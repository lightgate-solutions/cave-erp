"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { organization } from "@/db/schema";
import { eq } from "drizzle-orm";

async function verifyOrganizationOwnership(
  userId: string,
  organizationId: string,
): Promise<boolean> {
  const org = await db.query.organization.findFirst({
    where: eq(organization.id, organizationId),
    columns: { ownerId: true },
  });

  return org?.ownerId === userId;
}

export async function uploadOrganizationLogo(
  organizationId: string,
  logoUrl: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user.id) {
      return { success: false, error: "User not authenticated" };
    }

    // Verify ownership
    const isOwner = await verifyOrganizationOwnership(
      session.user.id,
      organizationId,
    );
    if (!isOwner) {
      return {
        success: false,
        error: "Only organization owners can upload logos",
      };
    }

    // Update logo
    await db
      .update(organization)
      .set({ logo: logoUrl })
      .where(eq(organization.id, organizationId));

    return { success: true };
  } catch (error) {
    console.error("Error uploading organization logo:", error);
    return { success: false, error: "Failed to upload logo" };
  }
}

export async function removeOrganizationLogo(
  organizationId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user.id) {
      return { success: false, error: "User not authenticated" };
    }

    const isOwner = await verifyOrganizationOwnership(
      session.user.id,
      organizationId,
    );
    if (!isOwner) {
      return {
        success: false,
        error: "Only organization owners can remove logos",
      };
    }

    await db
      .update(organization)
      .set({ logo: null })
      .where(eq(organization.id, organizationId));

    return { success: true };
  } catch (error) {
    console.error("Error removing organization logo:", error);
    return { success: false, error: "Failed to remove logo" };
  }
}
