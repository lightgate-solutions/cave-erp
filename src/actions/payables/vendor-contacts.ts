"use server";

import { db } from "@/db";
import { vendorContacts, vendors } from "@/db/schema";
import {
  requirePayablesViewAccess,
  requirePayablesWriteAccess,
} from "../auth/dal-payables";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export interface CreateVendorContactInput {
  vendorId: number;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  isPrimary: boolean;
}

export interface UpdateVendorContactInput {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  isPrimary?: boolean;
}

/**
 * Add a contact to a vendor
 */
export async function addVendorContact(data: CreateVendorContactInput) {
  try {
    await requirePayablesWriteAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    // Verify vendor belongs to organization
    const [vendor] = await db
      .select()
      .from(vendors)
      .where(
        and(
          eq(vendors.id, data.vendorId),
          eq(vendors.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!vendor) {
      return {
        success: null,
        error: { reason: "Vendor not found" },
      };
    }

    // If this is set as primary, unset other primary contacts
    if (data.isPrimary) {
      await db
        .update(vendorContacts)
        .set({ isPrimary: false })
        .where(
          and(
            eq(vendorContacts.vendorId, data.vendorId),
            eq(vendorContacts.organizationId, organization.id),
          ),
        );
    }

    const [contact] = await db
      .insert(vendorContacts)
      .values({
        vendorId: data.vendorId,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        role: data.role || null,
        isPrimary: data.isPrimary,
        organizationId: organization.id,
      })
      .returning();

    revalidatePath("/payables/vendors");
    revalidatePath(`/payables/vendors/${data.vendorId}`);

    return {
      success: { data: contact },
      error: null,
    };
  } catch (error) {
    console.error("Error adding vendor contact:", error);
    return {
      success: null,
      error: { reason: "Failed to add vendor contact" },
    };
  }
}

/**
 * Update a vendor contact
 */
export async function updateVendorContact(
  id: number,
  data: UpdateVendorContactInput,
) {
  try {
    await requirePayablesWriteAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    // Get existing contact
    const [existing] = await db
      .select()
      .from(vendorContacts)
      .where(
        and(
          eq(vendorContacts.id, id),
          eq(vendorContacts.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!existing) {
      return {
        success: null,
        error: { reason: "Contact not found" },
      };
    }

    // If setting as primary, unset other primary contacts for this vendor
    if (data.isPrimary) {
      await db
        .update(vendorContacts)
        .set({ isPrimary: false })
        .where(
          and(
            eq(vendorContacts.vendorId, existing.vendorId),
            eq(vendorContacts.organizationId, organization.id),
          ),
        );
    }

    const [updated] = await db
      .update(vendorContacts)
      .set(data)
      .where(
        and(
          eq(vendorContacts.id, id),
          eq(vendorContacts.organizationId, organization.id),
        ),
      )
      .returning();

    revalidatePath("/payables/vendors");
    revalidatePath(`/payables/vendors/${existing.vendorId}`);

    return {
      success: { data: updated },
      error: null,
    };
  } catch (error) {
    console.error("Error updating vendor contact:", error);
    return {
      success: null,
      error: { reason: "Failed to update vendor contact" },
    };
  }
}

/**
 * Delete a vendor contact
 */
export async function deleteVendorContact(id: number) {
  try {
    await requirePayablesWriteAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    // Get contact to find vendor ID for revalidation
    const [contact] = await db
      .select()
      .from(vendorContacts)
      .where(
        and(
          eq(vendorContacts.id, id),
          eq(vendorContacts.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!contact) {
      return {
        success: null,
        error: { reason: "Contact not found" },
      };
    }

    await db
      .delete(vendorContacts)
      .where(
        and(
          eq(vendorContacts.id, id),
          eq(vendorContacts.organizationId, organization.id),
        ),
      );

    revalidatePath("/payables/vendors");
    revalidatePath(`/payables/vendors/${contact.vendorId}`);

    return {
      success: { reason: "Contact deleted successfully" },
      error: null,
    };
  } catch (error) {
    console.error("Error deleting vendor contact:", error);
    return {
      success: null,
      error: { reason: "Failed to delete vendor contact" },
    };
  }
}

/**
 * Get all contacts for a vendor
 */
export async function getVendorContacts(vendorId: number) {
  try {
    await requirePayablesViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const contacts = await db
      .select()
      .from(vendorContacts)
      .where(
        and(
          eq(vendorContacts.vendorId, vendorId),
          eq(vendorContacts.organizationId, organization.id),
        ),
      )
      .orderBy(vendorContacts.isPrimary); // Primary contact first

    return contacts;
  } catch (error) {
    console.error("Error fetching vendor contacts:", error);
    return [];
  }
}
