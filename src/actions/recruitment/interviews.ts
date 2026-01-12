/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

"use server";

import { db } from "@/db";
import {
  interviews,
  recruitmentActivityLog,
  candidates,
  jobPostings,
} from "@/db/schema";
import { requireHROrAdmin } from "../auth/dal";
import { and, desc, eq, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export type InterviewType =
  | "Phone Screening"
  | "Technical"
  | "Behavioral"
  | "HR Round"
  | "Final Round";

export type InterviewStatus =
  | "Scheduled"
  | "Completed"
  | "Cancelled"
  | "Rescheduled"
  | "No Show";

export type InterviewRecommendation =
  | "Strong Hire"
  | "Hire"
  | "Maybe"
  | "No Hire";

export interface ScheduleInterviewInput {
  candidateId: number;
  interviewType: InterviewType;
  round?: number;
  scheduledDate: Date;
  scheduledEndDate?: Date;
  location?: string;
  interviewerIds?: string[];
}

export interface UpdateInterviewInput extends Partial<ScheduleInterviewInput> {
  status?: InterviewStatus;
  feedback?: string;
  rating?: number;
  recommendation?: InterviewRecommendation;
}

/**
 * Schedule a new interview
 */
export async function scheduleInterview(data: ScheduleInterviewInput) {
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

    const [interview] = await db.transaction(async (tx) => {
      // Create interview
      const [newInterview] = await tx
        .insert(interviews)
        .values({
          ...data,
          scheduledBy: employee.userId,
          organizationId: organization.id,
        })
        .returning();

      // Log activity
      await tx.insert(recruitmentActivityLog).values({
        candidateId: data.candidateId,
        activityType: "Interview Scheduled",
        description: `${data.interviewType} scheduled for ${new Date(data.scheduledDate).toLocaleString()}`,
        performedBy: employee.userId,
        metadata: {
          interviewId: newInterview.id,
          interviewType: data.interviewType,
          scheduledDate: data.scheduledDate,
        },
        organizationId: organization.id,
      });

      return [newInterview];
    });

    revalidatePath("/recruitment/pipeline");
    revalidatePath(`/recruitment/candidates/${data.candidateId}`);

    return {
      success: { data: interview },
      error: null,
    };
  } catch (error) {
    console.error("Error scheduling interview:", error);
    return {
      success: null,
      error: { reason: "Failed to schedule interview" },
    };
  }
}

/**
 * Update an interview
 */
export async function updateInterview(id: number, data: UpdateInterviewInput) {
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

    // Get existing interview
    const [existing] = await db
      .select()
      .from(interviews)
      .where(
        and(
          eq(interviews.id, id),
          eq(interviews.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!existing) {
      return {
        success: null,
        error: { reason: "Interview not found" },
      };
    }

    const updateData: Record<string, any> = { ...data };

    // Set conducted timestamp when completed
    if (data.status === "Completed" && !existing.conductedAt) {
      updateData.conductedAt = new Date();
    }

    const [updated] = await db.transaction(async (tx) => {
      const [updatedInterview] = await tx
        .update(interviews)
        .set(updateData)
        .where(
          and(
            eq(interviews.id, id),
            eq(interviews.organizationId, organization.id),
          ),
        )
        .returning();

      // Log activity if status changed
      if (data.status && data.status !== existing.status) {
        await tx.insert(recruitmentActivityLog).values({
          candidateId: existing.candidateId,
          activityType: "Interview Completed",
          description: `${existing.interviewType} marked as ${data.status}`,
          performedBy: employee.userId,
          metadata: {
            interviewId: id,
            oldStatus: existing.status,
            newStatus: data.status,
          },
          organizationId: organization.id,
        });
      }

      return [updatedInterview];
    });

    revalidatePath("/recruitment/pipeline");
    revalidatePath(`/recruitment/candidates/${existing.candidateId}`);

    return {
      success: { data: updated },
      error: null,
    };
  } catch (error) {
    console.error("Error updating interview:", error);
    return {
      success: null,
      error: { reason: "Failed to update interview" },
    };
  }
}

/**
 * Cancel an interview
 */
export async function cancelInterview(id: number, _reason?: string) {
  return updateInterview(id, {
    status: "Cancelled",
  });
}

/**
 * Get interview by ID
 */
export async function getInterview(id: number) {
  try {
    await requireHROrAdmin();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return null;
    }

    const [interview] = await db
      .select()
      .from(interviews)
      .where(
        and(
          eq(interviews.id, id),
          eq(interviews.organizationId, organization.id),
        ),
      )
      .limit(1);

    return interview || null;
  } catch (error) {
    console.error("Error fetching interview:", error);
    return null;
  }
}

/**
 * Get all interviews for a candidate
 */
export async function getCandidateInterviews(candidateId: number) {
  try {
    await requireHROrAdmin();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const allInterviews = await db
      .select()
      .from(interviews)
      .where(
        and(
          eq(interviews.candidateId, candidateId),
          eq(interviews.organizationId, organization.id),
        ),
      )
      .orderBy(desc(interviews.scheduledDate));

    return allInterviews;
  } catch (error) {
    console.error("Error fetching candidate interviews:", error);
    return [];
  }
}

/**
 * Get all upcoming interviews
 */
export async function getUpcomingInterviews() {
  try {
    await requireHROrAdmin();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const now = new Date();

    const upcomingInterviews = await db
      .select({
        id: interviews.id,
        candidateId: interviews.candidateId,
        candidateName: candidates.name,
        jobTitle: jobPostings.title,
        interviewType: interviews.interviewType,
        round: interviews.round,
        scheduledDate: interviews.scheduledDate,
        scheduledEndDate: interviews.scheduledEndDate,
        location: interviews.location,
        status: interviews.status,
        feedback: interviews.feedback,
        rating: interviews.rating,
        recommendation: interviews.recommendation,
        conductedAt: interviews.conductedAt,
        createdAt: interviews.createdAt,
      })
      .from(interviews)
      .innerJoin(candidates, eq(interviews.candidateId, candidates.id))
      .innerJoin(jobPostings, eq(candidates.jobPostingId, jobPostings.id))
      .where(
        and(
          eq(interviews.organizationId, organization.id),
          eq(interviews.status, "Scheduled"),
          gte(interviews.scheduledDate, now),
        ),
      )
      .orderBy(interviews.scheduledDate);

    return upcomingInterviews;
  } catch (error) {
    console.error("Error fetching upcoming interviews:", error);
    return [];
  }
}
