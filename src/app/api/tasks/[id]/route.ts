import { NextResponse, type NextRequest } from "next/server";
import {
  getTaskForEmployee,
  getTaskByManager,
  deleteTask,
  updateTask,
} from "@/actions/tasks/tasks";
import type { CreateTask } from "@/types";
import { db } from "@/db";
import { employees, taskAssignees } from "@/db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id: idParam } = await params;
    const id = Number(idParam);
    const { searchParams } = _request.nextUrl;
    // Note: API query parameter is still "employeeId" for backward compatibility
    const employeeIdParam = searchParams.get("employeeId");
    const employeeId = employeeIdParam ? Number(employeeIdParam) : 0;
    const role = searchParams.get("role");
    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 },
      );
    }

    // Look up employee to get authId (string userId)
    const employee = await db
      .select({ id: employees.id, authId: employees.authId })
      .from(employees)
      .where(
        and(
          eq(employees.id, employeeId),
          eq(employees.organizationId, organization.id),
        ),
      )
      .limit(1)
      .then((res) => res[0]);

    if (!employee?.authId) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 400 },
      );
    }

    const userId = employee.authId; // Now it's string (text)
    let task: CreateTask | undefined;
    if (role === "manager") {
      task = await getTaskByManager(employee.authId, id);
    } else {
      task = await getTaskForEmployee(userId, id);
    }
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    // Enrich with emails
    const ids = [task.assignedTo, task.assignedBy].filter(Boolean) as string[];
    // Load assignees for this task
    const assigneesRows = await db
      .select({
        id: employees.id,
        email: employees.email,
        name: employees.name,
      })
      .from(taskAssignees)
      .leftJoin(employees, eq(employees.authId, taskAssignees.userId))
      .where(
        and(
          eq(taskAssignees.taskId, id),
          eq(taskAssignees.organizationId, organization.id),
        ),
      );
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
      const map = new Map(
        rows.map((r) => [r.authId, { email: r.email, name: r.name }]),
      );
      return NextResponse.json({
        task: {
          ...task,
          assignedToEmail: map.get(task.assignedTo || "")?.email ?? null,
          assignedByEmail: map.get(task.assignedBy || "")?.email ?? null,
          assignedToName: map.get(task.assignedTo || "")?.name ?? null,
          assignedByName: map.get(task.assignedBy || "")?.name ?? null,
          assignees: assigneesRows.map((r) => ({
            id: r.id,
            email: r.email,
            name: r.name,
          })),
        },
      });
    }
    return NextResponse.json({
      task: {
        ...task,
        assignees: assigneesRows.map((r) => ({
          id: r.id,
          email: r.email,
          name: r.name,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id: idParam } = await params;
    const id = Number(idParam);
    const { searchParams } = _request.nextUrl;
    // Note: API query parameter is still "employeeId" for backward compatibility
    const employeeIdParam = searchParams.get("employeeId");
    const employeeId = employeeIdParam ? Number(employeeIdParam) : 0;
    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 },
      );
    }

    // Look up employee to get authId (string userId)
    const employee = await db
      .select({ id: employees.id, authId: employees.authId })
      .from(employees)
      .where(
        and(
          eq(employees.id, employeeId),
          eq(employees.organizationId, organization.id),
        ),
      )
      .limit(1)
      .then((res) => res[0]);

    if (!employee?.authId) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 400 },
      );
    }

    const userId = employee.authId; // Now it's string (text)
    const deleted = await deleteTask(userId, id);

    if (!deleted.success) {
      return NextResponse.json(
        { error: deleted.error?.reason || "Task not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: deleted.success.reason });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id: idParam } = await params;
    const id = Number(idParam);
    const body = await request.json();
    const content: Partial<CreateTask> = {};
    const keys = Object.keys(body) as Array<keyof CreateTask>;
    for (const key of keys) {
      const value = body[key];
      if (value !== undefined) {
        (content as Record<string, unknown>)[key as string] = value as unknown;
      }
    }
    const { searchParams } = request.nextUrl;
    // Note: API query parameter is still "employeeId" for backward compatibility
    const employeeIdParam = searchParams.get("employeeId");
    const employeeId = employeeIdParam ? Number(employeeIdParam) : 0;
    const role = searchParams.get("role");
    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 },
      );
    }

    // Look up employee to get authId (string userId)
    const employee = await db
      .select({ id: employees.id, authId: employees.authId })
      .from(employees)
      .where(
        and(
          eq(employees.id, employeeId),
          eq(employees.organizationId, organization.id),
        ),
      )
      .limit(1)
      .then((res) => res[0]);

    if (!employee?.authId) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 400 },
      );
    }

    const userId = employee.authId; // Now it's string (text)
    const updated = await updateTask(userId, id, content);
    if (!updated.success) {
      return NextResponse.json(
        { error: updated.error?.reason || "Task not found or not updated" },
        { status: 404 },
      );
    }

    // Fetch and return the updated task object so clients can update instantly
    let task: CreateTask | undefined;
    if (role === "manager") {
      task = await getTaskByManager(employee.authId, id);
    } else if (role === "employee") {
      task = await getTaskForEmployee(userId, id);
    } else {
      // Fallback: return 200 with no task if role missing
      return NextResponse.json({ message: updated.success.reason });
    }

    // Enrich with emails for the updated object if available
    if (task) {
      const ids = [task.assignedTo, task.assignedBy].filter(
        Boolean,
      ) as string[];
      const assigneesRows = await db
        .select({
          id: employees.id,
          email: employees.email,
          name: employees.name,
        })
        .from(taskAssignees)
        .leftJoin(employees, eq(employees.authId, taskAssignees.userId))
        .where(
          and(
            eq(taskAssignees.taskId, id),
            eq(taskAssignees.organizationId, organization.id),
          ),
        );
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
        const map = new Map(
          rows.map((r) => [r.authId, { email: r.email, name: r.name }]),
        );
        return NextResponse.json({
          task: {
            ...task,
            assignedToEmail: map.get(task.assignedTo || "")?.email ?? null,
            assignedByEmail: map.get(task.assignedBy || "")?.email ?? null,
            assignedToName: map.get(task.assignedTo || "")?.name ?? null,
            assignedByName: map.get(task.assignedBy || "")?.name ?? null,
            assignees: assigneesRows.map((r) => ({
              id: r.id,
              email: r.email,
              name: r.name,
            })),
          },
        });
      }
    }
    return NextResponse.json({
      task: {
        ...task,
        assignees: [],
      },
    });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id: idParam } = await params;
    const id = Number(idParam);
    const body = await request.json();
    // Note: Request body still uses "employeeId" for backward compatibility
    const { employeeId: userId, ...updates } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 },
      );
    }

    const updated = await updateTask(userId, id, updates);
    if (!updated.success) {
      return NextResponse.json(
        { error: updated.error?.reason || "Task not found or not updated" },
        { status: 404 },
      );
    }

    return NextResponse.json({ message: updated.success.reason });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    );
  }
}
