import { db } from "@/db";
import { employees, projects } from "@/db/schema";
import { auth } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { requireProjectPermission } from "@/actions/projects/permissions";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id: projectId } = await params;
    const id = Number(projectId);

    // Check if user has permission to view this project
    await requireProjectPermission(id, "view");
    const [row] = await db
      .select({
        id: projects.id,
        name: projects.name,
        code: projects.code,
        description: projects.description,
        location: projects.location,
        budgetPlanned: projects.budgetPlanned,
        budgetActual: projects.budgetActual,
        supervisorId: projects.supervisorId,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        supervisorName: employees.name,
        supervisorEmail: employees.email,
      })
      .from(projects)
      .leftJoin(employees, eq(employees.authId, projects.supervisorId))
      .where(
        and(eq(projects.id, id), eq(projects.organizationId, organization.id)),
      )
      .limit(1);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ project: row });
  } catch (error) {
    console.error("Error fetching project:", error);

    // Check if it's a permission error
    if (error instanceof Error && error.message.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id: projectId } = await params;
    const id = Number(projectId);

    // Check if user has permission to edit this project
    await requireProjectPermission(id, "manage");

    const body = await request.json();
    const {
      name,
      code,
      description,
      location,
      supervisorId,
      budgetPlanned,
      budgetActual,
      status,
    } = body ?? {};

    // Convert supervisorId from employee ID to auth ID if needed
    let supervisorAuthId = supervisorId ?? null;
    if (supervisorId) {
      const supervisorIdNum = Number(supervisorId);
      if (!Number.isNaN(supervisorIdNum)) {
        // It's a numeric employee ID, convert to auth ID
        const supervisor = await db.query.employees.findFirst({
          where: and(
            eq(employees.id, supervisorIdNum),
            eq(employees.organizationId, organization.id),
          ),
        });

        if (!supervisor) {
          return NextResponse.json(
            { error: "Supervisor not found" },
            { status: 400 },
          );
        }

        supervisorAuthId = supervisor.authId;
      }
    }

    const [updated] = await db
      .update(projects)
      .set({
        name,
        code,
        description,
        location,
        supervisorId: supervisorAuthId,
        budgetPlanned:
          budgetPlanned !== undefined ? Number(budgetPlanned) : undefined,
        budgetActual:
          budgetActual !== undefined ? Number(budgetActual) : undefined,
        status,
        updatedAt: new Date(),
      })
      .where(
        and(eq(projects.id, id), eq(projects.organizationId, organization.id)),
      )
      .returning();
    if (!updated)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ project: updated });
  } catch (error) {
    console.error("Error updating project:", error);

    // Check if it's a permission error
    if (error instanceof Error && error.message.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id: projectId } = await params;
    const id = Number(projectId);

    // Check if user has permission to delete this project
    await requireProjectPermission(id, "manage");
    const [deleted] = await db
      .delete(projects)
      .where(
        and(eq(projects.id, id), eq(projects.organizationId, organization.id)),
      )
      .returning();
    if (!deleted)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);

    // Check if it's a permission error
    if (error instanceof Error && error.message.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 },
    );
  }
}
