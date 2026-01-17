"use server";
import "server-only";
import { headers } from "next/headers";
import { db } from "@/db";
import { assetLocations } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { requireAssetAccess } from "@/actions/auth/dal";
import { revalidatePath } from "next/cache";

export async function getAssetLocations() {
  await requireAssetAccess();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    throw new Error("Organization not found");
  }

  const locations = await db
    .select()
    .from(assetLocations)
    .where(eq(assetLocations.organizationId, organization.id))
    .orderBy(desc(assetLocations.createdAt));

  return locations;
}

export async function getAssetLocation(id: number) {
  await requireAssetAccess();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    throw new Error("Organization not found");
  }

  const [location] = await db
    .select()
    .from(assetLocations)
    .where(
      and(
        eq(assetLocations.id, id),
        eq(assetLocations.organizationId, organization.id),
      ),
    )
    .limit(1);

  return location;
}

export async function createAssetLocation(data: {
  name: string;
  address?: string;
  type?: string;
  description?: string;
}) {
  const authData = await requireAssetAccess();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    throw new Error("Organization not found");
  }

  const [location] = await db
    .insert(assetLocations)
    .values({
      organizationId: organization.id,
      name: data.name,
      address: data.address || null,
      type: data.type || null,
      description: data.description || null,
      createdBy: authData.userId,
    })
    .returning();

  revalidatePath("/assets/locations");
  return location;
}

export async function updateAssetLocation(
  id: number,
  data: {
    name?: string;
    address?: string;
    type?: string;
    description?: string;
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

  const [location] = await db
    .update(assetLocations)
    .set({
      ...(data.name && { name: data.name }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(assetLocations.id, id),
        eq(assetLocations.organizationId, organization.id),
      ),
    )
    .returning();

  revalidatePath("/assets/locations");
  return location;
}

export async function deleteAssetLocation(id: number) {
  await requireAssetAccess();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    throw new Error("Organization not found");
  }

  await db
    .delete(assetLocations)
    .where(
      and(
        eq(assetLocations.id, id),
        eq(assetLocations.organizationId, organization.id),
      ),
    );

  revalidatePath("/assets/locations");
  return { success: true };
}
