"use server";

import { db } from "@/db";
import {
  receivablesInvoices,
  invoiceLineItems,
  invoiceTaxes,
  invoiceActivityLog,
  organizationCurrencies,
  clients,
  companyBankAccounts,
  glAccounts,
  glJournals,
} from "@/db/schema";
import { createJournal } from "../finance/gl/journals";
import { ensureDefaultGLAccounts } from "../finance/gl/accounts";
import {
  requireInvoicingViewAccess,
  requireInvoicingWriteAccess,
} from "../auth/dal-invoicing";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { LineItem } from "@/types/invoicing";
import { calculateInvoiceAmounts } from "@/lib/invoicing-utils";
import { generateInvoicePdf } from "@/lib/pdf/invoice-pdf";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "@/lib/r2Client";
import { sendInvoiceEmail } from "@/lib/emails";

export type InvoiceStatus =
  | "Draft"
  | "Sent"
  | "Paid"
  | "Overdue"
  | "Cancelled"
  | "Partially Paid";

export interface CreateInvoiceInput {
  clientId: number;
  currencyId: number;
  bankAccountId?: number;
  invoiceDate: string; // YYYY-MM-DD format
  dueDate: string; // YYYY-MM-DD format
  lineItems: LineItem[];
  taxes?: { taxName: string; taxPercentage: number }[];
  notes?: string;
  termsAndConditions?: string;
  footerNote?: string;
  template?: "Modern" | "Classic" | "Minimal" | "Detailed" | "Professional";
}

export interface UpdateInvoiceInput extends Partial<CreateInvoiceInput> {}

/**
 * Generate unique invoice number for organization
 * Format: {ORG_PREFIX}-{YEAR}-{NNNN}
 * Example: LIG-2026-0001
 */
export async function generateInvoiceNumber(organizationId?: string) {
  try {
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return null;
    }

    const targetOrgId = organizationId || organization.id;

    if (organization.id !== targetOrgId) {
      return null;
    }

    // Extract first 3 characters of organization slug, uppercase
    const orgPrefix = organization.slug.toUpperCase().substring(0, 3);
    const year = new Date().getFullYear();
    const prefix = `${orgPrefix}-${year}-`;

    // Get the latest invoice with this year's prefix
    const latestInvoice = await db
      .select()
      .from(receivablesInvoices)
      .where(
        and(
          eq(receivablesInvoices.organizationId, targetOrgId),
          ilike(receivablesInvoices.invoiceNumber, `${prefix}%`),
        ),
      )
      .orderBy(desc(receivablesInvoices.createdAt))
      .limit(1);

    if (latestInvoice.length === 0) {
      return `${prefix}0001`;
    }

    // Extract number from last code and increment
    const lastCode = latestInvoice[0].invoiceNumber;
    const lastNumber = Number.parseInt(lastCode.split("-")[2] || "0");
    const nextNumber = lastNumber + 1;

    return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
  } catch (error) {
    console.error("Error generating invoice number:", error);
    return null;
  }
}

/**
 * Create a new invoice
 */
export async function createInvoice(data: CreateInvoiceInput) {
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

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(organization.id);
    if (!invoiceNumber) {
      return {
        success: null,
        error: { reason: "Failed to generate invoice number" },
      };
    }

    // Calculate amounts
    const { subtotal, taxAmount, total } = calculateInvoiceAmounts(
      data.lineItems,
      data.taxes || [],
    );

    const [invoice] = await db.transaction(async (tx) => {
      // Create invoice
      const [newInvoice] = await tx
        .insert(receivablesInvoices)
        .values({
          invoiceNumber,
          clientId: data.clientId,
          currencyId: data.currencyId,
          bankAccountId: data.bankAccountId,
          invoiceDate: data.invoiceDate,
          dueDate: data.dueDate,
          status: "Draft",
          subtotal: subtotal.toString(),
          taxAmount: taxAmount.toString(),
          total: total.toString(),
          amountPaid: "0.00",
          amountDue: total.toString(),
          notes: data.notes || null,
          termsAndConditions: data.termsAndConditions || null,
          footerNote: data.footerNote || null,
          template: data.template || "Modern",
          organizationId: organization.id,
          createdBy: employee.userId,
        })
        .returning();

      // Insert line items
      if (data.lineItems.length > 0) {
        await tx.insert(invoiceLineItems).values(
          data.lineItems.map((item, index) => ({
            invoiceId: newInvoice.id,
            description: item.description,
            quantity: item.quantity.toString(),
            unitPrice: item.unitPrice.toString(),
            amount: (item.quantity * item.unitPrice).toString(),
            sortOrder: item.sortOrder ?? index,
            organizationId: organization.id,
          })),
        );
      }

      // Insert taxes
      if (data.taxes && data.taxes.length > 0) {
        await tx.insert(invoiceTaxes).values(
          data.taxes.map((tax) => ({
            invoiceId: newInvoice.id,
            taxName: tax.taxName,
            taxPercentage: tax.taxPercentage.toString(),
            taxAmount: ((subtotal * tax.taxPercentage) / 100).toString(),
            organizationId: organization.id,
          })),
        );
      }

      // Log activity
      await tx.insert(invoiceActivityLog).values({
        invoiceId: newInvoice.id,
        activityType: "Invoice Created",
        description: `Invoice ${invoiceNumber} created as draft`,
        performedBy: employee.userId,
        metadata: {
          clientId: data.clientId,
          total,
          lineItemCount: data.lineItems.length,
          taxCount: data.taxes?.length || 0,
        },
        organizationId: organization.id,
      });

      return [newInvoice];
    });

    revalidatePath("/invoicing");
    revalidatePath("/invoicing/invoices");

    return {
      success: { data: invoice },
      error: null,
    };
  } catch (error) {
    console.error("Error creating invoice:", error);
    return {
      success: null,
      error: { reason: "Failed to create invoice" },
    };
  }
}

/**
 * Update an existing invoice
 */
export async function updateInvoice(id: number, data: UpdateInvoiceInput) {
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

    // Get existing invoice
    const [existing] = await db
      .select()
      .from(receivablesInvoices)
      .where(
        and(
          eq(receivablesInvoices.id, id),
          eq(receivablesInvoices.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!existing) {
      return {
        success: null,
        error: { reason: "Invoice not found" },
      };
    }

    // Only allow editing drafts
    if (existing.status !== "Draft") {
      return {
        success: null,
        error: {
          reason: "Only draft invoices can be edited",
        },
      };
    }

    const [updated] = await db.transaction(async (tx) => {
      // Build update data
      const updateData: Record<string, unknown> = {
        updatedBy: employee.userId,
      };

      if (data.clientId !== undefined) updateData.clientId = data.clientId;
      if (data.currencyId !== undefined)
        updateData.currencyId = data.currencyId;
      if (data.bankAccountId !== undefined)
        updateData.bankAccountId = data.bankAccountId;
      if (data.invoiceDate !== undefined)
        updateData.invoiceDate = data.invoiceDate;
      if (data.dueDate !== undefined) updateData.dueDate = data.dueDate;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.termsAndConditions !== undefined)
        updateData.termsAndConditions = data.termsAndConditions;
      if (data.footerNote !== undefined)
        updateData.footerNote = data.footerNote;
      if (data.template !== undefined) updateData.template = data.template;

      // Recalculate amounts if line items or taxes changed
      if (data.lineItems || data.taxes) {
        // Fetch current details for merging
        const currentDetails = await db.query.receivablesInvoices.findFirst({
          where: eq(receivablesInvoices.id, id),
          with: {
            lineItems: true,
            taxes: true,
          },
        });

        // Prepare line items
        const lineItems =
          data.lineItems ||
          currentDetails?.lineItems.map((item) => ({
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            sortOrder: item.sortOrder,
          })) ||
          [];

        // Prepare taxes
        const taxes =
          data.taxes ||
          currentDetails?.taxes.map((t) => ({
            taxName: t.taxName,
            taxPercentage: Number(t.taxPercentage),
          })) ||
          [];

        const { subtotal, taxAmount, total } = calculateInvoiceAmounts(
          lineItems,
          taxes,
        );

        updateData.subtotal = subtotal.toString();
        updateData.taxAmount = taxAmount.toString();
        updateData.total = total.toString();
        updateData.amountDue = (
          total - Number(existing.amountPaid || 0)
        ).toString();

        // Update taxes
        if (data.taxes) {
          // Delete existing taxes
          await tx.delete(invoiceTaxes).where(eq(invoiceTaxes.invoiceId, id));

          // Insert new taxes
          if (data.taxes.length > 0) {
            await tx.insert(invoiceTaxes).values(
              data.taxes.map((tax) => ({
                invoiceId: id,
                taxName: tax.taxName,
                taxPercentage: tax.taxPercentage.toString(),
                taxAmount: ((subtotal * tax.taxPercentage) / 100).toString(),
                organizationId: organization.id,
              })),
            );
          }
        }

        // Update line items
        if (data.lineItems) {
          // Delete existing line items
          await tx
            .delete(invoiceLineItems)
            .where(eq(invoiceLineItems.invoiceId, id));

          // Insert new line items
          if (data.lineItems.length > 0) {
            await tx.insert(invoiceLineItems).values(
              data.lineItems.map((item, index) => ({
                invoiceId: id,
                description: item.description,
                quantity: item.quantity.toString(),
                unitPrice: item.unitPrice.toString(),
                amount: (item.quantity * item.unitPrice).toString(),
                sortOrder: item.sortOrder ?? index,
                organizationId: organization.id,
              })),
            );
          }
        }
      }

      // Update invoice
      const [updatedInvoice] = await tx
        .update(receivablesInvoices)
        .set(updateData)
        .where(
          and(
            eq(receivablesInvoices.id, id),
            eq(receivablesInvoices.organizationId, organization.id),
          ),
        )
        .returning();

      // Log activity
      await tx.insert(invoiceActivityLog).values({
        invoiceId: id,
        activityType: "Invoice Updated",
        description: `Invoice ${existing.invoiceNumber} updated`,
        performedBy: employee.userId,
        metadata: { updatedFields: Object.keys(updateData) },
        organizationId: organization.id,
      });

      return [updatedInvoice];
    });

    revalidatePath("/invoicing");
    revalidatePath("/invoicing/invoices");
    revalidatePath(`/invoicing/invoices/${id}`);

    return {
      success: { data: updated },
      error: null,
    };
  } catch (error) {
    console.error("Error updating invoice:", error);
    return {
      success: null,
      error: { reason: "Failed to update invoice" },
    };
  }
}

/**
 * Delete an invoice (drafts only)
 */
export async function deleteInvoice(id: number) {
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

    // Get invoice
    const [invoice] = await db
      .select()
      .from(receivablesInvoices)
      .where(
        and(
          eq(receivablesInvoices.id, id),
          eq(receivablesInvoices.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!invoice) {
      return {
        success: null,
        error: { reason: "Invoice not found" },
      };
    }

    // Only allow deleting drafts
    if (invoice.status !== "Draft") {
      return {
        success: null,
        error: { reason: "Only draft invoices can be deleted" },
      };
    }

    await db
      .delete(receivablesInvoices)
      .where(
        and(
          eq(receivablesInvoices.id, id),
          eq(receivablesInvoices.organizationId, organization.id),
        ),
      );

    revalidatePath("/invoicing");
    revalidatePath("/invoicing/invoices");

    return {
      success: { reason: "Invoice deleted successfully" },
      error: null,
    };
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return {
      success: null,
      error: { reason: "Failed to delete invoice" },
    };
  }
}

/**
 * Get a single invoice with all relations
 */
export async function getInvoice(id: number) {
  try {
    await requireInvoicingViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return null;
    }

    const invoice = await db.query.receivablesInvoices.findFirst({
      where: and(
        eq(receivablesInvoices.id, id),
        eq(receivablesInvoices.organizationId, organization.id),
      ),
      with: {
        client: true,
        currency: true,
        lineItems: {
          orderBy: (items, { asc }) => [asc(items.sortOrder)],
        },
        taxes: true,
        payments: {
          orderBy: (payments, { desc }) => [desc(payments.paymentDate)],
        },
        documents: true,
        activityLog: {
          orderBy: (log, { desc }) => [desc(log.createdAt)],
          with: {
            performedByUser: true,
          },
        },
        createdByUser: true,
        updatedByUser: true,
      },
    });

    return invoice || null;
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return null;
  }
}

/**
 * Get all invoices with optional filters
 */
export async function getAllInvoices(filters?: {
  status?: InvoiceStatus;
  clientId?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    await requireInvoicingViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const conditions = [
      eq(receivablesInvoices.organizationId, organization.id),
    ];

    if (filters?.status) {
      conditions.push(eq(receivablesInvoices.status, filters.status));
    }

    if (filters?.clientId) {
      conditions.push(eq(receivablesInvoices.clientId, filters.clientId));
    }

    if (filters?.search) {
      conditions.push(
        // biome-ignore lint/style/noNonNullAssertion: <>
        or(
          ilike(receivablesInvoices.invoiceNumber, `%${filters.search}%`),
          ilike(clients.name, `%${filters.search}%`),
          ilike(clients.email, `%${filters.search}%`),
        )!,
      );
    }

    if (filters?.startDate) {
      conditions.push(
        sql`${receivablesInvoices.invoiceDate} >= ${filters.startDate}`,
      );
    }

    if (filters?.endDate) {
      conditions.push(
        sql`${receivablesInvoices.invoiceDate} <= ${filters.endDate}`,
      );
    }

    const allInvoices = await db
      .select({
        id: receivablesInvoices.id,
        invoiceNumber: receivablesInvoices.invoiceNumber,
        clientId: receivablesInvoices.clientId,
        clientName: clients.name,
        clientCompanyName: clients.companyName,
        invoiceDate: receivablesInvoices.invoiceDate,
        dueDate: receivablesInvoices.dueDate,
        status: receivablesInvoices.status,
        total: receivablesInvoices.total,
        amountPaid: receivablesInvoices.amountPaid,
        amountDue: receivablesInvoices.amountDue,
        currencyId: receivablesInvoices.currencyId,
        currencySymbol: organizationCurrencies.currencySymbol,
        createdAt: receivablesInvoices.createdAt,
      })
      .from(receivablesInvoices)
      .innerJoin(clients, eq(receivablesInvoices.clientId, clients.id))
      .innerJoin(
        organizationCurrencies,
        eq(receivablesInvoices.currencyId, organizationCurrencies.id),
      )
      .where(and(...conditions))
      .orderBy(desc(receivablesInvoices.createdAt));

    return allInvoices;
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return [];
  }
}

/**
 * Update invoice status
 */
export async function updateInvoiceStatus(
  id: number,
  newStatus: InvoiceStatus,
  reason?: string,
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

    // Get current invoice with client name for GL description
    const [row] = await db
      .select({
        invoice: receivablesInvoices,
        clientName: clients.name,
      })
      .from(receivablesInvoices)
      .leftJoin(clients, eq(receivablesInvoices.clientId, clients.id))
      .where(
        and(
          eq(receivablesInvoices.id, id),
          eq(receivablesInvoices.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!row) {
      return {
        success: null,
        error: { reason: "Invoice not found" },
      };
    }

    const existing = row.invoice;
    const clientName = row.clientName ?? "Client";
    const oldStatus = existing.status;

    await db.transaction(async (tx) => {
      // Build update data
      const updateData: Record<string, unknown> = { status: newStatus };

      if (newStatus === "Sent" && !existing.sentAt) {
        updateData.sentAt = new Date();
      } else if (newStatus === "Cancelled") {
        updateData.cancelledAt = new Date();
      }

      await tx
        .update(receivablesInvoices)
        .set(updateData)
        .where(
          and(
            eq(receivablesInvoices.id, id),
            eq(receivablesInvoices.organizationId, organization.id),
          ),
        );

      // Log activity
      await tx.insert(invoiceActivityLog).values({
        invoiceId: id,
        activityType: "Status Changed",
        description: `Status changed from ${oldStatus} to ${newStatus}${reason ? `: ${reason}` : ""}`,
        performedBy: employee.userId,
        metadata: {
          oldStatus,
          newStatus,
          reason,
        },
        organizationId: organization.id,
      });
    });

    // ---------------------------------------------------------
    // POST TO GENERAL LEDGER
    // ---------------------------------------------------------
    if (newStatus === "Sent" && oldStatus !== "Sent") {
      try {
        await ensureDefaultGLAccounts(organization.id);
        const arAccount = await db.query.glAccounts.findFirst({
          where: and(
            eq(glAccounts.organizationId, organization.id),
            eq(glAccounts.code, "1200"), // Accounts Receivable
          ),
        });

        const revenueAccount = await db.query.glAccounts.findFirst({
          where: and(
            eq(glAccounts.organizationId, organization.id),
            eq(glAccounts.code, "4000"), // Sales Revenue
          ),
        });

        if (arAccount && revenueAccount) {
          const glResult = await createJournal({
            organizationId: organization.id,
            transactionDate: new Date(),
            postingDate: new Date(),
            description: `Invoice Sent: ${existing.invoiceNumber}`,
            reference: existing.invoiceNumber,
            source: "Receivables",
            sourceId: String(id),
            status: "Posted",
            lines: [
              {
                accountId: arAccount.id,
                description: `Accounts Receivable - ${clientName}`,
                debit: Number(existing.total),
                credit: 0,
              },
              {
                accountId: revenueAccount.id,
                description: `Sales Revenue - ${existing.invoiceNumber}`,
                debit: 0,
                credit: Number(existing.total),
              },
            ],
          });
          if (!glResult.success) {
            console.error(
              "Failed to post invoice to GL (updateInvoiceStatus):",
              glResult.error,
            );
          }
        }
      } catch (glError) {
        console.error("Failed to post invoice to GL:", glError);
      }
    }

    revalidatePath("/invoicing");
    revalidatePath("/invoicing/invoices");
    revalidatePath(`/invoicing/invoices/${id}`);

    return {
      success: { reason: "Status updated successfully" },
      error: null,
    };
  } catch (error) {
    console.error("Error updating invoice status:", error);
    return {
      success: null,
      error: { reason: "Failed to update invoice status" },
    };
  }
}

/**
 * Send an invoice via email (generates PDF, uploads to R2, sends email)
 */
export async function sendInvoice(id: number) {
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

    // Get invoice with all details
    const invoice = await getInvoice(id);

    if (!invoice) {
      return {
        success: null,
        error: { reason: "Invoice not found" },
      };
    }

    if (invoice.status === "Cancelled" || invoice.status === "Paid") {
      return {
        success: null,
        error: { reason: "Cannot send cancelled or paid invoices" },
      };
    }

    // Get Bank Account
    let bankAccount = null;
    if (invoice.bankAccountId) {
      [bankAccount] = await db
        .select()
        .from(companyBankAccounts)
        .where(
          and(
            eq(companyBankAccounts.id, invoice.bankAccountId),
            eq(companyBankAccounts.organizationId, organization.id),
          ),
        )
        .limit(1);
    }

    // Generate PDF
    const pdfArrayBuffer = await generateInvoicePdf(
      invoice,
      organization,
      bankAccount,
      invoice.currency?.currencySymbol,
    );
    const pdfBuffer = Buffer.from(pdfArrayBuffer);

    // Upload to R2
    const pdfKey = `${organization.slug}/invoices/${invoice.invoiceNumber}.pdf`;

    await r2Client.send(
      new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        Key: pdfKey,
        Body: pdfBuffer,
        ContentType: "application/pdf",
      }),
    );

    const pdfPath = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${pdfKey}`;

    // Send Email
    await sendInvoiceEmail({
      to: invoice.client.email,
      invoiceDetails: {
        invoiceId: invoice.invoiceNumber,
        amount: Number(invoice.total),
        dueDate: invoice.dueDate,
        items: invoice.lineItems.map((item) => ({
          description: item.description,
          amount: item.amount,
        })),
        currencySymbol: invoice.currency?.currencySymbol,
        paymentLink: undefined, // Can be added later if Stripe/etc integrated
      },
      pdfBuffer,
      organizationName: organization.name,
    });

    // Update Invoice Status & Log
    await db.transaction(async (tx) => {
      await tx
        .update(receivablesInvoices)
        .set({
          status: "Sent",
          sentAt: new Date(),
          pdfPath: pdfPath,
          emailSentAt: new Date(),
          emailSentCount: (invoice.emailSentCount || 0) + 1,
        })
        .where(
          and(
            eq(receivablesInvoices.id, id),
            eq(receivablesInvoices.organizationId, organization.id),
          ),
        );

      await tx.insert(invoiceActivityLog).values({
        invoiceId: id,
        activityType: "Invoice Sent",
        description: `Invoice sent to ${invoice.client.email}`,
        performedBy: employee.userId,
        organizationId: organization.id,
      });
    });

    // Automatic GL posting when invoice is sent (Dr AR, Cr Sales Revenue). Trackable on invoice detail.
    try {
      await ensureDefaultGLAccounts(organization.id);
      const arAccount = await db.query.glAccounts.findFirst({
        where: and(
          eq(glAccounts.organizationId, organization.id),
          eq(glAccounts.code, "1200"),
        ),
      });
      const revenueAccount = await db.query.glAccounts.findFirst({
        where: and(
          eq(glAccounts.organizationId, organization.id),
          eq(glAccounts.code, "4000"),
        ),
      });
      if (arAccount && revenueAccount) {
        const glResult = await createJournal({
          organizationId: organization.id,
          transactionDate: new Date(),
          postingDate: new Date(),
          description: `Invoice Sent: ${invoice.invoiceNumber}`,
          reference: invoice.invoiceNumber,
          source: "Receivables",
          sourceId: String(id),
          status: "Posted",
          lines: [
            {
              accountId: arAccount.id,
              description: `Accounts Receivable - ${invoice.client?.name || "Client"}`,
              debit: Number(invoice.total),
              credit: 0,
            },
            {
              accountId: revenueAccount.id,
              description: `Sales Revenue - ${invoice.invoiceNumber}`,
              debit: 0,
              credit: Number(invoice.total),
            },
          ],
        });
        if (!glResult.success) {
          console.error(
            "Failed to post invoice to GL (sendInvoice):",
            glResult.error,
          );
        }
      }
    } catch (glError) {
      console.error("Failed to post invoice to GL:", glError);
    }

    revalidatePath("/invoicing");
    revalidatePath(`/invoicing/invoices/${id}`);
    revalidatePath("/finance/gl/journals");
    revalidatePath("/finance/gl/reports");
    revalidatePath("/finance/gl/accounts");

    return {
      success: { reason: "Invoice sent successfully" },
      error: null,
    };
  } catch (error) {
    console.error("Error sending invoice:", error);
    return {
      success: null,
      error: { reason: "Failed to send invoice" },
    };
  }
}

/**
 * Check whether an invoice has been posted to the General Ledger (trackable status).
 */
export async function getInvoiceGLPostingStatus(id: number): Promise<{
  posted: boolean;
  postedAt?: string;
  journalNumber?: string;
} | null> {
  try {
    await requireInvoicingViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) return null;

    const journal = await db.query.glJournals.findFirst({
      where: and(
        eq(glJournals.organizationId, organization.id),
        eq(glJournals.source, "Receivables"),
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
    console.error("Error fetching invoice GL posting status:", error);
    return null;
  }
}

/**
 * Post "Invoice Sent" to General Ledger (manual option).
 * Automatic posting already happens when the invoice is sent (sendInvoice / updateInvoiceStatus).
 * Creates Debit AR, Credit Sales Revenue. Safe to call multiple times (skips if already posted).
 */
export async function postInvoiceToGL(id: number): Promise<{
  success: boolean;
  error?: string;
  alreadyPosted?: boolean;
}> {
  try {
    await requireInvoicingWriteAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return { success: false, error: "Organization not found" };
    }

    const invoice = await getInvoice(id);
    if (!invoice) {
      return { success: false, error: "Invoice not found" };
    }
    if (invoice.status === "Draft" || invoice.status === "Cancelled") {
      return {
        success: false,
        error:
          "Only sent, partially paid, or paid invoices can be posted to the GL.",
      };
    }

    const existing = await db.query.glJournals.findFirst({
      where: and(
        eq(glJournals.organizationId, organization.id),
        eq(glJournals.source, "Receivables"),
        eq(glJournals.sourceId, String(id)),
      ),
      columns: { id: true },
    });
    if (existing) {
      return { success: true, alreadyPosted: true };
    }

    await ensureDefaultGLAccounts(organization.id);
    const arAccount = await db.query.glAccounts.findFirst({
      where: and(
        eq(glAccounts.organizationId, organization.id),
        eq(glAccounts.code, "1200"),
      ),
    });
    const revenueAccount = await db.query.glAccounts.findFirst({
      where: and(
        eq(glAccounts.organizationId, organization.id),
        eq(glAccounts.code, "4000"),
      ),
    });
    if (!arAccount || !revenueAccount) {
      return { success: false, error: "GL accounts 1200 or 4000 not found." };
    }

    const transactionDate = invoice.sentAt
      ? new Date(invoice.sentAt)
      : new Date(invoice.invoiceDate);

    await createJournal({
      organizationId: organization.id,
      transactionDate,
      postingDate: transactionDate,
      description: `Invoice Sent: ${invoice.invoiceNumber}`,
      reference: invoice.invoiceNumber,
      source: "Receivables",
      sourceId: String(id),
      status: "Posted",
      lines: [
        {
          accountId: arAccount.id,
          description: `Accounts Receivable - ${invoice.client?.name ?? "Client"}`,
          debit: Number(invoice.total),
          credit: 0,
        },
        {
          accountId: revenueAccount.id,
          description: `Sales Revenue - ${invoice.invoiceNumber}`,
          debit: 0,
          credit: Number(invoice.total),
        },
      ],
    });

    revalidatePath("/invoicing/invoices");
    revalidatePath(`/invoicing/invoices/${id}`);
    revalidatePath("/finance/gl/journals");
    revalidatePath("/finance/gl/reports");
    revalidatePath("/finance/gl/accounts");

    return { success: true };
  } catch (error) {
    console.error("Error posting invoice to GL:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to post to GL",
    };
  }
}

/**
 * Remind client about invoice (Resend email)
 */
export async function remindInvoice(id: number) {
  try {
    const { employee } = await requireInvoicingWriteAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization)
      return { success: null, error: { reason: "Organization not found" } };

    const invoice = await getInvoice(id);
    if (!invoice)
      return { success: null, error: { reason: "Invoice not found" } };

    if (invoice.status === "Draft" || invoice.status === "Cancelled") {
      return {
        success: null,
        error: {
          reason: "Can only remind for Sent, Overdue or Partial invoices",
        },
      };
    }

    // Regenerate PDF (in case details changed or just to be safe) or fetch existing?
    // Safer to regenerate to ensure it matches current DB state.

    // Get Bank Account
    let bankAccount = null;
    if (invoice.bankAccountId) {
      [bankAccount] = await db
        .select()
        .from(companyBankAccounts)
        .where(
          and(
            eq(companyBankAccounts.id, invoice.bankAccountId),
            eq(companyBankAccounts.organizationId, organization.id),
          ),
        )
        .limit(1);
    }

    const pdfArrayBuffer = await generateInvoicePdf(
      invoice,
      organization,
      bankAccount,
      invoice.currency?.currencySymbol,
    );
    const pdfBuffer = Buffer.from(pdfArrayBuffer);

    await sendInvoiceEmail({
      to: invoice.client.email,
      invoiceDetails: {
        invoiceId: invoice.invoiceNumber,
        amount: Number(invoice.amountDue), // Remind for due amount? Or total? Usually total but context helps. Email template shows "Total Amount".
        dueDate: invoice.dueDate,
        items: invoice.lineItems.map((item) => ({
          description: item.description,
          amount: item.amount,
        })),
        currencySymbol: invoice.currency?.currencySymbol,
      },
      pdfBuffer,
      organizationName: organization.name,
    });

    await db.transaction(async (tx) => {
      await tx
        .update(receivablesInvoices)
        .set({
          lastReminderSentAt: new Date(),
          reminderCount: (invoice.reminderCount || 0) + 1,
        })
        .where(
          and(
            eq(receivablesInvoices.id, id),
            eq(receivablesInvoices.organizationId, organization.id),
          ),
        );

      await tx.insert(invoiceActivityLog).values({
        invoiceId: id,
        activityType: "Reminder Sent",
        description: `Reminder sent to ${invoice.client.email}`,
        performedBy: employee.userId,
        organizationId: organization.id,
      });
    });

    revalidatePath(`/invoicing/invoices/${id}`);

    return {
      success: { reason: "Reminder sent successfully" },
      error: null,
    };
  } catch (error) {
    console.error("Error reminding invoice:", error);
    return {
      success: null,
      error: { reason: "Failed to send reminder" },
    };
  }
}
