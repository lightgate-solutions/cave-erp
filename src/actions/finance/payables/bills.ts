"use server";

import { db } from "@/db";
import {
  bills,
  billItems,
  organizationCurrencies,
  suppliers,
} from "@/db/schema";
import {
  requireFinanceViewAccess,
  requireFinanceWriteAccess,
} from "../../auth/dal-finance";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export type BillStatus =
  | "Draft"
  | "Open"
  | "Paid"
  | "Overdue"
  | "Partially Paid"
  | "Void";

export interface BillLineItem {
  id?: number;
  description: string;
  category?: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateBillInput {
  supplierId: number;
  currencyId: number;
  billNumber: string; // Vendor's invoice number
  billDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  lineItems: BillLineItem[];
  notes?: string;
  attachmentPath?: string;
  status?: "Draft" | "Open";
}

export interface UpdateBillInput
  extends Omit<Partial<CreateBillInput>, "status"> {
  status?: BillStatus;
}

/**
 * Calculate totals for a bill
 */
function calculateBillTotals(items: BillLineItem[]) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );
  // For now, no separate tax logic for bills (usually included or simple).
  // Schema has taxAmount, let's assume 0 for MVP or manual input later.
  // We'll proceed with 0 tax for now to match input interface.
  const taxAmount = 0;
  const total = subtotal + taxAmount;
  return { subtotal, taxAmount, total };
}

/**
 * Create a new bill
 */
export async function createBill(data: CreateBillInput) {
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

    // Check if bill number already exists for this supplier?
    // Not enforcing strict uniqueness yet as vendor numbers might collide across vendors,
    // but here we might want to check for same vendor + same bill number.

    const { subtotal, taxAmount, total } = calculateBillTotals(data.lineItems);

    const [bill] = await db.transaction(async (tx) => {
      // Create bill
      const [newBill] = await tx
        .insert(bills)
        .values({
          billNumber: data.billNumber,
          supplierId: data.supplierId,
          currencyId: data.currencyId,
          billDate: data.billDate,
          dueDate: data.dueDate,
          status: data.status || "Draft",
          subtotal: subtotal.toString(),
          taxAmount: taxAmount.toString(),
          total: total.toString(),
          amountPaid: "0.00",
          amountDue: total.toString(),
          notes: data.notes || null,
          attachmentPath: data.attachmentPath || null,
          organizationId: organization.id,
          createdBy: employee.userId,
        })
        .returning();

      // Insert line items
      if (data.lineItems.length > 0) {
        await tx.insert(billItems).values(
          data.lineItems.map((item) => ({
            billId: newBill.id,
            description: item.description,
            category: item.category || null,
            quantity: item.quantity.toString(),
            unitPrice: item.unitPrice.toString(),
            amount: (item.quantity * item.unitPrice).toString(),
            organizationId: organization.id,
          })),
        );
      }

      return [newBill];
    });

    revalidatePath("/finance/payables/bills");

    return {
      success: { data: bill },
      error: null,
    };
  } catch (error) {
    console.error("Error creating bill:", error);
    return {
      success: null,
      error: { reason: "Failed to create bill" },
    };
  }
}

/**
 * Update an existing bill
 */
export async function updateBill(id: number, data: UpdateBillInput) {
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

    const [existing] = await db
      .select()
      .from(bills)
      .where(and(eq(bills.id, id), eq(bills.organizationId, organization.id)))
      .limit(1);

    if (!existing) {
      return {
        success: null,
        error: { reason: "Bill not found" },
      };
    }

    // Only allow editing if not fully paid/void (or maybe looser rules for bills)
    if (existing.status === "Paid" || existing.status === "Void") {
      // Can't edit key financial details
    }

    const [updated] = await db.transaction(async (tx) => {
      const updateData: Record<string, unknown> = {};

      if (data.billNumber !== undefined)
        updateData.billNumber = data.billNumber;
      if (data.supplierId !== undefined)
        updateData.supplierId = data.supplierId;
      if (data.currencyId !== undefined)
        updateData.currencyId = data.currencyId;
      if (data.billDate !== undefined) updateData.billDate = data.billDate;
      if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.status !== undefined) updateData.status = data.status;

      // Recalculate if items changed
      if (data.lineItems) {
        // Delete existing
        await tx.delete(billItems).where(eq(billItems.billId, id));

        // Calculate new totals
        const { subtotal, taxAmount, total } = calculateBillTotals(
          data.lineItems,
        );

        updateData.subtotal = subtotal.toString();
        updateData.taxAmount = taxAmount.toString();
        updateData.total = total.toString();
        updateData.amountDue = (
          total - Number(existing.amountPaid || 0)
        ).toString();

        // Insert new items
        if (data.lineItems.length > 0) {
          await tx.insert(billItems).values(
            data.lineItems.map((item) => ({
              billId: id,
              description: item.description,
              category: item.category || null,
              quantity: item.quantity.toString(),
              unitPrice: item.unitPrice.toString(),
              amount: (item.quantity * item.unitPrice).toString(),
              organizationId: organization.id,
            })),
          );
        }
      }

      const [updatedBill] = await tx
        .update(bills)
        .set(updateData)
        .where(and(eq(bills.id, id), eq(bills.organizationId, organization.id)))
        .returning();

      return [updatedBill];
    });

    revalidatePath("/finance/payables/bills");
    revalidatePath(`/finance/payables/bills/${id}`);

    return {
      success: { data: updated },
      error: null,
    };
  } catch (error) {
    console.error("Error updating bill:", error);
    return {
      success: null,
      error: { reason: "Failed to update bill" },
    };
  }
}

/**
 * Delete a bill
 */
export async function deleteBill(id: number) {
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

    // Check if payments exist?
    // If payments exist, maybe warn or cascading delete if allowed.
    // For now, let's say only if no payments.
    const existing = await db.query.bills.findFirst({
      where: and(eq(bills.id, id), eq(bills.organizationId, organization.id)),
      with: { payments: true },
    });

    if (!existing)
      return { success: null, error: { reason: "Bill not found" } };

    if (existing.payments.length > 0) {
      return {
        success: null,
        error: { reason: "Cannot delete bill with recorded payments." },
      };
    }

    await db
      .delete(bills)
      .where(and(eq(bills.id, id), eq(bills.organizationId, organization.id)));

    revalidatePath("/finance/payables/bills");

    return {
      success: { reason: "Bill deleted successfully" },
      error: null,
    };
  } catch (error) {
    console.error("Error deleting bill:", error);
    return {
      success: null,
      error: { reason: "Failed to delete bill" },
    };
  }
}

/**
 * Get a single bill
 */
export async function getBill(id: number) {
  try {
    await requireFinanceViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return null;
    }

    const bill = await db.query.bills.findFirst({
      where: and(eq(bills.id, id), eq(bills.organizationId, organization.id)),
      with: {
        supplier: true,
        currency: true,
        items: true,
        payments: {
          with: { bankAccount: true, recordedByUser: true },
          orderBy: (p, { desc }) => [desc(p.paymentDate)],
        },
        createdByUser: true,
      },
    });

    return bill || null;
  } catch (error) {
    console.error("Error fetching bill:", error);
    return null;
  }
}

/**
 * Get all bills
 */
export async function getAllBills(filters?: {
  status?: BillStatus;
  supplierId?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    await requireFinanceViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const conditions = [eq(bills.organizationId, organization.id)];

    if (filters?.status) {
      conditions.push(eq(bills.status, filters.status));
    }

    if (filters?.supplierId) {
      conditions.push(eq(bills.supplierId, filters.supplierId));
    }

    if (filters?.search) {
      const searchCondition = or(
        ilike(bills.billNumber, `%${filters.search}%`),
        ilike(suppliers.name, `%${filters.search}%`),
        ilike(suppliers.email, `%${filters.search}%`),
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    if (filters?.startDate) {
      conditions.push(sql`${bills.billDate} >= ${filters.startDate}`);
    }
    if (filters?.endDate) {
      conditions.push(sql`${bills.billDate} <= ${filters.endDate}`);
    }

    const allBills = await db
      .select({
        id: bills.id,
        billNumber: bills.billNumber,
        supplierId: bills.supplierId,
        supplierName: suppliers.name,
        billDate: bills.billDate,
        dueDate: bills.dueDate,
        status: bills.status,
        total: bills.total,
        amountPaid: bills.amountPaid,
        amountDue: bills.amountDue,
        currencyId: bills.currencyId,
        currencySymbol: organizationCurrencies.currencySymbol,
        createdAt: bills.createdAt,
      })
      .from(bills)
      .innerJoin(suppliers, eq(bills.supplierId, suppliers.id))
      .innerJoin(
        organizationCurrencies,
        eq(bills.currencyId, organizationCurrencies.id),
      )
      .where(and(...conditions))
      .orderBy(desc(bills.createdAt));

    return allBills;
  } catch (error) {
    console.error("Error fetching bills:", error);
    return [];
  }
}
