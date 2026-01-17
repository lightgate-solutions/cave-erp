"use server";
import "server-only";
import { headers } from "next/headers";
import { db } from "@/db";
import {
  assets,
  assetCategories,
  assetLocations,
  assetAssignments,
  user,
} from "@/db/schema";
import { and, eq, desc, like, isNull, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { requireAssetAccess } from "@/actions/auth/dal";
import { revalidatePath } from "next/cache";

// Generate asset code in format: YEAR-CATEGORY-SEQUENCE (e.g., 2026-COMP-0001)
export async function generateAssetCode(categoryId: number): Promise<string> {
  await requireAssetAccess();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    throw new Error("Organization not found");
  }

  // Get the category
  const [category] = await db
    .select()
    .from(assetCategories)
    .where(
      and(
        eq(assetCategories.id, categoryId),
        eq(assetCategories.organizationId, organization.id),
      ),
    )
    .limit(1);

  if (!category) {
    throw new Error("Category not found");
  }

  const year = new Date().getFullYear();
  const prefix = `${year}-${category.codePrefix}-`;

  // Get the last asset code for this year and category
  const [lastAsset] = await db
    .select({ assetCode: assets.assetCode })
    .from(assets)
    .where(
      and(
        eq(assets.organizationId, organization.id),
        like(assets.assetCode, `${prefix}%`),
      ),
    )
    .orderBy(desc(assets.assetCode))
    .limit(1);

  let sequence = 1;
  if (lastAsset) {
    const lastSequence = Number.parseInt(lastAsset.assetCode.split("-")[2], 10);
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(4, "0")}`;
}

export async function getAssets(params?: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  locationId?: number;
  status?: string;
}) {
  await requireAssetAccess();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    throw new Error("Organization not found");
  }

  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const offset = (page - 1) * limit;

  // Build where conditions
  const conditions = [eq(assets.organizationId, organization.id)];

  if (params?.categoryId) {
    conditions.push(eq(assets.categoryId, params.categoryId));
  }

  if (params?.locationId) {
    conditions.push(eq(assets.locationId, params.locationId));
  }

  if (params?.status) {
    conditions.push(
      eq(
        assets.status,
        params.status as (typeof assets.status.enumValues)[number],
      ),
    );
  }

  if (params?.search) {
    conditions.push(
      sql`(${assets.name} ILIKE ${`%${params.search}%`} OR ${assets.assetCode} ILIKE ${`%${params.search}%`} OR ${assets.serialNumber} ILIKE ${`%${params.search}%`})`,
    );
  }

  const [assetsList, countResult] = await Promise.all([
    db
      .select({
        id: assets.id,
        assetCode: assets.assetCode,
        name: assets.name,
        description: assets.description,
        categoryId: assets.categoryId,
        locationId: assets.locationId,
        purchaseDate: assets.purchaseDate,
        purchasePrice: assets.purchasePrice,
        currentValue: assets.currentValue,
        status: assets.status,
        serialNumber: assets.serialNumber,
        model: assets.model,
        manufacturer: assets.manufacturer,
        warrantyEndDate: assets.warrantyEndDate,
        requiresMaintenance: assets.requiresMaintenance,
        createdAt: assets.createdAt,
        category: {
          id: assetCategories.id,
          name: assetCategories.name,
          codePrefix: assetCategories.codePrefix,
        },
        location: {
          id: assetLocations.id,
          name: assetLocations.name,
        },
      })
      .from(assets)
      .leftJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
      .leftJoin(assetLocations, eq(assets.locationId, assetLocations.id))
      .where(and(...conditions))
      .orderBy(desc(assets.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(assets)
      .where(and(...conditions)),
  ]);

  // Get current assignments for each asset
  const assetIds = assetsList.map((a) => a.id);
  const assignments =
    assetIds.length > 0
      ? await db
          .select({
            assetId: assetAssignments.assetId,
            targetType: assetAssignments.targetType,
            employeeId: assetAssignments.employeeId,
            department: assetAssignments.department,
            projectId: assetAssignments.projectId,
            employeeName: user.name,
          })
          .from(assetAssignments)
          .leftJoin(user, eq(assetAssignments.employeeId, user.id))
          .where(
            and(
              sql`${assetAssignments.assetId} IN (${sql.join(assetIds, sql`, `)})`,
              isNull(assetAssignments.actualReturnDate),
            ),
          )
      : [];

  // Map assignments to assets
  const assignmentMap = new Map(assignments.map((a) => [a.assetId, a]));

  const assetsWithAssignments = assetsList.map((asset) => ({
    ...asset,
    currentAssignment: assignmentMap.get(asset.id) || null,
  }));

  return {
    assets: assetsWithAssignments,
    total: countResult[0]?.count || 0,
    page,
    limit,
    totalPages: Math.ceil((countResult[0]?.count || 0) / limit),
  };
}

export async function getAsset(id: number) {
  await requireAssetAccess();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    throw new Error("Organization not found");
  }

  const [asset] = await db
    .select({
      id: assets.id,
      organizationId: assets.organizationId,
      assetCode: assets.assetCode,
      name: assets.name,
      description: assets.description,
      categoryId: assets.categoryId,
      locationId: assets.locationId,
      purchaseDate: assets.purchaseDate,
      purchasePrice: assets.purchasePrice,
      vendor: assets.vendor,
      poNumber: assets.poNumber,
      currentValue: assets.currentValue,
      depreciationMethod: assets.depreciationMethod,
      usefulLifeYears: assets.usefulLifeYears,
      residualValue: assets.residualValue,
      depreciationStartDate: assets.depreciationStartDate,
      accumulatedDepreciation: assets.accumulatedDepreciation,
      warrantyStartDate: assets.warrantyStartDate,
      warrantyEndDate: assets.warrantyEndDate,
      warrantyProvider: assets.warrantyProvider,
      warrantyTerms: assets.warrantyTerms,
      serialNumber: assets.serialNumber,
      model: assets.model,
      manufacturer: assets.manufacturer,
      barcode: assets.barcode,
      requiresMaintenance: assets.requiresMaintenance,
      status: assets.status,
      disposalDate: assets.disposalDate,
      disposalReason: assets.disposalReason,
      disposalPrice: assets.disposalPrice,
      notes: assets.notes,
      customFields: assets.customFields,
      createdAt: assets.createdAt,
      updatedAt: assets.updatedAt,
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
    .where(and(eq(assets.id, id), eq(assets.organizationId, organization.id)))
    .limit(1);

  if (!asset) {
    return null;
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
        eq(assetAssignments.assetId, id),
        isNull(assetAssignments.actualReturnDate),
      ),
    )
    .limit(1);

  return {
    ...asset,
    currentAssignment: currentAssignment || null,
  };
}

export async function createAsset(data: {
  name: string;
  description?: string;
  categoryId: number;
  locationId?: number;
  purchaseDate?: string;
  purchasePrice?: number;
  vendor?: string;
  poNumber?: string;
  currentValue?: number;
  usefulLifeYears?: number;
  residualValue?: number;
  depreciationStartDate?: string;
  warrantyStartDate?: string;
  warrantyEndDate?: string;
  warrantyProvider?: string;
  warrantyTerms?: string;
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
  barcode?: string;
  requiresMaintenance?: boolean;
  notes?: string;
}) {
  const authData = await requireAssetAccess();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    throw new Error("Organization not found");
  }

  // Generate asset code
  const assetCode = await generateAssetCode(data.categoryId);

  // Set current value to purchase price if not provided
  const currentValue = data.currentValue ?? data.purchasePrice ?? null;

  const [asset] = await db
    .insert(assets)
    .values({
      organizationId: organization.id,
      assetCode,
      name: data.name,
      description: data.description || null,
      categoryId: data.categoryId,
      locationId: data.locationId || null,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      purchasePrice: data.purchasePrice ? String(data.purchasePrice) : null,
      vendor: data.vendor || null,
      poNumber: data.poNumber || null,
      currentValue: currentValue ? String(currentValue) : null,
      usefulLifeYears: data.usefulLifeYears || null,
      residualValue: data.residualValue ? String(data.residualValue) : null,
      depreciationStartDate: data.depreciationStartDate
        ? new Date(data.depreciationStartDate)
        : null,
      warrantyStartDate: data.warrantyStartDate
        ? new Date(data.warrantyStartDate)
        : null,
      warrantyEndDate: data.warrantyEndDate
        ? new Date(data.warrantyEndDate)
        : null,
      warrantyProvider: data.warrantyProvider || null,
      warrantyTerms: data.warrantyTerms || null,
      serialNumber: data.serialNumber || null,
      model: data.model || null,
      manufacturer: data.manufacturer || null,
      barcode: data.barcode || null,
      requiresMaintenance: data.requiresMaintenance || false,
      notes: data.notes || null,
      createdBy: authData.userId,
    })
    .returning();

  revalidatePath("/assets");
  return asset;
}

export async function updateAsset(
  id: number,
  data: {
    name?: string;
    description?: string;
    categoryId?: number;
    locationId?: number | null;
    purchaseDate?: string | null;
    purchasePrice?: number | null;
    vendor?: string | null;
    poNumber?: string | null;
    currentValue?: number | null;
    usefulLifeYears?: number | null;
    residualValue?: number | null;
    depreciationStartDate?: string | null;
    warrantyStartDate?: string | null;
    warrantyEndDate?: string | null;
    warrantyProvider?: string | null;
    warrantyTerms?: string | null;
    serialNumber?: string | null;
    model?: string | null;
    manufacturer?: string | null;
    barcode?: string | null;
    requiresMaintenance?: boolean;
    status?: string;
    notes?: string | null;
  },
) {
  await requireAssetAccess();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    throw new Error("Organization not found");
  }

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.locationId !== undefined) updateData.locationId = data.locationId;
  if (data.purchaseDate !== undefined)
    updateData.purchaseDate = data.purchaseDate
      ? new Date(data.purchaseDate)
      : null;
  if (data.purchasePrice !== undefined)
    updateData.purchasePrice =
      data.purchasePrice !== null ? String(data.purchasePrice) : null;
  if (data.vendor !== undefined) updateData.vendor = data.vendor;
  if (data.poNumber !== undefined) updateData.poNumber = data.poNumber;
  if (data.currentValue !== undefined)
    updateData.currentValue =
      data.currentValue !== null ? String(data.currentValue) : null;
  if (data.usefulLifeYears !== undefined)
    updateData.usefulLifeYears = data.usefulLifeYears;
  if (data.residualValue !== undefined)
    updateData.residualValue =
      data.residualValue !== null ? String(data.residualValue) : null;
  if (data.depreciationStartDate !== undefined)
    updateData.depreciationStartDate = data.depreciationStartDate
      ? new Date(data.depreciationStartDate)
      : null;
  if (data.warrantyStartDate !== undefined)
    updateData.warrantyStartDate = data.warrantyStartDate
      ? new Date(data.warrantyStartDate)
      : null;
  if (data.warrantyEndDate !== undefined)
    updateData.warrantyEndDate = data.warrantyEndDate
      ? new Date(data.warrantyEndDate)
      : null;
  if (data.warrantyProvider !== undefined)
    updateData.warrantyProvider = data.warrantyProvider;
  if (data.warrantyTerms !== undefined)
    updateData.warrantyTerms = data.warrantyTerms;
  if (data.serialNumber !== undefined)
    updateData.serialNumber = data.serialNumber;
  if (data.model !== undefined) updateData.model = data.model;
  if (data.manufacturer !== undefined)
    updateData.manufacturer = data.manufacturer;
  if (data.barcode !== undefined) updateData.barcode = data.barcode;
  if (data.requiresMaintenance !== undefined)
    updateData.requiresMaintenance = data.requiresMaintenance;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.notes !== undefined) updateData.notes = data.notes;

  const [asset] = await db
    .update(assets)
    .set(updateData)
    .where(and(eq(assets.id, id), eq(assets.organizationId, organization.id)))
    .returning();

  revalidatePath("/assets");
  revalidatePath(`/assets/${id}`);
  return asset;
}

export async function deleteAsset(id: number) {
  await requireAssetAccess();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    throw new Error("Organization not found");
  }

  await db
    .delete(assets)
    .where(and(eq(assets.id, id), eq(assets.organizationId, organization.id)));

  revalidatePath("/assets");
  return { success: true };
}

export async function disposeAsset(
  id: number,
  data: {
    disposalDate: string;
    disposalReason: string;
    disposalPrice?: number;
  },
) {
  const authData = await requireAssetAccess();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    throw new Error("Organization not found");
  }

  const [asset] = await db
    .update(assets)
    .set({
      status: "Disposed",
      disposalDate: new Date(data.disposalDate),
      disposalReason: data.disposalReason,
      disposalPrice: data.disposalPrice ? String(data.disposalPrice) : null,
      disposedBy: authData.userId,
      updatedAt: new Date(),
    })
    .where(and(eq(assets.id, id), eq(assets.organizationId, organization.id)))
    .returning();

  revalidatePath("/assets");
  revalidatePath(`/assets/${id}`);
  return asset;
}
