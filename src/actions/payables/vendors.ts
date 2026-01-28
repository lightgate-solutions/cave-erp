"use server";

import { db } from "@/db";
import {
  vendors,
  vendorContacts,
  vendorBankAccounts,
  payablesBills,
} from "@/db/schema";
import {
  requirePayablesViewAccess,
  requirePayablesWriteAccess,
} from "../auth/dal-payables";
import { and, count, desc, eq, ilike, or, sql, sum } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type {
  VendorStatus,
  VendorCategory,
  PaymentMethod,
  VendorContact,
  VendorBankAccount,
  BillStatus,
} from "@/types/payables";

export interface CreateVendorInput {
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  taxId?: string;
  cacNumber?: string;
  category: VendorCategory;
  customCategory?: string;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;
  website?: string;
  notes?: string;
  status?: VendorStatus;
  defaultPaymentTerms?: string;
  defaultPaymentMethod?: PaymentMethod;
  contacts?: VendorContact[];
  bankAccounts?: VendorBankAccount[];
}

export interface UpdateVendorInput extends Partial<CreateVendorInput> {}

/**
 * Generate unique vendor code
 * Format: VEN-{YEAR}-{NNNN}
 * Example: VEN-2026-0001
 */
export async function generateVendorCode() {
  try {
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return null;
    }

    const year = new Date().getFullYear();
    const prefix = `VEN-${year}-`;

    // Get the latest vendor with this year's prefix
    const latestVendor = await db
      .select()
      .from(vendors)
      .where(
        and(
          eq(vendors.organizationId, organization.id),
          ilike(vendors.vendorCode, `${prefix}%`),
        ),
      )
      .orderBy(desc(vendors.createdAt))
      .limit(1);

    if (latestVendor.length === 0) {
      return `${prefix}0001`;
    }

    // Extract number from last code and increment
    const lastCode = latestVendor[0].vendorCode;
    const lastNumber = Number.parseInt(lastCode.split("-")[2] || "0");
    const nextNumber = lastNumber + 1;

    return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
  } catch (error) {
    console.error("Error generating vendor code:", error);
    return null;
  }
}

/**
 * Create a new vendor with contacts and bank accounts
 */
export async function createVendor(data: CreateVendorInput) {
  try {
    const { userId } = await requirePayablesWriteAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    // Generate vendor code
    const vendorCode = await generateVendorCode();
    if (!vendorCode) {
      return {
        success: null,
        error: { reason: "Failed to generate vendor code" },
      };
    }

    const result = await db.transaction(async (tx) => {
      // Create vendor
      const [vendor] = await tx
        .insert(vendors)
        .values({
          vendorCode,
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          companyName: data.companyName || null,
          taxId: data.taxId || null,
          cacNumber: data.cacNumber || null,
          category: data.category,
          customCategory: data.customCategory || null,
          billingAddress: data.billingAddress || null,
          billingCity: data.billingCity || null,
          billingState: data.billingState || null,
          billingPostalCode: data.billingPostalCode || null,
          billingCountry: data.billingCountry || null,
          website: data.website || null,
          notes: data.notes || null,
          status: data.status || "Active",
          defaultPaymentTerms: data.defaultPaymentTerms || null,
          defaultPaymentMethod: data.defaultPaymentMethod || null,
          organizationId: organization.id,
          createdBy: userId,
        })
        .returning();

      // Create vendor contacts if provided
      if (data.contacts && data.contacts.length > 0) {
        await tx.insert(vendorContacts).values(
          data.contacts.map((contact) => ({
            vendorId: vendor.id,
            name: contact.name,
            email: contact.email,
            phone: contact.phone || null,
            role: contact.role || null,
            isPrimary: contact.isPrimary,
            organizationId: organization.id,
          })),
        );
      }

      // Create vendor bank accounts if provided
      if (data.bankAccounts && data.bankAccounts.length > 0) {
        await tx.insert(vendorBankAccounts).values(
          data.bankAccounts.map((account) => ({
            vendorId: vendor.id,
            accountName: account.accountName,
            bankName: account.bankName,
            accountNumber: account.accountNumber,
            routingNumber: account.routingNumber || null,
            swiftCode: account.swiftCode || null,
            iban: account.iban || null,
            currency: account.currency,
            isDefault: account.isDefault,
            isActive: account.isActive,
            organizationId: organization.id,
          })),
        );
      }

      return vendor;
    });

    revalidatePath("/payables/vendors");

    return {
      success: { data: result },
      error: null,
    };
  } catch (error) {
    console.error("Error creating vendor:", error);
    return {
      success: null,
      error: { reason: "Failed to create vendor" },
    };
  }
}

/**
 * Update an existing vendor
 */
export async function updateVendor(id: number, data: UpdateVendorInput) {
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

    // Check if vendor exists
    const [existing] = await db
      .select()
      .from(vendors)
      .where(
        and(eq(vendors.id, id), eq(vendors.organizationId, organization.id)),
      )
      .limit(1);

    if (!existing) {
      return {
        success: null,
        error: { reason: "Vendor not found" },
      };
    }

    // Build update data (exclude contacts and bankAccounts)
    const {
      contacts: _contacts,
      bankAccounts: _bankAccounts,
      ...updateData
    } = data;

    const [updated] = await db
      .update(vendors)
      .set(updateData)
      .where(
        and(eq(vendors.id, id), eq(vendors.organizationId, organization.id)),
      )
      .returning();

    revalidatePath("/payables/vendors");
    revalidatePath(`/payables/vendors/${id}`);

    return {
      success: { data: updated },
      error: null,
    };
  } catch (error) {
    console.error("Error updating vendor:", error);
    return {
      success: null,
      error: { reason: "Failed to update vendor" },
    };
  }
}

/**
 * Delete a vendor (soft delete if has bills, hard delete otherwise)
 */
export async function deleteVendor(id: number) {
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

    // Check if vendor has any bills
    const [billCount] = await db
      .select({ count: count() })
      .from(payablesBills)
      .where(
        and(
          eq(payablesBills.vendorId, id),
          eq(payablesBills.organizationId, organization.id),
        ),
      );

    if (billCount.count > 0) {
      // Soft delete - mark as inactive
      await db
        .update(vendors)
        .set({ status: "Inactive" })
        .where(
          and(eq(vendors.id, id), eq(vendors.organizationId, organization.id)),
        );

      revalidatePath("/payables/vendors");

      return {
        success: {
          reason: "Vendor has bills. Marked as inactive instead.",
        },
        error: null,
      };
    }

    // Hard delete if no bills
    await db
      .delete(vendors)
      .where(
        and(eq(vendors.id, id), eq(vendors.organizationId, organization.id)),
      );

    revalidatePath("/payables/vendors");

    return {
      success: { reason: "Vendor deleted successfully" },
      error: null,
    };
  } catch (error) {
    console.error("Error deleting vendor:", error);
    return {
      success: null,
      error: { reason: "Failed to delete vendor" },
    };
  }
}

/**
 * Get a single vendor with stats, contacts, and bank accounts
 */
export async function getVendor(id: number) {
  try {
    await requirePayablesViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return null;
    }

    // Get vendor with relations
    const vendor = await db.query.vendors.findFirst({
      where: and(
        eq(vendors.id, id),
        eq(vendors.organizationId, organization.id),
      ),
      with: {
        contacts: true,
        bankAccounts: true,
      },
    });

    if (!vendor) {
      return null;
    }

    // Get bill stats
    const [stats] = await db
      .select({
        totalBills: count(),
        totalSpend: sum(payablesBills.total),
        amountPaid: sum(payablesBills.amountPaid),
        outstandingAmount: sum(payablesBills.amountDue),
      })
      .from(payablesBills)
      .where(
        and(
          eq(payablesBills.vendorId, id),
          eq(payablesBills.organizationId, organization.id),
        ),
      );

    return {
      ...vendor,
      stats: {
        totalBills: stats.totalBills || 0,
        totalSpend: stats.totalSpend || "0.00",
        amountPaid: stats.amountPaid || "0.00",
        outstandingAmount: stats.outstandingAmount || "0.00",
      },
    };
  } catch (error) {
    console.error("Error fetching vendor:", error);
    return null;
  }
}

/**
 * Get all vendors with optional filters
 */
export async function getAllVendors(filters?: {
  search?: string;
  category?: string;
  status?: VendorStatus;
}) {
  try {
    await requirePayablesViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const conditions = [eq(vendors.organizationId, organization.id)];

    if (filters?.search) {
      conditions.push(
        // biome-ignore lint/style/noNonNullAssertion: safe
        or(
          ilike(vendors.name, `%${filters.search}%`),
          ilike(vendors.email, `%${filters.search}%`),
          ilike(vendors.companyName, `%${filters.search}%`),
          ilike(vendors.vendorCode, `%${filters.search}%`),
        )!,
      );
    }

    if (filters?.category) {
      conditions.push(eq(vendors.category, filters.category as VendorCategory));
    }

    if (filters?.status) {
      conditions.push(eq(vendors.status, filters.status));
    }

    const allVendors = await db
      .select({
        id: vendors.id,
        vendorCode: vendors.vendorCode,
        name: vendors.name,
        email: vendors.email,
        phone: vendors.phone,
        companyName: vendors.companyName,
        category: vendors.category,
        customCategory: vendors.customCategory,
        status: vendors.status,
        defaultPaymentTerms: vendors.defaultPaymentTerms,
        createdAt: vendors.createdAt,
        billCount: sql<number>`(SELECT COUNT(*) FROM ${payablesBills} WHERE ${payablesBills.vendorId} = ${vendors.id})`,
        totalOutstanding: sql<string>`COALESCE((SELECT SUM(${payablesBills.amountDue}) FROM ${payablesBills} WHERE ${payablesBills.vendorId} = ${vendors.id}), 0)`,
      })
      .from(vendors)
      .where(and(...conditions))
      .orderBy(desc(vendors.createdAt));

    return allVendors;
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return [];
  }
}

/**
 * Get bills for a specific vendor
 */
export async function getVendorBills(
  vendorId: number,
  filters?: {
    status?: string;
  },
) {
  try {
    await requirePayablesViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const conditions = [
      eq(payablesBills.vendorId, vendorId),
      eq(payablesBills.organizationId, organization.id),
    ];

    if (filters?.status) {
      conditions.push(eq(payablesBills.status, filters.status as BillStatus));
    }

    const bills = await db
      .select()
      .from(payablesBills)
      .where(and(...conditions))
      .orderBy(desc(payablesBills.createdAt));

    return bills;
  } catch (error) {
    console.error("Error fetching vendor bills:", error);
    return [];
  }
}

/**
 * Get vendor statistics
 */
export async function getVendorStats(vendorId: number) {
  try {
    await requirePayablesViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return null;
    }

    const [stats] = await db
      .select({
        totalBills: count(),
        totalSpend: sum(payablesBills.total),
        amountPaid: sum(payablesBills.amountPaid),
        outstandingAmount: sum(payablesBills.amountDue),
        overdueCount: sql<number>`COUNT(CASE WHEN ${payablesBills.status} = 'Overdue' THEN 1 END)`,
        overdueAmount: sql<string>`COALESCE(SUM(CASE WHEN ${payablesBills.status} = 'Overdue' THEN ${payablesBills.amountDue} ELSE 0 END), 0)`,
      })
      .from(payablesBills)
      .where(
        and(
          eq(payablesBills.vendorId, vendorId),
          eq(payablesBills.organizationId, organization.id),
        ),
      );

    return {
      totalBills: stats.totalBills || 0,
      totalSpend: stats.totalSpend || "0.00",
      amountPaid: stats.amountPaid || "0.00",
      outstandingAmount: stats.outstandingAmount || "0.00",
      overdueCount: stats.overdueCount || 0,
      overdueAmount: stats.overdueAmount || "0.00",
    };
  } catch (error) {
    console.error("Error fetching vendor stats:", error);
    return null;
  }
}
