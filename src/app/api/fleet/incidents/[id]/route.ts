import { db } from "@/db";
import { fleetIncidents, vehicles, drivers } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET: Get single incident by ID
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

    const incidentId = Number(id);
    const [incident] = await db
      .select()
      .from(fleetIncidents)
      .where(
        and(
          eq(fleetIncidents.id, incidentId),
          eq(fleetIncidents.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!incident) {
      return NextResponse.json(
        { error: "Incident not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ incident });
  } catch (error) {
    console.error("Error fetching incident:", error);
    return NextResponse.json(
      { error: "Failed to fetch incident" },
      { status: 500 },
    );
  }
}

// PUT: Update incident
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

    const incidentId = Number(id);
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

    // If driverId is being changed, verify it belongs to organization
    if (body.driverId) {
      const [driver] = await db
        .select()
        .from(drivers)
        .where(
          and(
            eq(drivers.id, Number(body.driverId)),
            eq(drivers.organizationId, organization.id),
          ),
        )
        .limit(1);

      if (!driver) {
        return NextResponse.json(
          { error: "Driver not found" },
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
        key !== "reportedBy"
      ) {
        if (["incidentDate", "resolvedAt"].includes(key)) {
          updateData[key] = value ? new Date(value as string) : null;
        } else if (["vehicleId", "driverId"].includes(key)) {
          updateData[key] = value ? Number(value) : null;
        } else if (["estimatedCost"].includes(key)) {
          updateData[key] = value ? value.toString() : null;
        } else {
          updateData[key] = value;
        }
      }
    }

    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(fleetIncidents)
      .set(updateData as Partial<typeof fleetIncidents.$inferInsert>)
      .where(
        and(
          eq(fleetIncidents.id, incidentId),
          eq(fleetIncidents.organizationId, organization.id),
        ),
      )
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Incident not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ incident: updated });
  } catch (error) {
    console.error("Error updating incident:", error);
    return NextResponse.json(
      { error: "Failed to update incident" },
      { status: 500 },
    );
  }
}

// DELETE: Delete incident
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

    const incidentId = Number(id);

    // Check if incident exists first
    const [existing] = await db
      .select()
      .from(fleetIncidents)
      .where(
        and(
          eq(fleetIncidents.id, incidentId),
          eq(fleetIncidents.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Incident not found" },
        { status: 404 },
      );
    }

    await db
      .delete(fleetIncidents)
      .where(
        and(
          eq(fleetIncidents.id, incidentId),
          eq(fleetIncidents.organizationId, organization.id),
        ),
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting incident:", error);
    return NextResponse.json(
      { error: "Failed to delete incident" },
      { status: 500 },
    );
  }
}
