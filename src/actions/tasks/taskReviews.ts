"use server";

import { db } from "@/db";
import { taskReviews, tasks } from "@/db/schema";
import { getEmployee } from "../hr/employees";
import { DrizzleQueryError, eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth, requireManager } from "@/actions/auth/dal";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

type NewReview = typeof taskReviews.$inferInsert;

export const reviewTask = async (reviewData: NewReview) => {
  const authData = await requireManager();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return {
      success: null,
      error: { reason: "Organization not found" },
    };
  }

  // Verify the user is the one doing the review
  if (authData.userId !== reviewData.reviewedBy) {
    return {
      success: null,
      error: { reason: "You can only review as yourself" },
    };
  }

  try {
    const manager = await getEmployee(reviewData.reviewedBy);

    if (!manager || !manager.isManager) {
      return {
        success: null,
        error: { reason: "Only managers can review tasks" },
      };
    }

    await db.insert(taskReviews).values({
      ...reviewData,
      organizationId: organization.id,
    });

    // Status side-effects based on review decision
    if (reviewData.status === "Accepted") {
      // Accepted -> Completed
      await db
        .update(tasks)
        .set({ status: "Completed", updatedAt: new Date() })
        .where(
          and(
            eq(tasks.id, reviewData.taskId),
            eq(tasks.organizationId, organization.id),
          ),
        );
    } else if (reviewData.status === "Rejected") {
      // Rejected -> keep task In Progress (don't downgrade a Completed task)
      const current = await db
        .select({ status: tasks.status })
        .from(tasks)
        .where(
          and(
            eq(tasks.id, reviewData.taskId),
            eq(tasks.organizationId, organization.id),
          ),
        )
        .limit(1)
        .then((r) => r[0]);

      if (current && current.status !== "Completed") {
        await db
          .update(tasks)
          .set({ status: "In Progress", updatedAt: new Date() })
          .where(
            and(
              eq(tasks.id, reviewData.taskId),
              eq(tasks.organizationId, organization.id),
            ),
          );
      }
    }

    revalidatePath("/tasks");
    return {
      success: { reason: "Task reviewed successfully" },
      error: null,
    };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message },
      };
    }
    return {
      success: null,
      error: { reason: "An unexpected error occurred" },
    };
  }
};

export const getSubmissionReviews = async (submissionId: number) => {
  await requireAuth();
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return [];
  }
  return await db
    .select()
    .from(taskReviews)
    .where(
      and(
        eq(taskReviews.submissionId, submissionId),
        eq(taskReviews.organizationId, organization.id),
      ),
    );
};
