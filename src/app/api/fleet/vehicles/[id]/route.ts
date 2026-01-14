import { db } from "@/db";
import { vehicles } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET: Get single vehicle by ID
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

    const vehicleId = Number(id);
    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(
        and(
          eq(vehicles.id, vehicleId),
          eq(vehicles.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    return NextResponse.json({ vehicle });
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    return NextResponse.json(
      { error: "Failed to fetch vehicle" },
      { status: 500 },
    );
  }
}

// PUT: Update vehicle
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

    const vehicleId = Number(id);
    const body = await request.json();

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
        if (
          [
            "purchaseDate",
            "insuranceExpiryDate",
            "registrationExpiryDate",
          ].includes(key)
        ) {
          updateData[key] = value ? new Date(value as string) : null;
        } else if (["year"].includes(key)) {
          updateData[key] = Number(value);
        } else if (
          [
            "currentMileage",
            "purchasePrice",
            "currentValue",
            "depreciationRate",
            "insurancePremiumAmount",
          ].includes(key)
        ) {
          updateData[key] = value ? value.toString() : null;
        } else {
          updateData[key] = value;
        }
      }
    }

    updateData.updatedAt = new Date();

    const [updated] = await db
      .update(vehicles)
      .set(updateData as Partial<typeof vehicles.$inferInsert>)
      .where(
        and(
          eq(vehicles.id, vehicleId),
          eq(vehicles.organizationId, organization.id),
        ),
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    return NextResponse.json({ vehicle: updated });
  } catch (error) {
    console.error("Error updating vehicle:", error);
    return NextResponse.json(
      { error: "Failed to update vehicle" },
      { status: 500 },
    );
  }
}

// DELETE: Delete vehicle
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

    const vehicleId = Number(id);

    // Check if vehicle exists first
    const [existing] = await db
      .select()
      .from(vehicles)
      .where(
        and(
          eq(vehicles.id, vehicleId),
          eq(vehicles.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    await db
      .delete(vehicles)
      .where(
        and(
          eq(vehicles.id, vehicleId),
          eq(vehicles.organizationId, organization.id),
        ),
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    return NextResponse.json(
      { error: "Failed to delete vehicle" },
      { status: 500 },
    );
  }
}
