import { db } from "@/db";
import { assetLocations } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { requireAssetAccess } from "@/actions/auth/dal";

// GET: Get single location
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAssetAccess();
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const locationId = Number(id);

    const [location] = await db
      .select()
      .from(assetLocations)
      .where(
        and(
          eq(assetLocations.id, locationId),
          eq(assetLocations.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ location });
  } catch (error) {
    console.error("Error fetching location:", error);
    return NextResponse.json(
      { error: "Failed to fetch location" },
      { status: 500 },
    );
  }
}

// PATCH: Update location
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAssetAccess();
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const locationId = Number(id);
    const body = await request.json();

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const [updated] = await db
      .update(assetLocations)
      .set(updateData)
      .where(
        and(
          eq(assetLocations.id, locationId),
          eq(assetLocations.organizationId, organization.id),
        ),
      )
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ location: updated });
  } catch (error) {
    console.error("Error updating location:", error);
    return NextResponse.json(
      { error: "Failed to update location" },
      { status: 500 },
    );
  }
}

// DELETE: Delete location
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAssetAccess();
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const locationId = Number(id);

    const [deleted] = await db
      .delete(assetLocations)
      .where(
        and(
          eq(assetLocations.id, locationId),
          eq(assetLocations.organizationId, organization.id),
        ),
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting location:", error);
    return NextResponse.json(
      { error: "Failed to delete location" },
      { status: 500 },
    );
  }
}
