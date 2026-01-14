import { db } from "@/db";
import { driverAssignments } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET: Get single assignment by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assignmentId = Number(id);
    const [assignment] = await db
      .select()
      .from(driverAssignments)
      .where(
        and(
          eq(driverAssignments.id, assignmentId),
          eq(driverAssignments.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ assignment });
  } catch (error) {
    console.error("Error fetching assignment:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignment" },
      { status: 500 },
    );
  }
}

// PUT: Update assignment (primarily for ending an assignment)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assignmentId = Number(id);
    const body = await request.json();

    // Filter out undefined fields
    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (
        value !== undefined &&
        key !== "id" &&
        key !== "organizationId" &&
        key !== "driverId" &&
        key !== "vehicleId" &&
        key !== "createdAt" &&
        key !== "assignedBy"
      ) {
        if (["startDate", "endDate"].includes(key)) {
          updateData[key] = value ? new Date(value as string) : null;
        } else {
          updateData[key] = value;
        }
      }
    }

    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(driverAssignments)
      .set(updateData as Partial<typeof driverAssignments.$inferInsert>)
      .where(
        and(
          eq(driverAssignments.id, assignmentId),
          eq(driverAssignments.organizationId, organization.id),
        ),
      )
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ assignment: updated });
  } catch (error) {
    console.error("Error updating assignment:", error);
    return NextResponse.json(
      { error: "Failed to update assignment" },
      { status: 500 },
    );
  }
}

// DELETE: Delete assignment
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assignmentId = Number(id);

    // Check if assignment exists first
    const [existing] = await db
      .select()
      .from(driverAssignments)
      .where(
        and(
          eq(driverAssignments.id, assignmentId),
          eq(driverAssignments.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }

    await db
      .delete(driverAssignments)
      .where(
        and(
          eq(driverAssignments.id, assignmentId),
          eq(driverAssignments.organizationId, organization.id),
        ),
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    return NextResponse.json(
      { error: "Failed to delete assignment" },
      { status: 500 },
    );
  }
}
