"use server";

import { db } from "@/db";
import { vendorBankAccounts, vendors } from "@/db/schema";
import {
  requirePayablesViewAccess,
  requirePayablesWriteAccess,
} from "../auth/dal-payables";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export interface CreateVendorBankAccountInput {
  vendorId: number;
  accountName: string;
  bankName: string;
  accountNumber: string;
  routingNumber?: string;
  swiftCode?: string;
  iban?: string;
  currency: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface UpdateVendorBankAccountInput {
  accountName?: string;
  bankName?: string;
  accountNumber?: string;
  routingNumber?: string;
  swiftCode?: string;
  iban?: string;
  currency?: string;
  isDefault?: boolean;
  isActive?: boolean;
}

/**
 * Add a bank account to a vendor
 */
export async function addVendorBankAccount(data: CreateVendorBankAccountInput) {
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

    // If this is set as default, unset other default accounts
    if (data.isDefault) {
      await db
        .update(vendorBankAccounts)
        .set({ isDefault: false })
        .where(
          and(
            eq(vendorBankAccounts.vendorId, data.vendorId),
            eq(vendorBankAccounts.organizationId, organization.id),
          ),
        );
    }

    const [account] = await db
      .insert(vendorBankAccounts)
      .values({
        vendorId: data.vendorId,
        accountName: data.accountName,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        routingNumber: data.routingNumber || null,
        swiftCode: data.swiftCode || null,
        iban: data.iban || null,
        currency: data.currency,
        isDefault: data.isDefault,
        isActive: data.isActive,
        organizationId: organization.id,
      })
      .returning();

    revalidatePath("/payables/vendors");
    revalidatePath(`/payables/vendors/${data.vendorId}`);

    return {
      success: { data: account },
      error: null,
    };
  } catch (error) {
    console.error("Error adding vendor bank account:", error);
    return {
      success: null,
      error: { reason: "Failed to add vendor bank account" },
    };
  }
}

/**
 * Update a vendor bank account
 */
export async function updateVendorBankAccount(
  id: number,
  data: UpdateVendorBankAccountInput,
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

    // Get existing account
    const [existing] = await db
      .select()
      .from(vendorBankAccounts)
      .where(
        and(
          eq(vendorBankAccounts.id, id),
          eq(vendorBankAccounts.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!existing) {
      return {
        success: null,
        error: { reason: "Bank account not found" },
      };
    }

    // If setting as default, unset other default accounts for this vendor
    if (data.isDefault) {
      await db
        .update(vendorBankAccounts)
        .set({ isDefault: false })
        .where(
          and(
            eq(vendorBankAccounts.vendorId, existing.vendorId),
            eq(vendorBankAccounts.organizationId, organization.id),
          ),
        );
    }

    const [updated] = await db
      .update(vendorBankAccounts)
      .set(data)
      .where(
        and(
          eq(vendorBankAccounts.id, id),
          eq(vendorBankAccounts.organizationId, organization.id),
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
    console.error("Error updating vendor bank account:", error);
    return {
      success: null,
      error: { reason: "Failed to update vendor bank account" },
    };
  }
}

/**
 * Delete a vendor bank account
 */
export async function deleteVendorBankAccount(id: number) {
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

    // Get account to find vendor ID for revalidation
    const [account] = await db
      .select()
      .from(vendorBankAccounts)
      .where(
        and(
          eq(vendorBankAccounts.id, id),
          eq(vendorBankAccounts.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!account) {
      return {
        success: null,
        error: { reason: "Bank account not found" },
      };
    }

    await db
      .delete(vendorBankAccounts)
      .where(
        and(
          eq(vendorBankAccounts.id, id),
          eq(vendorBankAccounts.organizationId, organization.id),
        ),
      );

    revalidatePath("/payables/vendors");
    revalidatePath(`/payables/vendors/${account.vendorId}`);

    return {
      success: { reason: "Bank account deleted successfully" },
      error: null,
    };
  } catch (error) {
    console.error("Error deleting vendor bank account:", error);
    return {
      success: null,
      error: { reason: "Failed to delete vendor bank account" },
    };
  }
}

/**
 * Get all bank accounts for a vendor
 */
export async function getVendorBankAccounts(vendorId: number) {
  try {
    await requirePayablesViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const accounts = await db
      .select()
      .from(vendorBankAccounts)
      .where(
        and(
          eq(vendorBankAccounts.vendorId, vendorId),
          eq(vendorBankAccounts.organizationId, organization.id),
        ),
      )
      .orderBy(vendorBankAccounts.isDefault); // Default account first

    return accounts;
  } catch (error) {
    console.error("Error fetching vendor bank accounts:", error);
    return [];
  }
}

/**
 * Get the default bank account for a vendor
 */
export async function getVendorDefaultBankAccount(vendorId: number) {
  try {
    await requirePayablesViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return null;
    }

    const [account] = await db
      .select()
      .from(vendorBankAccounts)
      .where(
        and(
          eq(vendorBankAccounts.vendorId, vendorId),
          eq(vendorBankAccounts.isDefault, true),
          eq(vendorBankAccounts.isActive, true),
          eq(vendorBankAccounts.organizationId, organization.id),
        ),
      )
      .limit(1);

    return account || null;
  } catch (error) {
    console.error("Error fetching default bank account:", error);
    return null;
  }
}
