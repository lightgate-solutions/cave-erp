"use server";

import { db } from "@/db";
import { employees, tasks, taskAssignees } from "@/db/schema";
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

type CreateTaskWithAssignees = CreateTask & {
  assignees?: string[];
  selfAssign?: boolean;
};

export async function createTask(taskData: CreateTaskWithAssignees) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user.id || session.user.id !== taskData.assignedBy) {
      return {
        success: null,
        error: { reason: "Unauthorized" },
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

    const creator = await getEmployee(taskData.assignedBy);
    if (!creator) {
      return {
        success: null,
        error: { reason: "Employee not found" },
      };
    }

    const assignees = (taskData.assignees || []).filter(Boolean);
    const isSelfAssign =
      assignees.length === 1 && assignees[0] === taskData.assignedBy;
    const isSessionAdmin = session.user.role === "admin";
    const canAssignToOthers =
      !!creator.isManager || creator.role === "admin" || isSessionAdmin;

    if (!isSelfAssign && !canAssignToOthers) {
      return {
        success: null,
        error: {
          reason: "Only managers and admins can assign tasks to other people",
        },
      };
    }

    if (taskData.selfAssign === true && !isSelfAssign) {
      return {
        success: null,
        error: { reason: "Self-assign must only include yourself" },
      };
    }

    const uniqueAssignees = [...new Set(assignees)];
    if (uniqueAssignees.length) {
      const found = await db
        .select({ authId: employees.authId })
        .from(employees)
        .where(
          and(
            inArray(employees.authId, uniqueAssignees),
            eq(employees.organizationId, organization.id),
          ),
        );
      if (found.length !== uniqueAssignees.length) {
        return {
          success: null,
          error: {
            reason: "One or more assignees are not in your organization",
          },
        };
      }
    }

    const firstAssignee = assignees[0] ?? taskData.assignedTo ?? null;

    const {
      assignees: _assignees,
      selfAssign: _selfAssign,
      ...taskInsert
    } = taskData;

    const [created] = await db
      .insert(tasks)
      .values({
        ...taskInsert,
        assignedTo: firstAssignee ?? undefined,
        organizationId: organization.id,
      })
      .returning({ id: tasks.id });

    if (created?.id && assignees.length) {
      const rows = assignees.map((empId) => ({
        taskId: created.id,
        userId: empId,
        organizationId: organization.id,
      }));
      await db.insert(taskAssignees).values(rows);

      for (const notifyUserId of assignees) {
        if (notifyUserId === taskData.assignedBy) {
          continue;
        }

        const dueDate = taskData.dueDate
          ? new Date(taskData.dueDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          : null;

        let context = "";
        if (taskData.description) {
          const firstSentence = taskData.description.split(/[.!?]\s/)[0];
          const preview =
            firstSentence.length > 80
              ? `${firstSentence.substring(0, 80)}...`
              : firstSentence;
          context = ` — ${preview}`;
        }

        const message = `${creator.name} assigned you "${taskData.title}"${dueDate ? ` • Due ${dueDate}` : ""}${context}`;

        await createNotification({
          user_id: notifyUserId,
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
  userId: string,
  taskId: number,
  updates: Partial<CreateTask>,
) {
  const employee = await getEmployee(userId);
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

  const taskRow = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.organizationId, organization.id)))
    .limit(1)
    .then((r) => r[0]);

  if (!taskRow) {
    return {
      success: null,
      error: { reason: "Task not found" },
    };
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const isSessionAdmin = session?.user?.role === "admin";
  const isSelfOwnedTask =
    taskRow.assignedBy === userId && taskRow.assignedTo === userId;
  const isManagerLike =
    !!employee.isManager || employee.role === "admin" || isSessionAdmin;
  const isCreator = taskRow.assignedBy === userId;

  const useManagerPermissions = (isManagerLike && isCreator) || isSelfOwnedTask;

  type TaskInsert = typeof tasks.$inferInsert;
  type TaskUpdate = Partial<TaskInsert>;
  let allowedUpdates: Partial<CreateTask> = { ...updates };

  if (useManagerPermissions) {
    if (isManagerLike && isCreator && !isSelfOwnedTask) {
      const taskOwned = await getTaskByManager(userId, taskId);
      if (!taskOwned) {
        return {
          success: null,
          error: { reason: "You can only update tasks you created" },
        };
      }
    }
  } else {
    allowedUpdates = {} as Partial<CreateTask>;
    if (typeof updates.status !== "undefined") {
      if (updates.status === "Completed") {
        return {
          success: null,
          error: { reason: "Only managers can mark tasks as completed" },
        };
      }
      allowedUpdates.status = updates.status as CreateTask["status"];
    }
    if (updates.attachments !== undefined) {
      (allowedUpdates as Record<string, unknown>).attachments =
        updates.attachments;
    }
    if (Object.keys(allowedUpdates).length === 0) {
      return {
        success: null,
        error: {
          reason: "Employees can only update task status and attachments",
        },
      };
    }
    const assignedTask = await getTaskForEmployee(userId, taskId);
    if (!assignedTask) {
      return {
        success: null,
        error: { reason: "You are not assigned to this task" },
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
    const currentTask = taskRow;

    await db
      .update(tasks)
      .set(normalized as unknown as TaskUpdate)
      .where(
        and(eq(tasks.id, taskId), eq(tasks.organizationId, organization.id)),
      );

    if (useManagerPermissions && currentTask) {
      const hasSignificantChanges =
        updates.title ||
        updates.description ||
        updates.dueDate ||
        updates.priority;

      if (hasSignificantChanges) {
        // Get all assignees
        const assigneesList = await db
          .select({ userId: taskAssignees.userId })
          .from(taskAssignees)
          .where(
            and(
              eq(taskAssignees.taskId, taskId),
              eq(taskAssignees.organizationId, organization.id),
            ),
          );

        const assigneeIds = assigneesList.map((a) => a.userId).filter(Boolean);
        if (currentTask.assignedTo) assigneeIds.push(currentTask.assignedTo);

        // Notify each assignee
        for (const assigneeId of assigneeIds) {
          if (assigneeId === userId) {
            continue;
          }
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

    if (
      !useManagerPermissions &&
      updates.status === "In Progress" &&
      currentTask &&
      currentTask.assignedBy !== userId
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

export async function deleteTask(userId: string, taskId: number) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user.id || session.user.id !== userId) {
      return {
        success: null,
        error: { reason: "Unauthorized" },
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

    const actor = await getEmployee(userId);
    if (!actor) {
      return {
        success: null,
        error: { reason: "Employee not found" },
      };
    }

    const task = await db
      .select()
      .from(tasks)
      .where(
        and(eq(tasks.id, taskId), eq(tasks.organizationId, organization.id)),
      )
      .limit(1)
      .then((r) => r[0]);

    if (!task) {
      return {
        success: null,
        error: { reason: "Task not found" },
      };
    }

    const isSessionAdmin = session.user.role === "admin";
    const isSelfOwned =
      task.assignedBy === userId && task.assignedTo === userId;
    const isManagerLike =
      !!actor.isManager || actor.role === "admin" || isSessionAdmin;
    const canDelete =
      (isManagerLike && task.assignedBy === userId) || isSelfOwned;

    if (!canDelete) {
      return {
        success: null,
        error: { reason: "You cannot delete this task" },
      };
    }

    const assigneesList = await db
      .select({ userId: taskAssignees.userId })
      .from(taskAssignees)
      .where(
        and(
          eq(taskAssignees.taskId, taskId),
          eq(taskAssignees.organizationId, organization.id),
        ),
      );

    const assigneeIds = assigneesList.map((a) => a.userId).filter(Boolean);
    if (task.assignedTo) assigneeIds.push(task.assignedTo);

    await db
      .delete(tasks)
      .where(
        and(eq(tasks.id, taskId), eq(tasks.organizationId, organization.id)),
      );

    for (const assigneeId of assigneeIds) {
      if (assigneeId === userId) {
        continue;
      }
      await createNotification({
        user_id: assigneeId,
        title: "Task Cancelled",
        message: `${actor.name} cancelled the task "${task.title}"`,
        notification_type: "message",
        reference_id: taskId,
      });
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

export async function getTaskForEmployee(userId: string, taskId: number) {
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
        eq(taskAssignees.userId, userId),
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
        or(eq(tasks.assignedTo, userId), inArray(tasks.id, taskIds)),
      ),
    )
    .limit(1)
    .then((res) => res[0]);
}

export async function getTaskByManager(managerId: string, taskId: number) {
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
export async function getTasksByManager(managerId: string) {
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
