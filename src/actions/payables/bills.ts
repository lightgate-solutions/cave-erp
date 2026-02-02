"use server";

import { db } from "@/db";
import {
  payablesBills,
  billLineItems,
  billTaxes,
  billActivityLog,
  vendors,
  purchaseOrders,
  poLineItems,
  glAccounts,
  glJournals,
} from "@/db/schema";
import { createJournal } from "../finance/gl/journals";
import { ensureDefaultGLAccounts } from "../finance/gl/accounts";
import {
  requirePayablesViewAccess,
  requirePayablesWriteAccess,
  requirePayablesApprovalAccess,
} from "../auth/dal-payables";
import { and, desc, eq, gte, ilike, lte, ne, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { BillStatus, LineItem, TaxItem } from "@/types/payables";
import {
  calculateBillAmounts,
  generateDuplicateCheckHash,
  calculateDuplicateSimilarity,
  calculateStringSimilarity,
} from "@/lib/payables-utils";
import { updatePOBilledAmount } from "./purchase-orders";
import { sendBillReceivedConfirmationEmail as sendBillReceivedConfirmationEmailUtil } from "@/lib/emails";

export interface CreateBillInput {
  vendorInvoiceNumber: string;
  vendorId: number;
  poId?: number;
  bankAccountId?: number;
  billDate: string;
  dueDate: string;
  receivedDate: string;
  status?: BillStatus;
  currencyId: number;
  lineItems: LineItem[];
  taxes?: TaxItem[];
  notes?: string;
  paymentTerms?: string;
  isRecurring?: boolean;
  recurringFrequency?: string;
  recurringEndDate?: string;
}

export interface UpdateBillInput extends Partial<CreateBillInput> {}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  confidence: "high" | "medium" | "low";
  matches: Array<{
    billId: number;
    billNumber: string;
    vendorInvoiceNumber: string;
    amount: string;
    billDate: string;
    status: string;
    reason: string;
    similarity: number;
  }>;
}

/**
 * Generate unique bill number
 * Format: BILL-{YEAR}-{NNNN}
 * Example: BILL-2026-0001
 */
export async function generateBillNumber() {
  try {
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return null;
    }

    const year = new Date().getFullYear();
    const prefix = `BILL-${year}-`;

    // Get the latest bill with this year's prefix
    const latestBill = await db
      .select()
      .from(payablesBills)
      .where(
        and(
          eq(payablesBills.organizationId, organization.id),
          ilike(payablesBills.billNumber, `${prefix}%`),
        ),
      )
      .orderBy(desc(payablesBills.createdAt))
      .limit(1);

    if (latestBill.length === 0) {
      return `${prefix}0001`;
    }

    // Extract number from last code and increment
    const lastCode = latestBill[0].billNumber;
    const lastNumber = Number.parseInt(lastCode.split("-")[2] || "0");
    const nextNumber = lastNumber + 1;

    return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
  } catch (error) {
    console.error("Error generating bill number:", error);
    return null;
  }
}

/**
 * Smart duplicate detection with multi-factor analysis
 */
export async function checkForDuplicateBill(
  vendorId: number,
  vendorInvoiceNumber: string,
  amount: number,
  billDate: string,
  excludeBillId?: number,
): Promise<DuplicateCheckResult> {
  try {
    await requirePayablesViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        isDuplicate: false,
        confidence: "low",
        matches: [],
      };
    }

    // 1. HIGH confidence: Exact match on vendor + invoice number
    const exactMatchConditions = [
      eq(payablesBills.vendorId, vendorId),
      eq(payablesBills.vendorInvoiceNumber, vendorInvoiceNumber.trim()),
      eq(payablesBills.organizationId, organization.id),
      // Exclude cancelled bills
      sql`${payablesBills.status} != 'Cancelled'`,
    ];

    // Exclude current bill when in edit mode
    if (excludeBillId) {
      exactMatchConditions.push(ne(payablesBills.id, excludeBillId));
    }

    const exactMatches = await db
      .select()
      .from(payablesBills)
      .where(and(...exactMatchConditions))
      .limit(10);

    if (exactMatches.length > 0) {
      return {
        isDuplicate: true,
        confidence: "high",
        matches: exactMatches.map((match) => ({
          billId: match.id,
          billNumber: match.billNumber,
          vendorInvoiceNumber: match.vendorInvoiceNumber,
          amount: match.total,
          billDate: match.billDate,
          status: match.status,
          reason: "Same vendor and invoice number",
          similarity: 1.0,
        })),
      };
    }

    // 2. MEDIUM confidence: Same vendor + similar amount + close date
    const dateRange = 30; // days
    const amountTolerance = 0.01; // 1%
    const lowerAmount = amount * (1 - amountTolerance);
    const upperAmount = amount * (1 + amountTolerance);

    const similarMatchConditions = [
      eq(payablesBills.vendorId, vendorId),
      eq(payablesBills.organizationId, organization.id),
      gte(payablesBills.total, lowerAmount.toString()),
      lte(payablesBills.total, upperAmount.toString()),
      sql`ABS(EXTRACT(DAY FROM (${payablesBills.billDate}::date - ${billDate}::date))) <= ${dateRange}`,
      sql`${payablesBills.status} != 'Cancelled'`,
    ];

    // Exclude current bill when in edit mode
    if (excludeBillId) {
      similarMatchConditions.push(ne(payablesBills.id, excludeBillId));
    }

    const similarMatches = await db
      .select()
      .from(payablesBills)
      .where(and(...similarMatchConditions))
      .limit(10);

    if (similarMatches.length > 0) {
      return {
        isDuplicate: true,
        confidence: "medium",
        matches: similarMatches.map((match) => {
          const similarity = calculateDuplicateSimilarity(
            {
              vendorId,
              vendorInvoiceNumber,
              total: amount,
              billDate,
            },
            {
              vendorId: match.vendorId,
              vendorInvoiceNumber: match.vendorInvoiceNumber,
              total: Number.parseFloat(match.total),
              billDate: match.billDate,
            },
          );

          return {
            billId: match.id,
            billNumber: match.billNumber,
            vendorInvoiceNumber: match.vendorInvoiceNumber,
            amount: match.total,
            billDate: match.billDate,
            status: match.status,
            reason: `Similar amount (${match.total}) within ${dateRange} days`,
            similarity: similarity.similarity,
          };
        }),
      };
    }

    return {
      isDuplicate: false,
      confidence: "low",
      matches: [],
    };
  } catch (error) {
    console.error("Error checking for duplicate bill:", error);
    return {
      isDuplicate: false,
      confidence: "low",
      matches: [],
    };
  }
}

/**
 * Create a new bill with line items and taxes
 */
export async function createBill(data: CreateBillInput) {
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

    // Verify PO if provided
    if (data.poId) {
      const [po] = await db
        .select()
        .from(purchaseOrders)
        .where(
          and(
            eq(purchaseOrders.id, data.poId),
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

      // Verify PO is approved
      if (po.status !== "Approved" && po.status !== "Sent") {
        return {
          success: null,
          error: {
            reason: "Purchase order must be approved before creating a bill",
          },
        };
      }
    }

    // Calculate amounts
    const { subtotal, taxAmount, total } = calculateBillAmounts(
      data.lineItems,
      data.taxes || [],
    );

    // Generate duplicate check hash
    const duplicateCheckHash = generateDuplicateCheckHash(
      data.vendorId,
      data.vendorInvoiceNumber,
      total,
    );

    // Generate bill number
    const billNumber = await generateBillNumber();
    if (!billNumber) {
      return {
        success: null,
        error: { reason: "Failed to generate bill number" },
      };
    }

    const result = await db.transaction(async (tx) => {
      // Create bill
      const [bill] = await tx
        .insert(payablesBills)
        .values({
          billNumber,
          vendorInvoiceNumber: data.vendorInvoiceNumber.trim(),
          vendorId: data.vendorId,
          poId: data.poId || null,
          bankAccountId: data.bankAccountId || null,
          billDate: data.billDate,
          dueDate: data.dueDate,
          receivedDate: data.receivedDate,
          status: data.status || "Draft",
          currencyId: data.currencyId,
          subtotal: subtotal.toString(),
          taxAmount: taxAmount.toString(),
          total: total.toString(),
          amountPaid: "0.00",
          amountDue: total.toString(),
          notes: data.notes || null,
          paymentTerms: data.paymentTerms || null,
          isRecurring: data.isRecurring || false,
          recurringFrequency: data.recurringFrequency || null,
          recurringEndDate: data.recurringEndDate || null,
          duplicateCheckHash,
          organizationId: organization.id,
          createdBy: userId,
        })
        .returning();

      // Create line items
      if (data.lineItems && data.lineItems.length > 0) {
        await tx.insert(billLineItems).values(
          data.lineItems.map((item, index) => ({
            billId: bill.id,
            poLineItemId: item.poLineItemId || null,
            description: item.description,
            quantity: item.quantity.toString(),
            poUnitPrice: item.poUnitPrice ? item.poUnitPrice.toString() : null,
            poAmount: item.poAmount ? item.poAmount.toString() : null,
            unitPrice: item.unitPrice.toString(),
            amount: (item.quantity * item.unitPrice).toString(),
            sortOrder: item.sortOrder || index,
            organizationId: organization.id,
          })),
        );
      }

      // Create taxes if provided
      if (data.taxes && data.taxes.length > 0) {
        await tx.insert(billTaxes).values(
          data.taxes.map((tax) => ({
            billId: bill.id,
            taxType: tax.taxType,
            taxName: tax.taxName,
            taxPercentage: tax.taxPercentage.toString(),
            taxAmount: tax.taxAmount
              ? tax.taxAmount.toString()
              : ((subtotal * tax.taxPercentage) / 100).toString(),
            isWithholdingTax: tax.isWithholdingTax || false,
            whtCertificateNumber: tax.whtCertificateNumber || null,
            organizationId: organization.id,
          })),
        );
      }

      // Log activity
      await tx.insert(billActivityLog).values({
        billId: bill.id,
        activityType: "Bill Created",
        description: `Bill ${billNumber} created for ${vendor.name}`,
        performedBy: userId,
        metadata: {
          vendorInvoiceNumber: data.vendorInvoiceNumber,
          amount: total,
          dueDate: data.dueDate,
        },
        organizationId: organization.id,
      });

      return bill;
    });

    // If linked to PO, update PO billed amount
    if (data.poId) {
      await updatePOBilledAmount(data.poId);
    }

    // Automatic GL posting when bill is created (Dr Expense, Cr AP). Same as invoice: auto-post when record is created.
    try {
      await ensureDefaultGLAccounts(organization.id);
      const apAccount = await db.query.glAccounts.findFirst({
        where: and(
          eq(glAccounts.organizationId, organization.id),
          eq(glAccounts.code, "2000"),
        ),
      });
      const expenseAccount = await db.query.glAccounts.findFirst({
        where: and(
          eq(glAccounts.organizationId, organization.id),
          eq(glAccounts.code, "6000"),
        ),
      });
      if (apAccount && expenseAccount) {
        const glResult = await createJournal({
          organizationId: organization.id,
          transactionDate: new Date(),
          postingDate: new Date(),
          description: `Bill: ${result.billNumber}`,
          reference: result.billNumber,
          source: "Payables",
          sourceId: String(result.id),
          status: "Posted",
          lines: [
            {
              accountId: expenseAccount.id,
              description: `Bill Expense - ${result.vendorInvoiceNumber}`,
              debit: Number(result.total),
              credit: 0,
            },
            {
              accountId: apAccount.id,
              description: `Accounts Payable - ${vendor.name}`,
              debit: 0,
              credit: Number(result.total),
            },
          ],
        });
        if (!glResult.success) {
          console.error("Failed to post bill to GL on create:", glResult.error);
        }
        revalidatePath("/finance/gl/journals");
        revalidatePath("/finance/gl/reports");
        revalidatePath("/finance/gl/accounts");
      }
    } catch (glError) {
      console.error("Failed to post bill to GL on create:", glError);
    }

    revalidatePath("/payables/bills");
    if (data.poId) {
      revalidatePath(`/payables/purchase-orders/${data.poId}`);
    }
    revalidatePath(`/payables/vendors/${data.vendorId}`);

    return {
      success: { data: result },
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

    // Check if bill exists
    const [existing] = await db
      .select()
      .from(payablesBills)
      .where(
        and(
          eq(payablesBills.id, id),
          eq(payablesBills.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!existing) {
      return {
        success: null,
        error: { reason: "Bill not found" },
      };
    }

    // Only allow editing drafts
    if (existing.status !== "Draft") {
      return {
        success: null,
        error: { reason: "Only draft bills can be edited" },
      };
    }

    const result = await db.transaction(async (tx) => {
      // Build update data
      const updateData: Partial<typeof payablesBills.$inferInsert> = {
        updatedBy: userId,
      };

      // If line items or taxes are being updated, recalculate amounts
      if (data.lineItems || data.taxes) {
        const lineItems = data.lineItems || [];
        const taxes = data.taxes || [];

        const { subtotal, taxAmount, total } = calculateBillAmounts(
          lineItems,
          taxes,
        );

        updateData.subtotal = subtotal.toString();
        updateData.taxAmount = taxAmount.toString();
        updateData.total = total.toString();
        updateData.amountDue = total.toString();

        // Update duplicate check hash if amount changed
        if (data.vendorInvoiceNumber || data.vendorId) {
          updateData.duplicateCheckHash = generateDuplicateCheckHash(
            data.vendorId || existing.vendorId,
            data.vendorInvoiceNumber || existing.vendorInvoiceNumber,
            total,
          );
        }

        // Delete existing line items and taxes
        await tx.delete(billLineItems).where(eq(billLineItems.billId, id));
        await tx.delete(billTaxes).where(eq(billTaxes.billId, id));

        // Insert new line items
        if (lineItems.length > 0) {
          await tx.insert(billLineItems).values(
            lineItems.map((item, index) => ({
              billId: id,
              poLineItemId: item.poLineItemId || null,
              description: item.description,
              quantity: item.quantity.toString(),
              poUnitPrice: item.poUnitPrice
                ? item.poUnitPrice.toString()
                : null,
              poAmount: item.poAmount ? item.poAmount.toString() : null,
              unitPrice: item.unitPrice.toString(),
              amount: (item.quantity * item.unitPrice).toString(),
              sortOrder: item.sortOrder || index,
              organizationId: organization.id,
            })),
          );
        }

        // Insert new taxes
        if (taxes.length > 0) {
          await tx.insert(billTaxes).values(
            taxes.map((tax) => ({
              billId: id,
              taxType: tax.taxType,
              taxName: tax.taxName,
              taxPercentage: tax.taxPercentage.toString(),
              taxAmount: tax.taxAmount
                ? tax.taxAmount.toString()
                : (
                    (Number.parseFloat(subtotal.toString()) *
                      tax.taxPercentage) /
                    100
                  ).toString(),
              isWithholdingTax: tax.isWithholdingTax || false,
              whtCertificateNumber: tax.whtCertificateNumber || null,
              organizationId: organization.id,
            })),
          );
        }
      }

      // Update basic fields
      if (data.vendorInvoiceNumber !== undefined) {
        updateData.vendorInvoiceNumber = data.vendorInvoiceNumber.trim();
      }
      if (data.billDate !== undefined) updateData.billDate = data.billDate;
      if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
      if (data.receivedDate !== undefined)
        updateData.receivedDate = data.receivedDate;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.paymentTerms !== undefined)
        updateData.paymentTerms = data.paymentTerms;
      if (data.isRecurring !== undefined)
        updateData.isRecurring = data.isRecurring;
      if (data.recurringFrequency !== undefined)
        updateData.recurringFrequency = data.recurringFrequency;
      if (data.recurringEndDate !== undefined)
        updateData.recurringEndDate = data.recurringEndDate;

      const [updated] = await tx
        .update(payablesBills)
        .set(updateData)
        .where(
          and(
            eq(payablesBills.id, id),
            eq(payablesBills.organizationId, organization.id),
          ),
        )
        .returning();

      // Log activity
      await tx.insert(billActivityLog).values({
        billId: id,
        activityType: "Bill Updated",
        description: `Bill ${existing.billNumber} updated`,
        performedBy: userId,
        organizationId: organization.id,
      });

      return updated;
    });

    revalidatePath("/payables/bills");
    revalidatePath(`/payables/bills/${id}`);
    if (existing.poId) {
      revalidatePath(`/payables/purchase-orders/${existing.poId}`);
    }
    revalidatePath(`/payables/vendors/${existing.vendorId}`);

    return {
      success: { data: result },
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
 * Delete a bill (only drafts)
 */
export async function deleteBill(id: number) {
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

    // Get bill to check status
    const [bill] = await db
      .select()
      .from(payablesBills)
      .where(
        and(
          eq(payablesBills.id, id),
          eq(payablesBills.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!bill) {
      return {
        success: null,
        error: { reason: "Bill not found" },
      };
    }

    // Only allow deleting drafts
    if (bill.status !== "Draft") {
      return {
        success: null,
        error: {
          reason: "Only draft bills can be deleted. Cancel this bill instead.",
        },
      };
    }

    await db
      .delete(payablesBills)
      .where(
        and(
          eq(payablesBills.id, id),
          eq(payablesBills.organizationId, organization.id),
        ),
      );

    // If linked to PO, update PO billed amount
    if (bill.poId) {
      await updatePOBilledAmount(bill.poId);
    }

    revalidatePath("/payables/bills");
    if (bill.poId) {
      revalidatePath(`/payables/purchase-orders/${bill.poId}`);
    }
    revalidatePath(`/payables/vendors/${bill.vendorId}`);

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
 * Get a single bill with all relations
 */
export async function getBill(id: number) {
  try {
    await requirePayablesViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return null;
    }

    // Get bill with relations
    const bill = await db.query.payablesBills.findFirst({
      where: and(
        eq(payablesBills.id, id),
        eq(payablesBills.organizationId, organization.id),
      ),
      with: {
        vendor: true,
        currency: true,
        lineItems: {
          orderBy: (items, { asc }) => [asc(items.sortOrder)],
        },
        taxes: true,
        payments: {
          orderBy: (payments, { desc }) => [desc(payments.createdAt)],
        },
        documents: {
          orderBy: (docs, { desc }) => [desc(docs.createdAt)],
        },
        activityLog: {
          orderBy: (log, { desc }) => [desc(log.createdAt)],
        },
      },
    });

    if (!bill) {
      return null;
    }

    // If linked to PO, get PO details
    let purchaseOrder = null;
    if (bill.poId) {
      purchaseOrder = await db.query.purchaseOrders.findFirst({
        where: eq(purchaseOrders.id, bill.poId),
        with: {
          lineItems: true,
        },
      });
    }

    return {
      ...bill,
      purchaseOrder,
    };
  } catch (error) {
    console.error("Error fetching bill:", error);
    return null;
  }
}

/**
 * Get all bills with optional filters
 */
export async function getAllBills(filters?: {
  search?: string;
  status?: BillStatus;
  vendorId?: number;
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

    const conditions = [eq(payablesBills.organizationId, organization.id)];

    if (filters?.search) {
      conditions.push(
        // biome-ignore lint/style/noNonNullAssertion: safe
        or(
          ilike(payablesBills.billNumber, `%${filters.search}%`),
          ilike(payablesBills.vendorInvoiceNumber, `%${filters.search}%`),
        )!,
      );
    }

    if (filters?.status) {
      conditions.push(eq(payablesBills.status, filters.status));
    }

    if (filters?.vendorId) {
      conditions.push(eq(payablesBills.vendorId, filters.vendorId));
    }

    if (filters?.startDate) {
      conditions.push(gte(payablesBills.billDate, filters.startDate));
    }

    if (filters?.endDate) {
      conditions.push(lte(payablesBills.billDate, filters.endDate));
    }

    const bills = await db
      .select({
        id: payablesBills.id,
        billNumber: payablesBills.billNumber,
        vendorInvoiceNumber: payablesBills.vendorInvoiceNumber,
        vendorId: payablesBills.vendorId,
        vendorName: vendors.name,
        billDate: payablesBills.billDate,
        dueDate: payablesBills.dueDate,
        status: payablesBills.status,
        total: payablesBills.total,
        amountPaid: payablesBills.amountPaid,
        amountDue: payablesBills.amountDue,
        poId: payablesBills.poId,
        poNumber: purchaseOrders.poNumber,
        createdAt: payablesBills.createdAt,
      })
      .from(payablesBills)
      .leftJoin(vendors, eq(payablesBills.vendorId, vendors.id))
      .leftJoin(purchaseOrders, eq(payablesBills.poId, purchaseOrders.id))
      .where(and(...conditions))
      .orderBy(desc(payablesBills.createdAt));

    return bills;
  } catch (error) {
    console.error("Error fetching bills:", error);
    return [];
  }
}

/**
 * Update bill status
 */
export async function updateBillStatus(
  id: number,
  newStatus: BillStatus,
  reason?: string,
) {
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

    const [bill] = await db
      .select()
      .from(payablesBills)
      .where(
        and(
          eq(payablesBills.id, id),
          eq(payablesBills.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!bill) {
      return {
        success: null,
        error: { reason: "Bill not found" },
      };
    }

    await db.transaction(async (tx) => {
      // Update status
      const updateData: Partial<typeof payablesBills.$inferInsert> = {
        status: newStatus,
        updatedBy: userId,
      };

      if (newStatus === "Cancelled") {
        updateData.cancelledAt = new Date();
      } else if (newStatus === "Approved") {
        updateData.approvedAt = new Date();
      } else if (newStatus === "Paid") {
        updateData.paidAt = new Date();
      }

      await tx
        .update(payablesBills)
        .set(updateData)
        .where(
          and(
            eq(payablesBills.id, id),
            eq(payablesBills.organizationId, organization.id),
          ),
        );

      // Log activity
      await tx.insert(billActivityLog).values({
        billId: id,
        activityType: "Status Changed",
        description: `Status changed from ${bill.status} to ${newStatus}${reason ? `: ${reason}` : ""}`,
        performedBy: userId,
        metadata: {
          oldStatus: bill.status,
          newStatus,
          reason,
        },
        organizationId: organization.id,
      });
    });

    // Post to GL when status is set to Approved (Dr Expense, Cr AP) - same as approveBill
    if (newStatus === "Approved" && bill.status !== "Approved") {
      try {
        const existingJournal = await db.query.glJournals.findFirst({
          where: and(
            eq(glJournals.organizationId, organization.id),
            eq(glJournals.source, "Payables"),
            eq(glJournals.sourceId, String(id)),
          ),
          columns: { id: true },
        });
        if (!existingJournal) {
          await ensureDefaultGLAccounts(organization.id);
          const apAccount = await db.query.glAccounts.findFirst({
            where: and(
              eq(glAccounts.organizationId, organization.id),
              eq(glAccounts.code, "2000"),
            ),
          });
          const expenseAccount = await db.query.glAccounts.findFirst({
            where: and(
              eq(glAccounts.organizationId, organization.id),
              eq(glAccounts.code, "6000"),
            ),
          });
          const [vendorRow] = await db
            .select({ name: vendors.name })
            .from(vendors)
            .where(
              and(
                eq(vendors.id, bill.vendorId),
                eq(vendors.organizationId, organization.id),
              ),
            )
            .limit(1);
          const vendorName = vendorRow?.name ?? "Vendor";
          if (apAccount && expenseAccount) {
            const glResult = await createJournal({
              organizationId: organization.id,
              transactionDate: new Date(),
              postingDate: new Date(),
              description: `Bill Approval: ${bill.billNumber}`,
              reference: bill.billNumber,
              source: "Payables",
              sourceId: String(id),
              status: "Posted",
              lines: [
                {
                  accountId: expenseAccount.id,
                  description: `Bill Expense - ${bill.vendorInvoiceNumber}`,
                  debit: Number(bill.total),
                  credit: 0,
                },
                {
                  accountId: apAccount.id,
                  description: `Accounts Payable - ${vendorName}`,
                  debit: 0,
                  credit: Number(bill.total),
                },
              ],
            });
            if (!glResult.success) {
              console.error(
                "Failed to post bill approval to GL:",
                glResult.error,
              );
            }
          }
          revalidatePath("/finance/gl/journals");
          revalidatePath("/finance/gl/reports");
          revalidatePath("/finance/gl/accounts");
        }
      } catch (glError) {
        console.error("Failed to post bill approval to GL:", glError);
      }
    }

    revalidatePath("/payables/bills");
    revalidatePath(`/payables/bills/${id}`);
    revalidatePath(`/payables/vendors/${bill.vendorId}`);

    return {
      success: { reason: "Bill status updated successfully" },
      error: null,
    };
  } catch (error) {
    console.error("Error updating bill status:", error);
    return {
      success: null,
      error: { reason: "Failed to update bill status" },
    };
  }
}

/**
 * Approve a bill
 */
export async function approveBill(id: number) {
  try {
    const { userId } = await requirePayablesApprovalAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    const [bill] = await db
      .select()
      .from(payablesBills)
      .where(
        and(
          eq(payablesBills.id, id),
          eq(payablesBills.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!bill) {
      return {
        success: null,
        error: { reason: "Bill not found" },
      };
    }

    if (bill.status !== "Pending" && bill.status !== "Draft") {
      return {
        success: null,
        error: {
          reason: "Only pending or draft bills can be approved",
        },
      };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(payablesBills)
        .set({
          status: "Approved",
          approvedAt: new Date(),
          updatedBy: userId,
        })
        .where(
          and(
            eq(payablesBills.id, id),
            eq(payablesBills.organizationId, organization.id),
          ),
        );

      // Log activity
      await tx.insert(billActivityLog).values({
        billId: id,
        activityType: "Bill Approved",
        description: `Bill ${bill.billNumber} approved`,
        performedBy: userId,
        organizationId: organization.id,
      });
    });

    // ---------------------------------------------------------
    // POST TO GENERAL LEDGER (skip if already posted on create)
    // ---------------------------------------------------------
    try {
      const existingJournal = await db.query.glJournals.findFirst({
        where: and(
          eq(glJournals.organizationId, organization.id),
          eq(glJournals.source, "Payables"),
          eq(glJournals.sourceId, String(id)),
        ),
        columns: { id: true },
      });
      if (!existingJournal) {
        await ensureDefaultGLAccounts(organization.id);
        const apAccount = await db.query.glAccounts.findFirst({
          where: and(
            eq(glAccounts.organizationId, organization.id),
            eq(glAccounts.code, "2000"),
          ),
        });

        const expenseAccount = await db.query.glAccounts.findFirst({
          where: and(
            eq(glAccounts.organizationId, organization.id),
            eq(glAccounts.code, "6000"),
          ),
        });

        if (apAccount && expenseAccount) {
          const [vendorRow] = await db
            .select({ name: vendors.name })
            .from(vendors)
            .where(
              and(
                eq(vendors.id, bill.vendorId),
                eq(vendors.organizationId, organization.id),
              ),
            )
            .limit(1);
          const vendorName = vendorRow?.name ?? "Vendor";
          const glResult = await createJournal({
            organizationId: organization.id,
            transactionDate: new Date(),
            postingDate: new Date(),
            description: `Bill Approval: ${bill.billNumber}`,
            reference: bill.billNumber,
            source: "Payables",
            sourceId: String(bill.id),
            status: "Posted",
            lines: [
              {
                accountId: expenseAccount.id,
                description: `Bill Expense - ${bill.vendorInvoiceNumber}`,
                debit: Number(bill.total),
                credit: 0,
              },
              {
                accountId: apAccount.id,
                description: `Accounts Payable - ${vendorName}`,
                debit: 0,
                credit: Number(bill.total),
              },
            ],
          });
          if (!glResult.success) {
            console.error(
              "Failed to post bill approval to GL:",
              glResult.error,
            );
          }
        }
      }
    } catch (glError) {
      console.error("Failed to post bill to GL:", glError);
      // We don't fail the approval if GL post fails, but we should alert/log.
    }

    revalidatePath("/payables/bills");
    revalidatePath(`/payables/bills/${id}`);
    revalidatePath(`/payables/vendors/${bill.vendorId}`);

    return {
      success: { reason: "Bill approved successfully" },
      error: null,
    };
  } catch (error) {
    console.error("Error approving bill:", error);
    return {
      success: null,
      error: { reason: "Failed to approve bill" },
    };
  }
}

/**
 * Check whether a bill has been posted to the General Ledger (bill approval: Dr Expense, Cr AP).
 */
export async function getBillGLPostingStatus(id: number): Promise<{
  posted: boolean;
  postedAt?: string;
  journalNumber?: string;
} | null> {
  try {
    await requirePayablesViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) return null;

    const journal = await db.query.glJournals.findFirst({
      where: and(
        eq(glJournals.organizationId, organization.id),
        eq(glJournals.source, "Payables"),
        eq(glJournals.sourceId, String(id)),
      ),
      columns: {
        postingDate: true,
        journalNumber: true,
      },
    });

    if (!journal) {
      return { posted: false };
    }
    return {
      posted: true,
      postedAt: journal.postingDate ?? undefined,
      journalNumber: journal.journalNumber ?? undefined,
    };
  } catch (error) {
    console.error("Error fetching bill GL posting status:", error);
    return null;
  }
}

/**
 * Post bill approval to General Ledger (Dr Expense, Cr AP). Manual option for backfill.
 * Automatic posting happens when the bill is approved (approveBill / updateBillStatus / createBill with Approved).
 */
export async function postBillToGL(id: number): Promise<{
  success: boolean;
  error?: string;
  alreadyPosted?: boolean;
}> {
  try {
    await requirePayablesWriteAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return { success: false, error: "Organization not found" };
    }

    const [bill] = await db
      .select()
      .from(payablesBills)
      .where(
        and(
          eq(payablesBills.id, id),
          eq(payablesBills.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!bill) {
      return { success: false, error: "Bill not found" };
    }
    if (
      bill.status === "Draft" ||
      bill.status === "Cancelled" ||
      bill.status === "Pending"
    ) {
      return {
        success: false,
        error:
          "Only approved, partially paid, or paid bills can be posted to the GL.",
      };
    }

    const existing = await db.query.glJournals.findFirst({
      where: and(
        eq(glJournals.organizationId, organization.id),
        eq(glJournals.source, "Payables"),
        eq(glJournals.sourceId, String(id)),
      ),
      columns: { id: true },
    });
    if (existing) {
      return { success: true, alreadyPosted: true };
    }

    await ensureDefaultGLAccounts(organization.id);
    const apAccount = await db.query.glAccounts.findFirst({
      where: and(
        eq(glAccounts.organizationId, organization.id),
        eq(glAccounts.code, "2000"),
      ),
    });
    const expenseAccount = await db.query.glAccounts.findFirst({
      where: and(
        eq(glAccounts.organizationId, organization.id),
        eq(glAccounts.code, "6000"),
      ),
    });
    if (!apAccount || !expenseAccount) {
      return { success: false, error: "GL accounts 2000 or 6000 not found." };
    }

    const [vendorRow] = await db
      .select({ name: vendors.name })
      .from(vendors)
      .where(
        and(
          eq(vendors.id, bill.vendorId),
          eq(vendors.organizationId, organization.id),
        ),
      )
      .limit(1);
    const vendorName = vendorRow?.name ?? "Vendor";

    const glResult = await createJournal({
      organizationId: organization.id,
      transactionDate: new Date(),
      postingDate: new Date(),
      description: `Bill Approval: ${bill.billNumber}`,
      reference: bill.billNumber,
      source: "Payables",
      sourceId: String(id),
      status: "Posted",
      lines: [
        {
          accountId: expenseAccount.id,
          description: `Bill Expense - ${bill.vendorInvoiceNumber}`,
          debit: Number(bill.total),
          credit: 0,
        },
        {
          accountId: apAccount.id,
          description: `Accounts Payable - ${vendorName}`,
          debit: 0,
          credit: Number(bill.total),
        },
      ],
    });

    if (!glResult.success) {
      return { success: false, error: glResult.error };
    }

    revalidatePath("/payables/bills");
    revalidatePath(`/payables/bills/${id}`);
    revalidatePath("/finance/gl/journals");
    revalidatePath("/finance/gl/reports");
    revalidatePath("/finance/gl/accounts");

    return { success: true };
  } catch (error) {
    console.error("Error posting bill to GL:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to post to GL",
    };
  }
}

/**
 * Match bill to PO for 3-way matching
 * This links bill line items to PO line items
 */
export async function matchBillToPO(billId: number, poId: number) {
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

    // Get PO with line items
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
      return {
        success: null,
        error: { reason: "Purchase order not found" },
      };
    }

    // Get bill with line items
    const bill = await db.query.payablesBills.findFirst({
      where: and(
        eq(payablesBills.id, billId),
        eq(payablesBills.organizationId, organization.id),
      ),
      with: {
        lineItems: true,
      },
    });

    if (!bill) {
      return {
        success: null,
        error: { reason: "Bill not found" },
      };
    }

    await db.transaction(async (tx) => {
      // Update bill with PO reference
      await tx
        .update(payablesBills)
        .set({ poId, updatedBy: userId })
        .where(eq(payablesBills.id, billId));

      // Try to auto-match line items by description similarity
      for (const billLineItem of bill.lineItems) {
        // Find matching PO item by description
        const matchingPOItem = po.lineItems.find((poItem) => {
          const similarity = calculateStringSimilarity(
            billLineItem.description.toLowerCase(),
            poItem.description.toLowerCase(),
          );
          return similarity > 0.8; // 80% similarity threshold
        });

        if (matchingPOItem) {
          // Update bill line item with PO line item reference
          await tx
            .update(billLineItems)
            .set({ poLineItemId: matchingPOItem.id })
            .where(eq(billLineItems.id, billLineItem.id));

          // Update PO line item billed quantity
          await tx
            .update(poLineItems)
            .set({
              billedQuantity: sql`${poLineItems.billedQuantity} + ${billLineItem.quantity}`,
            })
            .where(eq(poLineItems.id, matchingPOItem.id));
        }
      }

      // Log activity
      await tx.insert(billActivityLog).values({
        billId,
        activityType: "PO Matched",
        description: `Bill matched to PO ${po.poNumber}`,
        performedBy: userId,
        metadata: {
          poId,
          poNumber: po.poNumber,
        },
        organizationId: organization.id,
      });
    });

    // Update PO billed amount
    await updatePOBilledAmount(poId);

    revalidatePath("/payables/bills");
    revalidatePath(`/payables/bills/${billId}`);
    revalidatePath(`/payables/purchase-orders/${poId}`);

    return {
      success: { reason: "Bill matched to PO successfully" },
      error: null,
    };
  } catch (error) {
    console.error("Error matching bill to PO:", error);
    return {
      success: null,
      error: { reason: "Failed to match bill to PO" },
    };
  }
}

/**
 * Send bill received confirmation email
 * (Email implementation will be added later)
 */
export async function sendBillReceivedConfirmation(billId: number) {
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

    const bill = await getBill(billId);

    if (!bill) {
      return {
        success: null,
        error: { reason: "Bill not found" },
      };
    }

    await sendBillReceivedConfirmationEmailUtil({
      to: bill.vendor.email,
      vendorName: bill.vendor.name,
      billDetails: {
        billNumber: bill.billNumber,
        vendorInvoiceNumber: bill.vendorInvoiceNumber,
        amount: bill.total,
        dueDate: bill.dueDate,
      },
      organizationName: organization.name,
    });

    await db.transaction(async (tx) => {
      await tx
        .update(payablesBills)
        .set({
          confirmationEmailSentAt: new Date(),
        })
        .where(eq(payablesBills.id, billId));

      // Log activity
      await tx.insert(billActivityLog).values({
        billId,
        activityType: "Email Sent",
        description: "Bill received confirmation email sent to vendor",
        performedBy: userId,
        organizationId: organization.id,
      });
    });

    revalidatePath(`/payables/bills/${billId}`);

    return {
      success: { reason: "Confirmation email sent successfully" },
      error: null,
    };
  } catch (error) {
    console.error("Error sending bill confirmation:", error);
    return {
      success: null,
      error: { reason: "Failed to send confirmation email" },
    };
  }
}
