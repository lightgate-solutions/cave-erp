/** biome-ignore-all lint/style/noNonNullAssertion: <> */
/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

"use server";

import { db } from "@/db";
import { jobPostings, recruitmentMetrics } from "@/db/schema";
import { requireHROrAdmin } from "../auth/dal";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export type JobPostingStatus = "Draft" | "Published" | "Closed" | "Cancelled";

export interface CreateJobPostingInput {
  title: string;
  code: string;
  department: "admin" | "hr" | "finance" | "operations";
  position: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  employmentType: "Full-time" | "Part-time" | "Contract" | "Intern";
  salaryRangeMin?: number;
  salaryRangeMax?: number;
  location?: string;
  openings?: number;
}

export interface UpdateJobPostingInput extends Partial<CreateJobPostingInput> {
  status?: JobPostingStatus;
}

/**
 * Create a new job posting
 */
export async function createJobPosting(data: CreateJobPostingInput) {
  try {
    const { employee } = await requireHROrAdmin();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    // Check if code already exists
    const existing = await db
      .select()
      .from(jobPostings)
      .where(
        and(
          eq(jobPostings.code, data.code),
          eq(jobPostings.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return {
        success: null,
        error: { reason: "Job code already exists" },
      };
    }

    const [jobPosting] = await db
      .insert(jobPostings)
      .values({
        ...data,
        postedBy: employee.userId,
        organizationId: organization.id,
      })
      .returning();

    // Initialize metrics for this job posting
    await db.insert(recruitmentMetrics).values({
      jobPostingId: jobPosting.id,
      organizationId: organization.id,
    });

    revalidatePath("/recruitment/jobs");

    return {
      success: { data: jobPosting },
      error: null,
    };
  } catch (error) {
    console.error("Error creating job posting:", error);
    return {
      success: null,
      error: { reason: "Failed to create job posting" },
    };
  }
}

/**
 * Update an existing job posting
 */
export async function updateJobPosting(
  id: number,
  data: UpdateJobPostingInput,
) {
  try {
    await requireHROrAdmin();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    // Verify job posting exists and belongs to organization
    const [existing] = await db
      .select()
      .from(jobPostings)
      .where(
        and(
          eq(jobPostings.id, id),
          eq(jobPostings.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!existing) {
      return {
        success: null,
        error: { reason: "Job posting not found" },
      };
    }

    // If code is being updated, check uniqueness
    if (data.code && data.code !== existing.code) {
      const codeExists = await db
        .select()
        .from(jobPostings)
        .where(
          and(
            eq(jobPostings.code, data.code),
            eq(jobPostings.organizationId, organization.id),
          ),
        )
        .limit(1);

      if (codeExists.length > 0) {
        return {
          success: null,
          error: { reason: "Job code already exists" },
        };
      }
    }

    // Handle status-specific timestamps
    const updateData: Record<string, any> = { ...data };

    if (data.status === "Published" && !existing.publishedAt) {
      updateData.publishedAt = new Date();
    } else if (data.status === "Closed" && !existing.closedAt) {
      updateData.closedAt = new Date();
    }

    const [updated] = await db
      .update(jobPostings)
      .set(updateData)
      .where(
        and(
          eq(jobPostings.id, id),
          eq(jobPostings.organizationId, organization.id),
        ),
      )
      .returning();

    revalidatePath("/recruitment/jobs");
    revalidatePath(`/recruitment/jobs/${id}`);

    return {
      success: { data: updated },
      error: null,
    };
  } catch (error) {
    console.error("Error updating job posting:", error);
    return {
      success: null,
      error: { reason: "Failed to update job posting" },
    };
  }
}

/**
 * Delete a job posting
 */
export async function deleteJobPosting(id: number) {
  try {
    await requireHROrAdmin();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    await db
      .delete(jobPostings)
      .where(
        and(
          eq(jobPostings.id, id),
          eq(jobPostings.organizationId, organization.id),
        ),
      );

    revalidatePath("/recruitment/jobs");

    return {
      success: { reason: "Job posting deleted successfully" },
      error: null,
    };
  } catch (error) {
    console.error("Error deleting job posting:", error);
    return {
      success: null,
      error: { reason: "Failed to delete job posting" },
    };
  }
}

/**
 * Get a single job posting by ID
 */
export async function getJobPosting(id: number) {
  try {
    await requireHROrAdmin();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return null;
    }

    const [jobPosting] = await db
      .select()
      .from(jobPostings)
      .where(
        and(
          eq(jobPostings.id, id),
          eq(jobPostings.organizationId, organization.id),
        ),
      )
      .limit(1);

    return jobPosting || null;
  } catch (error) {
    console.error("Error fetching job posting:", error);
    return null;
  }
}

/**
 * Get all job postings with optional filters
 */
export async function getAllJobPostings(filters?: {
  status?: JobPostingStatus;
  department?: string;
  search?: string;
}) {
  try {
    await requireHROrAdmin();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const conditions = [eq(jobPostings.organizationId, organization.id)];

    if (filters?.status) {
      conditions.push(eq(jobPostings.status, filters.status));
    }

    if (filters?.department) {
      conditions.push(
        eq(
          jobPostings.department,
          filters.department as "admin" | "hr" | "finance" | "operations",
        ),
      );
    }

    if (filters?.search) {
      conditions.push(
        or(
          ilike(jobPostings.title, `%${filters.search}%`),
          ilike(jobPostings.position, `%${filters.search}%`),
          ilike(jobPostings.code, `%${filters.search}%`),
        )!,
      );
    }

    const jobs = await db
      .select()
      .from(jobPostings)
      .where(and(...conditions))
      .orderBy(desc(jobPostings.createdAt));

    return jobs;
  } catch (error) {
    console.error("Error fetching job postings:", error);
    return [];
  }
}

/**
 * Publish a job posting
 */
export async function publishJobPosting(id: number) {
  return updateJobPosting(id, {
    status: "Published",
  });
}

/**
 * Close a job posting
 */
export async function closeJobPosting(id: number) {
  return updateJobPosting(id, {
    status: "Closed",
  });
}

/**
 * Generate next job code
 */
export async function generateJobCode() {
  try {
    await requireHROrAdmin();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return null;
    }

    const year = new Date().getFullYear();
    const prefix = `JOB-${year}-`;

    // Get the latest job posting with this year's prefix
    const latestJob = await db
      .select()
      .from(jobPostings)
      .where(
        and(
          eq(jobPostings.organizationId, organization.id),
          ilike(jobPostings.code, `${prefix}%`),
        ),
      )
      .orderBy(desc(jobPostings.createdAt))
      .limit(1);

    if (latestJob.length === 0) {
      return `${prefix}0001`;
    }

    // Extract number from last code and increment
    const lastCode = latestJob[0].code;
    const lastNumber = Number.parseInt(lastCode.split("-")[2] || "0");
    const nextNumber = lastNumber + 1;

    return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
  } catch (error) {
    console.error("Error generating job code:", error);
    return null;
  }
}
