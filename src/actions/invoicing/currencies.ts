/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

"use server";

import { db } from "@/db";
import { organizationCurrencies, receivablesInvoices } from "@/db/schema";
import {
  requireInvoicingViewAccess,
  requireInvoicingWriteAccess,
} from "../auth/dal-invoicing";
import { and, count, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export interface CreateCurrencyInput {
  currencyCode: string; // USD, EUR, GBP, etc.
  currencySymbol: string; // $, €, £, etc.
  currencyName: string; // US Dollar, Euro, British Pound, etc.
  exchangeRate: number; // Exchange rate relative to base currency (default 1.0)
  isDefault?: boolean;
}

export interface UpdateCurrencyInput {
  currencySymbol?: string;
  currencyName?: string;
  exchangeRate?: number;
  isDefault?: boolean;
}

/**
 * Create a new currency for the organization
 */
export async function createOrganizationCurrency(data: CreateCurrencyInput) {
  try {
    await requireInvoicingWriteAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    // Check if currency code already exists for this organization
    const [existing] = await db
      .select()
      .from(organizationCurrencies)
      .where(
        and(
          eq(organizationCurrencies.organizationId, organization.id),
          eq(organizationCurrencies.currencyCode, data.currencyCode),
        ),
      )
      .limit(1);

    if (existing) {
      return {
        success: null,
        error: { reason: "Currency already exists for this organization" },
      };
    }

    // If this is the first currency or isDefault is true, set as default
    const [currencyCount] = await db
      .select({ count: count() })
      .from(organizationCurrencies)
      .where(eq(organizationCurrencies.organizationId, organization.id));

    const shouldBeDefault =
      currencyCount.count === 0 || data.isDefault === true;

    // If setting as default, unset other defaults
    if (shouldBeDefault) {
      await db
        .update(organizationCurrencies)
        .set({ isDefault: false })
        .where(eq(organizationCurrencies.organizationId, organization.id));
    }

    const [currency] = await db
      .insert(organizationCurrencies)
      .values({
        currencyCode: data.currencyCode.toUpperCase(),
        currencySymbol: data.currencySymbol,
        currencyName: data.currencyName,
        exchangeRate: data.exchangeRate.toString(),
        isDefault: shouldBeDefault,
        organizationId: organization.id,
      })
      .returning();

    revalidatePath("/invoicing/settings");
    revalidatePath("/invoicing/invoices/new");

    return {
      success: { data: currency },
      error: null,
    };
  } catch (error) {
    console.error("Error creating currency:", error);
    return {
      success: null,
      error: { reason: "Failed to create currency" },
    };
  }
}

/**
 * Update an existing currency
 */
export async function updateOrganizationCurrency(
  id: number,
  data: UpdateCurrencyInput,
) {
  try {
    await requireInvoicingWriteAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    // Check if currency exists
    const [existing] = await db
      .select()
      .from(organizationCurrencies)
      .where(
        and(
          eq(organizationCurrencies.id, id),
          eq(organizationCurrencies.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!existing) {
      return {
        success: null,
        error: { reason: "Currency not found" },
      };
    }

    // If setting as default, unset other defaults
    if (data.isDefault === true) {
      await db
        .update(organizationCurrencies)
        .set({ isDefault: false })
        .where(
          and(
            eq(organizationCurrencies.organizationId, organization.id),
            eq(organizationCurrencies.isDefault, true),
          ),
        );
    }

    const updateData: any = {};
    if (data.currencySymbol !== undefined)
      updateData.currencySymbol = data.currencySymbol;
    if (data.currencyName !== undefined)
      updateData.currencyName = data.currencyName;
    if (data.exchangeRate !== undefined)
      updateData.exchangeRate = data.exchangeRate.toString();
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;

    const [updated] = await db
      .update(organizationCurrencies)
      .set(updateData)
      .where(eq(organizationCurrencies.id, id))
      .returning();

    revalidatePath("/invoicing/settings");
    revalidatePath("/invoicing/invoices/new");

    return {
      success: { data: updated },
      error: null,
    };
  } catch (error) {
    console.error("Error updating currency:", error);
    return {
      success: null,
      error: { reason: "Failed to update currency" },
    };
  }
}

/**
 * Delete a currency
 * Only allowed if no invoices are using this currency
 */
export async function deleteOrganizationCurrency(id: number) {
  try {
    await requireInvoicingWriteAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    // Check if currency exists
    const [existing] = await db
      .select()
      .from(organizationCurrencies)
      .where(
        and(
          eq(organizationCurrencies.id, id),
          eq(organizationCurrencies.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!existing) {
      return {
        success: null,
        error: { reason: "Currency not found" },
      };
    }

    // Check if any invoices are using this currency
    const [invoiceCount] = await db
      .select({ count: count() })
      .from(receivablesInvoices)
      .where(
        and(
          eq(receivablesInvoices.currencyId, id),
          eq(receivablesInvoices.organizationId, organization.id),
        ),
      );

    if (invoiceCount.count > 0) {
      return {
        success: null,
        error: {
          reason: `Cannot delete currency. ${invoiceCount.count} invoice(s) are using this currency.`,
        },
      };
    }

    // Don't allow deleting the default currency if it's the only one
    const [totalCount] = await db
      .select({ count: count() })
      .from(organizationCurrencies)
      .where(eq(organizationCurrencies.organizationId, organization.id));

    if (existing.isDefault && totalCount.count > 1) {
      return {
        success: null,
        error: {
          reason:
            "Cannot delete default currency. Set another currency as default first.",
        },
      };
    }

    await db
      .delete(organizationCurrencies)
      .where(eq(organizationCurrencies.id, id));

    revalidatePath("/invoicing/settings");
    revalidatePath("/invoicing/invoices/new");

    return {
      success: { reason: "Currency deleted successfully" },
      error: null,
    };
  } catch (error) {
    console.error("Error deleting currency:", error);
    return {
      success: null,
      error: { reason: "Failed to delete currency" },
    };
  }
}

/**
 * Get all currencies for the organization
 */
export async function getAllOrganizationCurrencies() {
  try {
    await requireInvoicingViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const currencies = await db
      .select()
      .from(organizationCurrencies)
      .where(eq(organizationCurrencies.organizationId, organization.id))
      .orderBy(
        desc(organizationCurrencies.isDefault),
        organizationCurrencies.currencyCode,
      );

    return currencies;
  } catch (error) {
    console.error("Error fetching currencies:", error);
    return [];
  }
}

/**
 * Set a currency as the default for the organization
 */
export async function setDefaultCurrency(id: number) {
  try {
    await requireInvoicingWriteAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    // Check if currency exists
    const [existing] = await db
      .select()
      .from(organizationCurrencies)
      .where(
        and(
          eq(organizationCurrencies.id, id),
          eq(organizationCurrencies.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!existing) {
      return {
        success: null,
        error: { reason: "Currency not found" },
      };
    }

    await db.transaction(async (tx) => {
      // Unset all defaults
      await tx
        .update(organizationCurrencies)
        .set({ isDefault: false })
        .where(eq(organizationCurrencies.organizationId, organization.id));

      // Set new default
      await tx
        .update(organizationCurrencies)
        .set({ isDefault: true })
        .where(eq(organizationCurrencies.id, id));
    });

    revalidatePath("/invoicing/settings");
    revalidatePath("/invoicing/invoices/new");

    return {
      success: { reason: "Default currency updated successfully" },
      error: null,
    };
  } catch (error) {
    console.error("Error setting default currency:", error);
    return {
      success: null,
      error: { reason: "Failed to set default currency" },
    };
  }
}

/**
 * Get the default currency for the organization
 */
export async function getDefaultCurrency() {
  try {
    await requireInvoicingViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return null;
    }

    const [currency] = await db
      .select()
      .from(organizationCurrencies)
      .where(
        and(
          eq(organizationCurrencies.organizationId, organization.id),
          eq(organizationCurrencies.isDefault, true),
        ),
      )
      .limit(1);

    return currency || null;
  } catch (error) {
    console.error("Error fetching default currency:", error);
    return null;
  }
}

/**
 * Get a currency by ID
 */
export async function getCurrency(id: number) {
  try {
    await requireInvoicingViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return null;
    }

    const [currency] = await db
      .select()
      .from(organizationCurrencies)
      .where(
        and(
          eq(organizationCurrencies.id, id),
          eq(organizationCurrencies.organizationId, organization.id),
        ),
      )
      .limit(1);

    return currency || null;
  } catch (error) {
    console.error("Error fetching currency:", error);
    return null;
  }
}
