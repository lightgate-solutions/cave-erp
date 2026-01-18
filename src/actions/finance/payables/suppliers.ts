/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

"use server";

import { db } from "@/db";
import { suppliers, bills } from "@/db/schema";
import {
  requireFinanceViewAccess,
  requireFinanceWriteAccess,
} from "../../auth/dal-finance";
import { and, count, desc, eq, ilike, or, sql, sum } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export interface CreateSupplierInput {
  name: string;
  email?: string;
  phone?: string;
  taxId?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  paymentTerms?: string;
  website?: string;
  notes?: string;
  currencyId?: number;
}

export interface UpdateSupplierInput extends Partial<CreateSupplierInput> {
  isActive?: boolean;
}

/**
 * Create a new supplier
 */
export async function createSupplier(data: CreateSupplierInput) {
  try {
    const { employee } = await requireFinanceWriteAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    const [supplier] = await db
      .insert(suppliers)
      .values({
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        taxId: data.taxId || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        postalCode: data.postalCode || null,
        country: data.country || null,
        paymentTerms: data.paymentTerms || null,
        website: data.website || null,
        notes: data.notes || null,
        currencyId: data.currencyId || null,
        organizationId: organization.id,
        createdBy: employee.userId,
      })
      .returning();

    revalidatePath("/finance/payables/suppliers");

    return {
      success: { data: supplier },
      error: null,
    };
  } catch (error) {
    console.error("Error creating supplier:", error);
    return {
      success: null,
      error: { reason: "Failed to create supplier" },
    };
  }
}

/**
 * Update an existing supplier
 */
export async function updateSupplier(id: number, data: UpdateSupplierInput) {
  try {
    await requireFinanceWriteAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    // Check if supplier exists
    const [existing] = await db
      .select()
      .from(suppliers)
      .where(
        and(
          eq(suppliers.id, id),
          eq(suppliers.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!existing) {
      return {
        success: null,
        error: { reason: "Supplier not found" },
      };
    }

    const [updated] = await db
      .update(suppliers)
      .set(data)
      .where(
        and(
          eq(suppliers.id, id),
          eq(suppliers.organizationId, organization.id),
        ),
      )
      .returning();

    revalidatePath("/finance/payables/suppliers");
    revalidatePath(`/finance/payables/suppliers/${id}`);

    return {
      success: { data: updated },
      error: null,
    };
  } catch (error) {
    console.error("Error updating supplier:", error);
    return {
      success: null,
      error: { reason: "Failed to update supplier" },
    };
  }
}

/**
 * Delete a supplier (only if no bills exist)
 */
export async function deleteSupplier(id: number) {
  try {
    await requireFinanceWriteAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    // Check if supplier has any bills
    const [billCount] = await db
      .select({ count: count() })
      .from(bills)
      .where(
        and(
          eq(bills.supplierId, id),
          eq(bills.organizationId, organization.id),
        ),
      );

    if (billCount.count > 0) {
      // Don't delete, just mark as inactive
      await db
        .update(suppliers)
        .set({ isActive: false })
        .where(
          and(
            eq(suppliers.id, id),
            eq(suppliers.organizationId, organization.id),
          ),
        );

      revalidatePath("/finance/payables/suppliers");

      return {
        success: {
          reason: "Supplier has bills. Marked as inactive instead.",
        },
        error: null,
      };
    }

    // Delete if no bills
    await db
      .delete(suppliers)
      .where(
        and(
          eq(suppliers.id, id),
          eq(suppliers.organizationId, organization.id),
        ),
      );

    revalidatePath("/finance/payables/suppliers");

    return {
      success: { reason: "Supplier deleted successfully" },
      error: null,
    };
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return {
      success: null,
      error: { reason: "Failed to delete supplier" },
    };
  }
}

/**
 * Get a single supplier with stats
 */
export async function getSupplier(id: number) {
  try {
    await requireFinanceViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return null;
    }

    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(
        and(
          eq(suppliers.id, id),
          eq(suppliers.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!supplier) {
      return null;
    }

    // Get bill stats
    const [stats] = await db
      .select({
        totalBills: count(),
        totalAmount: sum(bills.total),
        paidAmount: sum(bills.amountPaid),
        outstandingAmount: sum(bills.amountDue),
      })
      .from(bills)
      .where(
        and(
          eq(bills.supplierId, id),
          eq(bills.organizationId, organization.id),
        ),
      );

    return {
      ...supplier,
      stats: {
        totalBills: stats.totalBills || 0,
        totalAmount: stats.totalAmount || "0.00",
        paidAmount: stats.paidAmount || "0.00",
        outstandingAmount: stats.outstandingAmount || "0.00",
      },
    };
  } catch (error) {
    console.error("Error fetching supplier:", error);
    return null;
  }
}

/**
 * Get all suppliers with optional filters
 */
export async function getAllSuppliers(filters?: {
  search?: string;
  isActive?: boolean;
}) {
  try {
    await requireFinanceViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const conditions = [eq(suppliers.organizationId, organization.id)];

    if (filters?.search) {
      conditions.push(
        // biome-ignore lint/style/noNonNullAssertion: <>
        or(
          ilike(suppliers.name, `%${filters.search}%`),
          ilike(suppliers.email, `%${filters.search}%`),
        )!,
      );
    }

    if (filters?.isActive !== undefined) {
      conditions.push(eq(suppliers.isActive, filters.isActive));
    }

    const allSuppliers = await db
      .select({
        id: suppliers.id,
        name: suppliers.name,
        email: suppliers.email,
        phone: suppliers.phone,
        isActive: suppliers.isActive,
        city: suppliers.city,
        country: suppliers.country,
        createdAt: suppliers.createdAt,
        billCount: sql<number>`(SELECT COUNT(*) FROM ${bills} WHERE ${bills.supplierId} = ${suppliers.id})`,
        totalOutstanding: sql<string>`COALESCE((SELECT SUM(${bills.amountDue}) FROM ${bills} WHERE ${bills.supplierId} = ${suppliers.id}), 0)`,
      })
      .from(suppliers)
      .where(and(...conditions))
      .orderBy(desc(suppliers.createdAt));

    return allSuppliers;
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return [];
  }
}
