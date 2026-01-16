/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

"use server";

import { db } from "@/db";
import { clients, receivablesInvoices } from "@/db/schema";
import {
  requireInvoicingViewAccess,
  requireInvoicingWriteAccess,
} from "../auth/dal-invoicing";
import { and, count, desc, eq, ilike, or, sql, sum } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export interface CreateClientInput {
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  taxId?: string;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  website?: string;
  notes?: string;
}

export interface UpdateClientInput extends Partial<CreateClientInput> {
  isActive?: boolean;
}

/**
 * Generate unique client code
 * Format: CLI-{YEAR}-{NNNN}
 * Example: CLI-2026-0001
 */
export async function generateClientCode() {
  try {
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return null;
    }

    const year = new Date().getFullYear();
    const prefix = `CLI-${year}-`;

    // Get the latest client with this year's prefix
    const latestClient = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.organizationId, organization.id),
          ilike(clients.clientCode, `${prefix}%`),
        ),
      )
      .orderBy(desc(clients.createdAt))
      .limit(1);

    if (latestClient.length === 0) {
      return `${prefix}0001`;
    }

    // Extract number from last code and increment
    const lastCode = latestClient[0].clientCode;
    const lastNumber = Number.parseInt(lastCode.split("-")[2] || "0");
    const nextNumber = lastNumber + 1;

    return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
  } catch (error) {
    console.error("Error generating client code:", error);
    return null;
  }
}

/**
 * Create a new client
 */
export async function createClient(data: CreateClientInput) {
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

    // Generate client code
    const clientCode = await generateClientCode();
    if (!clientCode) {
      return {
        success: null,
        error: { reason: "Failed to generate client code" },
      };
    }

    const [client] = await db
      .insert(clients)
      .values({
        clientCode,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        companyName: data.companyName || null,
        taxId: data.taxId || null,
        billingAddress: data.billingAddress || null,
        billingCity: data.billingCity || null,
        billingState: data.billingState || null,
        billingPostalCode: data.billingPostalCode || null,
        billingCountry: data.billingCountry || null,
        shippingAddress: data.shippingAddress || null,
        shippingCity: data.shippingCity || null,
        shippingState: data.shippingState || null,
        shippingPostalCode: data.shippingPostalCode || null,
        shippingCountry: data.shippingCountry || null,
        website: data.website || null,
        notes: data.notes || null,
        organizationId: organization.id,
        createdBy: employee.userId,
      })
      .returning();

    revalidatePath("/invoicing/clients");

    return {
      success: { data: client },
      error: null,
    };
  } catch (error) {
    console.error("Error creating client:", error);
    return {
      success: null,
      error: { reason: "Failed to create client" },
    };
  }
}

/**
 * Update an existing client
 */
export async function updateClient(id: number, data: UpdateClientInput) {
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

    // Check if client exists
    const [existing] = await db
      .select()
      .from(clients)
      .where(
        and(eq(clients.id, id), eq(clients.organizationId, organization.id)),
      )
      .limit(1);

    if (!existing) {
      return {
        success: null,
        error: { reason: "Client not found" },
      };
    }

    const [updated] = await db
      .update(clients)
      .set(data)
      .where(
        and(eq(clients.id, id), eq(clients.organizationId, organization.id)),
      )
      .returning();

    revalidatePath("/invoicing/clients");
    revalidatePath(`/invoicing/clients/${id}`);

    return {
      success: { data: updated },
      error: null,
    };
  } catch (error) {
    console.error("Error updating client:", error);
    return {
      success: null,
      error: { reason: "Failed to update client" },
    };
  }
}

/**
 * Delete a client (only if no invoices exist)
 */
export async function deleteClient(id: number) {
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

    // Check if client has any invoices
    const [invoiceCount] = await db
      .select({ count: count() })
      .from(receivablesInvoices)
      .where(
        and(
          eq(receivablesInvoices.clientId, id),
          eq(receivablesInvoices.organizationId, organization.id),
        ),
      );

    if (invoiceCount.count > 0) {
      // Don't delete, just mark as inactive
      await db
        .update(clients)
        .set({ isActive: false })
        .where(
          and(eq(clients.id, id), eq(clients.organizationId, organization.id)),
        );

      revalidatePath("/invoicing/clients");

      return {
        success: {
          reason: "Client has invoices. Marked as inactive instead.",
        },
        error: null,
      };
    }

    // Delete if no invoices
    await db
      .delete(clients)
      .where(
        and(eq(clients.id, id), eq(clients.organizationId, organization.id)),
      );

    revalidatePath("/invoicing/clients");

    return {
      success: { reason: "Client deleted successfully" },
      error: null,
    };
  } catch (error) {
    console.error("Error deleting client:", error);
    return {
      success: null,
      error: { reason: "Failed to delete client" },
    };
  }
}

/**
 * Get a single client with stats
 */
export async function getClient(id: number) {
  try {
    await requireInvoicingViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return null;
    }

    const [client] = await db
      .select()
      .from(clients)
      .where(
        and(eq(clients.id, id), eq(clients.organizationId, organization.id)),
      )
      .limit(1);

    if (!client) {
      return null;
    }

    // Get invoice stats
    const [stats] = await db
      .select({
        totalInvoices: count(),
        totalRevenue: sum(receivablesInvoices.total),
        paidAmount: sum(receivablesInvoices.amountPaid),
        outstandingAmount: sum(receivablesInvoices.amountDue),
      })
      .from(receivablesInvoices)
      .where(
        and(
          eq(receivablesInvoices.clientId, id),
          eq(receivablesInvoices.organizationId, organization.id),
        ),
      );

    return {
      ...client,
      stats: {
        totalInvoices: stats.totalInvoices || 0,
        totalRevenue: stats.totalRevenue || "0.00",
        paidAmount: stats.paidAmount || "0.00",
        outstandingAmount: stats.outstandingAmount || "0.00",
      },
    };
  } catch (error) {
    console.error("Error fetching client:", error);
    return null;
  }
}

/**
 * Get all clients with optional filters
 */
export async function getAllClients(filters?: {
  search?: string;
  isActive?: boolean;
}) {
  try {
    await requireInvoicingViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const conditions = [eq(clients.organizationId, organization.id)];

    if (filters?.search) {
      conditions.push(
        // biome-ignore lint/style/noNonNullAssertion: <>
        or(
          ilike(clients.name, `%${filters.search}%`),
          ilike(clients.email, `%${filters.search}%`),
          ilike(clients.companyName, `%${filters.search}%`),
          ilike(clients.clientCode, `%${filters.search}%`),
        )!,
      );
    }

    if (filters?.isActive !== undefined) {
      conditions.push(eq(clients.isActive, filters.isActive));
    }

    const allClients = await db
      .select({
        id: clients.id,
        clientCode: clients.clientCode,
        name: clients.name,
        email: clients.email,
        phone: clients.phone,
        companyName: clients.companyName,
        isActive: clients.isActive,
        createdAt: clients.createdAt,
        invoiceCount: sql<number>`(SELECT COUNT(*) FROM ${receivablesInvoices} WHERE ${receivablesInvoices.clientId} = ${clients.id})`,
        totalOutstanding: sql<string>`COALESCE((SELECT SUM(${receivablesInvoices.amountDue}) FROM ${receivablesInvoices} WHERE ${receivablesInvoices.clientId} = ${clients.id}), 0)`,
      })
      .from(clients)
      .where(and(...conditions))
      .orderBy(desc(clients.createdAt));

    return allClients;
  } catch (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
}

/**
 * Get invoices for a specific client
 */
export async function getClientInvoices(
  clientId: number,
  filters?: {
    status?: string;
  },
) {
  try {
    await requireInvoicingViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const conditions = [
      eq(receivablesInvoices.clientId, clientId),
      eq(receivablesInvoices.organizationId, organization.id),
    ];

    if (filters?.status) {
      conditions.push(eq(receivablesInvoices.status, filters.status as any));
    }

    const invoices = await db
      .select()
      .from(receivablesInvoices)
      .where(and(...conditions))
      .orderBy(desc(receivablesInvoices.createdAt));

    return invoices;
  } catch (error) {
    console.error("Error fetching client invoices:", error);
    return [];
  }
}
