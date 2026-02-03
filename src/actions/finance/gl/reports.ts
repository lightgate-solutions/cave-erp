"use server";

import { db } from "@/db";
import {
  glAccounts,
  glJournalLines,
  glJournals,
} from "@/db/schema/general-ledger";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ensureDefaultGLAccounts } from "./accounts";

export interface TrialBalanceItem {
  accountId: number;
  accountCode: string;
  accountName: string;
  accountType: string;
  totalDebits: number;
  totalCredits: number;
  netBalance: number;
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
        data: [],
      };
    }
    await ensureDefaultGLAccounts(organizationId);
    // Base query conditions
    const conditions = [
      eq(glJournals.organizationId, organizationId),
      eq(glJournals.status, "Posted"),
    ];

    if (startDate) {
      conditions.push(
        gte(glJournals.transactionDate, startDate.toISOString().split("T")[0]),
      );
    }
    if (endDate) {
      conditions.push(
        lte(glJournals.transactionDate, endDate.toISOString().split("T")[0]),
      );
    }

    // Aggregate Journal Lines
    const balances = await db
      .select({
        accountId: glJournalLines.accountId,
        totalDebits: sql<string>`sum(${glJournalLines.debit})`,
        totalCredits: sql<string>`sum(${glJournalLines.credit})`,
      })
      .from(glJournalLines)
      .leftJoin(glJournals, eq(glJournalLines.journalId, glJournals.id))
      .where(and(...conditions))
      .groupBy(glJournalLines.accountId);

    // Fetch Accounts to map details
    // We fetch all accounts to show even zero balances if needed,
    // but here we might just map the active ones.
    const allAccounts = await db.query.glAccounts.findMany({
      where: eq(glAccounts.organizationId, organizationId),
    });

    const report: TrialBalanceItem[] = allAccounts.map((acc) => {
      const bal = balances.find((b) => b.accountId === acc.id);
      const debits = bal ? Number(bal.totalDebits) : 0;
      const credits = bal ? Number(bal.totalCredits) : 0;

      // Net Balance Logic:
      // Asset/Expense: Debit - Credit
      // Liability/Equity/Income: Credit - Debit
      // However, standard trial balance just lists Debit vs Credit columns.
      // For internal calculation, we usually just do Dr - Cr.

      return {
        accountId: acc.id,
        accountCode: acc.code,
        accountName: acc.name,
        accountType: acc.type,
        totalDebits: debits,
        totalCredits: credits,
        netBalance: debits - credits,
      };
    });

    // Filter out zero balances? Maybe not for TB, usually we want to see everything or at least active.
    // Let's return all.

    return { success: true, data: report };
  } catch (error) {
    console.error("Failed to get trial balance:", error);
    return { success: false, error: "Failed to get trial balance" };
  }
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

    // Group by type or class logic here
    const revenue = data.filter((d) => d.accountType === "Income");
    const expenses = data.filter((d) => d.accountType === "Expense");

    const totalRevenue = revenue.reduce(
      (sum, item) => sum + (item.totalCredits - item.totalDebits),
      0,
    );
    const totalExpenses = expenses.reduce(
      (sum, item) => sum + (item.totalDebits - item.totalCredits),
      0,
    );

    return {
      success: true,
      data: {
        revenue,
        expenses,
        totalRevenue,
        totalExpenses,
        netIncome: totalRevenue - totalExpenses,
      },
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

    // Assets
    const assets = data.filter((d) => d.accountType === "Asset");
    const totalAssets = assets.reduce(
      (sum, item) => sum + (item.totalDebits - item.totalCredits),
      0,
    );

    // Liabilities
    const liabilities = data.filter((d) => d.accountType === "Liability");
    const totalLiabilities = liabilities.reduce(
      (sum, item) => sum + (item.totalCredits - item.totalDebits),
      0,
    );

    // Equity
    const equity = data.filter((d) => d.accountType === "Equity");
    let totalEquity = equity.reduce(
      (sum, item) => sum + (item.totalCredits - item.totalDebits),
      0,
    );

    // Calculate Retained Earnings (Net Income for all time up to asOfDate, actually strictly speaking just P&L items)
    // Note: In real systems, "Retained Earnings" is a specific account where P&L is closed into at year-end.
    // For this live report without closing entries, we calculate "Current Year Earnings" dynamically.
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
        retainedEarnings, // Computed
        check: totalAssets - (totalLiabilities + totalEquity), // Should be 0
      },
    };
  } catch (error) {
    console.error("Failed to get Balance Sheet:", error);
    return { success: false, error: "Failed to get Balance Sheet" };
  }
}
