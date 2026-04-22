import { NextResponse, type NextRequest } from "next/server";
import { getTasksForEmployee, createTask } from "@/actions/tasks/tasks";
import type { CreateTask, Task } from "@/types";
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  or,
  inArray,
  ne,
  type SQL,
} from "drizzle-orm";
import { db } from "@/db";
import { tasks, taskAssignees, employees } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<CreateTask> & {
      assignees?: string[];
      selfAssign?: boolean;
    };
    const created = await createTask(
      body as CreateTask & { assignees?: string[]; selfAssign?: boolean },
    );

    if (!created.success) {
      return NextResponse.json(
        { error: created.error?.reason || "Task not created" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: created.success.reason });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 401 },
      );
    }

    type StatusType =
      | "Backlog"
      | "Todo"
      | "In Progress"
      | "Review"
      | "Completed";
    type PriorityType = "Low" | "Medium" | "High" | "Urgent";
    const { searchParams } = request.nextUrl;

    const role = searchParams.get("role") || undefined;
    const view = searchParams.get("view") || "default";
    const userIdParam = searchParams.get("userId");
    const employeeIdParam = searchParams.get("employeeId");

    let userId: string | undefined;

    if (userIdParam) {
      const [row] = await db
        .select({ authId: employees.authId })
        .from(employees)
        .where(
          and(
            eq(employees.authId, userIdParam),
            eq(employees.organizationId, organization.id),
          ),
        )
        .limit(1);
      if (!row?.authId) {
        return NextResponse.json(
          { error: "Employee not found for userId" },
          { status: 400 },
        );
      }
      userId = row.authId;
    } else if (employeeIdParam) {
      const employeeId = Number(employeeIdParam);
      if (!employeeId) {
        return NextResponse.json(
          { error: "Invalid employeeId" },
          { status: 400 },
        );
      }
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
      userId = employee.authId;
    }

    if (!userId || !role) {
      return NextResponse.json(
        { error: "Missing userId, employeeId, or role parameter" },
        { status: 400 },
      );
    }
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    const sortableColumns = {
      createdAt: tasks.createdAt,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      assignedTo: tasks.assignedTo,
      assignedBy: tasks.assignedBy,
    };
    type SortableColumn = keyof typeof sortableColumns;

    const sortByParam = searchParams.get("sortBy") as SortableColumn | null;
    const status = searchParams.get("status") || "all";
    const priority = searchParams.get("priority") || undefined;
    const q = searchParams.get("q") || "";
    const sortDirection =
      searchParams.get("sortDirection") === "asc" ? "asc" : "desc";
    const sortColumn =
      (sortByParam && sortableColumns[sortByParam]) || tasks.createdAt;
    const order = sortDirection === "asc" ? asc(sortColumn) : desc(sortColumn);

    let where: SQL | undefined;
    if (role === "employee" && view === "self-assign") {
      where = and(
        eq(tasks.organizationId, organization.id),
        eq(tasks.assignedTo, userId),
        eq(tasks.assignedBy, userId),
      );
    } else if (role === "employee") {
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
      const baseWhere = ids.length
        ? or(eq(tasks.assignedTo, userId), inArray(tasks.id, ids))
        : eq(tasks.assignedTo, userId);
      const notPureSelfAssigned = or(
        ne(tasks.assignedBy, userId),
        ne(tasks.assignedTo, userId),
      );
      where = and(
        eq(tasks.organizationId, organization.id),
        and(baseWhere, notPureSelfAssigned),
      );
    } else if (role === "manager" || role === "admin") {
      where = and(
        eq(tasks.organizationId, organization.id),
        eq(tasks.assignedBy, userId),
      );
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
    if (status && status !== "all") {
      where = where
        ? and(where, eq(tasks.status, status as StatusType))
        : eq(tasks.status, status as StatusType);
    }
    console.log("Status: ", status);
    if (priority) {
      where = where
        ? and(where, eq(tasks.priority, priority as PriorityType))
        : eq(tasks.priority, priority as PriorityType);
    }
    const all_tasks: Task[] = await getTasksForEmployee(
      where,
      order,
      limit,
      offset,
    );
    // Enrich with emails and names for assignedTo/assignedBy
    const ids = Array.from(
      new Set(
        all_tasks
          .flatMap((t) => [t.assignedTo, t.assignedBy])
          .filter(Boolean) as string[],
      ),
    );
    let map = new Map<string, { email: string | null; name: string | null }>();
    if (ids.length) {
      const rows = await db
        .select({
          authId: employees.authId,
          email: employees.email,
          name: employees.name,
        })
        .from(employees)
        .where(
          and(
            inArray(employees.authId, ids),
            eq(employees.organizationId, organization.id),
          ),
        );
      map = new Map(
        rows.map((r) => [r.authId, { email: r.email, name: r.name }]),
      );
    }

    // Build assignees map for these tasks
    const taskIds = all_tasks.map((t) => t.id);
    const assigneesMap = new Map<
      number,
      { id: number | null; email: string | null; name: string | null }[]
    >();
    if (taskIds.length) {
      const assigneesRows = await db
        .select({
          taskId: taskAssignees.taskId,
          id: employees.id,
          email: employees.email,
          name: employees.name,
        })
        .from(taskAssignees)
        .leftJoin(employees, eq(employees.authId, taskAssignees.userId))
        .where(
          and(
            inArray(taskAssignees.taskId, taskIds),
            eq(taskAssignees.organizationId, organization.id),
          ),
        );
      for (const r of assigneesRows) {
        const list = assigneesMap.get(r.taskId) ?? [];
        list.push({ id: r.id, email: r.email, name: r.name });
        assigneesMap.set(r.taskId, list);
      }
    }

    const enriched = all_tasks.map((t) => {
      return {
        ...t,
        assignedToEmail: map.get(t.assignedTo || "")?.email ?? null,
        assignedByEmail: map.get(t.assignedBy || "")?.email ?? null,
        assignedToName: map.get(t.assignedTo || "")?.name ?? null,
        assignedByName: map.get(t.assignedBy || "")?.name ?? null,
        assignees: assigneesMap.get(t.id) ?? [],
      };
    });
    return NextResponse.json({ tasks: enriched }, { status: 200 });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 },
    );
  }
}
