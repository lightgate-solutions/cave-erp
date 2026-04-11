"use server";

import { db } from "@/db";
import {
  glAccounts,
  glJournalLines,
  glJournals,
} from "@/db/schema/general-ledger";
import { and, eq, gte, lte, lt, sql, type SQL } from "drizzle-orm";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ensureDefaultGLAccounts } from "./accounts";

/** Local calendar YYYY-MM-DD — matches date pickers and PostgreSQL `date` (not UTC midnight via ISO). */
function toSqlDate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export interface TrialBalanceItem {
  accountId: number;
  accountCode: string;
  accountName: string;
  accountType: string;
  /** Chart subclass — used to split COGS vs operating expenses on the P&amp;L. */
  accountClass: string | null;
  /** Activity in the selected date range (or cumulative through `endDate` if no start). */
  totalDebits: number;
  totalCredits: number;
  /** Period net: debits − credits (P&amp;L math uses type-specific rules in consumers). */
  netBalance: number;
  /** Sum of debits/credits for posted journals with transaction_date &lt; range start. */
  openingDebits?: number;
  openingCredits?: number;
  /** opening + period (articulated trial balance). */
  closingDebits?: number;
  closingCredits?: number;
  /** Calendar year-to-date through range end (Jan 1 … end). */
  ytdDebits?: number;
  ytdCredits?: number;
}

async function sumPostedLinesByAccount(
  organizationId: string,
  dateFilter: SQL | undefined,
): Promise<Map<number, { d: number; c: number }>> {
  const base = [
    eq(glJournals.organizationId, organizationId),
    eq(glJournals.status, "Posted"),
  ];
  if (dateFilter) base.push(dateFilter);

  const rows = await db
    .select({
      accountId: glJournalLines.accountId,
      debits: sql<string>`coalesce(sum(${glJournalLines.debit}), 0)`,
      credits: sql<string>`coalesce(sum(${glJournalLines.credit}), 0)`,
    })
    .from(glJournalLines)
    .innerJoin(glJournals, eq(glJournalLines.journalId, glJournals.id))
    .where(and(...base))
    .groupBy(glJournalLines.accountId);

  const m = new Map<number, { d: number; c: number }>();
  for (const r of rows) {
    m.set(r.accountId, { d: Number(r.debits), c: Number(r.credits) });
  }
  return m;
}

export async function getTrialBalance(
  passedOrgId?: string,
  startDate?: Date,
  endDate?: Date,
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const organizationId =
      session?.session?.activeOrganizationId ?? passedOrgId;
    if (!organizationId) {
      return {
        success: false,
        error: "Unauthorized: No active organization",
        data: [] as TrialBalanceItem[],
      };
    }
    await ensureDefaultGLAccounts(organizationId);

    const allAccounts = await db.query.glAccounts.findMany({
      where: eq(glAccounts.organizationId, organizationId),
    });

    const end = endDate ?? new Date();
    const endStr = toSqlDate(end);

    if (!startDate) {
      const cumulative = await sumPostedLinesByAccount(
        organizationId,
        lte(glJournals.transactionDate, endStr),
      );
      const report: TrialBalanceItem[] = allAccounts.map((acc) => {
        const bal = cumulative.get(acc.id) ?? { d: 0, c: 0 };
        return {
          accountId: acc.id,
          accountCode: acc.code,
          accountName: acc.name,
          accountType: acc.type,
          accountClass: acc.accountClass ?? null,
          totalDebits: bal.d,
          totalCredits: bal.c,
          netBalance: bal.d - bal.c,
        };
      });
      return { success: true, data: report };
    }

    const startStr = toSqlDate(startDate);
    const yearStartStr = `${end.getFullYear()}-01-01`;

    const [opening, period, ytd] = await Promise.all([
      sumPostedLinesByAccount(
        organizationId,
        lt(glJournals.transactionDate, startStr),
      ),
      sumPostedLinesByAccount(
        organizationId,
        and(
          gte(glJournals.transactionDate, startStr),
          lte(glJournals.transactionDate, endStr),
        ),
      ),
      sumPostedLinesByAccount(
        organizationId,
        and(
          gte(glJournals.transactionDate, yearStartStr),
          lte(glJournals.transactionDate, endStr),
        ),
      ),
    ]);

    const report: TrialBalanceItem[] = allAccounts.map((acc) => {
      const o = opening.get(acc.id) ?? { d: 0, c: 0 };
      const p = period.get(acc.id) ?? { d: 0, c: 0 };
      const y = ytd.get(acc.id) ?? { d: 0, c: 0 };
      return {
        accountId: acc.id,
        accountCode: acc.code,
        accountName: acc.name,
        accountType: acc.type,
        accountClass: acc.accountClass ?? null,
        openingDebits: o.d,
        openingCredits: o.c,
        totalDebits: p.d,
        totalCredits: p.c,
        closingDebits: o.d + p.d,
        closingCredits: o.c + p.c,
        ytdDebits: y.d,
        ytdCredits: y.c,
        netBalance: p.d - p.c,
      };
    });

    return { success: true, data: report };
  } catch (error) {
    console.error("Failed to get trial balance:", error);
    return { success: false, error: "Failed to get trial balance" };
  }
}

export interface CashFlowStatementData {
  netIncome: number;
  deltaAccountsReceivable: number;
  deltaAccountsPayable: number;
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
  /** Simplified indirect method; extend with non-cash and fixed-asset accounts for full GAAP compliance. */
  methodologyNote: string;
}

/**
 * High-signal indirect cash flow approximation from GL + P&amp;L.
 * Operating ≈ Net income − ΔAR + ΔAP (AR up uses cash; AP up is a source).
 */
export async function getCashFlowStatement(
  passedOrgId: string | undefined,
  startDate: Date,
  endDate: Date,
) {
  try {
    const pl = await getIncomeStatement(passedOrgId, startDate, endDate);
    if (!pl.success || !pl.data) {
      return { success: false, error: pl.error ?? "Failed to load P&L" };
    }

    const prior = new Date(startDate);
    prior.setDate(prior.getDate() - 1);

    const [tbPrior, tbEnd] = await Promise.all([
      getTrialBalance(passedOrgId, undefined, prior),
      getTrialBalance(passedOrgId, undefined, endDate),
    ]);

    if (!tbPrior.success || !tbEnd.success || !tbPrior.data || !tbEnd.data) {
      return { success: false, error: "Failed to load balance snapshots" };
    }

    const assetNet = (tb: typeof tbEnd.data, code: string) => {
      const row = tb.find((r) => r.accountCode === code);
      if (!row) return 0;
      return row.totalDebits - row.totalCredits;
    };

    const liabilityNet = (tb: typeof tbEnd.data, code: string) => {
      const row = tb.find((r) => r.accountCode === code);
      if (!row) return 0;
      return row.totalCredits - row.totalDebits;
    };

    const arPrior = assetNet(tbPrior.data, "1200");
    const arEnd = assetNet(tbEnd.data, "1200");
    const apPrior = liabilityNet(tbPrior.data, "2000");
    const apEnd = liabilityNet(tbEnd.data, "2000");

    const deltaAR = arEnd - arPrior;
    const deltaAP = apEnd - apPrior;

    const netIncome = pl.data.netIncome;
    const operatingCashFlow = netIncome - deltaAR + deltaAP;

    const data: CashFlowStatementData = {
      netIncome,
      deltaAccountsReceivable: deltaAR,
      deltaAccountsPayable: deltaAP,
      operatingCashFlow,
      investingCashFlow: 0,
      financingCashFlow: 0,
      methodologyNote:
        "Operating cash flow uses net income plus working-capital adjustments for default AR (1200) and AP (2000). Investing and financing are placeholders—map fixed assets, loans, and equity accounts to extend.",
    };

    return { success: true, data };
  } catch (error) {
    console.error("Failed to get cash flow statement:", error);
    return { success: false, error: "Failed to get cash flow statement" };
  }
}

function plExpenseAmount(item: TrialBalanceItem): number {
  return item.totalDebits - item.totalCredits;
}

function isCogsAccount(item: TrialBalanceItem): boolean {
  if (item.accountClass === "Cost of Goods Sold") return true;
  if (item.accountCode === "5002") return true;
  return false;
}

export interface IncomeStatementReport {
  revenue: TrialBalanceItem[];
  costOfGoodsSold: TrialBalanceItem[];
  operatingExpenses: TrialBalanceItem[];
  totalRevenue: number;
  totalCogs: number;
  grossProfit: number;
  totalOperatingExpenses: number;
  /** COGS + operating (full P&amp;L expense). */
  totalExpenses: number;
  netIncome: number;
}

export async function getIncomeStatement(
  passedOrgId: string | undefined,
  startDate: Date,
  endDate: Date,
) {
  try {
    const tbResult = await getTrialBalance(passedOrgId, startDate, endDate);
    if (!tbResult.success || !tbResult.data) {
      throw new Error(tbResult.error || "Failed to fetch base data");
    }

    const data = tbResult.data.filter((item) =>
      ["Income", "Expense"].includes(item.accountType),
    );

    const revenue = data.filter((d) => d.accountType === "Income");
    const expenses = data.filter((d) => d.accountType === "Expense");

    const costOfGoodsSold = expenses.filter(isCogsAccount);
    const operatingExpenses = expenses.filter((e) => !isCogsAccount(e));

    const totalRevenue = revenue.reduce(
      (sum, item) => sum + (item.totalCredits - item.totalDebits),
      0,
    );
    const totalCogs = costOfGoodsSold.reduce(
      (sum, item) => sum + plExpenseAmount(item),
      0,
    );
    const totalOperatingExpenses = operatingExpenses.reduce(
      (sum, item) => sum + plExpenseAmount(item),
      0,
    );
    const totalExpenses = totalCogs + totalOperatingExpenses;
    const grossProfit = totalRevenue - totalCogs;
    const netIncome = grossProfit - totalOperatingExpenses;

    return {
      success: true,
      data: {
        revenue,
        costOfGoodsSold,
        operatingExpenses,
        totalRevenue,
        totalCogs,
        grossProfit,
        totalOperatingExpenses,
        totalExpenses,
        netIncome,
      } satisfies IncomeStatementReport,
    };
  } catch (error) {
    console.error("Failed to get P&L:", error);
    return { success: false, error: "Failed to get P&L" };
  }
}

export async function getBalanceSheet(
  passedOrgId: string | undefined,
  asOfDate: Date,
) {
  try {
    const tbResult = await getTrialBalance(passedOrgId, undefined, asOfDate);
    if (!tbResult.success || !tbResult.data) {
      throw new Error(tbResult.error || "Failed to fetch base data");
    }

    const data = tbResult.data;

    const assets = data.filter((d) => d.accountType === "Asset");
    const totalAssets = assets.reduce(
      (sum, item) => sum + (item.totalDebits - item.totalCredits),
      0,
    );

    const liabilities = data.filter((d) => d.accountType === "Liability");
    const totalLiabilities = liabilities.reduce(
      (sum, item) => sum + (item.totalCredits - item.totalDebits),
      0,
    );

    const equity = data.filter((d) => d.accountType === "Equity");
    let totalEquity = equity.reduce(
      (sum, item) => sum + (item.totalCredits - item.totalDebits),
      0,
    );

    const pnlItems = data.filter((d) =>
      ["Income", "Expense"].includes(d.accountType),
    );
    const retainedEarnings = pnlItems.reduce((sum, item) => {
      if (item.accountType === "Income")
        return sum + (item.totalCredits - item.totalDebits);
      return sum - (item.totalDebits - item.totalCredits);
    }, 0);

    totalEquity += retainedEarnings;

    return {
      success: true,
      data: {
        assets,
        totalAssets,
        liabilities,
        totalLiabilities,
        equity,
        totalEquity,
        retainedEarnings,
        check: totalAssets - (totalLiabilities + totalEquity),
      },
    };
  } catch (error) {
    console.error("Failed to get Balance Sheet:", error);
    return { success: false, error: "Failed to get Balance Sheet" };
  }
}
