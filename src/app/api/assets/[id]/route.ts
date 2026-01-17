import { db } from "@/db";
import {
  assets,
  assetCategories,
  assetLocations,
  assetAssignments,
  user,
} from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { requireAssetAccess } from "@/actions/auth/dal";

// GET: Get single asset by ID
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
    const assetId = Number(id);

    const [row] = await db
      .select({
        asset: assets,
        category: {
          id: assetCategories.id,
          name: assetCategories.name,
          codePrefix: assetCategories.codePrefix,
        },
        location: {
          id: assetLocations.id,
          name: assetLocations.name,
          address: assetLocations.address,
        },
      })
      .from(assets)
      .leftJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
      .leftJoin(assetLocations, eq(assets.locationId, assetLocations.id))
      .where(
        and(eq(assets.id, assetId), eq(assets.organizationId, organization.id)),
      )
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Get current assignment
    const [currentAssignment] = await db
      .select({
        id: assetAssignments.id,
        targetType: assetAssignments.targetType,
        employeeId: assetAssignments.employeeId,
        department: assetAssignments.department,
        projectId: assetAssignments.projectId,
        assignedDate: assetAssignments.assignedDate,
        expectedReturnDate: assetAssignments.expectedReturnDate,
        notes: assetAssignments.notes,
        employeeName: user.name,
      })
      .from(assetAssignments)
      .leftJoin(user, eq(assetAssignments.employeeId, user.id))
      .where(
        and(
          eq(assetAssignments.assetId, assetId),
          isNull(assetAssignments.actualReturnDate),
        ),
      )
      .limit(1);

    return NextResponse.json({
      ...row.asset,
      category: row.category?.id ? row.category : null,
      location: row.location?.id ? row.location : null,
      currentAssignment: currentAssignment || null,
    });
  } catch (error) {
    console.error("Error fetching asset:", error);
    return NextResponse.json(
      { error: "Failed to fetch asset" },
      { status: 500 },
    );
  }
}

// PATCH: Update asset
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
    const assetId = Number(id);
    const body = await request.json();

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    // Build update object only for provided fields
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (body.locationId !== undefined) updateData.locationId = body.locationId;
    if (body.purchaseDate !== undefined)
      updateData.purchaseDate = body.purchaseDate
        ? new Date(body.purchaseDate)
        : null;
    if (body.purchasePrice !== undefined)
      updateData.purchasePrice =
        body.purchasePrice !== null ? String(body.purchasePrice) : null;
    if (body.vendor !== undefined) updateData.vendor = body.vendor;
    if (body.poNumber !== undefined) updateData.poNumber = body.poNumber;
    if (body.currentValue !== undefined)
      updateData.currentValue =
        body.currentValue !== null ? String(body.currentValue) : null;
    if (body.usefulLifeYears !== undefined)
      updateData.usefulLifeYears = body.usefulLifeYears;
    if (body.residualValue !== undefined)
      updateData.residualValue =
        body.residualValue !== null ? String(body.residualValue) : null;
    if (body.depreciationStartDate !== undefined)
      updateData.depreciationStartDate = body.depreciationStartDate
        ? new Date(body.depreciationStartDate)
        : null;
    if (body.warrantyStartDate !== undefined)
      updateData.warrantyStartDate = body.warrantyStartDate
        ? new Date(body.warrantyStartDate)
        : null;
    if (body.warrantyEndDate !== undefined)
      updateData.warrantyEndDate = body.warrantyEndDate
        ? new Date(body.warrantyEndDate)
        : null;
    if (body.warrantyProvider !== undefined)
      updateData.warrantyProvider = body.warrantyProvider;
    if (body.warrantyTerms !== undefined)
      updateData.warrantyTerms = body.warrantyTerms;
    if (body.serialNumber !== undefined)
      updateData.serialNumber = body.serialNumber;
    if (body.model !== undefined) updateData.model = body.model;
    if (body.manufacturer !== undefined)
      updateData.manufacturer = body.manufacturer;
    if (body.barcode !== undefined) updateData.barcode = body.barcode;
    if (body.requiresMaintenance !== undefined)
      updateData.requiresMaintenance = body.requiresMaintenance;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const [updated] = await db
      .update(assets)
      .set(updateData)
      .where(
        and(eq(assets.id, assetId), eq(assets.organizationId, organization.id)),
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json({ asset: updated });
  } catch (error) {
    console.error("Error updating asset:", error);
    return NextResponse.json(
      { error: "Failed to update asset" },
      { status: 500 },
    );
  }
}

// DELETE: Delete asset
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
    const assetId = Number(id);

    const [deleted] = await db
      .delete(assets)
      .where(
        and(eq(assets.id, assetId), eq(assets.organizationId, organization.id)),
      )
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting asset:", error);
    return NextResponse.json(
      { error: "Failed to delete asset" },
      { status: 500 },
    );
  }
}
