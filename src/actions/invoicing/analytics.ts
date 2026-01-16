/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

"use server";

import { db } from "@/db";
import {
  receivablesInvoices,
  clients,
  invoicePayments,
  organizationCurrencies,
} from "@/db/schema";
import { requireInvoicingViewAccess } from "../auth/dal-invoicing";
import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Get overall metrics for dashboard
 * Returns summary of total, paid, pending, and overdue revenue
 */
export async function getOverallMetrics() {
  try {
    await requireInvoicingViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return null;
    }

    // Get revenue metrics
    const [revenue] = await db
      .select({
        totalRevenue: sql<string>`COALESCE(SUM(${receivablesInvoices.total}), 0)`,
        paidRevenue: sql<string>`COALESCE(SUM(CASE WHEN ${receivablesInvoices.status} = 'Paid' THEN ${receivablesInvoices.total} ELSE 0 END), 0)`,
        pendingRevenue: sql<string>`COALESCE(SUM(CASE WHEN ${receivablesInvoices.status} IN ('Sent', 'Partially Paid') THEN ${receivablesInvoices.amountDue} ELSE 0 END), 0)`,
        overdueRevenue: sql<string>`COALESCE(SUM(CASE WHEN ${receivablesInvoices.status} = 'Overdue' THEN ${receivablesInvoices.amountDue} ELSE 0 END), 0)`,
      })
      .from(receivablesInvoices)
      .where(eq(receivablesInvoices.organizationId, organization.id));

    // Get invoice counts by status
    const [counts] = await db
      .select({
        totalInvoices: count(),
        draftInvoices: sql<number>`COUNT(CASE WHEN ${receivablesInvoices.status} = 'Draft' THEN 1 END)`,
        sentInvoices: sql<number>`COUNT(CASE WHEN ${receivablesInvoices.status} = 'Sent' THEN 1 END)`,
        paidInvoices: sql<number>`COUNT(CASE WHEN ${receivablesInvoices.status} = 'Paid' THEN 1 END)`,
        overdueInvoices: sql<number>`COUNT(CASE WHEN ${receivablesInvoices.status} = 'Overdue' THEN 1 END)`,
        partiallyPaidInvoices: sql<number>`COUNT(CASE WHEN ${receivablesInvoices.status} = 'Partially Paid' THEN 1 END)`,
        cancelledInvoices: sql<number>`COUNT(CASE WHEN ${receivablesInvoices.status} = 'Cancelled' THEN 1 END)`,
      })
      .from(receivablesInvoices)
      .where(eq(receivablesInvoices.organizationId, organization.id));

    // Calculate average payment time for paid invoices
    const paidInvoices = await db
      .select({
        sentAt: receivablesInvoices.sentAt,
        paidAt: receivablesInvoices.paidAt,
      })
      .from(receivablesInvoices)
      .where(
        and(
          eq(receivablesInvoices.organizationId, organization.id),
          eq(receivablesInvoices.status, "Paid"),
          sql`${receivablesInvoices.sentAt} IS NOT NULL`,
          sql`${receivablesInvoices.paidAt} IS NOT NULL`,
        ),
      );

    let avgPaymentTime = 0;
    if (paidInvoices.length > 0) {
      const totalDays = paidInvoices.reduce((sum, inv) => {
        if (!inv.sentAt || !inv.paidAt) return sum;
        const days = Math.floor(
          (new Date(inv.paidAt).getTime() - new Date(inv.sentAt).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        return sum + days;
      }, 0);
      avgPaymentTime = Math.round(totalDays / paidInvoices.length);
    }

    // Get total clients count
    const [clientCount] = await db
      .select({ count: count() })
      .from(clients)
      .where(eq(clients.organizationId, organization.id));

    // Get active clients (clients with at least one invoice)
    const [activeClientCount] = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${receivablesInvoices.clientId})`,
      })
      .from(receivablesInvoices)
      .where(eq(receivablesInvoices.organizationId, organization.id));

    return {
      revenue: {
        total: revenue.totalRevenue,
        paid: revenue.paidRevenue,
        pending: revenue.pendingRevenue,
        overdue: revenue.overdueRevenue,
      },
      invoices: {
        total: counts.totalInvoices,
        draft: counts.draftInvoices,
        sent: counts.sentInvoices,
        paid: counts.paidInvoices,
        overdue: counts.overdueInvoices,
        partiallyPaid: counts.partiallyPaidInvoices,
        cancelled: counts.cancelledInvoices,
      },
      avgPaymentTime,
      clients: {
        total: clientCount.count,
        active: activeClientCount.count,
      },
    };
  } catch (error) {
    console.error("Error fetching overall metrics:", error);
    return null;
  }
}

/**
 * Get revenue by period (monthly/quarterly)
 * Returns time-series data for charts
 */
export async function getRevenueByPeriod(
  period: "monthly" | "quarterly" = "monthly",
  year?: number,
) {
  try {
    await requireInvoicingViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const currentYear = year || new Date().getFullYear();

    if (period === "monthly") {
      // Get revenue by month
      const result = await db
        .select({
          month: sql<number>`EXTRACT(MONTH FROM ${receivablesInvoices.invoiceDate})`,
          year: sql<number>`EXTRACT(YEAR FROM ${receivablesInvoices.invoiceDate})`,
          totalRevenue: sql<string>`COALESCE(SUM(${receivablesInvoices.total}), 0)`,
          paidRevenue: sql<string>`COALESCE(SUM(CASE WHEN ${receivablesInvoices.status} = 'Paid' THEN ${receivablesInvoices.total} ELSE 0 END), 0)`,
          pendingRevenue: sql<string>`COALESCE(SUM(CASE WHEN ${receivablesInvoices.status} IN ('Sent', 'Partially Paid') THEN ${receivablesInvoices.amountDue} ELSE 0 END), 0)`,
          overdueRevenue: sql<string>`COALESCE(SUM(CASE WHEN ${receivablesInvoices.status} = 'Overdue' THEN ${receivablesInvoices.amountDue} ELSE 0 END), 0)`,
          invoiceCount: count(),
        })
        .from(receivablesInvoices)
        .where(
          and(
            eq(receivablesInvoices.organizationId, organization.id),
            sql`EXTRACT(YEAR FROM ${receivablesInvoices.invoiceDate}) = ${currentYear}`,
          ),
        )
        .groupBy(
          sql`EXTRACT(MONTH FROM ${receivablesInvoices.invoiceDate})`,
          sql`EXTRACT(YEAR FROM ${receivablesInvoices.invoiceDate})`,
        )
        .orderBy(
          sql`EXTRACT(YEAR FROM ${receivablesInvoices.invoiceDate})`,
          sql`EXTRACT(MONTH FROM ${receivablesInvoices.invoiceDate})`,
        );

      return result;
    }

    // Quarterly
    const result = await db
      .select({
        quarter: sql<number>`EXTRACT(QUARTER FROM ${receivablesInvoices.invoiceDate})`,
        year: sql<number>`EXTRACT(YEAR FROM ${receivablesInvoices.invoiceDate})`,
        totalRevenue: sql<string>`COALESCE(SUM(${receivablesInvoices.total}), 0)`,
        paidRevenue: sql<string>`COALESCE(SUM(CASE WHEN ${receivablesInvoices.status} = 'Paid' THEN ${receivablesInvoices.total} ELSE 0 END), 0)`,
        pendingRevenue: sql<string>`COALESCE(SUM(CASE WHEN ${receivablesInvoices.status} IN ('Sent', 'Partially Paid') THEN ${receivablesInvoices.amountDue} ELSE 0 END), 0)`,
        overdueRevenue: sql<string>`COALESCE(SUM(CASE WHEN ${receivablesInvoices.status} = 'Overdue' THEN ${receivablesInvoices.amountDue} ELSE 0 END), 0)`,
        invoiceCount: count(),
      })
      .from(receivablesInvoices)
      .where(
        and(
          eq(receivablesInvoices.organizationId, organization.id),
          sql`EXTRACT(YEAR FROM ${receivablesInvoices.invoiceDate}) = ${currentYear}`,
        ),
      )
      .groupBy(
        sql`EXTRACT(QUARTER FROM ${receivablesInvoices.invoiceDate})`,
        sql`EXTRACT(YEAR FROM ${receivablesInvoices.invoiceDate})`,
      )
      .orderBy(
        sql`EXTRACT(YEAR FROM ${receivablesInvoices.invoiceDate})`,
        sql`EXTRACT(QUARTER FROM ${receivablesInvoices.invoiceDate})`,
      );

    return result;
  } catch (error) {
    console.error("Error fetching revenue by period:", error);
    return [];
  }
}

/**
 * Get client analytics
 * Returns top clients by revenue and other client metrics
 */
export async function getClientAnalytics(limit: number = 10) {
  try {
    await requireInvoicingViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return null;
    }

    // Get top clients by revenue
    const topClients = await db
      .select({
        client: {
          id: clients.id,
          name: clients.name,
          email: clients.email,
          companyName: clients.companyName,
          clientCode: clients.clientCode,
        },
        invoiceCount: count(receivablesInvoices.id),
        totalRevenue: sql<string>`COALESCE(SUM(${receivablesInvoices.total}), 0)`,
        paidAmount: sql<string>`COALESCE(SUM(${receivablesInvoices.amountPaid}), 0)`,
        outstandingAmount: sql<string>`COALESCE(SUM(${receivablesInvoices.amountDue}), 0)`,
      })
      .from(clients)
      .leftJoin(
        receivablesInvoices,
        and(
          eq(clients.id, receivablesInvoices.clientId),
          eq(receivablesInvoices.organizationId, organization.id),
        ),
      )
      .where(eq(clients.organizationId, organization.id))
      .groupBy(clients.id)
      .orderBy(desc(sql`COALESCE(SUM(${receivablesInvoices.total}), 0)`))
      .limit(limit);

    // Calculate average revenue per client
    const clientRevenueSubquery = db
      .select({
        revenue: sql<number>`SUM(${receivablesInvoices.total})`.as("revenue"),
      })
      .from(receivablesInvoices)
      .where(eq(receivablesInvoices.organizationId, organization.id))
      .groupBy(receivablesInvoices.clientId)
      .as("client_revenue_subquery");

    const [avgRevenuePerClient] = await db
      .select({
        avgRevenue: sql<string>`COALESCE(AVG(${clientRevenueSubquery.revenue}), 0)`,
      })
      .from(clientRevenueSubquery);

    return {
      topClients,
      avgRevenuePerClient: avgRevenuePerClient.avgRevenue || "0.00",
    };
  } catch (error) {
    console.error("Error fetching client analytics:", error);
    return null;
  }
}

/**
 * Get status breakdown
 * Returns invoice count and amount by each status
 */
export async function getStatusBreakdown() {
  try {
    await requireInvoicingViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const breakdown = await db
      .select({
        status: receivablesInvoices.status,
        count: count(),
        totalAmount: sql<string>`COALESCE(SUM(${receivablesInvoices.total}), 0)`,
        amountDue: sql<string>`COALESCE(SUM(${receivablesInvoices.amountDue}), 0)`,
      })
      .from(receivablesInvoices)
      .where(eq(receivablesInvoices.organizationId, organization.id))
      .groupBy(receivablesInvoices.status)
      .orderBy(desc(count()));

    return breakdown;
  } catch (error) {
    console.error("Error fetching status breakdown:", error);
    return [];
  }
}

/**
 * Get overdue invoices
 * Returns list of overdue invoices with days overdue
 */
export async function getOverdueInvoices(limit?: number) {
  try {
    await requireInvoicingViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    let query = db
      .select({
        invoice: receivablesInvoices,
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
        daysOverdue: sql<number>`EXTRACT(DAY FROM AGE(CURRENT_DATE, ${receivablesInvoices.dueDate}))`,
      })
      .from(receivablesInvoices)
      .leftJoin(clients, eq(receivablesInvoices.clientId, clients.id))
      .leftJoin(
        organizationCurrencies,
        eq(receivablesInvoices.currencyId, organizationCurrencies.id),
      )
      .where(
        and(
          eq(receivablesInvoices.organizationId, organization.id),
          eq(receivablesInvoices.status, "Overdue"),
        ),
      )
      .orderBy(receivablesInvoices.dueDate);

    if (limit) {
      query = query.limit(limit) as any;
    }

    const overdueInvoices = await query;

    return overdueInvoices;
  } catch (error) {
    console.error("Error fetching overdue invoices:", error);
    return [];
  }
}

/**
 * Get payment method breakdown
 * Returns payment amounts by each method
 */
export async function getPaymentMethodBreakdown() {
  try {
    await requireInvoicingViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const breakdown = await db
      .select({
        paymentMethod: invoicePayments.paymentMethod,
        count: count(),
        totalAmount: sql<string>`COALESCE(SUM(${invoicePayments.amount}), 0)`,
      })
      .from(invoicePayments)
      .where(eq(invoicePayments.organizationId, organization.id))
      .groupBy(invoicePayments.paymentMethod)
      .orderBy(desc(sql`COALESCE(SUM(${invoicePayments.amount}), 0)`));

    return breakdown;
  } catch (error) {
    console.error("Error fetching payment method breakdown:", error);
    return [];
  }
}

/**
 * Get invoice analytics for a specific date range
 */
export async function getInvoiceAnalyticsByDateRange(
  startDate: string,
  endDate: string,
) {
  try {
    await requireInvoicingViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return null;
    }

    const [metrics] = await db
      .select({
        invoiceCount: count(),
        totalRevenue: sql<string>`COALESCE(SUM(${receivablesInvoices.total}), 0)`,
        paidRevenue: sql<string>`COALESCE(SUM(CASE WHEN ${receivablesInvoices.status} = 'Paid' THEN ${receivablesInvoices.total} ELSE 0 END), 0)`,
        pendingRevenue: sql<string>`COALESCE(SUM(CASE WHEN ${receivablesInvoices.status} IN ('Sent', 'Partially Paid') THEN ${receivablesInvoices.amountDue} ELSE 0 END), 0)`,
        overdueRevenue: sql<string>`COALESCE(SUM(CASE WHEN ${receivablesInvoices.status} = 'Overdue' THEN ${receivablesInvoices.amountDue} ELSE 0 END), 0)`,
      })
      .from(receivablesInvoices)
      .where(
        and(
          eq(receivablesInvoices.organizationId, organization.id),
          gte(receivablesInvoices.invoiceDate, startDate),
          lte(receivablesInvoices.invoiceDate, endDate),
        ),
      );

    return metrics;
  } catch (error) {
    console.error("Error fetching analytics by date range:", error);
    return null;
  }
}
