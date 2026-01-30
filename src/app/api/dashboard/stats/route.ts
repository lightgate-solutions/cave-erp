import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { employees } from "@/db/schema/hr";
import { tasks } from "@/db/schema/tasks/tasks";
import { document } from "@/db/schema/documents";
import { documentAccess } from "@/db/schema/documents";
import { projects } from "@/db/schema/projects";
import { emailRecipient } from "@/db/schema/mail";
import { notifications } from "@/db/schema/notifications";
import { eq, and, ne, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const h = await headers();
    const session = await auth.api.getSession({ headers: h });
    const authUserId = session?.user?.id;
    const role = session?.user?.role;

    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get organization context
    const organization = await auth.api.getFullOrganization({
      headers: h,
    });
    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 403 },
      );
    }

    // Get employee info
    const employeeResult = await db
      .select({
        id: employees.id,
        authId: employees.authId,
        isManager: employees.isManager,
        department: employees.department,
      })
      .from(employees)
      .where(
        and(
          eq(employees.authId, authUserId),
          eq(employees.organizationId, organization.id),
        ),
      )
      .limit(1);

    const employee = employeeResult[0];
    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    // Normalize role check like other endpoints
    const normalizedRole = role?.toLowerCase().trim() || "";
    const isAdmin = normalizedRole === "admin";
    const isManager = employee.isManager;

    // Task stats - fetch all at once
    let taskStats = { active: 0, pending: 0, inProgress: 0, total: 0 };
    try {
      const taskScopeWhere = isAdmin
        ? eq(tasks.organizationId, organization.id)
        : isManager
          ? and(
              eq(tasks.assignedBy, employee.authId),
              eq(tasks.organizationId, organization.id),
            )
          : and(
              eq(tasks.assignedTo, employee.authId),
              eq(tasks.organizationId, organization.id),
            );

      // Get task counts - active tasks are all tasks that are not Completed
      const activeTaskWhere = and(
        taskScopeWhere,
        ne(tasks.status, "Completed"),
      );

      const pendingTaskWhere = and(taskScopeWhere, eq(tasks.status, "Todo"));

      const inProgressTaskWhere = and(
        taskScopeWhere,
        eq(tasks.status, "In Progress"),
      );

      const [activeResult, pendingResult, inProgressResult] = await Promise.all(
        [
          db
            .select({ count: sql<number>`count(*)::int` })
            .from(tasks)
            .where(activeTaskWhere),
          db
            .select({ count: sql<number>`count(*)::int` })
            .from(tasks)
            .where(pendingTaskWhere),
          db
            .select({ count: sql<number>`count(*)::int` })
            .from(tasks)
            .where(inProgressTaskWhere),
        ],
      );

      taskStats = {
        active: Number(activeResult[0]?.count ?? 0),
        pending: Number(pendingResult[0]?.count ?? 0),
        inProgress: Number(inProgressResult[0]?.count ?? 0),
        total: 0,
      };
      taskStats.total =
        taskStats.active + taskStats.pending + taskStats.inProgress;
    } catch {
      // Keep default values
    }

    // Parallelize document, project, email, and notification stats (async-parallel)
    let documentCount = 0;
    let projectCount = 0;
    let emailStats = { unread: 0, inbox: 0 };
    let notificationCount = 0;

    try {
      const [docResult, projectResult, emailResults, notifResult] =
        await Promise.all([
          // Document stats - simplified query
          (async () => {
            if (isAdmin) {
              // Admin sees all active documents
              return db
                .select({ count: sql<number>`count(*)::int` })
                .from(document)
                .where(
                  and(
                    eq(document.status, "active"),
                    eq(document.organizationId, organization.id),
                  ),
                );
            }
            // Build visibility condition for non-admin users
            // Users can see documents they uploaded, public documents, departmental documents, or documents they have access to
            const visibilityCondition = sql`(
              ${document.uploadedBy} = ${employee.authId}
              OR ${document.public} = true
              OR (${document.departmental} = true AND ${document.department} = ${employee.department ?? ""})
              OR EXISTS (
                SELECT 1 FROM ${documentAccess}
                WHERE ${documentAccess.documentId} = ${document.id}
                  AND ${documentAccess.organizationId} = ${organization.id}
                  AND (
                    ${documentAccess.userId} = ${employee.authId}
                    OR (${documentAccess.department} IS NOT NULL AND ${documentAccess.department} = ${employee.department ?? ""})
                  )
              )
            )`;

            return db
              .select({
                count: sql<number>`count(distinct ${document.id})::int`,
              })
              .from(document)
              .where(
                and(
                  eq(document.status, "active"),
                  visibilityCondition,
                  eq(document.organizationId, organization.id),
                ),
              );
          })(),

          // Project stats
          db
            .select({ count: sql<number>`count(*)::int` })
            .from(projects)
            .where(eq(projects.organizationId, organization.id)),

          // Email stats (unread and inbox)
          Promise.all([
            db
              .select({ count: sql<number>`count(*)::int` })
              .from(emailRecipient)
              .where(
                and(
                  eq(emailRecipient.recipientId, employee.authId),
                  eq(emailRecipient.isRead, false),
                  eq(emailRecipient.organizationId, organization.id),
                  eq(emailRecipient.isArchived, false),
                  eq(emailRecipient.isDeleted, false),
                ),
              ),
            db
              .select({ count: sql<number>`count(*)::int` })
              .from(emailRecipient)
              .where(
                and(
                  eq(emailRecipient.recipientId, employee.authId),
                  eq(emailRecipient.isArchived, false),
                  eq(emailRecipient.organizationId, organization.id),
                  eq(emailRecipient.isDeleted, false),
                ),
              ),
          ]),

          // Notification stats
          db
            .select({ count: sql<number>`count(*)::int` })
            .from(notifications)
            .where(
              and(
                eq(notifications.user_id, employee.authId),
                eq(notifications.organizationId, organization.id),
                eq(notifications.is_read, false),
              ),
            ),
        ]);

      documentCount = Number(docResult[0]?.count ?? 0);
      projectCount = Number(projectResult[0]?.count ?? 0);
      emailStats = {
        unread: Number(emailResults[0][0]?.count ?? 0),
        inbox: Number(emailResults[1][0]?.count ?? 0),
      };
      notificationCount = Number(notifResult[0]?.count ?? 0);
    } catch {
      // Keep default values (already initialized)
    }

    return NextResponse.json(
      {
        tasks: taskStats,
        documents: documentCount,
        projects: projectCount,
        emails: emailStats,
        notifications: notificationCount,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard stats",
        tasks: { active: 0, pending: 0, inProgress: 0, total: 0 },
        documents: 0,
        projects: 0,
        emails: { unread: 0, inbox: 0 },
        notifications: 0,
      },
      { status: 500 },
    );
  }
}
