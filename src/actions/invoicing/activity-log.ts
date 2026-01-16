/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

"use server";

import { db } from "@/db";
import { invoiceActivityLog, user } from "@/db/schema";
import { requireInvoicingViewAccess } from "../auth/dal-invoicing";
import { and, desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Get activity log for a specific invoice
 * Returns timeline with user details
 */
export async function getInvoiceActivityLog(invoiceId: number) {
  try {
    await requireInvoicingViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    // Get activity log with user information
    const activities = await db
      .select({
        activity: invoiceActivityLog,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      })
      .from(invoiceActivityLog)
      .leftJoin(user, eq(invoiceActivityLog.performedBy, user.id))
      .where(
        and(
          eq(invoiceActivityLog.invoiceId, invoiceId),
          eq(invoiceActivityLog.organizationId, organization.id),
        ),
      )
      .orderBy(desc(invoiceActivityLog.createdAt));

    return activities;
  } catch (error) {
    console.error("Error fetching invoice activity log:", error);
    return [];
  }
}

/**
 * Log an activity for an invoice
 * Internal helper function used by other actions
 */
export async function logInvoiceActivity(
  invoiceId: number,
  activityType:
    | "Invoice Created"
    | "Invoice Sent"
    | "Status Changed"
    | "Payment Recorded"
    | "Payment Deleted"
    | "Email Sent"
    | "Reminder Sent"
    | "Invoice Updated"
    | "Invoice Cancelled"
    | "PDF Generated"
    | "Client Updated"
    | "Note Added",
  description: string,
  performedBy: string | null,
  metadata?: Record<string, any>,
) {
  try {
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      throw new Error("Organization not found");
    }

    await db.insert(invoiceActivityLog).values({
      invoiceId,
      activityType,
      description,
      performedBy,
      metadata: metadata || null,
      organizationId: organization.id,
    });

    return { success: true };
  } catch (error) {
    console.error("Error logging invoice activity:", error);
    return { success: false, error };
  }
}

/**
 * Get recent activity across all invoices for dashboard
 */
export async function getRecentInvoiceActivity(limit: number = 20) {
  try {
    await requireInvoicingViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const activities = await db
      .select({
        activity: invoiceActivityLog,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      })
      .from(invoiceActivityLog)
      .leftJoin(user, eq(invoiceActivityLog.performedBy, user.id))
      .where(eq(invoiceActivityLog.organizationId, organization.id))
      .orderBy(desc(invoiceActivityLog.createdAt))
      .limit(limit);

    return activities;
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return [];
  }
}
