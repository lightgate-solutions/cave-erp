"use server";

import { db } from "@/db";
import { employees, taskReviews, taskSubmissions, tasks } from "@/db/schema";
import { getEmployee } from "../hr/employees";
import { DrizzleQueryError, and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createNotification } from "../notification/notification";
import { requireAuth, requireManager } from "@/actions/auth/dal";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

type NewSubmission = typeof taskSubmissions.$inferInsert;

export async function submitTask(submissionData: NewSubmission) {
  const authData = await requireAuth();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return {
      success: null,
      error: { reason: "Organization not found" },
    };
  }

  // Verify user can only submit their own tasks
  if (authData.userId !== submissionData.submittedBy) {
    return {
      success: null,
      error: { reason: "You can only submit your own tasks" },
    };
  }

  try {
    const employee = await getEmployee(submissionData.submittedBy);

    if (!employee || employee.isManager) {
      return {
        success: null,
        error: { reason: "Only employees can submit tasks" },
      };
    }

    await db.insert(taskSubmissions).values({
      ...submissionData,
      organizationId: organization.id,
    });

    // Notify the manager that the task has been submitted
    const task = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.id, submissionData.taskId),
          eq(tasks.organizationId, organization.id),
        ),
      )
      .limit(1)
      .then((r) => r[0]);

    if (task?.assignedBy) {
      let note = "";
      if (submissionData.submissionNote) {
        const preview = submissionData.submissionNote.substring(0, 60);
        note = ` — ${preview}${submissionData.submissionNote.length > 60 ? "..." : ""}`;
      }

      const message = `${employee.name} submitted "${task.title}" for your review${note}`;

      await createNotification({
        user_id: task.assignedBy,
        title: "Task Submission Ready",
        message,
        notification_type: "message",
        reference_id: submissionData.taskId,
      });
    }

    revalidatePath("/tasks");
    return {
      success: { reason: "Task submitted successfully" },
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
}

export async function getTaskSubmissions(taskId: number) {
  await requireAuth();
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return [];
  }
  return await db
    .select()
    .from(taskSubmissions)
    .where(
      and(
        eq(taskSubmissions.taskId, taskId),
        eq(taskSubmissions.organizationId, organization.id),
      ),
    );
}

export async function getEmployeeSubmissions(userId: string) {
  await requireAuth();
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return [];
  }
  return await db
    .select()
    .from(taskSubmissions)
    .where(
      and(
        eq(taskSubmissions.submittedBy, userId),
        eq(taskSubmissions.organizationId, organization.id),
      ),
    );
}

export async function getSubmissionById(submissionId: number) {
  await requireAuth();
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return null;
  }
  return await db
    .select()
    .from(taskSubmissions)
    .where(
      and(
        eq(taskSubmissions.id, submissionId),
        eq(taskSubmissions.organizationId, organization.id),
      ),
    )
    .limit(1)
    .then((res) => res[0]);
}

export async function getManagerTeamSubmissions(managerId: string) {
  const authData = await requireManager();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return [];
  }

  // Verify the user is requesting their own team's submissions
  if (authData.userId !== managerId) {
    throw new Error("You can only view your own team's submissions");
  }

  // All submissions for tasks assigned by this manager
  const rows = await db
    .select({
      id: taskSubmissions.id,
      taskId: taskSubmissions.taskId,
      submittedBy: taskSubmissions.submittedBy,
      submissionNote: taskSubmissions.submissionNote,
      submittedFiles: taskSubmissions.submittedFiles,
      submittedAt: taskSubmissions.submittedAt,
      employeeName: employees.name,
      employeeEmail: employees.email,
      taskTitle: tasks.title,
    })
    .from(taskSubmissions)
    .leftJoin(tasks, eq(tasks.id, taskSubmissions.taskId))
    .leftJoin(employees, eq(employees.authId, taskSubmissions.submittedBy))
    .where(
      and(
        eq(tasks.assignedBy, managerId),
        eq(taskSubmissions.organizationId, organization.id),
      ),
    )
    .orderBy(desc(taskSubmissions.submittedAt));
  return rows;
}

export async function createSubmissionReview(args: {
  submissionId: number;
  taskId: number;
  reviewedBy: string;
  status: "Accepted" | "Rejected";
  reviewNote?: string;
}) {
  const authData = await requireManager();

  // Verify the user is the one doing the review
  if (authData.userId !== args.reviewedBy) {
    return {
      success: null,
      error: { reason: "You can only review as yourself" },
    };
  }

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return {
      success: null,
      error: { reason: "No organization found" },
    };
  }

  try {
    // Validate the reviewer is the manager who assigned the task
    const t = await db
      .select({ assignedBy: tasks.assignedBy })
      .from(tasks)
      .where(and(eq(tasks.id, args.taskId)))
      .limit(1)
      .then((r) => r[0]);
    if (!t || t.assignedBy !== args.reviewedBy) {
      return {
        success: null,
        error: {
          reason: "Only the assigning manager can review this submission",
        },
      };
    }

    await db.insert(taskReviews).values({
      taskId: args.taskId,
      submissionId: args.submissionId,
      reviewedBy: args.reviewedBy,
      organizationId: organization.id,
      status: args.status,
      reviewNote: args.reviewNote,
    });

    // Notify the employee about the review decision
    const submission = await db
      .select()
      .from(taskSubmissions)
      .where(eq(taskSubmissions.id, args.submissionId))
      .limit(1)
      .then((r) => r[0]);

    const taskDetails = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, args.taskId))
      .limit(1)
      .then((r) => r[0]);

    if (submission?.submittedBy) {
      const statusText = args.status === "Accepted" ? "approved" : "rejected";
      const feedback = args.reviewNote
        ? ` • ${args.reviewNote.substring(0, 80)}${args.reviewNote.length > 80 ? "..." : ""}`
        : "";

      const message = `Your submission for "${taskDetails?.title}" was ${statusText}${feedback}`;

      await createNotification({
        user_id: submission.submittedBy,
        title: `Submission ${args.status}`,
        message,
        notification_type: "approval",
        reference_id: args.taskId,
      });
    }

    // Mirror status side-effects here too to keep behavior consistent
    if (args.status === "Accepted") {
      // Accepted -> Completed
      await db
        .update(tasks)
        .set({ status: "Completed", updatedAt: new Date() })
        .where(eq(tasks.id, args.taskId));
    } else if (args.status === "Rejected") {
      // Rejected -> ensure task remains In Progress (don’t downgrade a Completed task)
      const current = await db
        .select({ status: tasks.status })
        .from(tasks)
        .where(eq(tasks.id, args.taskId))
        .limit(1)
        .then((r) => r[0]);

      if (current && current.status !== "Completed") {
        await db
          .update(tasks)
          .set({ status: "In Progress", updatedAt: new Date() })
          .where(eq(tasks.id, args.taskId));
      }
    }

    revalidatePath(`/tasks/manager`);
    revalidatePath(`/tasks`);
    return { success: { reason: "Review submitted" }, error: null };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return { success: null, error: { reason: err.cause?.message } };
    }
    return { success: null, error: { reason: "An unexpected error occurred" } };
  }
}
