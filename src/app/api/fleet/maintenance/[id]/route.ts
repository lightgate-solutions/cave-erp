import { db } from "@/db";
import { fleetMaintenance, vehicles } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET: Get single maintenance record by ID
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

    const maintenanceId = Number(id);
    const [maintenance] = await db
      .select()
      .from(fleetMaintenance)
      .where(
        and(
          eq(fleetMaintenance.id, maintenanceId),
          eq(fleetMaintenance.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!maintenance) {
      return NextResponse.json(
        { error: "Maintenance record not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ maintenance });
  } catch (error) {
    console.error("Error fetching maintenance record:", error);
    return NextResponse.json(
      { error: "Failed to fetch maintenance record" },
      { status: 500 },
    );
  }
}

// PUT: Update maintenance record
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

    const maintenanceId = Number(id);
    const body = await request.json();

    // If vehicleId is being changed, verify it belongs to organization
    if (body.vehicleId) {
      const [vehicle] = await db
        .select()
        .from(vehicles)
        .where(
          and(
            eq(vehicles.id, Number(body.vehicleId)),
            eq(vehicles.organizationId, organization.id),
          ),
        )
        .limit(1);

      if (!vehicle) {
        return NextResponse.json(
          { error: "Vehicle not found" },
          { status: 404 },
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
        if (["maintenanceDate"].includes(key)) {
          updateData[key] = value ? new Date(value as string) : null;
        } else if (["vehicleId"].includes(key)) {
          updateData[key] = Number(value);
        } else if (["cost", "mileageAtService"].includes(key)) {
          updateData[key] = value ? value.toString() : null;
        } else {
          updateData[key] = value;
        }
      }
    }

    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(fleetMaintenance)
      .set(updateData as Partial<typeof fleetMaintenance.$inferInsert>)
      .where(
        and(
          eq(fleetMaintenance.id, maintenanceId),
          eq(fleetMaintenance.organizationId, organization.id),
        ),
      )
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Maintenance record not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ maintenance: updated });
  } catch (error) {
    console.error("Error updating maintenance record:", error);
    return NextResponse.json(
      { error: "Failed to update maintenance record" },
      { status: 500 },
    );
  }
}

// DELETE: Delete maintenance record
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

    const maintenanceId = Number(id);

    // Check if maintenance record exists first
    const [existing] = await db
      .select()
      .from(fleetMaintenance)
      .where(
        and(
          eq(fleetMaintenance.id, maintenanceId),
          eq(fleetMaintenance.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Maintenance record not found" },
        { status: 404 },
      );
    }

    await db
      .delete(fleetMaintenance)
      .where(
        and(
          eq(fleetMaintenance.id, maintenanceId),
          eq(fleetMaintenance.organizationId, organization.id),
        ),
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting maintenance record:", error);
    return NextResponse.json(
      { error: "Failed to delete maintenance record" },
      { status: 500 },
    );
  }
}
