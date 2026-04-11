import { db } from "@/db";
import {
  companyExpenses,
  expenses as projectExpenses,
  receivablesInvoices,
  payablesBills,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { requireFinance } from "@/actions/auth/dal";
import { ensureDefaultGLAccounts } from "@/actions/finance/gl/accounts";
import { getIncomeStatement } from "@/actions/finance/gl/reports";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(_request: NextRequest) {
  try {
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

    const now = new Date();
    const from30 = new Date(now);
    from30.setDate(from30.getDate() - 30);
    from30.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [[companyRow], [projectRow], [receivablesRow], [payablesRow]] =
      await Promise.all([
        db
          .select({
            total: sql<string>`COALESCE(SUM(${companyExpenses.amount}), 0)`,
          })
          .from(companyExpenses)
          .where(
            and(
              eq(companyExpenses.organizationId, organization.id),
              gte(companyExpenses.expenseDate, from30),
              lte(companyExpenses.expenseDate, endOfDay),
            ),
          ),
        db
          .select({
            total: sql<string>`COALESCE(SUM(${projectExpenses.amount}), 0)`,
          })
          .from(projectExpenses)
          .where(
            and(
              eq(projectExpenses.organizationId, organization.id),
              gte(projectExpenses.spentAt, from30),
              lte(projectExpenses.spentAt, endOfDay),
            ),
          ),
        db
          .select({
            outstanding: sql<string>`COALESCE(SUM(CASE WHEN ${receivablesInvoices.status} IN ('Sent', 'Partially Paid', 'Overdue') THEN ${receivablesInvoices.amountDue} ELSE 0 END), 0)`,
          })
          .from(receivablesInvoices)
          .where(eq(receivablesInvoices.organizationId, organization.id)),
        db
          .select({
            outstanding: sql<string>`COALESCE(SUM(${payablesBills.amountDue}), 0)`,
          })
          .from(payablesBills)
          .where(
            and(
              eq(payablesBills.organizationId, organization.id),
              sql`${payablesBills.status} != 'Cancelled'`,
            ),
          ),
      ]);

    await ensureDefaultGLAccounts(organization.id);
    const pl = await getIncomeStatement(organization.id, startOfMonth, now);
    const netIncomeMtd = pl.success && pl.data ? Number(pl.data.netIncome) : 0;

    const operationsExpenses30d =
      Number(companyRow?.total ?? 0) + Number(projectRow?.total ?? 0);
    const receivablesOutstanding = Number(receivablesRow?.outstanding ?? 0);
    const payablesOutstanding = Number(payablesRow?.outstanding ?? 0);

    return NextResponse.json({
      operationsExpenses30d,
      glNetIncomeMtd: netIncomeMtd,
      receivablesOutstanding,
      payablesOutstanding,
    });
  } catch (error) {
    console.error("Error fetching finance sidebar overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch sidebar overview" },
      { status: 500 },
    );
  }
}
