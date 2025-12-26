"use server";

import { db } from "@/db";
import { tasks, taskAssignees } from "@/db/schema";
import { getEmployee } from "../hr/employees";
import {
  and,
  type asc,
  type desc,
  DrizzleQueryError,
  eq,
  or,
  inArray,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { CreateTask } from "@/types";
import { createNotification } from "../notification/notification";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

type CreateTaskWithAssignees = CreateTask & { assignees?: number[] };

export async function createTask(taskData: CreateTaskWithAssignees) {
  try {
    const manager = await getEmployee(taskData.assignedBy);
    if (!manager || !manager.isManager) {
      return {
        success: null,
        error: { reason: "Only managers can create tasks" },
      };
    }

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    const assignees = (taskData.assignees || []).filter(Boolean);
    const firstAssignee = assignees[0] ?? taskData.assignedTo ?? null;

    const [created] = await db
      .insert(tasks)
      .values({
        ...taskData,
        assignedTo: firstAssignee ?? undefined,
        organizationId: organization.id,
      })
      .returning({ id: tasks.id });

    if (created?.id && assignees.length) {
      const rows = assignees.map((empId) => ({
        taskId: created.id,
        employeeId: empId,
        organizationId: organization.id,
      }));
      await db.insert(taskAssignees).values(rows);

      // Notify all assignees about the new task
      for (const employeeId of assignees) {
        const dueDate = taskData.dueDate
          ? new Date(taskData.dueDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          : null;

        // Extract first sentence for context
        let context = "";
        if (taskData.description) {
          const firstSentence = taskData.description.split(/[.!?]\s/)[0];
          const preview =
            firstSentence.length > 80
              ? `${firstSentence.substring(0, 80)}...`
              : firstSentence;
          context = ` — ${preview}`;
        }

        const message = `${manager.name} assigned you "${taskData.title}"${dueDate ? ` • Due ${dueDate}` : ""}${context}`;

        await createNotification({
          user_id: employeeId,
          title: "New Task Assignment",
          message,
          notification_type: "message",
          reference_id: created.id,
        });
      }
    }

    revalidatePath("/tasks/history");
    return {
      success: { reason: "Task created successfully" },
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

export async function updateTask(
  employeeId: number,
  taskId: number,
  updates: Partial<CreateTask>,
) {
  const employee = await getEmployee(employeeId);
  if (!employee) {
    return {
      success: null,
      error: { reason: "Employee not found" },
    };
  }

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return {
      success: null,
      error: { reason: "Organization not found" },
    };
  }

  type TaskInsert = typeof tasks.$inferInsert;
  type TaskUpdate = Partial<TaskInsert>;
  // Enforce permissions:
  // - Managers can update any fields on tasks they created
  // - Employees can only update status (except to Completed) and attachments
  let allowedUpdates: Partial<CreateTask> = { ...updates };
  if (!employee.isManager) {
    // Filter down to only status and attachments for non-managers
    allowedUpdates = {} as Partial<CreateTask>;
    if (typeof updates.status !== "undefined") {
      // Employees cannot set status to "Completed"
      if (updates.status === "Completed") {
        return {
          success: null,
          error: { reason: "Only managers can mark tasks as completed" },
        };
      }
      allowedUpdates.status = updates.status as CreateTask["status"];
    }
    // Allow employees to add attachments
    if (updates.attachments !== undefined) {
      (allowedUpdates as Record<string, unknown>).attachments =
        updates.attachments;
    }
    // If nothing to update after filtering, exit early
    if (Object.keys(allowedUpdates).length === 0) {
      return {
        success: null,
        error: {
          reason: "Employees can only update task status and attachments",
        },
      };
    }
    // Ensure employee has access to this task (either directly assigned or via assignees table)
    const currentTask = await getTaskForEmployee(employeeId, taskId);
    if (!currentTask) {
      return {
        success: null,
        error: { reason: "You are not assigned to this task" },
      };
    }
  } else {
    // Manager path: ensure the task belongs to this manager
    const taskOwned = await getTaskByManager(employeeId, taskId);
    if (!taskOwned) {
      return {
        success: null,
        error: { reason: "You can only update tasks you created" },
      };
    }
  }

  const processedUpdates: TaskUpdate = {
    ...allowedUpdates,
    updatedAt: new Date(),
  } as TaskUpdate;

  // Normalize empty string fields to null where applicable
  const normalized = { ...processedUpdates } as Record<string, unknown>;
  for (const [key, value] of Object.entries(normalized)) {
    if (value === "") {
      normalized[key] = null;
    }
  }

  try {
    // Get current task before update for notifications
    const currentTask = await db
      .select()
      .from(tasks)
      .where(
        and(eq(tasks.id, taskId), eq(tasks.organizationId, organization.id)),
      )
      .limit(1)
      .then((r) => r[0]);

    // Additional safety: if employee is a manager, optionally ensure they own the task; otherwise just by id
    if (employee.isManager) {
      await db
        .update(tasks)
        .set(normalized as unknown as TaskUpdate)
        .where(
          and(eq(tasks.id, taskId), eq(tasks.organizationId, organization.id)),
        );
    } else {
      await db
        .update(tasks)
        .set(normalized as unknown as TaskUpdate)
        .where(
          and(eq(tasks.id, taskId), eq(tasks.organizationId, organization.id)),
        );
    }

    // Notify assignees if manager made significant changes
    if (employee.isManager && currentTask) {
      const hasSignificantChanges =
        updates.title ||
        updates.description ||
        updates.dueDate ||
        updates.priority;

      if (hasSignificantChanges) {
        // Get all assignees
        const assigneesList = await db
          .select({ employeeId: taskAssignees.employeeId })
          .from(taskAssignees)
          .where(
            and(
              eq(taskAssignees.taskId, taskId),
              eq(taskAssignees.organizationId, organization.id),
            ),
          );

        const assigneeIds = assigneesList
          .map((a) => a.employeeId)
          .filter(Boolean);
        if (currentTask.assignedTo) assigneeIds.push(currentTask.assignedTo);

        // Notify each assignee
        for (const assigneeId of assigneeIds) {
          let changeDesc = "";
          if (updates.title) changeDesc = "Task title updated";
          else if (updates.description) changeDesc = "Task description updated";
          else if (updates.dueDate) changeDesc = "Due date changed";
          else if (updates.priority) changeDesc = "Priority changed";

          await createNotification({
            user_id: assigneeId,
            title: "Task Updated",
            message: `${employee.name} updated "${currentTask.title}" • ${changeDesc}`,
            notification_type: "message",
            reference_id: taskId,
          });
        }
      }
    }

    // Notify manager when employee starts task
    if (
      !employee.isManager &&
      updates.status === "In Progress" &&
      currentTask
    ) {
      await createNotification({
        user_id: currentTask.assignedBy,
        title: "Task Started",
        message: `${employee.name} started working on "${currentTask.title}"`,
        notification_type: "message",
        reference_id: taskId,
      });
    }

    revalidatePath("/tasks/history");
    return {
      success: { reason: "Task updated successfully" },
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

export async function deleteTask(employeeId: number, taskId: number) {
  try {
    const manager = await getEmployee(employeeId);
    if (!manager || !manager.isManager) {
      return {
        success: null,
        error: { reason: "Only managers can delete tasks" },
      };
    }

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    // Get task details before deletion for notifications
    const task = await db
      .select()
      .from(tasks)
      .where(
        and(eq(tasks.id, taskId), eq(tasks.organizationId, organization.id)),
      )
      .limit(1)
      .then((r) => r[0]);

    if (task) {
      // Get all assignees to notify them
      const assigneesList = await db
        .select({ employeeId: taskAssignees.employeeId })
        .from(taskAssignees)
        .where(
          and(
            eq(taskAssignees.taskId, taskId),
            eq(taskAssignees.organizationId, organization.id),
          ),
        );

      const assigneeIds = assigneesList
        .map((a) => a.employeeId)
        .filter(Boolean);
      if (task.assignedTo) assigneeIds.push(task.assignedTo);

      // Delete the task
      await db
        .delete(tasks)
        .where(
          and(eq(tasks.id, taskId), eq(tasks.organizationId, organization.id)),
        );

      // Notify assignees that task was cancelled
      for (const assigneeId of assigneeIds) {
        await createNotification({
          user_id: assigneeId,
          title: "Task Cancelled",
          message: `${manager.name} cancelled the task "${task.title}"`,
          notification_type: "message",
          reference_id: taskId,
        });
      }
    } else {
      await db
        .delete(tasks)
        .where(
          and(eq(tasks.id, taskId), eq(tasks.organizationId, organization.id)),
        );
    }

    revalidatePath("/tasks");
    return {
      success: { reason: "Task deleted successfully" },
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

export async function getTasksForEmployee(
  where:
    | ReturnType<typeof or>
    | ReturnType<typeof eq>
    | ReturnType<typeof and>
    | undefined,
  order: ReturnType<typeof asc> | ReturnType<typeof desc>,
  limit: number = 10,
  offset: number = 0,
) {
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return [];
  }

  const finalWhere = where
    ? and(where, eq(tasks.organizationId, organization.id))
    : eq(tasks.organizationId, organization.id);

  const rows = await db
    .select()
    .from(tasks)
    .where(finalWhere)
    .orderBy(order)
    .limit(limit)
    .offset(offset);
  return rows;
}

export async function getTaskForEmployee(employeeId: number, taskId: number) {
  // A task is visible to an employee if either it's directly assignedTo them
  // or they appear in task_assignees for that task.
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return undefined;
  }

  const ids = await db
    .select({ id: taskAssignees.taskId })
    .from(taskAssignees)
    .where(
      and(
        eq(taskAssignees.employeeId, employeeId),
        eq(taskAssignees.organizationId, organization.id),
      ),
    );
  const taskIds = ids.map((r) => r.id);

  return await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.id, taskId),
        eq(tasks.organizationId, organization.id),
        or(eq(tasks.assignedTo, employeeId), inArray(tasks.id, taskIds)),
      ),
    )
    .limit(1)
    .then((res) => res[0]);
}

export async function getTaskByManager(managerId: number, taskId: number) {
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return undefined;
  }

  return await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.id, taskId),
        eq(tasks.assignedBy, managerId),
        eq(tasks.organizationId, organization.id),
      ),
    )
    .limit(1)
    .then((res) => res[0]);
}

// Returns all tasks created by a given manager
export async function getTasksByManager(managerId: number) {
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return [];
  }

  return await db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.assignedBy, managerId),
        eq(tasks.organizationId, organization.id),
      ),
    );
}
