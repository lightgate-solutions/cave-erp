import { db } from "@/db";
import { drivers, employees } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET: Get single driver by ID
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

    const driverId = Number(id);
    const [driver] = await db
      .select()
      .from(drivers)
      .where(
        and(
          eq(drivers.id, driverId),
          eq(drivers.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    return NextResponse.json({ driver });
  } catch (error) {
    console.error("Error fetching driver:", error);
    return NextResponse.json(
      { error: "Failed to fetch driver" },
      { status: 500 },
    );
  }
}

// PUT: Update driver
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

    const driverId = Number(id);
    const body = await request.json();

    // If employeeId provided, verify it belongs to this organization
    if (body.employeeId) {
      const [employee] = await db
        .select()
        .from(employees)
        .where(
          and(
            eq(employees.id, Number(body.employeeId)),
            eq(employees.organizationId, organization.id),
          ),
        )
        .limit(1);

      if (!employee) {
        return NextResponse.json(
          { error: "Invalid employee ID" },
          { status: 400 },
        );
      }
    }

    // Filter out undefined fields
    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (
        value !== undefined &&
        key !== "id" &&
        key !== "organizationId" &&
        key !== "createdAt" &&
        key !== "createdBy"
      ) {
        if (["licenseExpiryDate", "dateOfBirth", "hireDate"].includes(key)) {
          updateData[key] = value ? new Date(value as string) : null;
        } else if (["employeeId"].includes(key)) {
          updateData[key] = value ? Number(value) : null;
        } else {
          updateData[key] = value;
        }
      }
    }

    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(drivers)
      .set(updateData as Partial<typeof drivers.$inferInsert>)
      .where(
        and(
          eq(drivers.id, driverId),
          eq(drivers.organizationId, organization.id),
        ),
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    return NextResponse.json({ driver: updated });
  } catch (error) {
    console.error("Error updating driver:", error);
    return NextResponse.json(
      { error: "Failed to update driver" },
      { status: 500 },
    );
  }
}

// DELETE: Delete driver
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

    const driverId = Number(id);

    // Check if driver exists first
    const [existing] = await db
      .select()
      .from(drivers)
      .where(
        and(
          eq(drivers.id, driverId),
          eq(drivers.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    await db
      .delete(drivers)
      .where(
        and(
          eq(drivers.id, driverId),
          eq(drivers.organizationId, organization.id),
        ),
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting driver:", error);
    return NextResponse.json(
      { error: "Failed to delete driver" },
      { status: 500 },
    );
  }
}
