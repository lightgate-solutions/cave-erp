"use server";

import { db } from "@/db";
import {
  billPayments,
  payablesBills,
  billActivityLog,
  vendors,
  vendorContacts,
} from "@/db/schema";
import {
  requirePayablesViewAccess,
  requirePayablesWriteAccess,
} from "../auth/dal-payables";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { PaymentMethod } from "@/types/payables";
import { sendPaymentConfirmationEmail as sendPaymentConfirmationEmailUtil } from "@/lib/emails";

export interface RecordPaymentInput {
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
}

export interface UpdatePaymentInput {
  amount?: number;
  paymentDate?: string;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
}

/**
 * Record a payment for a bill
 * @param billId - The bill to record payment for
 * @param data - Payment details
 * @param sendEmail - If true, sends confirmation email to vendor
 */
export async function recordPayment(
  billId: number,
  data: RecordPaymentInput,
  sendEmail = false,
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

    // Get bill
    const [bill] = await db
      .select()
      .from(payablesBills)
      .where(
        and(
          eq(payablesBills.id, billId),
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

    // Validate payment amount
    const currentAmountDue = Number.parseFloat(bill.amountDue);
    if (data.amount <= 0) {
      return {
        success: null,
        error: { reason: "Payment amount must be greater than zero" },
      };
    }

    if (data.amount > currentAmountDue) {
      return {
        success: null,
        error: {
          reason: `Payment amount cannot exceed amount due (${bill.amountDue})`,
        },
      };
    }

    const result = await db.transaction(async (tx) => {
      // Insert payment
      const [payment] = await tx
        .insert(billPayments)
        .values({
          billId,
          amount: data.amount.toString(),
          paymentDate: data.paymentDate,
          paymentMethod: data.paymentMethod,
          referenceNumber: data.referenceNumber || null,
          notes: data.notes || null,
          recordedBy: userId,
          organizationId: organization.id,
        })
        .returning();

      // Update bill amounts and status
      const currentAmountPaid = Number.parseFloat(bill.amountPaid);
      const newAmountPaid = currentAmountPaid + data.amount;
      const newAmountDue = currentAmountDue - data.amount;

      // Determine new status
      let newStatus = bill.status;
      if (newAmountDue <= 0.01) {
        // Fully paid (with small tolerance for rounding)
        newStatus = "Paid";
      } else if (newAmountPaid > 0) {
        // Partially paid
        newStatus = "Partially Paid";
      }

      await tx
        .update(payablesBills)
        .set({
          amountPaid: newAmountPaid.toFixed(2),
          amountDue: newAmountDue.toFixed(2),
          status: newStatus,
          paidAt: newStatus === "Paid" ? new Date() : bill.paidAt,
        })
        .where(eq(payablesBills.id, billId));

      // Log activity
      await tx.insert(billActivityLog).values({
        billId,
        activityType: "Payment Recorded",
        description: `Payment of ${data.amount} recorded via ${data.paymentMethod}`,
        performedBy: userId,
        metadata: {
          paymentId: payment.id,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          referenceNumber: data.referenceNumber,
        },
        organizationId: organization.id,
      });

      return payment;
    });

    // Send email if requested
    if (sendEmail) {
      const emailResult = await sendPaymentConfirmationEmail(result.id);
      if (emailResult.error) {
        // Log email failure but don't fail the payment
        console.error(
          "Failed to send payment confirmation email:",
          emailResult.error,
        );
      }
    }

    revalidatePath("/payables/bills");
    revalidatePath(`/payables/bills/${billId}`);
    revalidatePath("/payables/payments");
    revalidatePath(`/payables/vendors/${bill.vendorId}`);

    return {
      success: { data: result },
      error: null,
    };
  } catch (error) {
    console.error("Error recording payment:", error);
    return {
      success: null,
      error: { reason: "Failed to record payment" },
    };
  }
}

/**
 * Update a payment
 */
export async function updatePayment(id: number, data: UpdatePaymentInput) {
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

    // Get existing payment
    const [existing] = await db
      .select()
      .from(billPayments)
      .where(
        and(
          eq(billPayments.id, id),
          eq(billPayments.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!existing) {
      return {
        success: null,
        error: { reason: "Payment not found" },
      };
    }

    // Get bill
    const [bill] = await db
      .select()
      .from(payablesBills)
      .where(eq(payablesBills.id, existing.billId))
      .limit(1);

    if (!bill) {
      return {
        success: null,
        error: { reason: "Bill not found" },
      };
    }

    const result = await db.transaction(async (tx) => {
      // If amount is being updated, we need to recalculate bill amounts
      if (data.amount !== undefined) {
        const oldAmount = Number.parseFloat(existing.amount);
        const newAmount = data.amount;

        // Validate new amount
        if (newAmount <= 0) {
          throw new Error("Payment amount must be greater than zero");
        }

        // Calculate new bill amounts
        const currentAmountPaid = Number.parseFloat(bill.amountPaid);
        const _currentAmountDue = Number.parseFloat(bill.amountDue);
        const total = Number.parseFloat(bill.total);

        // Reverse old payment and apply new payment
        const adjustedAmountPaid = currentAmountPaid - oldAmount + newAmount;
        const adjustedAmountDue = total - adjustedAmountPaid;

        if (adjustedAmountDue < -0.01) {
          throw new Error("Payment amount cannot exceed total bill amount");
        }

        // Determine new status
        let newStatus = bill.status;
        if (adjustedAmountDue <= 0.01) {
          newStatus = "Paid";
        } else if (adjustedAmountPaid > 0) {
          newStatus = "Partially Paid";
        } else {
          newStatus = "Approved"; // No payments
        }

        // Update bill
        await tx
          .update(payablesBills)
          .set({
            amountPaid: adjustedAmountPaid.toFixed(2),
            amountDue: adjustedAmountDue.toFixed(2),
            status: newStatus,
            paidAt: newStatus === "Paid" ? new Date() : null,
          })
          .where(eq(payablesBills.id, existing.billId));
      }

      // Update payment
      const updateData: Partial<typeof billPayments.$inferInsert> = {};
      if (data.amount !== undefined) updateData.amount = data.amount.toString();
      if (data.paymentDate !== undefined)
        updateData.paymentDate = data.paymentDate;
      if (data.paymentMethod !== undefined)
        updateData.paymentMethod = data.paymentMethod;
      if (data.referenceNumber !== undefined)
        updateData.referenceNumber = data.referenceNumber;
      if (data.notes !== undefined) updateData.notes = data.notes;

      const [updated] = await tx
        .update(billPayments)
        .set(updateData)
        .where(
          and(
            eq(billPayments.id, id),
            eq(billPayments.organizationId, organization.id),
          ),
        )
        .returning();

      // Log activity
      await tx.insert(billActivityLog).values({
        billId: existing.billId,
        activityType: "Payment Recorded",
        description: "Payment updated",
        performedBy: userId,
        metadata: {
          paymentId: id,
          changes: data,
        },
        organizationId: organization.id,
      });

      return updated;
    });

    revalidatePath("/payables/bills");
    revalidatePath(`/payables/bills/${existing.billId}`);
    revalidatePath("/payables/payments");
    revalidatePath(`/payables/vendors/${bill.vendorId}`);

    return {
      success: { data: result },
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
 */
export async function deletePayment(id: number) {
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

    // Get payment
    const [payment] = await db
      .select()
      .from(billPayments)
      .where(
        and(
          eq(billPayments.id, id),
          eq(billPayments.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!payment) {
      return {
        success: null,
        error: { reason: "Payment not found" },
      };
    }

    // Get bill
    const [bill] = await db
      .select()
      .from(payablesBills)
      .where(eq(payablesBills.id, payment.billId))
      .limit(1);

    if (!bill) {
      return {
        success: null,
        error: { reason: "Bill not found" },
      };
    }

    await db.transaction(async (tx) => {
      // Recalculate bill amounts
      const paymentAmount = Number.parseFloat(payment.amount);
      const currentAmountPaid = Number.parseFloat(bill.amountPaid);
      const currentAmountDue = Number.parseFloat(bill.amountDue);

      const newAmountPaid = currentAmountPaid - paymentAmount;
      const newAmountDue = currentAmountDue + paymentAmount;

      // Determine new status
      let newStatus = bill.status;
      if (newAmountPaid <= 0.01) {
        newStatus = "Approved"; // No payments
      } else if (newAmountPaid > 0) {
        newStatus = "Partially Paid";
      }

      // Update bill
      await tx
        .update(payablesBills)
        .set({
          amountPaid: newAmountPaid.toFixed(2),
          amountDue: newAmountDue.toFixed(2),
          status: newStatus,
          paidAt: null, // Reset paid date
        })
        .where(eq(payablesBills.id, payment.billId));

      // Delete payment
      await tx
        .delete(billPayments)
        .where(
          and(
            eq(billPayments.id, id),
            eq(billPayments.organizationId, organization.id),
          ),
        );

      // Log activity
      await tx.insert(billActivityLog).values({
        billId: payment.billId,
        activityType: "Payment Deleted",
        description: `Payment of ${payment.amount} deleted`,
        performedBy: userId,
        metadata: {
          paymentId: id,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
        },
        organizationId: organization.id,
      });
    });

    revalidatePath("/payables/bills");
    revalidatePath(`/payables/bills/${payment.billId}`);
    revalidatePath("/payables/payments");
    revalidatePath(`/payables/vendors/${bill.vendorId}`);

    return {
      success: { reason: "Payment deleted successfully" },
      error: null,
    };
  } catch (error) {
    console.error("Error deleting payment:", error);
    return {
      success: null,
      error: { reason: "Failed to delete payment" },
    };
  }
}

/**
 * Get all payments for a bill
 */
export async function getBillPayments(billId: number) {
  try {
    await requirePayablesViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const payments = await db
      .select()
      .from(billPayments)
      .where(
        and(
          eq(billPayments.billId, billId),
          eq(billPayments.organizationId, organization.id),
        ),
      )
      .orderBy(desc(billPayments.paymentDate));

    return payments;
  } catch (error) {
    console.error("Error fetching bill payments:", error);
    return [];
  }
}

/**
 * Get all payments with optional filters
 */
export async function getAllPayments(filters?: {
  startDate?: string;
  endDate?: string;
  paymentMethod?: PaymentMethod;
  vendorId?: number;
}) {
  try {
    await requirePayablesViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const conditions = [eq(billPayments.organizationId, organization.id)];

    if (filters?.startDate) {
      conditions.push(gte(billPayments.paymentDate, filters.startDate));
    }

    if (filters?.endDate) {
      conditions.push(lte(billPayments.paymentDate, filters.endDate));
    }

    if (filters?.paymentMethod) {
      conditions.push(eq(billPayments.paymentMethod, filters.paymentMethod));
    }

    const payments = await db
      .select({
        id: billPayments.id,
        billId: billPayments.billId,
        billNumber: payablesBills.billNumber,
        vendorId: vendors.id,
        vendorName: vendors.name,
        amount: billPayments.amount,
        paymentDate: billPayments.paymentDate,
        paymentMethod: billPayments.paymentMethod,
        referenceNumber: billPayments.referenceNumber,
        notes: billPayments.notes,
        confirmationEmailSentAt: billPayments.confirmationEmailSentAt,
        createdAt: billPayments.createdAt,
      })
      .from(billPayments)
      .innerJoin(payablesBills, eq(billPayments.billId, payablesBills.id))
      .innerJoin(vendors, eq(payablesBills.vendorId, vendors.id))
      .where(
        filters?.vendorId
          ? and(...conditions, eq(vendors.id, filters.vendorId))
          : and(...conditions),
      )
      .orderBy(desc(billPayments.paymentDate));

    return payments;
  } catch (error) {
    console.error("Error fetching payments:", error);
    return [];
  }
}

/**
 * Send payment confirmation email to vendor
 */
export async function sendPaymentConfirmationEmail(paymentId: number) {
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

    // Get payment with bill and vendor details
    const [payment] = await db
      .select({
        payment: billPayments,
        bill: payablesBills,
        vendor: vendors,
      })
      .from(billPayments)
      .innerJoin(payablesBills, eq(billPayments.billId, payablesBills.id))
      .innerJoin(vendors, eq(payablesBills.vendorId, vendors.id))
      .where(
        and(
          eq(billPayments.id, paymentId),
          eq(billPayments.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!payment) {
      return {
        success: null,
        error: { reason: "Payment not found" },
      };
    }

    // Get primary contact or first contact
    const contacts = await db
      .select()
      .from(vendorContacts)
      .where(
        and(
          eq(vendorContacts.vendorId, payment.vendor.id),
          eq(vendorContacts.organizationId, organization.id),
        ),
      )
      .orderBy(desc(vendorContacts.isPrimary));

    const primaryContact = contacts[0];

    if (!primaryContact) {
      return {
        success: null,
        error: { reason: "No contact found for vendor" },
      };
    }

    await sendPaymentConfirmationEmailUtil({
      to: primaryContact.email,
      vendorName: payment.vendor.name,
      paymentDetails: {
        billNumber: payment.bill.billNumber,
        amount: Number.parseFloat(payment.payment.amount),
        paymentDate: payment.payment.paymentDate,
        referenceNumber: payment.payment.referenceNumber || undefined,
      },
      organizationName: organization.name,
    });

    await db.transaction(async (tx) => {
      // Update payment with email timestamp
      await tx
        .update(billPayments)
        .set({
          confirmationEmailSentAt: new Date(),
          confirmationEmailSentTo: primaryContact.email,
        })
        .where(eq(billPayments.id, paymentId));

      // Log activity
      await tx.insert(billActivityLog).values({
        billId: payment.bill.id,
        activityType: "Email Sent",
        description: `Payment confirmation email sent to ${primaryContact.email}`,
        performedBy: userId,
        metadata: {
          paymentId,
          emailTo: primaryContact.email,
        },
        organizationId: organization.id,
      });
    });

    revalidatePath("/payables/payments");
    revalidatePath(`/payables/bills/${payment.bill.id}`);

    return {
      success: { reason: "Payment confirmation email sent successfully" },
      error: null,
    };
  } catch (error) {
    console.error("Error sending payment confirmation email:", error);
    return {
      success: null,
      error: { reason: "Failed to send payment confirmation email" },
    };
  }
}
