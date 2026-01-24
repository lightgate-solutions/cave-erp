"use server";

import { db } from "@/db";
import {
  purchaseOrders,
  poLineItems,
  billLineItems,
  vendors,
  organizationCurrencies,
} from "@/db/schema";
import {
  requirePayablesViewAccess,
  requirePayablesWriteAccess,
  requirePayablesApprovalAccess,
} from "../auth/dal-payables";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { POStatus, LineItem } from "@/types/payables";
import { calculateBillAmounts } from "@/lib/payables-utils";

export interface CreatePOInput {
  vendorId: number;
  currencyId: number;
  poDate: string; // YYYY-MM-DD format
  expectedDeliveryDate?: string;
  lineItems: LineItem[];
  notes?: string;
  termsAndConditions?: string;
  deliveryAddress?: string;
}

export interface UpdatePOInput extends Partial<CreatePOInput> {}

/**
 * Generate unique PO number for organization
 * Format: PO-{YEAR}-{NNNN}
 * Example: PO-2026-0001
 */
export async function generatePONumber() {
  try {
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return null;
    }

    const year = new Date().getFullYear();
    const prefix = `PO-${year}-`;

    // Get the latest PO with this year's prefix
    const latestPO = await db
      .select()
      .from(purchaseOrders)
      .where(
        and(
          eq(purchaseOrders.organizationId, organization.id),
          ilike(purchaseOrders.poNumber, `${prefix}%`),
        ),
      )
      .orderBy(desc(purchaseOrders.createdAt))
      .limit(1);

    if (latestPO.length === 0) {
      return `${prefix}0001`;
    }

    // Extract number from last code and increment
    const lastCode = latestPO[0].poNumber;
    const lastNumber = Number.parseInt(lastCode.split("-")[2] || "0");
    const nextNumber = lastNumber + 1;

    return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
  } catch (error) {
    console.error("Error generating PO number:", error);
    return null;
  }
}

/**
 * Create a new purchase order
 */
export async function createPurchaseOrder(data: CreatePOInput) {
  try {
    const { employee, userId } = await requirePayablesWriteAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    // Generate PO number
    const poNumber = await generatePONumber();
    if (!poNumber) {
      return {
        success: null,
        error: { reason: "Failed to generate PO number" },
      };
    }

    // Calculate amounts (POs don't have taxes at creation, just subtotal)
    const { subtotal, total } = calculateBillAmounts(data.lineItems, []);

    const [po] = await db.transaction(async (tx) => {
      // Create PO
      const [newPO] = await tx
        .insert(purchaseOrders)
        .values({
          poNumber,
          vendorId: data.vendorId,
          currencyId: data.currencyId,
          poDate: data.poDate,
          expectedDeliveryDate: data.expectedDeliveryDate || null,
          status: "Draft",
          subtotal: subtotal.toString(),
          taxAmount: "0.00",
          total: total.toString(),
          receivedAmount: "0.00",
          billedAmount: "0.00",
          notes: data.notes || null,
          termsAndConditions: data.termsAndConditions || null,
          deliveryAddress: data.deliveryAddress || null,
          organizationId: organization.id,
          createdBy: userId,
        })
        .returning();

      // Insert line items
      if (data.lineItems.length > 0) {
        await tx.insert(poLineItems).values(
          data.lineItems.map((item, index) => ({
            poId: newPO.id,
            description: item.description,
            quantity: item.quantity.toString(),
            unitPrice: item.unitPrice.toString(),
            amount: (item.quantity * item.unitPrice).toString(),
            receivedQuantity: "0.00",
            billedQuantity: "0.00",
            sortOrder: item.sortOrder ?? index,
            organizationId: organization.id,
          })),
        );
      }

      return [newPO];
    });

    revalidatePath("/payables/purchase-orders");

    return {
      success: { data: po },
      error: null,
    };
  } catch (error) {
    console.error("Error creating purchase order:", error);
    return {
      success: null,
      error: { reason: "Failed to create purchase order" },
    };
  }
}

/**
 * Update an existing purchase order
 */
export async function updatePurchaseOrder(id: number, data: UpdatePOInput) {
  try {
    const { employee, userId } = await requirePayablesWriteAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    // Get existing PO
    const [existing] = await db
      .select()
      .from(purchaseOrders)
      .where(
        and(
          eq(purchaseOrders.id, id),
          eq(purchaseOrders.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!existing) {
      return {
        success: null,
        error: { reason: "Purchase order not found" },
      };
    }

    // Only allow editing drafts
    if (existing.status !== "Draft") {
      return {
        success: null,
        error: {
          reason: "Only draft purchase orders can be edited",
        },
      };
    }

    const [updated] = await db.transaction(async (tx) => {
      // Build update data
      const updateData: Record<string, unknown> = {
        updatedBy: userId,
      };

      if (data.vendorId !== undefined) updateData.vendorId = data.vendorId;
      if (data.currencyId !== undefined)
        updateData.currencyId = data.currencyId;
      if (data.poDate !== undefined) updateData.poDate = data.poDate;
      if (data.expectedDeliveryDate !== undefined)
        updateData.expectedDeliveryDate = data.expectedDeliveryDate;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.termsAndConditions !== undefined)
        updateData.termsAndConditions = data.termsAndConditions;
      if (data.deliveryAddress !== undefined)
        updateData.deliveryAddress = data.deliveryAddress;

      // Recalculate amounts if line items changed
      if (data.lineItems) {
        const { subtotal, total } = calculateBillAmounts(data.lineItems, []);

        updateData.subtotal = subtotal.toString();
        updateData.total = total.toString();

        // Delete existing line items
        await tx.delete(poLineItems).where(eq(poLineItems.poId, id));

        // Insert new line items
        if (data.lineItems.length > 0) {
          await tx.insert(poLineItems).values(
            data.lineItems.map((item, index) => ({
              poId: id,
              description: item.description,
              quantity: item.quantity.toString(),
              unitPrice: item.unitPrice.toString(),
              amount: (item.quantity * item.unitPrice).toString(),
              receivedQuantity: "0.00",
              billedQuantity: "0.00",
              sortOrder: item.sortOrder ?? index,
              organizationId: organization.id,
            })),
          );
        }
      }

      // Update PO
      const [updatedPO] = await tx
        .update(purchaseOrders)
        .set(updateData)
        .where(
          and(
            eq(purchaseOrders.id, id),
            eq(purchaseOrders.organizationId, organization.id),
          ),
        )
        .returning();

      return [updatedPO];
    });

    revalidatePath("/payables/purchase-orders");
    revalidatePath(`/payables/purchase-orders/${id}`);

    return {
      success: { data: updated },
      error: null,
    };
  } catch (error) {
    console.error("Error updating purchase order:", error);
    return {
      success: null,
      error: { reason: "Failed to update purchase order" },
    };
  }
}

/**
 * Delete a purchase order (drafts only)
 */
export async function deletePurchaseOrder(id: number) {
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

    // Get PO
    const [po] = await db
      .select()
      .from(purchaseOrders)
      .where(
        and(
          eq(purchaseOrders.id, id),
          eq(purchaseOrders.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!po) {
      return {
        success: null,
        error: { reason: "Purchase order not found" },
      };
    }

    // Only allow deleting drafts
    if (po.status !== "Draft") {
      return {
        success: null,
        error: { reason: "Only draft purchase orders can be deleted" },
      };
    }

    await db
      .delete(purchaseOrders)
      .where(
        and(
          eq(purchaseOrders.id, id),
          eq(purchaseOrders.organizationId, organization.id),
        ),
      );

    revalidatePath("/payables/purchase-orders");

    return {
      success: { reason: "Purchase order deleted successfully" },
      error: null,
    };
  } catch (error) {
    console.error("Error deleting purchase order:", error);
    return {
      success: null,
      error: { reason: "Failed to delete purchase order" },
    };
  }
}

/**
 * Get a single purchase order with all relations
 */
export async function getPurchaseOrder(id: number) {
  try {
    await requirePayablesViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return null;
    }

    const po = await db.query.purchaseOrders.findFirst({
      where: and(
        eq(purchaseOrders.id, id),
        eq(purchaseOrders.organizationId, organization.id),
      ),
      with: {
        vendor: true,
        currency: true,
        lineItems: {
          orderBy: (items, { asc }) => [asc(items.sortOrder)],
        },
        bills: true,
        createdByUser: true,
        updatedByUser: true,
        approvedByUser: true,
      },
    });

    return po || null;
  } catch (error) {
    console.error("Error fetching purchase order:", error);
    return null;
  }
}

/**
 * Get all purchase orders with optional filters
 */
export async function getAllPurchaseOrders(filters?: {
  status?: POStatus;
  vendorId?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    await requirePayablesViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const conditions = [eq(purchaseOrders.organizationId, organization.id)];

    if (filters?.status) {
      conditions.push(eq(purchaseOrders.status, filters.status));
    }

    if (filters?.vendorId) {
      conditions.push(eq(purchaseOrders.vendorId, filters.vendorId));
    }

    if (filters?.search) {
      conditions.push(
        // biome-ignore lint/style/noNonNullAssertion: safe
        or(
          ilike(purchaseOrders.poNumber, `%${filters.search}%`),
          ilike(vendors.name, `%${filters.search}%`),
        )!,
      );
    }

    if (filters?.startDate) {
      conditions.push(sql`${purchaseOrders.poDate} >= ${filters.startDate}`);
    }

    if (filters?.endDate) {
      conditions.push(sql`${purchaseOrders.poDate} <= ${filters.endDate}`);
    }

    const allPOs = await db
      .select({
        id: purchaseOrders.id,
        poNumber: purchaseOrders.poNumber,
        vendorId: purchaseOrders.vendorId,
        vendorName: vendors.name,
        poDate: purchaseOrders.poDate,
        expectedDeliveryDate: purchaseOrders.expectedDeliveryDate,
        status: purchaseOrders.status,
        total: purchaseOrders.total,
        receivedAmount: purchaseOrders.receivedAmount,
        billedAmount: purchaseOrders.billedAmount,
        currencyId: purchaseOrders.currencyId,
        currencySymbol: organizationCurrencies.currencySymbol,
        createdAt: purchaseOrders.createdAt,
      })
      .from(purchaseOrders)
      .innerJoin(vendors, eq(purchaseOrders.vendorId, vendors.id))
      .innerJoin(
        organizationCurrencies,
        eq(purchaseOrders.currencyId, organizationCurrencies.id),
      )
      .where(and(...conditions))
      .orderBy(desc(purchaseOrders.createdAt));

    return allPOs;
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return [];
  }
}

/**
 * Update purchase order status
 */
export async function updatePOStatus(
  id: number,
  newStatus: POStatus,
  _reason?: string,
) {
  try {
    const { employee, userId } = await requirePayablesWriteAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    // Get current PO
    const [existing] = await db
      .select()
      .from(purchaseOrders)
      .where(
        and(
          eq(purchaseOrders.id, id),
          eq(purchaseOrders.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!existing) {
      return {
        success: null,
        error: { reason: "Purchase order not found" },
      };
    }

    const _oldStatus = existing.status;

    // Build update data
    const updateData: Record<string, unknown> = { status: newStatus };

    if (newStatus === "Sent" && !existing.sentAt) {
      updateData.sentAt = new Date();
    } else if (newStatus === "Closed") {
      updateData.closedAt = new Date();
    } else if (newStatus === "Cancelled") {
      updateData.cancelledAt = new Date();
    }

    await db
      .update(purchaseOrders)
      .set(updateData)
      .where(
        and(
          eq(purchaseOrders.id, id),
          eq(purchaseOrders.organizationId, organization.id),
        ),
      );

    revalidatePath("/payables/purchase-orders");
    revalidatePath(`/payables/purchase-orders/${id}`);

    return {
      success: { reason: "Status updated successfully" },
      error: null,
    };
  } catch (error) {
    console.error("Error updating PO status:", error);
    return {
      success: null,
      error: { reason: "Failed to update PO status" },
    };
  }
}

/**
 * Approve a purchase order
 */
export async function approvePurchaseOrder(id: number) {
  try {
    const { employee, userId } = await requirePayablesApprovalAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    await db
      .update(purchaseOrders)
      .set({
        status: "Approved",
        approvedBy: userId,
        approvedAt: new Date(),
      })
      .where(
        and(
          eq(purchaseOrders.id, id),
          eq(purchaseOrders.organizationId, organization.id),
        ),
      );

    revalidatePath("/payables/purchase-orders");
    revalidatePath(`/payables/purchase-orders/${id}`);

    return {
      success: { reason: "Purchase order approved successfully" },
      error: null,
    };
  } catch (error) {
    console.error("Error approving purchase order:", error);
    return {
      success: null,
      error: { reason: "Failed to approve purchase order" },
    };
  }
}

/**
 * Get PO matching status - shows billed vs ordered quantities
 */
export async function getPOMatchingStatus(poId: number) {
  try {
    await requirePayablesViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return null;
    }

    const po = await db.query.purchaseOrders.findFirst({
      where: and(
        eq(purchaseOrders.id, poId),
        eq(purchaseOrders.organizationId, organization.id),
      ),
      with: {
        lineItems: true,
      },
    });

    if (!po) {
      return null;
    }

    // Calculate matching status for each line item
    const lineItemStatus = po.lineItems.map((item) => {
      const ordered = Number(item.quantity);
      const billed = Number(item.billedQuantity);
      const received = Number(item.receivedQuantity);
      const unbilled = ordered - billed;
      const percentBilled = ordered > 0 ? (billed / ordered) * 100 : 0;

      return {
        id: item.id,
        description: item.description,
        orderedQuantity: ordered,
        billedQuantity: billed,
        receivedQuantity: received,
        unbilledQuantity: unbilled,
        percentBilled: Number(percentBilled.toFixed(2)),
        fullyBilled: billed >= ordered,
      };
    });

    // Calculate overall PO status
    const totalOrdered = Number(po.total);
    const totalBilled = Number(po.billedAmount);
    const totalReceived = Number(po.receivedAmount);
    const percentBilled =
      totalOrdered > 0 ? (totalBilled / totalOrdered) * 100 : 0;

    return {
      poNumber: po.poNumber,
      status: po.status,
      totalOrdered,
      totalBilled,
      totalReceived,
      totalUnbilled: totalOrdered - totalBilled,
      percentBilled: Number(percentBilled.toFixed(2)),
      fullyBilled: totalBilled >= totalOrdered,
      lineItems: lineItemStatus,
    };
  } catch (error) {
    console.error("Error fetching PO matching status:", error);
    return null;
  }
}

/**
 * Update PO billed amount after bill creation
 * (Called internally by bill creation)
 */
export async function updatePOBilledAmount(poId: number) {
  try {
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return;
    }

    // Calculate total billed amount from all bill line items linked to this PO
    const [result] = await db
      .select({
        totalBilled: sql<string>`COALESCE(SUM(${billLineItems.amount}), 0)`,
      })
      .from(billLineItems)
      .innerJoin(poLineItems, eq(billLineItems.poLineItemId, poLineItems.id))
      .where(eq(poLineItems.poId, poId));

    const totalBilled = Number(result.totalBilled);

    // Update PO billed amount
    await db
      .update(purchaseOrders)
      .set({
        billedAmount: totalBilled.toString(),
      })
      .where(eq(purchaseOrders.id, poId));

    // Update PO status based on billing progress
    const [po] = await db
      .select()
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, poId))
      .limit(1);

    if (po) {
      const total = Number(po.total);
      const billed = Number(po.billedAmount);

      if (billed >= total && po.status !== "Closed") {
        // Fully billed - close PO
        await db
          .update(purchaseOrders)
          .set({ status: "Closed", closedAt: new Date() })
          .where(eq(purchaseOrders.id, poId));
      }
    }

    revalidatePath("/payables/purchase-orders");
    revalidatePath(`/payables/purchase-orders/${poId}`);
  } catch (error) {
    console.error("Error updating PO billed amount:", error);
  }
}
