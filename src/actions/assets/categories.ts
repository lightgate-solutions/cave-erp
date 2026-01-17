"use server";
import "server-only";
import { headers } from "next/headers";
import { db } from "@/db";
import { assetCategories } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { requireAssetAccess } from "@/actions/auth/dal";
import { revalidatePath } from "next/cache";

export async function getAssetCategories() {
  await requireAssetAccess();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    throw new Error("Organization not found");
  }

  const categories = await db
    .select()
    .from(assetCategories)
    .where(eq(assetCategories.organizationId, organization.id))
    .orderBy(desc(assetCategories.createdAt));

  return categories;
}

export async function getAssetCategory(id: number) {
  await requireAssetAccess();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    throw new Error("Organization not found");
  }

  const [category] = await db
    .select()
    .from(assetCategories)
    .where(
      and(
        eq(assetCategories.id, id),
        eq(assetCategories.organizationId, organization.id),
      ),
    )
    .limit(1);

  return category;
}

export async function createAssetCategory(data: {
  name: string;
  description?: string;
  codePrefix: string;
  defaultUsefulLifeYears?: number;
  defaultResidualValuePercent?: number;
}) {
  const authData = await requireAssetAccess();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    throw new Error("Organization not found");
  }

  // Check for duplicate code prefix
  const [existing] = await db
    .select()
    .from(assetCategories)
    .where(
      and(
        eq(assetCategories.organizationId, organization.id),
        eq(assetCategories.codePrefix, data.codePrefix.toUpperCase()),
      ),
    )
    .limit(1);

  if (existing) {
    throw new Error("A category with this code prefix already exists");
  }

  const [category] = await db
    .insert(assetCategories)
    .values({
      organizationId: organization.id,
      name: data.name,
      description: data.description || null,
      codePrefix: data.codePrefix.toUpperCase(),
      defaultUsefulLifeYears: data.defaultUsefulLifeYears || null,
      defaultResidualValuePercent: data.defaultResidualValuePercent
        ? String(data.defaultResidualValuePercent)
        : null,
      createdBy: authData.userId,
    })
    .returning();

  revalidatePath("/assets/categories");
  return category;
}

export async function updateAssetCategory(
  id: number,
  data: {
    name?: string;
    description?: string;
    codePrefix?: string;
    defaultUsefulLifeYears?: number;
    defaultResidualValuePercent?: number;
    isActive?: boolean;
  },
) {
  await requireAssetAccess();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    throw new Error("Organization not found");
  }

  // If updating code prefix, check for duplicates
  if (data.codePrefix) {
    const [existing] = await db
      .select()
      .from(assetCategories)
      .where(
        and(
          eq(assetCategories.organizationId, organization.id),
          eq(assetCategories.codePrefix, data.codePrefix.toUpperCase()),
        ),
      )
      .limit(1);

    if (existing && existing.id !== id) {
      throw new Error("A category with this code prefix already exists");
    }
  }

  const [category] = await db
    .update(assetCategories)
    .set({
      ...(data.name && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.codePrefix && { codePrefix: data.codePrefix.toUpperCase() }),
      ...(data.defaultUsefulLifeYears !== undefined && {
        defaultUsefulLifeYears: data.defaultUsefulLifeYears,
      }),
      ...(data.defaultResidualValuePercent !== undefined && {
        defaultResidualValuePercent: String(data.defaultResidualValuePercent),
      }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(assetCategories.id, id),
        eq(assetCategories.organizationId, organization.id),
      ),
    )
    .returning();

  revalidatePath("/assets/categories");
  return category;
}

export async function deleteAssetCategory(id: number) {
  await requireAssetAccess();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    throw new Error("Organization not found");
  }

  await db
    .delete(assetCategories)
    .where(
      and(
        eq(assetCategories.id, id),
        eq(assetCategories.organizationId, organization.id),
      ),
    );

  revalidatePath("/assets/categories");
  return { success: true };
}
