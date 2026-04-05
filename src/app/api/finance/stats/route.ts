import { db } from "@/db";
import {
  companyExpenses,
  loanApplications,
  balanceTransactions,
  expenses as projectExpenses,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { sql, inArray, and, gte, lte, type SQL, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { requireFinance } from "@/actions/auth/dal";

export async function GET(request: NextRequest) {
  try {
    // Check Finance department or admin access
    try {
      await requireFinance();
    } catch {
      return NextResponse.json(
        { error: "Forbidden: Finance department or Admin access required" },
        { status: 403 },
      );
    }

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let expenseWhere: SQL | undefined;
    let projectExpenseWhere: SQL | undefined;
    let chartWhere: SQL | undefined;

    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      // Adjust toDate to end of day
      toDate.setHours(23, 59, 59, 999);

      expenseWhere = and(
        gte(companyExpenses.expenseDate, fromDate),
        lte(companyExpenses.expenseDate, toDate),
      );

      // Project expenses: filter by spentAt (when the expense was incurred)
      projectExpenseWhere = and(
        gte(projectExpenses.spentAt, fromDate),
        lte(projectExpenses.spentAt, toDate),
      );

      chartWhere = and(
        gte(balanceTransactions.createdAt, fromDate),
        lte(balanceTransactions.createdAt, toDate),
      );
    }

    // Sum company-level expenses (finance module)
    const [companyExpensesResult] = await db
      .select({
        total: sql<string>`coalesce(sum(${companyExpenses.amount}), 0)`,
      })
      .from(companyExpenses)
      .where(
        and(expenseWhere, eq(companyExpenses.organizationId, organization.id)),
      );

    // Sum project-level expenses (projects module)
    const [projExpensesResult] = await db
      .select({
        total: sql<string>`coalesce(sum(${projectExpenses.amount}), 0)`,
      })
      .from(projectExpenses)
      .where(
        and(
          projectExpenseWhere,
          eq(projectExpenses.organizationId, organization.id),
        ),
      );

    const totalExpenses =
      Number(companyExpensesResult?.total || 0) +
      Number(projExpensesResult?.total || 0);

    const [loansResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(loanApplications)
      .where(
        and(
          inArray(loanApplications.status, ["active", "disbursed"]),
          eq(loanApplications.organizationId, organization.id),
        ),
      );

    const chartData = await db
      .select({
        date: sql<string>`DATE(${balanceTransactions.createdAt})`,
        type: balanceTransactions.transactionType,
        amount: sql<string>`sum(${balanceTransactions.amount})`,
      })
      .from(balanceTransactions)
      .where(
        and(
          chartWhere,
          eq(balanceTransactions.organizationId, organization.id),
        ),
      )
      .groupBy(
        sql`DATE(${balanceTransactions.createdAt})`,
        balanceTransactions.transactionType,
      )
      .orderBy(sql`DATE(${balanceTransactions.createdAt})`);

    const processedChartData: Record<
      string,
      { date: string; income: number; expense: number }
    > = {};

    for (const record of chartData) {
      const date = record.date;
      if (!processedChartData[date]) {
        processedChartData[date] = { date, income: 0, expense: 0 };
      }

      const amount = Number(record.amount);
      if (record.type === "top-up") {
        processedChartData[date].income += amount;
      } else if (record.type === "expense") {
        processedChartData[date].expense += amount;
      }
    }

    const chartDataArray = Object.values(processedChartData).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    return NextResponse.json({
      totalExpenses: String(totalExpenses),
      activeLoans: loansResult?.count || 0,
      chartData: chartDataArray,
    });
  } catch (error) {
    console.error("Error fetching finance stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch finance stats" },
      { status: 500 },
    );
  }
}
