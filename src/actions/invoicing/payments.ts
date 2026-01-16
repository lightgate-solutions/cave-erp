/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

"use server";

import { db } from "@/db";
import {
  receivablesInvoices,
  invoicePayments,
  invoiceActivityLog,
  organizationCurrencies,
  clients,
} from "@/db/schema";
import {
  requireInvoicingViewAccess,
  requireInvoicingWriteAccess,
} from "../auth/dal-invoicing";
import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export interface RecordPaymentInput {
  amount: number;
  paymentDate: string;
  paymentMethod:
    | "Cash"
    | "Bank Transfer"
    | "Check"
    | "Credit Card"
    | "Debit Card"
    | "Mobile Money"
    | "Other";
  referenceNumber?: string;
  notes?: string;
}

export interface UpdatePaymentInput {
  amount?: number;
  paymentDate?: string;
  paymentMethod?:
    | "Cash"
    | "Bank Transfer"
    | "Check"
    | "Credit Card"
    | "Debit Card"
    | "Mobile Money"
    | "Other";
  referenceNumber?: string;
  notes?: string;
}

/**
 * Record a payment for an invoice
 * Updates invoice amounts and status in a transaction
 */
export async function recordPayment(
  invoiceId: number,
  data: RecordPaymentInput,
) {
  try {
    const { employee } = await requireInvoicingWriteAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    // Execute in transaction to ensure data consistency
    const result = await db.transaction(async (tx) => {
      // 1. Get current invoice with currency
      const [invoice] = await tx
        .select({
          invoice: receivablesInvoices,
          currency: organizationCurrencies,
          client: clients,
        })
        .from(receivablesInvoices)
        .leftJoin(
          organizationCurrencies,
          eq(receivablesInvoices.currencyId, organizationCurrencies.id),
        )
        .leftJoin(clients, eq(receivablesInvoices.clientId, clients.id))
        .where(
          and(
            eq(receivablesInvoices.id, invoiceId),
            eq(receivablesInvoices.organizationId, organization.id),
          ),
        )
        .limit(1);

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      // Validate payment amount
      const currentAmountDue = Number.parseFloat(
        invoice.invoice.amountDue.toString(),
      );
      if (data.amount <= 0) {
        throw new Error("Payment amount must be greater than zero");
      }
      if (data.amount > currentAmountDue) {
        throw new Error(
          `Payment amount (${data.amount}) cannot exceed amount due (${currentAmountDue})`,
        );
      }

      // 2. Insert payment record
      const [payment] = await tx
        .insert(invoicePayments)
        .values({
          invoiceId,
          amount: data.amount.toFixed(2),
          paymentDate: data.paymentDate,
          paymentMethod: data.paymentMethod,
          referenceNumber: data.referenceNumber || null,
          notes: data.notes || null,
          recordedBy: employee.userId,
          organizationId: organization.id,
        })
        .returning();

      // 3. Calculate new amounts
      const currentAmountPaid = Number.parseFloat(
        invoice.invoice.amountPaid.toString(),
      );
      const newAmountPaid = currentAmountPaid + data.amount;
      const total = Number.parseFloat(invoice.invoice.total.toString());
      const newAmountDue = total - newAmountPaid;

      // 4. Determine new status
      let newStatus = invoice.invoice.status;
      let paidAt = invoice.invoice.paidAt;

      if (newAmountDue <= 0.01) {
        // Allow for small rounding differences
        newStatus = "Paid";
        paidAt = new Date();
      } else if (newAmountPaid > 0) {
        newStatus = "Partially Paid";
      }

      // 5. Update invoice
      await tx
        .update(receivablesInvoices)
        .set({
          amountPaid: newAmountPaid.toFixed(2),
          amountDue: Math.max(0, newAmountDue).toFixed(2), // Ensure not negative
          status: newStatus,
          paidAt,
          updatedBy: employee.userId,
        })
        .where(eq(receivablesInvoices.id, invoiceId));

      // 6. Log activity
      await tx.insert(invoiceActivityLog).values({
        invoiceId,
        activityType: "Payment Recorded",
        description: `Payment of ${invoice.currency?.currencySymbol || ""}${data.amount.toFixed(2)} recorded via ${data.paymentMethod}`,
        performedBy: employee.userId,
        metadata: {
          paymentId: payment.id,
          amount: data.amount,
          method: data.paymentMethod,
          referenceNumber: data.referenceNumber,
          newAmountPaid,
          newAmountDue: Math.max(0, newAmountDue),
          oldStatus: invoice.invoice.status,
          newStatus,
        },
        organizationId: organization.id,
      });

      // Log status change if status changed
      if (newStatus !== invoice.invoice.status) {
        await tx.insert(invoiceActivityLog).values({
          invoiceId,
          activityType: "Status Changed",
          description: `Invoice status changed from ${invoice.invoice.status} to ${newStatus}`,
          performedBy: employee.userId,
          metadata: {
            oldStatus: invoice.invoice.status,
            newStatus,
            reason: "Payment recorded",
          },
          organizationId: organization.id,
        });
      }

      return payment;
    });

    revalidatePath("/invoicing/invoices");
    revalidatePath(`/invoicing/invoices/${invoiceId}`);
    revalidatePath("/invoicing/payments");

    return {
      success: { data: result },
      error: null,
    };
  } catch (error) {
    console.error("Error recording payment:", error);
    return {
      success: null,
      error: {
        reason:
          error instanceof Error ? error.message : "Failed to record payment",
      },
    };
  }
}

/**
 * Update an existing payment
 * Recalculates invoice amounts based on all payments
 */
export async function updatePayment(id: number, data: UpdatePaymentInput) {
  try {
    const { employee } = await requireInvoicingWriteAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    const result = await db.transaction(async (tx) => {
      // Get existing payment
      const [existing] = await tx
        .select()
        .from(invoicePayments)
        .where(
          and(
            eq(invoicePayments.id, id),
            eq(invoicePayments.organizationId, organization.id),
          ),
        )
        .limit(1);

      if (!existing) {
        throw new Error("Payment not found");
      }

      const invoiceId = existing.invoiceId;

      // Get invoice
      const [invoice] = await tx
        .select()
        .from(receivablesInvoices)
        .where(
          and(
            eq(receivablesInvoices.id, invoiceId),
            eq(receivablesInvoices.organizationId, organization.id),
          ),
        )
        .limit(1);

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      // Update payment
      const [updated] = await tx
        .update(invoicePayments)
        .set({
          ...data,
          amount:
            data.amount !== undefined ? data.amount.toFixed(2) : undefined,
        })
        .where(eq(invoicePayments.id, id))
        .returning();

      // Recalculate invoice amounts based on all payments
      const [paymentsSum] = await tx
        .select({
          totalPaid: sql<string>`COALESCE(SUM(${invoicePayments.amount}), 0)`,
        })
        .from(invoicePayments)
        .where(eq(invoicePayments.invoiceId, invoiceId));

      const newAmountPaid = Number.parseFloat(paymentsSum.totalPaid);
      const total = Number.parseFloat(invoice.total.toString());
      const newAmountDue = total - newAmountPaid;

      // Determine new status
      let newStatus = invoice.status;
      let paidAt = invoice.paidAt;

      if (newAmountDue <= 0.01) {
        newStatus = "Paid";
        paidAt = paidAt || new Date();
      } else if (newAmountPaid > 0) {
        newStatus = "Partially Paid";
        paidAt = null;
      } else if (
        invoice.status === "Paid" ||
        invoice.status === "Partially Paid"
      ) {
        // If no payments, revert to Sent or Overdue based on due date
        const dueDate = new Date(invoice.dueDate);
        const today = new Date();
        newStatus = today > dueDate ? "Overdue" : "Sent";
        paidAt = null;
      }

      // Update invoice
      await tx
        .update(receivablesInvoices)
        .set({
          amountPaid: newAmountPaid.toFixed(2),
          amountDue: Math.max(0, newAmountDue).toFixed(2),
          status: newStatus,
          paidAt,
          updatedBy: employee.userId,
        })
        .where(eq(receivablesInvoices.id, invoiceId));

      // Log activity
      await tx.insert(invoiceActivityLog).values({
        invoiceId,
        activityType: "Payment Recorded",
        description: `Payment #${id} updated`,
        performedBy: employee.userId,
        metadata: {
          paymentId: id,
          changes: data,
          oldAmount: existing.amount,
          newAmount: data.amount || existing.amount,
        },
        organizationId: organization.id,
      });

      return { payment: updated, invoiceId };
    });

    revalidatePath("/invoicing/invoices");
    revalidatePath(`/invoicing/invoices/${result.invoiceId}`);
    revalidatePath("/invoicing/payments");

    return {
      success: { data: result.payment },
      error: null,
    };
  } catch (error) {
    console.error("Error updating payment:", error);
    return {
      success: null,
      error: {
        reason:
          error instanceof Error ? error.message : "Failed to update payment",
      },
    };
  }
}

/**
 * Delete a payment
 * Recalculates invoice amounts and status
 */
export async function deletePayment(id: number) {
  try {
    const { employee } = await requireInvoicingWriteAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    const result = await db.transaction(async (tx) => {
      // Get payment
      const [payment] = await tx
        .select()
        .from(invoicePayments)
        .where(
          and(
            eq(invoicePayments.id, id),
            eq(invoicePayments.organizationId, organization.id),
          ),
        )
        .limit(1);

      if (!payment) {
        throw new Error("Payment not found");
      }

      const invoiceId = payment.invoiceId;

      // Get invoice
      const [invoice] = await tx
        .select()
        .from(receivablesInvoices)
        .where(
          and(
            eq(receivablesInvoices.id, invoiceId),
            eq(receivablesInvoices.organizationId, organization.id),
          ),
        )
        .limit(1);

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      // Delete payment
      await tx.delete(invoicePayments).where(eq(invoicePayments.id, id));

      // Recalculate invoice amounts based on remaining payments
      const [paymentsSum] = await tx
        .select({
          totalPaid: sql<string>`COALESCE(SUM(${invoicePayments.amount}), 0)`,
        })
        .from(invoicePayments)
        .where(eq(invoicePayments.invoiceId, invoiceId));

      const newAmountPaid = Number.parseFloat(paymentsSum.totalPaid);
      const total = Number.parseFloat(invoice.total.toString());
      const newAmountDue = total - newAmountPaid;

      // Determine new status
      let newStatus = invoice.status;
      let paidAt = invoice.paidAt;

      if (newAmountDue <= 0.01) {
        newStatus = "Paid";
      } else if (newAmountPaid > 0) {
        newStatus = "Partially Paid";
        paidAt = null;
      } else {
        // No payments remaining, check if overdue
        const dueDate = new Date(invoice.dueDate);
        const today = new Date();
        newStatus = today > dueDate ? "Overdue" : "Sent";
        paidAt = null;
      }

      // Update invoice
      await tx
        .update(receivablesInvoices)
        .set({
          amountPaid: newAmountPaid.toFixed(2),
          amountDue: Math.max(0, newAmountDue).toFixed(2),
          status: newStatus,
          paidAt,
          updatedBy: employee.userId,
        })
        .where(eq(receivablesInvoices.id, invoiceId));

      // Log activity
      await tx.insert(invoiceActivityLog).values({
        invoiceId,
        activityType: "Payment Deleted",
        description: `Payment of ${payment.amount} deleted`,
        performedBy: employee.userId,
        metadata: {
          paymentId: id,
          deletedPayment: {
            amount: payment.amount,
            method: payment.paymentMethod,
            date: payment.paymentDate,
          },
        },
        organizationId: organization.id,
      });

      return { invoiceId };
    });

    revalidatePath("/invoicing/invoices");
    revalidatePath(`/invoicing/invoices/${result.invoiceId}`);
    revalidatePath("/invoicing/payments");

    return {
      success: { reason: "Payment deleted successfully" },
      error: null,
    };
  } catch (error) {
    console.error("Error deleting payment:", error);
    return {
      success: null,
      error: {
        reason:
          error instanceof Error ? error.message : "Failed to delete payment",
      },
    };
  }
}

/**
 * Get all payments for a specific invoice
 */
export async function getInvoicePayments(invoiceId: number) {
  try {
    await requireInvoicingViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const payments = await db
      .select()
      .from(invoicePayments)
      .where(
        and(
          eq(invoicePayments.invoiceId, invoiceId),
          eq(invoicePayments.organizationId, organization.id),
        ),
      )
      .orderBy(desc(invoicePayments.paymentDate));

    return payments;
  } catch (error) {
    console.error("Error fetching invoice payments:", error);
    return [];
  }
}

/**
 * Get all payments with optional filters
 */
export async function getAllPayments(filters?: {
  startDate?: string;
  endDate?: string;
  paymentMethod?: string;
  clientId?: number;
  invoiceId?: number;
}) {
  try {
    await requireInvoicingViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const conditions = [eq(invoicePayments.organizationId, organization.id)];

    if (filters?.startDate) {
      conditions.push(gte(invoicePayments.paymentDate, filters.startDate));
    }

    if (filters?.endDate) {
      conditions.push(lte(invoicePayments.paymentDate, filters.endDate));
    }

    if (filters?.paymentMethod) {
      conditions.push(
        eq(invoicePayments.paymentMethod, filters.paymentMethod as any),
      );
    }

    if (filters?.invoiceId) {
      conditions.push(eq(invoicePayments.invoiceId, filters.invoiceId));
    }

    // Build query with joins to get invoice and client info
    const payments = await db
      .select({
        payment: invoicePayments,
        invoice: {
          id: receivablesInvoices.id,
          invoiceNumber: receivablesInvoices.invoiceNumber,
          clientId: receivablesInvoices.clientId,
          total: receivablesInvoices.total,
          status: receivablesInvoices.status,
        },
        client: {
          id: clients.id,
          name: clients.name,
          email: clients.email,
          companyName: clients.companyName,
        },
        currency: {
          currencyCode: organizationCurrencies.currencyCode,
          currencySymbol: organizationCurrencies.currencySymbol,
        },
      })
      .from(invoicePayments)
      .leftJoin(
        receivablesInvoices,
        eq(invoicePayments.invoiceId, receivablesInvoices.id),
      )
      .leftJoin(clients, eq(receivablesInvoices.clientId, clients.id))
      .leftJoin(
        organizationCurrencies,
        eq(receivablesInvoices.currencyId, organizationCurrencies.id),
      )
      .where(and(...conditions))
      .orderBy(desc(invoicePayments.paymentDate));

    // Apply client filter if provided (after join)
    if (filters?.clientId) {
      return payments.filter((p) => p.invoice?.clientId === filters.clientId);
    }

    return payments;
  } catch (error) {
    console.error("Error fetching payments:", error);
    return [];
  }
}

/**
 * Get payment statistics for an invoice
 */
export async function getInvoicePaymentStats(invoiceId: number) {
  try {
    await requireInvoicingViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return null;
    }

    const [stats] = await db
      .select({
        paymentCount: count(),
        totalPaid: sql<string>`COALESCE(SUM(${invoicePayments.amount}), 0)`,
        lastPaymentDate: sql<string>`MAX(${invoicePayments.paymentDate})`,
      })
      .from(invoicePayments)
      .where(
        and(
          eq(invoicePayments.invoiceId, invoiceId),
          eq(invoicePayments.organizationId, organization.id),
        ),
      );

    return {
      paymentCount: stats.paymentCount || 0,
      totalPaid: stats.totalPaid || "0.00",
      lastPaymentDate: stats.lastPaymentDate || null,
    };
  } catch (error) {
    console.error("Error fetching payment stats:", error);
    return null;
  }
}
