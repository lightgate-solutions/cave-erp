import { NextResponse, type NextRequest } from "next/server";
import { and, asc, eq, ilike, or, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  tasks,
  taskAssignees,
  employees,
  taskLabels,
  taskLabelAssignments,
  taskMessages,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    type StatusType =
      | "Backlog"
      | "Todo"
      | "In Progress"
      | "Review"
      | "Completed";
    type PriorityType = "Low" | "Medium" | "High" | "Urgent";

    // Get organization context
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 403 },
      );
    }

    const { searchParams } = request.nextUrl;

    const role = searchParams.get("role") || undefined;
    // Note: API query parameter is still "employeeId" for backward compatibility
    const employeeIdParam = searchParams.get("employeeId");
    const employeeId = employeeIdParam ? Number(employeeIdParam) : 0;
    if (!employeeId || !role) {
      return NextResponse.json(
        { error: "Missing employeeId or role parameter" },
        { status: 400 },
      );
    }

    // Look up employee to get authId (string userId)
    const employee = await db
      .select({ authId: employees.authId })
      .from(employees)
      .where(
        and(
          eq(employees.id, employeeId),
          eq(employees.organizationId, organization.id),
        ),
      )
      .limit(1)
      .then((res) => res[0]);

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 400 },
      );
    }

    const userId = employee.authId; // Now it's string (text)

    const priority = searchParams.get("priority") || undefined;
    const assignee = searchParams.get("assignee") || undefined;
    const q = searchParams.get("q") || "";

    let where: ReturnType<typeof or> | ReturnType<typeof eq> | undefined;

    if (role === "employee") {
      const rows = await db
        .select({ id: taskAssignees.taskId })
        .from(taskAssignees)
        .where(
          and(
            eq(taskAssignees.userId, userId),
            eq(taskAssignees.organizationId, organization.id),
          ),
        );
      const ids = rows.map((r) => r.id);
      where = ids.length
        ? or(eq(tasks.assignedTo, userId), inArray(tasks.id, ids))
        : eq(tasks.assignedTo, userId);
    } else if (role === "manager") {
      where = eq(tasks.assignedBy, userId);
    }

    if (q) {
      where = where
        ? and(
            where,
            or(
              ilike(tasks.title, `%${q}%`),
              ilike(tasks.description, `%${q}%`),
            ),
          )
        : or(ilike(tasks.title, `%${q}%`), ilike(tasks.description, `%${q}%`));
    }

    if (priority && priority !== "all") {
      where = where
        ? and(where, eq(tasks.priority, priority as PriorityType))
        : eq(tasks.priority, priority as PriorityType);
    }

    if (assignee === "me") {
      where = where
        ? and(where, eq(tasks.assignedTo, userId))
        : eq(tasks.assignedTo, userId);
    }

    // Add organization filter to all task queries
    where = where
      ? and(where, eq(tasks.organizationId, organization.id))
      : eq(tasks.organizationId, organization.id);

    // Fetch all tasks
    const allTasks = await db
      .select()
      .from(tasks)
      .where(where)
      .orderBy(asc(tasks.createdAt));

    if (!allTasks.length) {
      return NextResponse.json({
        tasksByStatus: {},
        labels: [],
        statuses: ["Backlog", "Todo", "In Progress", "Review", "Completed"],
      });
    }

    const taskIds = allTasks.map((t) => t.id);

    // Get all user IDs for enrichment
    const userIds = Array.from(
      new Set(
        allTasks
          .flatMap((t) => [t.assignedTo, t.assignedBy])
          .filter(Boolean) as string[],
      ),
    );

    // Fetch employee data
    const employeeRows = userIds.length
      ? await db
          .select({
            authId: employees.authId,
            email: employees.email,
            name: employees.name,
          })
          .from(employees)
          .where(inArray(employees.authId, userIds))
      : [];

    const employeeMap = new Map(
      employeeRows.map((r) => [
        r.authId,
        {
          id: r.authId,
          email: r.email,
          name: r.name,
          avatar: null as string | null,
        },
      ]),
    );

    // Fetch assignees for all tasks
    const assigneesRows = await db
      .select({
        taskId: taskAssignees.taskId,
        id: employees.id,
        email: employees.email,
        name: employees.name,
      })
      .from(taskAssignees)
      .leftJoin(employees, eq(employees.authId, taskAssignees.userId))
      .where(inArray(taskAssignees.taskId, taskIds));

    const assigneesMap = new Map<
      number,
      {
        id: number | null;
        email: string | null;
        name: string | null;
        avatar: string | null;
      }[]
    >();
    for (const r of assigneesRows) {
      const list = assigneesMap.get(r.taskId) ?? [];
      list.push({ id: r.id, email: r.email, name: r.name, avatar: null });
      assigneesMap.set(r.taskId, list);
    }

    // Fetch labels for all tasks
    const labelAssignments = await db
      .select({
        taskId: taskLabelAssignments.taskId,
        id: taskLabels.id,
        name: taskLabels.name,
        color: taskLabels.color,
      })
      .from(taskLabelAssignments)
      .leftJoin(taskLabels, eq(taskLabels.id, taskLabelAssignments.labelId))
      .where(inArray(taskLabelAssignments.taskId, taskIds));

    const labelsMap = new Map<
      number,
      { id: number | null; name: string | null; color: string | null }[]
    >();
    for (const r of labelAssignments) {
      const list = labelsMap.get(r.taskId) ?? [];
      list.push({ id: r.id, name: r.name, color: r.color });
      labelsMap.set(r.taskId, list);
    }

    // Fetch comment counts for all tasks
    const messageCounts = await db
      .select({
        taskId: taskMessages.taskId,
      })
      .from(taskMessages)
      .where(inArray(taskMessages.taskId, taskIds));

    const commentsMap = new Map<number, number>();
    for (const r of messageCounts) {
      commentsMap.set(r.taskId, (commentsMap.get(r.taskId) || 0) + 1);
    }

    // Enrich tasks and group by status
    type EnrichedTask = {
      id: number;
      title: string;
      description: string | null;
      status: StatusType;
      priority: string;
      dueDate: string | null;
      attachments: { url: string; name: string }[];
      links: { url: string; title: string }[];
      progressCompleted: number;
      progressTotal: number;
      createdAt: Date;
      updatedAt: Date;
      assignedBy: {
        id: string;
        email: string | null;
        name: string | null;
        avatar: string | null;
      } | null;
      assignees: {
        id: number | null;
        email: string | null;
        name: string | null;
        avatar: string | null;
      }[];
      labels: {
        id: number | null;
        name: string | null;
        color: string | null;
      }[];
      comments: number;
    };

    const tasksByStatus: Record<StatusType, EnrichedTask[]> = {
      Backlog: [],
      Todo: [],
      "In Progress": [],
      Review: [],
      Completed: [],
    };

    for (const task of allTasks) {
      const enriched: EnrichedTask = {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status as StatusType,
        priority: task.priority,
        dueDate: task.dueDate,
        attachments: (task.attachments || []) as {
          url: string;
          name: string;
        }[],
        links: (task.links || []) as { url: string; title: string }[],
        progressCompleted: task.progressCompleted || 0,
        progressTotal: task.progressTotal || 0,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        assignedBy: employeeMap.get(task.assignedBy) || null,
        assignees: assigneesMap.get(task.id) || [],
        labels: labelsMap.get(task.id) || [],
        comments: commentsMap.get(task.id) || 0,
      };

      if (tasksByStatus[task.status as StatusType]) {
        tasksByStatus[task.status as StatusType].push(enriched);
      }
    }

    // Fetch all available labels
    const allLabels = await db.select().from(taskLabels);

    return NextResponse.json({
      tasksByStatus,
      labels: allLabels,
      statuses: ["Backlog", "Todo", "In Progress", "Review", "Completed"],
    });
  } catch (error) {
    console.error("Error fetching board tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch board tasks" },
      { status: 500 },
    );
  }
}

// Update task status (for drag and drop)
export async function PATCH(request: NextRequest) {
  try {
    // Get organization context
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 403 },
      );
    }

    const { taskId, status } = await request.json();

    if (!taskId || !status) {
      return NextResponse.json(
        { error: "Missing taskId or status" },
        { status: 400 },
      );
    }

    // Verify task belongs to current organization before updating
    const [task] = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(
        and(eq(tasks.id, taskId), eq(tasks.organizationId, organization.id)),
      )
      .limit(1);

    if (!task) {
      return NextResponse.json(
        { error: "Task not found in your organization" },
        { status: 404 },
      );
    }

    await db
      .update(tasks)
      .set({ status })
      .where(
        and(eq(tasks.id, taskId), eq(tasks.organizationId, organization.id)),
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating task status:", error);
    return NextResponse.json(
      { error: "Failed to update task status" },
      { status: 500 },
    );
  }
}
