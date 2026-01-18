/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

"use server";

import { db } from "@/db";
import { bills, suppliers, organizationCurrencies } from "@/db/schema";
import { requireFinanceViewAccess } from "../../auth/dal-finance";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Get overall metrics for payables dashboard
 */
export async function getPayablesMetrics() {
  try {
    await requireFinanceViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return null;
    }

    // Get amount metrics
    const [amounts] = await db
      .select({
        totalPayable: sql<string>`COALESCE(SUM(${bills.total}), 0)`,
        paidAmount: sql<string>`COALESCE(SUM(${bills.amountPaid}), 0)`,
        pendingAmount: sql<string>`COALESCE(SUM(CASE WHEN ${bills.status} IN ('Open', 'Partially Paid') THEN ${bills.amountDue} ELSE 0 END), 0)`,
        overdueAmount: sql<string>`COALESCE(SUM(CASE WHEN ${bills.status} = 'Overdue' THEN ${bills.amountDue} ELSE 0 END), 0)`,
      })
      .from(bills)
      .where(eq(bills.organizationId, organization.id));

    // Get bill counts by status
    const [counts] = await db
      .select({
        totalBills: count(),
        draftBills: sql<number>`COUNT(CASE WHEN ${bills.status} = 'Draft' THEN 1 END)`,
        openBills: sql<number>`COUNT(CASE WHEN ${bills.status} = 'Open' THEN 1 END)`,
        paidBills: sql<number>`COUNT(CASE WHEN ${bills.status} = 'Paid' THEN 1 END)`,
        overdueBills: sql<number>`COUNT(CASE WHEN ${bills.status} = 'Overdue' THEN 1 END)`,
        partiallyPaidBills: sql<number>`COUNT(CASE WHEN ${bills.status} = 'Partially Paid' THEN 1 END)`,
      })
      .from(bills)
      .where(eq(bills.organizationId, organization.id));

    // Get total suppliers count
    const [supplierCount] = await db
      .select({ count: count() })
      .from(suppliers)
      .where(eq(suppliers.organizationId, organization.id));

    // Get active suppliers (suppliers with at least one bill)
    // Note: This might be expensive if many bills, but fine for MVP.
    const [activeSupplierCount] = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${bills.supplierId})`,
      })
      .from(bills)
      .where(eq(bills.organizationId, organization.id));

    return {
      amounts: {
        total: amounts.totalPayable,
        paid: amounts.paidAmount,
        pending: amounts.pendingAmount,
        overdue: amounts.overdueAmount,
      },
      bills: {
        total: counts.totalBills,
        draft: counts.draftBills,
        open: counts.openBills,
        paid: counts.paidBills,
        overdue: counts.overdueBills,
        partiallyPaid: counts.partiallyPaidBills,
      },
      suppliers: {
        total: supplierCount.count,
        active: activeSupplierCount.count,
      },
    };
  } catch (error) {
    console.error("Error fetching payables metrics:", error);
    return null;
  }
}

/**
 * Get recent bills
 */
export async function getRecentBills(limit: number = 5) {
  try {
    await requireFinanceViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const recentBills = await db
      .select({
        id: bills.id,
        billNumber: bills.billNumber,
        supplierName: suppliers.name,
        dueDate: bills.dueDate,
        total: bills.total,
        status: bills.status,
        currencySymbol: organizationCurrencies.currencySymbol,
      })
      .from(bills)
      .innerJoin(suppliers, eq(bills.supplierId, suppliers.id))
      .innerJoin(
        organizationCurrencies,
        eq(bills.currencyId, organizationCurrencies.id),
      )
      .where(eq(bills.organizationId, organization.id))
      .orderBy(desc(bills.createdAt))
      .limit(limit);

    return recentBills;
  } catch (error) {
    console.error("Error fetching recent bills:", error);
    return [];
  }
}

/**
 * Get aging report data - bills grouped by days overdue
 */
export async function getAgingReport() {
  try {
    await requireFinanceViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return null;
    }

    // Get all unpaid bills with supplier info
    const unpaidBills = await db
      .select({
        id: bills.id,
        billNumber: bills.billNumber,
        supplierId: bills.supplierId,
        supplierName: suppliers.name,
        dueDate: bills.dueDate,
        billDate: bills.billDate,
        total: bills.total,
        amountDue: bills.amountDue,
        status: bills.status,
        currencySymbol: organizationCurrencies.currencySymbol,
      })
      .from(bills)
      .innerJoin(suppliers, eq(bills.supplierId, suppliers.id))
      .innerJoin(
        organizationCurrencies,
        eq(bills.currencyId, organizationCurrencies.id),
      )
      .where(
        and(
          eq(bills.organizationId, organization.id),
          sql`${bills.status} NOT IN ('Paid', 'Void', 'Draft')`,
        ),
      )
      .orderBy(desc(bills.dueDate));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Categorize bills by aging buckets
    const agingBuckets = {
      current: { bills: [] as typeof unpaidBills, total: 0 }, // Not yet due
      days1to30: { bills: [] as typeof unpaidBills, total: 0 }, // 1-30 days overdue
      days31to60: { bills: [] as typeof unpaidBills, total: 0 }, // 31-60 days overdue
      days61to90: { bills: [] as typeof unpaidBills, total: 0 }, // 61-90 days overdue
      days90plus: { bills: [] as typeof unpaidBills, total: 0 }, // 90+ days overdue
    };

    for (const bill of unpaidBills) {
      const dueDate = new Date(bill.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const amountDue = Number(bill.amountDue);

      if (diffDays <= 0) {
        agingBuckets.current.bills.push(bill);
        agingBuckets.current.total += amountDue;
      } else if (diffDays <= 30) {
        agingBuckets.days1to30.bills.push(bill);
        agingBuckets.days1to30.total += amountDue;
      } else if (diffDays <= 60) {
        agingBuckets.days31to60.bills.push(bill);
        agingBuckets.days31to60.total += amountDue;
      } else if (diffDays <= 90) {
        agingBuckets.days61to90.bills.push(bill);
        agingBuckets.days61to90.total += amountDue;
      } else {
        agingBuckets.days90plus.bills.push(bill);
        agingBuckets.days90plus.total += amountDue;
      }
    }

    const grandTotal =
      agingBuckets.current.total +
      agingBuckets.days1to30.total +
      agingBuckets.days31to60.total +
      agingBuckets.days61to90.total +
      agingBuckets.days90plus.total;

    return {
      buckets: agingBuckets,
      grandTotal,
      billCount: unpaidBills.length,
    };
  } catch (error) {
    console.error("Error fetching aging report:", error);
    return null;
  }
}
