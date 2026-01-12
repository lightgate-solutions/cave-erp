import { db } from "@/db";
import { milestones } from "@/db/schema";
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
    const { id } = await params;
    const projectId = Number(id);

    // Check if user has permission to view this project
    await requireProjectPermission(projectId, "view");

    const rows = await db
      .select()
      .from(milestones)
      .where(
        and(
          eq(milestones.projectId, projectId),
          eq(milestones.organizationId, organization.id),
        ),
      );
    return NextResponse.json({ milestones: rows });
  } catch (error) {
    console.error("Error fetching milestones:", error);
    return NextResponse.json(
      { error: "Failed to fetch milestones" },
      { status: 500 },
    );
  }
}

export async function POST(
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
    const { id } = await params;
    const projectId = Number(id);

    // Check if user has permission to edit this project
    await requireProjectPermission(projectId, "edit");

    const body = await request.json();
    const { title, description, dueDate } = body ?? {};
    if (!title)
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    const [created] = await db
      .insert(milestones)
      .values({
        projectId,
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        completed: 0,
        organizationId: organization.id,
      })
      .returning();
    return NextResponse.json({ milestone: created }, { status: 201 });
  } catch (error) {
    console.error("Error creating milestone:", error);
    return NextResponse.json(
      { error: "Failed to create milestone" },
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
    const { id } = await params;
    const projectId = Number(id);

    // Check if user has permission to edit this project
    await requireProjectPermission(projectId, "edit");

    const body = await request.json();
    const {
      id: milestoneId,
      title,
      description,
      dueDate,
      completed,
    } = body ?? {};
    if (!milestoneId)
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    const [updated] = await db
      .update(milestones)
      .set({
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        completed: completed ? 1 : 0,
      })
      .where(
        and(
          eq(milestones.projectId, projectId),
          eq(milestones.organizationId, organization.id),
          eq(milestones.id, Number(milestoneId)),
        ),
      )
      .returning();
    return NextResponse.json({ milestone: updated });
  } catch (error) {
    console.error("Error updating milestone:", error);
    return NextResponse.json(
      { error: "Failed to update milestone" },
      { status: 500 },
    );
  }
}

export async function DELETE(
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
    const { id } = await params;
    const projectId = Number(id);

    // Check if user has permission to edit this project
    await requireProjectPermission(projectId, "edit");

    const body = await request.json();
    const { id: milestoneId } = body ?? {};
    if (!milestoneId)
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    await db
      .delete(milestones)
      .where(
        and(
          eq(milestones.projectId, projectId),
          eq(milestones.id, Number(milestoneId)),
          eq(milestones.organizationId, organization.id),
        ),
      );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting milestone:", error);
    return NextResponse.json(
      { error: "Failed to delete milestone" },
      { status: 500 },
    );
  }
}
