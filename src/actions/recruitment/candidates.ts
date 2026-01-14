"use server";

import { db } from "@/db";
import {
  candidates,
  recruitmentActivityLog,
  recruitmentMetrics,
} from "@/db/schema";
import { requireHROrAdmin } from "../auth/dal";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export type CandidateStatus =
  | "Applied"
  | "Screening"
  | "Interview"
  | "Offer"
  | "Hired"
  | "Rejected";

export interface CreateCandidateInput {
  jobPostingId: number;
  name: string;
  email: string;
  phone: string;
  currentCompany?: string;
  currentPosition?: string;
  yearsExperience?: number;
  expectedSalary?: number;
  noticePeriod?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  referredBy?: string;
  notes?: string;
}

export interface UpdateCandidateInput extends Partial<CreateCandidateInput> {}

/**
 * Create a new candidate
 */
export async function createCandidate(data: CreateCandidateInput) {
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

    // Generate candidate code
    const candidateCode = await generateCandidateCode();
    if (!candidateCode) {
      return {
        success: null,
        error: { reason: "Failed to generate candidate code" },
      };
    }

    const [candidate] = await db.transaction(async (tx) => {
      // Create candidate
      const [newCandidate] = await tx
        .insert(candidates)
        .values({
          ...data,
          candidateCode,
          organizationId: organization.id,
        })
        .returning();

      // Log activity
      await tx.insert(recruitmentActivityLog).values({
        candidateId: newCandidate.id,
        activityType: "Application Received",
        description: `${data.name} applied for the position`,
        performedBy: employee.userId,
        organizationId: organization.id,
      });

      // Update metrics
      await tx
        .update(recruitmentMetrics)
        .set({
          totalApplications: sql`${recruitmentMetrics.totalApplications} + 1`,
        })
        .where(
          and(
            eq(recruitmentMetrics.jobPostingId, data.jobPostingId),
            eq(recruitmentMetrics.organizationId, organization.id),
          ),
        );

      return [newCandidate];
    });

    revalidatePath("/recruitment/candidates");
    revalidatePath("/recruitment/pipeline");

    return {
      success: { data: candidate },
      error: null,
    };
  } catch (error) {
    console.error("Error creating candidate:", error);
    return {
      success: null,
      error: { reason: "Failed to create candidate" },
    };
  }
}

/**
 * Update a candidate
 */
export async function updateCandidate(id: number, data: UpdateCandidateInput) {
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

    // Verify candidate exists
    const [existing] = await db
      .select()
      .from(candidates)
      .where(
        and(
          eq(candidates.id, id),
          eq(candidates.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!existing) {
      return {
        success: null,
        error: { reason: "Candidate not found" },
      };
    }

    const [updated] = await db
      .update(candidates)
      .set(data)
      .where(
        and(
          eq(candidates.id, id),
          eq(candidates.organizationId, organization.id),
        ),
      )
      .returning();

    revalidatePath("/recruitment/candidates");
    revalidatePath(`/recruitment/candidates/${id}`);

    return {
      success: { data: updated },
      error: null,
    };
  } catch (error) {
    console.error("Error updating candidate:", error);
    return {
      success: null,
      error: { reason: "Failed to update candidate" },
    };
  }
}

/**
 * Update candidate status
 */
export async function updateCandidateStatus(
  id: number,
  newStatus: CandidateStatus,
  reason?: string,
) {
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

    // Get current candidate
    const [existing] = await db
      .select()
      .from(candidates)
      .where(
        and(
          eq(candidates.id, id),
          eq(candidates.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!existing) {
      return {
        success: null,
        error: { reason: "Candidate not found" },
      };
    }

    const oldStatus = existing.status;

    await db.transaction(async (tx) => {
      // Update status with additional fields based on new status
      const updateData: Record<string, unknown> = { status: newStatus };

      if (newStatus === "Screening") {
        updateData.screenedBy = employee.userId;
        updateData.screenedAt = new Date();
      } else if (newStatus === "Rejected") {
        updateData.rejectedBy = employee.userId;
        updateData.rejectedAt = new Date();
        if (reason) {
          updateData.rejectionReason = reason;
        }
      } else if (newStatus === "Hired") {
        updateData.hiredAt = new Date();
      }

      await tx
        .update(candidates)
        .set(updateData)
        .where(
          and(
            eq(candidates.id, id),
            eq(candidates.organizationId, organization.id),
          ),
        );

      // Log activity
      await tx.insert(recruitmentActivityLog).values({
        candidateId: id,
        activityType: "Status Changed",
        description: `Status changed from ${oldStatus} to ${newStatus}${reason ? `: ${reason}` : ""}`,
        performedBy: employee.userId,
        metadata: {
          oldStatus,
          newStatus,
          reason,
        },
        organizationId: organization.id,
      });

      // Update metrics
      const metricsUpdate: Record<string, unknown> = {};

      // Decrement old status
      if (oldStatus === "Screening") {
        metricsUpdate.screened = sql`${recruitmentMetrics.screened} - 1`;
      } else if (oldStatus === "Interview") {
        metricsUpdate.interviewed = sql`${recruitmentMetrics.interviewed} - 1`;
      } else if (oldStatus === "Offer") {
        metricsUpdate.offered = sql`${recruitmentMetrics.offered} - 1`;
      }

      // Increment new status
      if (newStatus === "Screening") {
        metricsUpdate.screened = sql`${recruitmentMetrics.screened} + 1`;
      } else if (newStatus === "Interview") {
        metricsUpdate.interviewed = sql`${recruitmentMetrics.interviewed} + 1`;
      } else if (newStatus === "Offer") {
        metricsUpdate.offered = sql`${recruitmentMetrics.offered} + 1`;
      } else if (newStatus === "Hired") {
        metricsUpdate.hired = sql`${recruitmentMetrics.hired} + 1`;
      } else if (newStatus === "Rejected") {
        metricsUpdate.rejected = sql`${recruitmentMetrics.rejected} + 1`;
      }

      if (Object.keys(metricsUpdate).length > 0) {
        await tx
          .update(recruitmentMetrics)
          .set(metricsUpdate)
          .where(
            and(
              eq(recruitmentMetrics.jobPostingId, existing.jobPostingId),
              eq(recruitmentMetrics.organizationId, organization.id),
            ),
          );
      }
    });

    revalidatePath("/recruitment/candidates");
    revalidatePath("/recruitment/pipeline");
    revalidatePath(`/recruitment/candidates/${id}`);

    return {
      success: { reason: "Status updated successfully" },
      error: null,
    };
  } catch (error) {
    console.error("Error updating candidate status:", error);
    return {
      success: null,
      error: { reason: "Failed to update candidate status" },
    };
  }
}

/**
 * Delete a candidate
 */
export async function deleteCandidate(id: number) {
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
      .delete(candidates)
      .where(
        and(
          eq(candidates.id, id),
          eq(candidates.organizationId, organization.id),
        ),
      );

    revalidatePath("/recruitment/candidates");
    revalidatePath("/recruitment/pipeline");

    return {
      success: { reason: "Candidate deleted successfully" },
      error: null,
    };
  } catch (error) {
    console.error("Error deleting candidate:", error);
    return {
      success: null,
      error: { reason: "Failed to delete candidate" },
    };
  }
}

/**
 * Get a single candidate by ID
 */
export async function getCandidate(id: number) {
  try {
    await requireHROrAdmin();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return null;
    }

    const [candidate] = await db
      .select()
      .from(candidates)
      .where(
        and(
          eq(candidates.id, id),
          eq(candidates.organizationId, organization.id),
        ),
      )
      .limit(1);

    return candidate || null;
  } catch (error) {
    console.error("Error fetching candidate:", error);
    return null;
  }
}

/**
 * Get all candidates with optional filters
 */
export async function getAllCandidates(filters?: {
  status?: CandidateStatus;
  jobPostingId?: number;
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

    const conditions = [eq(candidates.organizationId, organization.id)];

    if (filters?.status) {
      conditions.push(eq(candidates.status, filters.status));
    }

    if (filters?.jobPostingId) {
      conditions.push(eq(candidates.jobPostingId, filters.jobPostingId));
    }

    if (filters?.search) {
      conditions.push(
        or(
          ilike(candidates.name, `%${filters.search}%`),
          ilike(candidates.email, `%${filters.search}%`),
          ilike(candidates.candidateCode, `%${filters.search}%`),
        ),
      );
    }

    const allCandidates = await db
      .select()
      .from(candidates)
      .where(and(...conditions))
      .orderBy(desc(candidates.createdAt));

    return allCandidates;
  } catch (error) {
    console.error("Error fetching candidates:", error);
    return [];
  }
}

/**
 * Get candidates grouped by status (for kanban board)
 */
export async function getCandidatesByStatus(jobPostingId?: number) {
  try {
    await requireHROrAdmin();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        Applied: [],
        Screening: [],
        Interview: [],
        Offer: [],
        Hired: [],
        Rejected: [],
      };
    }

    const conditions = [eq(candidates.organizationId, organization.id)];

    if (jobPostingId) {
      conditions.push(eq(candidates.jobPostingId, jobPostingId));
    }

    const allCandidates = await db
      .select()
      .from(candidates)
      .where(and(...conditions))
      .orderBy(desc(candidates.createdAt));

    // Group by status
    const grouped: Record<CandidateStatus, typeof allCandidates> = {
      Applied: [],
      Screening: [],
      Interview: [],
      Offer: [],
      Hired: [],
      Rejected: [],
    };

    for (const candidate of allCandidates) {
      grouped[candidate.status].push(candidate);
    }

    return grouped;
  } catch (error) {
    console.error("Error fetching candidates by status:", error);
    return {
      Applied: [],
      Screening: [],
      Interview: [],
      Offer: [],
      Hired: [],
      Rejected: [],
    };
  }
}

/**
 * Generate next candidate code
 */
async function generateCandidateCode() {
  try {
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return null;
    }

    const year = new Date().getFullYear();
    const prefix = `CAN-${year}-`;

    // Get the latest candidate with this year's prefix
    const latestCandidate = await db
      .select()
      .from(candidates)
      .where(
        and(
          eq(candidates.organizationId, organization.id),
          ilike(candidates.candidateCode, `${prefix}%`),
        ),
      )
      .orderBy(desc(candidates.createdAt))
      .limit(1);

    if (latestCandidate.length === 0) {
      return `${prefix}0001`;
    }

    // Extract number from last code and increment
    const lastCode = latestCandidate[0].candidateCode;
    const lastNumber = Number.parseInt(lastCode.split("-")[2] || "0");
    const nextNumber = lastNumber + 1;

    return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
  } catch (error) {
    console.error("Error generating candidate code:", error);
    return null;
  }
}

/**
 * Add a note to candidate
 */
export async function addCandidateNote(candidateId: number, note: string) {
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

    // Get candidate
    const [candidate] = await db
      .select()
      .from(candidates)
      .where(
        and(
          eq(candidates.id, candidateId),
          eq(candidates.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!candidate) {
      return {
        success: null,
        error: { reason: "Candidate not found" },
      };
    }

    // Append note to existing notes
    const currentNotes = candidate.notes || "";
    const timestamp = new Date().toLocaleString();
    const newNote = `[${timestamp}] ${employee.name}: ${note}`;
    const updatedNotes = currentNotes
      ? `${currentNotes}\n\n${newNote}`
      : newNote;

    await db.transaction(async (tx) => {
      await tx
        .update(candidates)
        .set({ notes: updatedNotes })
        .where(
          and(
            eq(candidates.id, candidateId),
            eq(candidates.organizationId, organization.id),
          ),
        );

      // Log activity
      await tx.insert(recruitmentActivityLog).values({
        candidateId,
        activityType: "Note Added",
        description: `Added note: ${note.substring(0, 100)}${note.length > 100 ? "..." : ""}`,
        performedBy: employee.userId,
        organizationId: organization.id,
      });
    });

    revalidatePath(`/recruitment/candidates/${candidateId}`);

    return {
      success: { reason: "Note added successfully" },
      error: null,
    };
  } catch (error) {
    console.error("Error adding candidate note:", error);
    return {
      success: null,
      error: { reason: "Failed to add note" },
    };
  }
}
