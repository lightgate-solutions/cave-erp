/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

"use server";

import { db } from "@/db";
import {
  payablesBills,
  billPayments,
  vendors,
  billTaxes,
  purchaseOrders,
} from "@/db/schema";
import { requirePayablesViewAccess } from "../auth/dal-payables";
import { and, count, desc, eq, gte, lte, or, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import type { BillTaxType } from "@/types/payables";

/**
 * Get overall payables metrics for dashboard
 */
export async function getOverallMetrics() {
  try {
    await requirePayablesViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        payables: {
          total: "0.00",
          outstanding: "0.00",
          overdue: "0.00",
          paid: "0.00",
        },
        bills: { total: 0, approved: 0, paid: 0, overdue: 0 },
        vendors: { total: 0, active: 0 },
        avgPaymentTime: 0,
      };
    }

    // Get payables amounts
    const [payablesMetrics] = await db
      .select({
        total: sql<string>`COALESCE(SUM(${payablesBills.total}), 0)`,
        outstanding: sql<string>`COALESCE(SUM(${payablesBills.amountDue}), 0)`,
        overdue: sql<string>`COALESCE(SUM(CASE WHEN ${payablesBills.status} = 'Overdue' THEN ${payablesBills.amountDue} ELSE 0 END), 0)`,
        paid: sql<string>`COALESCE(SUM(${payablesBills.amountPaid}), 0)`,
      })
      .from(payablesBills)
      .where(
        and(
          eq(payablesBills.organizationId, organization.id),
          sql`${payablesBills.status} != 'Cancelled'`,
        ),
      );

    // Get bill counts
    const [billCounts] = await db
      .select({
        total: count(),
        approved: sql<number>`COUNT(CASE WHEN ${payablesBills.status} = 'Approved' THEN 1 END)`,
        paid: sql<number>`COUNT(CASE WHEN ${payablesBills.status} = 'Paid' THEN 1 END)`,
        overdue: sql<number>`COUNT(CASE WHEN ${payablesBills.status} = 'Overdue' THEN 1 END)`,
      })
      .from(payablesBills)
      .where(
        and(
          eq(payablesBills.organizationId, organization.id),
          sql`${payablesBills.status} != 'Cancelled'`,
        ),
      );

    // Get vendor counts
    const [vendorCounts] = await db
      .select({
        total: count(),
        active: sql<number>`COUNT(CASE WHEN ${vendors.status} = 'Active' THEN 1 END)`,
      })
      .from(vendors)
      .where(eq(vendors.organizationId, organization.id));

    // Calculate average payment time (days from bill date to payment date)
    const [avgPaymentTimeResult] = await db
      .select({
        avgDays: sql<number>`COALESCE(AVG(${billPayments.paymentDate}::date - ${payablesBills.billDate}::date), 0)`,
      })
      .from(billPayments)
      .innerJoin(payablesBills, eq(billPayments.billId, payablesBills.id))
      .where(eq(billPayments.organizationId, organization.id));

    return {
      payables: {
        total: payablesMetrics?.total || "0.00",
        outstanding: payablesMetrics?.outstanding || "0.00",
        overdue: payablesMetrics?.overdue || "0.00",
        paid: payablesMetrics?.paid || "0.00",
      },
      bills: {
        total: billCounts?.total || 0,
        approved: billCounts?.approved || 0,
        paid: billCounts?.paid || 0,
        overdue: billCounts?.overdue || 0,
      },
      vendors: {
        total: vendorCounts?.total || 0,
        active: vendorCounts?.active || 0,
      },
      avgPaymentTime: Math.round(avgPaymentTimeResult?.avgDays || 0),
    };
  } catch (error) {
    console.error("Error fetching overall metrics:", error);
    return {
      payables: {
        total: "0.00",
        outstanding: "0.00",
        overdue: "0.00",
        paid: "0.00",
      },
      bills: { total: 0, approved: 0, paid: 0, overdue: 0 },
      vendors: { total: 0, active: 0 },
      avgPaymentTime: 0,
    };
  }
}

/**
 * Get AP aging summary (30-60-90 days)
 */
export async function getAPAgingSummary() {
  try {
    await requirePayablesViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const aging = await db
      .select({
        vendor: {
          id: vendors.id,
          name: vendors.name,
          category: vendors.category,
        },
        current: sql<string>`COALESCE(SUM(CASE WHEN ${payablesBills.dueDate} >= CURRENT_DATE THEN ${payablesBills.amountDue} ELSE 0 END), 0)`,
        days1to30: sql<string>`COALESCE(SUM(CASE WHEN ${payablesBills.dueDate} < CURRENT_DATE AND ${payablesBills.dueDate} >= CURRENT_DATE - INTERVAL '30 days' THEN ${payablesBills.amountDue} ELSE 0 END), 0)`,
        days31to60: sql<string>`COALESCE(SUM(CASE WHEN ${payablesBills.dueDate} < CURRENT_DATE - INTERVAL '30 days' AND ${payablesBills.dueDate} >= CURRENT_DATE - INTERVAL '60 days' THEN ${payablesBills.amountDue} ELSE 0 END), 0)`,
        days61to90: sql<string>`COALESCE(SUM(CASE WHEN ${payablesBills.dueDate} < CURRENT_DATE - INTERVAL '60 days' AND ${payablesBills.dueDate} >= CURRENT_DATE - INTERVAL '90 days' THEN ${payablesBills.amountDue} ELSE 0 END), 0)`,
        over90: sql<string>`COALESCE(SUM(CASE WHEN ${payablesBills.dueDate} < CURRENT_DATE - INTERVAL '90 days' THEN ${payablesBills.amountDue} ELSE 0 END), 0)`,
        totalOutstanding: sql<string>`COALESCE(SUM(${payablesBills.amountDue}), 0)`,
      })
      .from(payablesBills)
      .innerJoin(vendors, eq(payablesBills.vendorId, vendors.id))
      .where(
        and(
          eq(payablesBills.organizationId, organization.id),
          or(
            eq(payablesBills.status, "Approved"),
            eq(payablesBills.status, "Overdue"),
            eq(payablesBills.status, "Partially Paid"),
          ),
        ),
      )
      .groupBy(vendors.id, vendors.name, vendors.category)
      .orderBy(desc(sql`COALESCE(SUM(${payablesBills.amountDue}), 0)`));

    return aging;
  } catch (error) {
    console.error("Error fetching AP aging summary:", error);
    return [];
  }
}

/**
 * Get AP aging details for a specific bucket
 */
export async function getAPAgingDetails(bucket: string) {
  try {
    await requirePayablesViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    // Build date condition based on bucket
    let dateCondition: any;
    switch (bucket) {
      case "current":
        dateCondition = sql`${payablesBills.dueDate} >= CURRENT_DATE`;
        break;
      case "1-30":
        dateCondition = sql`${payablesBills.dueDate} < CURRENT_DATE AND ${payablesBills.dueDate} >= CURRENT_DATE - INTERVAL '30 days'`;
        break;
      case "31-60":
        dateCondition = sql`${payablesBills.dueDate} < CURRENT_DATE - INTERVAL '30 days' AND ${payablesBills.dueDate} >= CURRENT_DATE - INTERVAL '60 days'`;
        break;
      case "61-90":
        dateCondition = sql`${payablesBills.dueDate} < CURRENT_DATE - INTERVAL '60 days' AND ${payablesBills.dueDate} >= CURRENT_DATE - INTERVAL '90 days'`;
        break;
      case "90+":
        dateCondition = sql`${payablesBills.dueDate} < CURRENT_DATE - INTERVAL '90 days'`;
        break;
      default:
        dateCondition = sql`TRUE`;
    }

    const bills = await db
      .select({
        id: payablesBills.id,
        billNumber: payablesBills.billNumber,
        vendorName: vendors.name,
        billDate: payablesBills.billDate,
        dueDate: payablesBills.dueDate,
        total: payablesBills.total,
        amountDue: payablesBills.amountDue,
        daysOverdue: sql<number>`EXTRACT(DAY FROM (CURRENT_DATE - ${payablesBills.dueDate}::date))`,
      })
      .from(payablesBills)
      .innerJoin(vendors, eq(payablesBills.vendorId, vendors.id))
      .where(
        and(
          eq(payablesBills.organizationId, organization.id),
          or(
            eq(payablesBills.status, "Approved"),
            eq(payablesBills.status, "Overdue"),
            eq(payablesBills.status, "Partially Paid"),
          ),
          dateCondition,
        ),
      )
      .orderBy(payablesBills.dueDate);

    return bills;
  } catch (error) {
    console.error("Error fetching AP aging details:", error);
    return [];
  }
}

/**
 * Get cash flow forecast
 */
export async function getCashFlowForecast(months = 3) {
  try {
    await requirePayablesViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);

    // Get bills due in the next X months, grouped by month
    const forecast = await db
      .select({
        month: sql<string>`TO_CHAR(${payablesBills.dueDate}, 'YYYY-MM')`,
        totalDue: sql<string>`COALESCE(SUM(${payablesBills.amountDue}), 0)`,
        billCount: count(),
      })
      .from(payablesBills)
      .where(
        and(
          eq(payablesBills.organizationId, organization.id),
          or(
            eq(payablesBills.status, "Approved"),
            eq(payablesBills.status, "Overdue"),
            eq(payablesBills.status, "Partially Paid"),
          ),
          gte(payablesBills.dueDate, new Date().toISOString().split("T")[0]),
          lte(payablesBills.dueDate, endDate.toISOString().split("T")[0]),
        ),
      )
      .groupBy(sql`TO_CHAR(${payablesBills.dueDate}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${payablesBills.dueDate}, 'YYYY-MM')`);

    return forecast;
  } catch (error) {
    console.error("Error fetching cash flow forecast:", error);
    return [];
  }
}

/**
 * Get vendor analytics (top vendors by spend)
 */
export async function getVendorAnalytics(limit = 10) {
  try {
    await requirePayablesViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        topVendors: [],
        avgSpendPerVendor: "0.00",
      };
    }

    // Get top vendors by total spend
    const topVendors = await db
      .select({
        vendorId: vendors.id,
        vendorName: vendors.name,
        category: vendors.category,
        totalSpend: sql<string>`COALESCE(SUM(${payablesBills.total}), 0)`,
        amountPaid: sql<string>`COALESCE(SUM(${payablesBills.amountPaid}), 0)`,
        outstanding: sql<string>`COALESCE(SUM(${payablesBills.amountDue}), 0)`,
        billCount: count(),
      })
      .from(vendors)
      .leftJoin(
        payablesBills,
        and(
          eq(vendors.id, payablesBills.vendorId),
          sql`${payablesBills.status} != 'Cancelled'`,
        ),
      )
      .where(eq(vendors.organizationId, organization.id))
      .groupBy(vendors.id, vendors.name, vendors.category)
      .orderBy(desc(sql`COALESCE(SUM(${payablesBills.total}), 0)`))
      .limit(limit);

    // Calculate average spend per vendor
    const [avgSpend] = await db
      .select({
        avgSpend: sql<string>`COALESCE(AVG(vendor_totals.total_spend), 0)`,
      })
      .from(
        db
          .select({
            total_spend: sql<number>`SUM(${payablesBills.total})`.as(
              "total_spend",
            ),
          })
          .from(payablesBills)
          .where(
            and(
              eq(payablesBills.organizationId, organization.id),
              sql`${payablesBills.status} != 'Cancelled'`,
            ),
          )
          .groupBy(payablesBills.vendorId)
          .as("vendor_totals"),
      );

    return {
      topVendors,
      avgSpendPerVendor: avgSpend?.avgSpend || "0.00",
    };
  } catch (error) {
    console.error("Error fetching vendor analytics:", error);
    return {
      topVendors: [],
      avgSpendPerVendor: "0.00",
    };
  }
}

/**
 * Get payment method breakdown
 */
export async function getPaymentMethodBreakdown() {
  try {
    await requirePayablesViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const breakdown = await db
      .select({
        paymentMethod: billPayments.paymentMethod,
        totalAmount: sql<string>`COALESCE(SUM(${billPayments.amount}), 0)`,
        paymentCount: count(),
      })
      .from(billPayments)
      .where(eq(billPayments.organizationId, organization.id))
      .groupBy(billPayments.paymentMethod)
      .orderBy(desc(sql`COALESCE(SUM(${billPayments.amount}), 0)`));

    return breakdown;
  } catch (error) {
    console.error("Error fetching payment method breakdown:", error);
    return [];
  }
}

/**
 * Get tax summary report
 */
export async function getTaxSummaryReport(
  taxType?: BillTaxType,
  startDate?: string,
  endDate?: string,
) {
  try {
    await requirePayablesViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const conditions = [eq(billTaxes.organizationId, organization.id)];

    if (taxType) {
      conditions.push(eq(billTaxes.taxType, taxType));
    }

    if (startDate) {
      conditions.push(gte(payablesBills.billDate, startDate));
    }

    if (endDate) {
      conditions.push(lte(payablesBills.billDate, endDate));
    }

    const taxSummary = await db
      .select({
        taxType: billTaxes.taxType,
        taxName: billTaxes.taxName,
        taxPercentage: billTaxes.taxPercentage,
        totalTaxAmount: sql<string>`COALESCE(SUM(${billTaxes.taxAmount}), 0)`,
        billCount: count(),
        isWithholdingTax: billTaxes.isWithholdingTax,
      })
      .from(billTaxes)
      .innerJoin(payablesBills, eq(billTaxes.billId, payablesBills.id))
      .where(and(...conditions, sql`${payablesBills.status} != 'Cancelled'`))
      .groupBy(
        billTaxes.taxType,
        billTaxes.taxName,
        billTaxes.taxPercentage,
        billTaxes.isWithholdingTax,
      )
      .orderBy(desc(sql`COALESCE(SUM(${billTaxes.taxAmount}), 0)`));

    return taxSummary;
  } catch (error) {
    console.error("Error fetching tax summary report:", error);
    return [];
  }
}

/**
 * Get WHT (Withholding Tax) report
 */
export async function getWHTReport(startDate: string, endDate: string) {
  try {
    await requirePayablesViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const whtReport = await db
      .select({
        billId: payablesBills.id,
        billNumber: payablesBills.billNumber,
        billDate: payablesBills.billDate,
        vendorName: vendors.name,
        vendorTaxId: vendors.taxId,
        taxName: billTaxes.taxName,
        taxPercentage: billTaxes.taxPercentage,
        taxAmount: billTaxes.taxAmount,
        whtCertificateNumber: billTaxes.whtCertificateNumber,
        billTotal: payablesBills.total,
      })
      .from(billTaxes)
      .innerJoin(payablesBills, eq(billTaxes.billId, payablesBills.id))
      .innerJoin(vendors, eq(payablesBills.vendorId, vendors.id))
      .where(
        and(
          eq(billTaxes.organizationId, organization.id),
          eq(billTaxes.isWithholdingTax, true),
          gte(payablesBills.billDate, startDate),
          lte(payablesBills.billDate, endDate),
          sql`${payablesBills.status} != 'Cancelled'`,
        ),
      )
      .orderBy(payablesBills.billDate);

    return whtReport;
  } catch (error) {
    console.error("Error fetching WHT report:", error);
    return [];
  }
}

/**
 * Get VAT report
 */
export async function getVATReport(startDate: string, endDate: string) {
  try {
    await requirePayablesViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const vatReport = await db
      .select({
        billId: payablesBills.id,
        billNumber: payablesBills.billNumber,
        billDate: payablesBills.billDate,
        vendorName: vendors.name,
        vendorTaxId: vendors.taxId,
        taxName: billTaxes.taxName,
        taxPercentage: billTaxes.taxPercentage,
        taxAmount: billTaxes.taxAmount,
        billSubtotal: payablesBills.subtotal,
        billTotal: payablesBills.total,
      })
      .from(billTaxes)
      .innerJoin(payablesBills, eq(billTaxes.billId, payablesBills.id))
      .innerJoin(vendors, eq(payablesBills.vendorId, vendors.id))
      .where(
        and(
          eq(billTaxes.organizationId, organization.id),
          eq(billTaxes.taxType, "VAT"),
          gte(payablesBills.billDate, startDate),
          lte(payablesBills.billDate, endDate),
          sql`${payablesBills.status} != 'Cancelled'`,
        ),
      )
      .orderBy(payablesBills.billDate);

    return vatReport;
  } catch (error) {
    console.error("Error fetching VAT report:", error);
    return [];
  }
}

/**
 * Get bill analytics by date range
 */
export async function getBillAnalyticsByDateRange(
  startDate: string,
  endDate: string,
) {
  try {
    await requirePayablesViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        summary: {
          totalBills: 0,
          totalAmount: "0.00",
          totalPaid: "0.00",
          totalOutstanding: "0.00",
        },
        byStatus: [],
        byCategory: [],
        byMonth: [],
      };
    }

    // Summary
    const [summary] = await db
      .select({
        totalBills: count(),
        totalAmount: sql<string>`COALESCE(SUM(${payablesBills.total}), 0)`,
        totalPaid: sql<string>`COALESCE(SUM(${payablesBills.amountPaid}), 0)`,
        totalOutstanding: sql<string>`COALESCE(SUM(${payablesBills.amountDue}), 0)`,
      })
      .from(payablesBills)
      .where(
        and(
          eq(payablesBills.organizationId, organization.id),
          gte(payablesBills.billDate, startDate),
          lte(payablesBills.billDate, endDate),
          sql`${payablesBills.status} != 'Cancelled'`,
        ),
      );

    // By status
    const byStatus = await db
      .select({
        status: payablesBills.status,
        count: count(),
        totalAmount: sql<string>`COALESCE(SUM(${payablesBills.total}), 0)`,
      })
      .from(payablesBills)
      .where(
        and(
          eq(payablesBills.organizationId, organization.id),
          gte(payablesBills.billDate, startDate),
          lte(payablesBills.billDate, endDate),
          sql`${payablesBills.status} != 'Cancelled'`,
        ),
      )
      .groupBy(payablesBills.status);

    // By vendor category
    const byCategory = await db
      .select({
        category: vendors.category,
        count: count(),
        totalAmount: sql<string>`COALESCE(SUM(${payablesBills.total}), 0)`,
      })
      .from(payablesBills)
      .innerJoin(vendors, eq(payablesBills.vendorId, vendors.id))
      .where(
        and(
          eq(payablesBills.organizationId, organization.id),
          gte(payablesBills.billDate, startDate),
          lte(payablesBills.billDate, endDate),
          sql`${payablesBills.status} != 'Cancelled'`,
        ),
      )
      .groupBy(vendors.category);

    // By month
    const byMonth = await db
      .select({
        month: sql<string>`TO_CHAR(${payablesBills.billDate}, 'YYYY-MM')`,
        count: count(),
        totalAmount: sql<string>`COALESCE(SUM(${payablesBills.total}), 0)`,
      })
      .from(payablesBills)
      .where(
        and(
          eq(payablesBills.organizationId, organization.id),
          gte(payablesBills.billDate, startDate),
          lte(payablesBills.billDate, endDate),
          sql`${payablesBills.status} != 'Cancelled'`,
        ),
      )
      .groupBy(sql`TO_CHAR(${payablesBills.billDate}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${payablesBills.billDate}, 'YYYY-MM')`);

    return {
      summary: {
        totalBills: summary?.totalBills || 0,
        totalAmount: summary?.totalAmount || "0.00",
        totalPaid: summary?.totalPaid || "0.00",
        totalOutstanding: summary?.totalOutstanding || "0.00",
      },
      byStatus,
      byCategory,
      byMonth,
    };
  } catch (error) {
    console.error("Error fetching bill analytics by date range:", error);
    return {
      summary: {
        totalBills: 0,
        totalAmount: "0.00",
        totalPaid: "0.00",
        totalOutstanding: "0.00",
      },
      byStatus: [],
      byCategory: [],
      byMonth: [],
    };
  }
}

/**
 * Get purchase order analytics
 */
export async function getPOAnalytics() {
  try {
    await requirePayablesViewAccess();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        summary: {
          totalPOs: 0,
          totalAmount: "0.00",
          totalBilled: "0.00",
          unbilled: "0.00",
        },
        byStatus: [],
      };
    }

    // Summary
    const [summary] = await db
      .select({
        totalPOs: count(),
        totalAmount: sql<string>`COALESCE(SUM(${purchaseOrders.total}), 0)`,
        totalBilled: sql<string>`COALESCE(SUM(${purchaseOrders.billedAmount}), 0)`,
        unbilled: sql<string>`COALESCE(SUM(${purchaseOrders.total} - ${purchaseOrders.billedAmount}), 0)`,
      })
      .from(purchaseOrders)
      .where(
        and(
          eq(purchaseOrders.organizationId, organization.id),
          sql`${purchaseOrders.status} != 'Cancelled'`,
        ),
      );

    // By status
    const byStatus = await db
      .select({
        status: purchaseOrders.status,
        count: count(),
        totalAmount: sql<string>`COALESCE(SUM(${purchaseOrders.total}), 0)`,
      })
      .from(purchaseOrders)
      .where(eq(purchaseOrders.organizationId, organization.id))
      .groupBy(purchaseOrders.status);

    return {
      summary: {
        totalPOs: summary?.totalPOs || 0,
        totalAmount: summary?.totalAmount || "0.00",
        totalBilled: summary?.totalBilled || "0.00",
        unbilled: summary?.unbilled || "0.00",
      },
      byStatus,
    };
  } catch (error) {
    console.error("Error fetching PO analytics:", error);
    return {
      summary: {
        totalPOs: 0,
        totalAmount: "0.00",
        totalBilled: "0.00",
        unbilled: "0.00",
      },
      byStatus: [],
    };
  }
}
