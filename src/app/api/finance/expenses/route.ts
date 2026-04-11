/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

import { db } from "@/db";
import {
  companyExpenses,
  companyBalance,
  balanceTransactions,
  employees,
} from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function buildExpenseDateFilter(
  dateFrom: string | null,
  dateTo: string | null,
): ReturnType<typeof sql> {
  const fromOk = dateFrom && ISO_DATE.test(dateFrom) ? dateFrom : null;
  const toOk = dateTo && ISO_DATE.test(dateTo) ? dateTo : null;
  if (fromOk && toOk) {
    const start = new Date(`${fromOk}T00:00:00.000Z`);
    const end = new Date(`${toOk}T23:59:59.999Z`);
    return sql`AND "expenseDate" >= ${start} AND "expenseDate" <= ${end}`;
  }
  if (fromOk) {
    const start = new Date(`${fromOk}T00:00:00.000Z`);
    return sql`AND "expenseDate" >= ${start}`;
  }
  if (toOk) {
    const end = new Date(`${toOk}T23:59:59.999Z`);
    return sql`AND "expenseDate" <= ${end}`;
  }
  return sql``;
}

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(request: NextRequest) {
  try {
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const exportCsv = searchParams.get("export") === "csv";
    const page = Number(searchParams.get("page") || "1");
    const limit = exportCsv
      ? 50_000
      : Number(searchParams.get("limit") || "10");
    const offset = exportCsv ? 0 : (page - 1) * limit;
    const q = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortDirection =
      searchParams.get("sortDirection") === "asc" ? "asc" : "desc";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const dateFilter = buildExpenseDateFilter(dateFrom, dateTo);

    const qFilter = q
      ? sql`AND (title ILIKE ${`%${q}%`} OR description ILIKE ${`%${q}%`} OR category ILIKE ${`%${q}%`})`
      : sql``;
    const catFilter = category ? sql`AND category = ${category}` : sql``;

    const countQuery = sql`
      WITH all_expenses AS (
        SELECT 
          id,
          title,
          description,
          amount,
          category,
          expense_date as "expenseDate",
          created_at as "createdAt",
          updated_at as "updatedAt",
          'company' as "type",
          organization_id
        FROM company_expenses
        UNION ALL
        SELECT 
          id,
          title,
          notes as description,
          amount::numeric as amount,
          'Project Expense' as category,
          COALESCE(spent_at, created_at) as "expenseDate",
          created_at as "createdAt",
          updated_at as "updatedAt",
          'project' as "type",
          organization_id
        FROM expenses
      )
      SELECT count(*)::int as count 
      FROM all_expenses 
      WHERE organization_id = ${organization.id} 
      ${qFilter} 
      ${catFilter}
      ${dateFilter}
    `;
    const totalResult = await db.execute(countQuery);
    const total = Number(totalResult.rows[0].count || 0);

    const validSortCols = [
      "id",
      "title",
      "description",
      "amount",
      "category",
      "expenseDate",
      "createdAt",
      "updatedAt",
    ];
    const sortCol = validSortCols.includes(sortBy) ? sortBy : "createdAt";
    const dir = sortDirection === "asc" ? sql`ASC` : sql`DESC`;

    const dataQuery = sql`
      WITH all_expenses AS (
        SELECT 
          id,
          title,
          description,
          amount,
          category,
          expense_date as "expenseDate",
          created_at as "createdAt",
          updated_at as "updatedAt",
          'company' as "type",
          organization_id
        FROM company_expenses
        
        UNION ALL
        
        SELECT 
          id,
          title,
          notes as description,
          amount::numeric as amount,
          'Project Expense' as category,
          COALESCE(spent_at, created_at) as "expenseDate",
          created_at as "createdAt",
          updated_at as "updatedAt",
          'project' as "type",
          organization_id
        FROM expenses
      )
      SELECT 
        id, 
        title, 
        description, 
        amount, 
        category, 
        "expenseDate", 
        "createdAt", 
        "updatedAt", 
        "type" 
      FROM all_expenses
      WHERE organization_id = ${organization.id}
      ${qFilter}
      ${catFilter}
      ${dateFilter}
      ORDER BY ${sql.raw(`"${sortCol}"`)} ${dir}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const rowsResult = await db.execute(dataQuery);
    const rows = rowsResult.rows as Record<string, unknown>[];

    if (exportCsv) {
      const headerRow = [
        "id",
        "title",
        "description",
        "amount",
        "category",
        "expenseDate",
        "type",
        "createdAt",
        "updatedAt",
      ];
      const lines = [
        headerRow.join(","),
        ...rows.map((r) => headerRow.map((h) => escapeCsvCell(r[h])).join(",")),
      ];
      const csv = `\uFEFF${lines.join("\n")}`;
      const rangePart =
        dateFrom && dateTo
          ? `${dateFrom}_to_${dateTo}`
          : dateFrom
            ? `from_${dateFrom}`
            : dateTo
              ? `to_${dateTo}`
              : "all";
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="company-expenses-${rangePart}.csv"`,
        },
      });
    }

    return NextResponse.json({
      expenses: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching all expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch top-level expenses" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const h = Object.fromEntries(request.headers);
    const session = await auth.api.getSession({ headers: h });
    const authUserId = session?.user?.id;

    let employeeAuthId: string | null = null;
    if (authUserId) {
      const [employee] = await db
        .select({ authId: employees.authId })
        .from(employees)
        .where(eq(employees.authId, authUserId))
        .limit(1);
      employeeAuthId = employee?.authId ?? null;
    }

    const body = await request.json();
    const { title, description, amount, category, expenseDate } = body ?? {};

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    if (!amount || Number(amount) <= 0) {
      return NextResponse.json(
        { error: "amount is required and must be greater than 0" },
        { status: 400 },
      );
    }

    // Start a transaction to insert expense and update balance
    const expenseAmount = Number(amount);

    // Insert the expense
    const [created] = await db
      .insert(companyExpenses)
      .values({
        title,
        description,
        organizationId: organization.id,
        amount: expenseAmount.toString(),
        category: category || null,
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
      })
      .returning();

    // Update company balance (subtract expense)
    // Get current balance or create if doesn't exist
    const [balanceRecord] = await db
      .select()
      .from(companyBalance)
      .limit(1)
      .where(eq(companyBalance.organizationId, organization.id));

    const balanceBefore = balanceRecord ? Number(balanceRecord.balance) : 0;
    const newBalance = balanceBefore - expenseAmount;

    if (balanceRecord) {
      await db
        .update(companyBalance)
        .set({
          balance: newBalance.toString(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(companyBalance.id, balanceRecord.id),
            eq(companyBalance.organizationId, organization.id),
          ),
        );
    } else {
      // Create initial balance record if it doesn't exist (assumes starting from 0)
      await db.insert(companyBalance).values({
        balance: newBalance.toString(),
        organizationId: organization.id,
        currency: "NGN",
      });
    }

    // Record transaction if user is authenticated
    if (employeeAuthId) {
      await db.insert(balanceTransactions).values({
        userId: employeeAuthId,
        amount: expenseAmount.toString(),
        organizationId: organization.id,
        transactionType: "expense",
        description: `Expense: ${title}`,
        balanceBefore: balanceBefore.toString(),
        balanceAfter: newBalance.toString(),
      });
    }

    return NextResponse.json({ expense: created }, { status: 201 });
  } catch (error) {
    console.error("Error creating company expense:", error);
    return NextResponse.json(
      { error: "Failed to create company expense" },
      { status: 500 },
    );
  }
}
