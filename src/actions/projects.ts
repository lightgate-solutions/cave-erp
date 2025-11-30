"use server";

import { db } from "@/db";
import { projects } from "@/db/schema";
import { DrizzleQueryError, asc, desc, eq, ilike, or } from "drizzle-orm";
import { createNotification } from "./notification/notification";
import { requireAuth, requireAdmin, requireManager } from "@/actions/auth/dal";
import { z } from "zod";

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(255),
  description: z.string().max(1000).nullable().optional(),
  location: z.string().max(255).nullable().optional(),
  supervisorId: z.number().int().positive().nullable().optional(),
  budgetPlanned: z.number().nonnegative().optional(),
  budgetActual: z.number().nonnegative().optional(),
});

export type ProjectInput = z.infer<typeof projectSchema>;

export async function listProjects(params: {
  page?: number;
  limit?: number;
  q?: string;
  sortBy?:
    | "id"
    | "name"
    | "code"
    | "description"
    | "location"
    | "status"
    | "budgetPlanned"
    | "budgetActual"
    | "supervisorId"
    | "createdAt"
    | "updatedAt";
  sortDirection?: "asc" | "desc";
}) {
  await requireAuth();
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const offset = (page - 1) * limit;
  const q = params.q ?? "";
  const sortBy = params.sortBy ?? "createdAt";
  const sortDirection = params.sortDirection === "asc" ? "asc" : "desc";

  const where = q
    ? or(
        ilike(projects.name, `%${q}%`),
        ilike(projects.code, `%${q}%`),
        ilike(projects.location, `%${q}%`),
      )
    : undefined;

  const totalRows = await db
    .select({ id: projects.id })
    .from(projects)
    .where(where);
  const total = totalRows.length;

  const order =
    sortDirection === "asc" ? asc(projects[sortBy]) : desc(projects[sortBy]);

  const rows = await db
    .select()
    .from(projects)
    .where(where)
    .orderBy(order)
    .limit(limit)
    .offset(offset);

  return {
    projects: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function createProject(input: ProjectInput) {
  await requireManager();

  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) {
    return {
      project: null,
      error: { reason: "Invalid input" },
    };
  }

  const validatedInput = parsed.data;

  try {
    // Generate code like 1BM, 2BM, ... based on max existing id
    const { sql } = await import("drizzle-orm");
    const [{ maxId }] = await db
      .select({ maxId: sql<number>`max(${projects.id})` })
      .from(projects);
    const nextId = (maxId ?? 0) + 1;
    const generatedCode = `${nextId}BM`;

    const [row] = await db
      .insert(projects)
      .values({
        name: validatedInput.name,
        code: generatedCode,
        description: validatedInput.description ?? null,
        location: validatedInput.location ?? null,
        supervisorId: validatedInput.supervisorId ?? null,
        budgetPlanned: validatedInput.budgetPlanned ?? 0,
        budgetActual: validatedInput.budgetActual ?? 0,
      })
      .returning();

    // Notify supervisor if assigned
    if (row.supervisorId) {
      await createNotification({
        user_id: row.supervisorId,
        title: "Assigned as Project Supervisor",
        message: `You've been assigned as supervisor for project: ${row.name} (${row.code})`,
        notification_type: "message",
        reference_id: row.id,
      });
    }

    return { project: row, error: null };
  } catch (err) {
    const message =
      err instanceof DrizzleQueryError
        ? err.cause?.message
        : "Could not create project";
    return { project: null, error: { reason: message } };
  }
}

export async function updateProject(id: number, input: Partial<ProjectInput>) {
  await requireAdmin();
  try {
    // Get the current project before updating
    const currentProject = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1)
      .then((r) => r[0]);

    const [row] = await db
      .update(projects)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();

    // Notify newly assigned supervisor
    if (
      input.supervisorId !== undefined &&
      input.supervisorId !== currentProject?.supervisorId &&
      input.supervisorId !== null
    ) {
      await createNotification({
        user_id: input.supervisorId,
        title: "Assigned as Project Supervisor",
        message: `You've been assigned as supervisor for project: ${row.name} (${row.code})`,
        notification_type: "message",
        reference_id: row.id,
      });
    }

    // Notify previous supervisor if removed
    if (
      input.supervisorId !== undefined &&
      input.supervisorId === null &&
      currentProject?.supervisorId
    ) {
      await createNotification({
        user_id: currentProject.supervisorId,
        title: "Project Supervision Ended",
        message: `You are no longer assigned to supervise project: ${row.name} (${row.code})`,
        notification_type: "message",
        reference_id: row.id,
      });
    }

    // Notify current supervisor about other significant updates
    if (row.supervisorId) {
      const changeSummary: string[] = [];
      if (input.name && input.name !== currentProject?.name) {
        changeSummary.push(`Name updated to "${input.name}"`);
      }
      if (
        input.description !== undefined &&
        input.description !== currentProject?.description
      ) {
        changeSummary.push("Description updated");
      }
      if (input.location && input.location !== currentProject?.location) {
        changeSummary.push(`Location updated to ${input.location}`);
      }
      if (
        typeof input.budgetPlanned === "number" &&
        input.budgetPlanned !== currentProject?.budgetPlanned
      ) {
        changeSummary.push(
          `Planned budget updated to ${input.budgetPlanned.toLocaleString()}`,
        );
      }
      if (
        typeof input.budgetActual === "number" &&
        input.budgetActual !== currentProject?.budgetActual
      ) {
        changeSummary.push(
          `Actual budget updated to ${input.budgetActual.toLocaleString()}`,
        );
      }

      if (changeSummary.length) {
        await createNotification({
          user_id: row.supervisorId,
          title: "Project Updated",
          message: `Project ${row.name} (${row.code}) updated • ${changeSummary.join(" • ")}`,
          notification_type: "message",
          reference_id: row.id,
        });
      }
    }

    return { project: row, error: null };
  } catch (err) {
    const message =
      err instanceof DrizzleQueryError
        ? err.cause?.message
        : "Could not update project";
    return { project: null, error: { reason: message } };
  }
}

export async function deleteProject(id: number) {
  await requireAdmin();
  try {
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1)
      .then((r) => r[0]);

    await db.delete(projects).where(eq(projects.id, id));

    if (project?.supervisorId) {
      await createNotification({
        user_id: project.supervisorId,
        title: "Project Cancelled",
        message: `Project ${project.name} (${project.code}) has been removed`,
        notification_type: "message",
        reference_id: project.id,
      });
    }

    return { success: true, error: null };
  } catch (err) {
    const message =
      err instanceof DrizzleQueryError
        ? err.cause?.message
        : "Could not delete project";
    return { success: false, error: { reason: message } };
  }
}
