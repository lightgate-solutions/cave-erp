import { db } from "@/db";
import { companyExpenses, companyBalance } from "@/db/schema";
import { auth } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const expenseId = Number(id);
    const [expense] = await db
      .select()
      .from(companyExpenses)
      .where(
        and(
          eq(companyExpenses.id, expenseId),
          eq(companyExpenses.organizationId, organization.id),
        ),
      );
    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }
    return NextResponse.json({ expense });
  } catch (error) {
    console.error("Error fetching expense:", error);
    return NextResponse.json(
      { error: "Failed to fetch expense" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const expenseId = Number(id);
    const body = await request.json();
    const { title, description, amount, category, expenseDate } = body ?? {};

    // Get the old expense to calculate balance difference
    const [oldExpense] = await db
      .select()
      .from(companyExpenses)
      .where(
        and(
          eq(companyExpenses.id, expenseId),
          eq(companyExpenses.organizationId, organization.id),
        ),
      );

    if (!oldExpense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const oldAmount = Number(oldExpense.amount);
    const newAmount = amount !== undefined ? Number(amount) : oldAmount;
    const amountDifference = newAmount - oldAmount;

    // Update the expense
    const [updated] = await db
      .update(companyExpenses)
      .set({
        title,
        description,
        amount: amount !== undefined ? newAmount.toString() : undefined,
        category: category !== undefined ? category : undefined,
        expenseDate: expenseDate ? new Date(expenseDate) : undefined,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(companyExpenses.id, expenseId),
          eq(companyExpenses.organizationId, organization.id),
        ),
      )
      .returning();

    // Update company balance if amount changed
    if (amountDifference !== 0) {
      const [balanceRecord] = await db
        .select()
        .from(companyBalance)
        .limit(1)
        .where(eq(companyBalance.organizationId, organization.id));

      if (balanceRecord) {
        const currentBalance = Number(balanceRecord.balance);
        // Subtract the difference (if new amount is higher, subtract more; if lower, subtract less)
        const newBalance = currentBalance - amountDifference;
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
      }
    }

    return NextResponse.json({ expense: updated });
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json(
      { error: "Failed to update expense" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const expenseId = Number(id);

    // Get the expense to restore balance
    const [expense] = await db
      .select()
      .from(companyExpenses)
      .where(
        and(
          eq(companyExpenses.id, expenseId),
          eq(companyExpenses.organizationId, organization.id),
        ),
      );

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const expenseAmount = Number(expense.amount);

    // Delete the expense
    await db
      .delete(companyExpenses)
      .where(
        and(
          eq(companyExpenses.id, expenseId),
          eq(companyExpenses.organizationId, organization.id),
        ),
      );

    // Restore balance (add back the expense amount)
    const [balanceRecord] = await db
      .select()
      .from(companyBalance)
      .limit(1)
      .where(eq(companyBalance.organizationId, organization.id));

    if (balanceRecord) {
      const currentBalance = Number(balanceRecord.balance);
      const newBalance = currentBalance + expenseAmount;
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
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 },
    );
  }
}
