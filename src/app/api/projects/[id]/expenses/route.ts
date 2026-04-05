import { db } from "@/db";
import {
  expenses,
  projects,
  companyBalance,
  balanceTransactions,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { createNotification } from "@/actions/notification/notification";
import { getUser } from "@/actions/auth/dal";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { requireProjectPermission } from "@/actions/projects/permissions";
import {
  createJournal,
  updateJournal,
  deleteJournal,
} from "@/actions/finance/gl/journals";
import { glAccounts, glJournals } from "@/db/schema/general-ledger";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const projectId = Number(id);

    // Check if user has permission to view this project
    await requireProjectPermission(projectId, "view");

    const rows = await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.projectId, projectId),
          eq(expenses.organizationId, organization.id),
        ),
      );
    return NextResponse.json({ expenses: rows });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const projectId = Number(id);

    // Check if user has permission to edit this project
    await requireProjectPermission(projectId, "edit");

    const body = await request.json();
    const { title, amount, spentAt, notes } = body ?? {};
    if (!title)
      return NextResponse.json({ error: "title is required" }, { status: 400 });

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [created] = await db
      .insert(expenses)
      .values({
        projectId,
        title,
        amount: Number(amount) || 0,
        spentAt: spentAt ? new Date(spentAt) : null,
        notes,
        organizationId: organization.id,
      })
      .returning();

    // Notify project supervisor about new expense
    const [project] = await db
      .select({
        supervisorId: projects.supervisorId,
        name: projects.name,
        code: projects.code,
      })
      .from(projects)
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (project?.supervisorId) {
      await createNotification({
        user_id: project.supervisorId,
        title: "New Project Expense",
        message: `${user.name} added expense "${title}" (₦${Number(amount).toLocaleString()}) to project ${project.name} (${project.code})`,
        notification_type: "message",
        reference_id: projectId,
      });
    }

    const expenseAmount = Number(amount) || 0;
    if (expenseAmount > 0) {
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
        await db.insert(companyBalance).values({
          balance: newBalance.toString(),
          organizationId: organization.id,
          currency: "NGN",
        });
      }

      await db.insert(balanceTransactions).values({
        userId: user.id,
        amount: expenseAmount.toString(),
        organizationId: organization.id,
        transactionType: "expense",
        description: `Project Expense: ${title} (${project?.code || "PRJ"})`,
        balanceBefore: balanceBefore.toString(),
        balanceAfter: newBalance.toString(),
      });
    }

    try {
      const expenseAccount = await db.query.glAccounts.findFirst({
        where: and(
          eq(glAccounts.organizationId, organization.id),
          eq(glAccounts.type, "Expense"),
        ),
      });
      const assetAccount = await db.query.glAccounts.findFirst({
        where: and(
          eq(glAccounts.organizationId, organization.id),
          eq(glAccounts.type, "Asset"),
        ),
      });

      if (expenseAccount && assetAccount && Number(amount) > 0) {
        await createJournal({
          transactionDate: spentAt ? new Date(spentAt) : new Date(),
          postingDate: new Date(),
          description: `Project Expense: ${title}`,
          reference: project?.code ? `PRJ-${project.code}` : "Project",
          source: "System",
          sourceId: `EXP-${created.id}`,
          status: "Posted",
          createdById: user.id,
          organizationId: organization.id,
          lines: [
            {
              accountId: expenseAccount.id,
              debit: Number(amount) || 0,
              credit: 0,
              description: title,
            },
            {
              accountId: assetAccount.id,
              debit: 0,
              credit: Number(amount) || 0,
              description: title,
            },
          ],
        });
      }
    } catch (e) {
      console.error("Failed to post journal", e);
    }

    return NextResponse.json({ expense: created }, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { error: "Failed to create expense" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const projectId = Number(id);

    // Check if user has permission to edit this project
    await requireProjectPermission(projectId, "edit");

    const body = await request.json();
    const { id: expenseId, title, amount, spentAt, notes } = body ?? {};
    if (!expenseId)
      return NextResponse.json({ error: "id is required" }, { status: 400 });

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get expense details before update
    const [existingExpense] = await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.projectId, projectId),
          eq(expenses.id, Number(expenseId)),
          eq(expenses.organizationId, organization.id),
        ),
      )
      .limit(1);

    const [updated] = await db
      .update(expenses)
      .set({
        title,
        amount: amount !== undefined ? Number(amount) : undefined,
        spentAt: spentAt ? new Date(spentAt) : null,
        notes,
      })
      .where(
        and(
          eq(expenses.projectId, projectId),
          eq(expenses.organizationId, organization.id),
          eq(expenses.id, Number(expenseId)),
        ),
      )
      .returning();

    // Notify project supervisor about expense update
    const [project] = await db
      .select({
        supervisorId: projects.supervisorId,
        name: projects.name,
        code: projects.code,
      })
      .from(projects)
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (project?.supervisorId && existingExpense) {
      await createNotification({
        user_id: project.supervisorId,
        title: "Project Expense Updated",
        message: `${user.name} updated expense "${existingExpense.title}" in project ${project.name} (${project.code})`,
        notification_type: "message",
        reference_id: projectId,
      });
    }

    const newAmount =
      amount !== undefined ? Number(amount) : existingExpense.amount;
    const diffAmount = newAmount - existingExpense.amount;

    if (diffAmount !== 0) {
      const [balanceRecord] = await db
        .select()
        .from(companyBalance)
        .limit(1)
        .where(eq(companyBalance.organizationId, organization.id));

      const balanceBefore = balanceRecord ? Number(balanceRecord.balance) : 0;
      const newBalance = balanceBefore - diffAmount;

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
        await db.insert(companyBalance).values({
          balance: newBalance.toString(),
          organizationId: organization.id,
          currency: "NGN",
        });
      }

      await db.insert(balanceTransactions).values({
        userId: user.id,
        amount: Math.abs(diffAmount).toString(),
        organizationId: organization.id,
        transactionType: diffAmount > 0 ? "expense" : "adjustment",
        description: `Project Expense Update: ${updated.title} ${diffAmount > 0 ? "(Increase)" : "(Decrease)"}`,
        balanceBefore: balanceBefore.toString(),
        balanceAfter: newBalance.toString(),
      });
    }

    try {
      const journal = await db.query.glJournals.findFirst({
        where: and(
          eq(glJournals.organizationId, organization.id),
          eq(glJournals.sourceId, `EXP-${expenseId}`),
        ),
      });
      if (journal && Number(amount) > 0) {
        const expenseAccount = await db.query.glAccounts.findFirst({
          where: and(
            eq(glAccounts.organizationId, organization.id),
            eq(glAccounts.type, "Expense"),
          ),
        });
        const assetAccount = await db.query.glAccounts.findFirst({
          where: and(
            eq(glAccounts.organizationId, organization.id),
            eq(glAccounts.type, "Asset"),
          ),
        });
        if (expenseAccount && assetAccount) {
          await db
            .update(glJournals)
            .set({ status: "Draft" })
            .where(eq(glJournals.id, journal.id));
          await updateJournal(journal.id, {
            transactionDate: spentAt ? new Date(spentAt) : new Date(),
            postingDate: new Date(),
            description: `Project Expense: ${title}`,
            reference: project?.code ? `PRJ-${project.code}` : "Project",
            source: "System",
            sourceId: `EXP-${expenseId}`,
            status: "Posted",
            createdById: user.id,
            organizationId: organization.id,
            lines: [
              {
                accountId: expenseAccount.id,
                debit: Number(amount) || 0,
                credit: 0,
                description: title,
              },
              {
                accountId: assetAccount.id,
                debit: 0,
                credit: Number(amount) || 0,
                description: title,
              },
            ],
          });
        }
      }
    } catch (e) {
      console.error("Failed to update journal", e);
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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const projectId = Number(id);

    // Check if user has permission to edit this project
    await requireProjectPermission(projectId, "edit");

    const body = await request.json();
    const { id: expenseId } = body ?? {};
    if (!expenseId)
      return NextResponse.json({ error: "id is required" }, { status: 400 });

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get expense details before deletion
    const [expenseToDelete] = await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.projectId, projectId),
          eq(expenses.organizationId, organization.id),
          eq(expenses.id, Number(expenseId)),
        ),
      )
      .limit(1);

    await db
      .delete(expenses)
      .where(
        and(
          eq(expenses.projectId, projectId),
          eq(expenses.organizationId, organization.id),
          eq(expenses.id, Number(expenseId)),
        ),
      );

    // Notify project supervisor about expense deletion
    const [project] = await db
      .select({
        supervisorId: projects.supervisorId,
        name: projects.name,
        code: projects.code,
      })
      .from(projects)
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (project?.supervisorId && expenseToDelete) {
      await createNotification({
        user_id: project.supervisorId,
        title: "Project Expense Removed",
        message: `${user.name} removed expense "${expenseToDelete.title}" from project ${project.name} (${project.code})`,
        notification_type: "message",
        reference_id: projectId,
      });
    }

    const refundAmount = expenseToDelete.amount;
    if (refundAmount > 0) {
      const [balanceRecord] = await db
        .select()
        .from(companyBalance)
        .limit(1)
        .where(eq(companyBalance.organizationId, organization.id));

      const balanceBefore = balanceRecord ? Number(balanceRecord.balance) : 0;
      const newBalance = balanceBefore + refundAmount;

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
        await db.insert(companyBalance).values({
          balance: newBalance.toString(),
          organizationId: organization.id,
          currency: "NGN",
        });
      }

      await db.insert(balanceTransactions).values({
        userId: user.id,
        amount: refundAmount.toString(),
        organizationId: organization.id,
        transactionType: "adjustment",
        description: `Project Expense Reversal: ${expenseToDelete.title}`,
        balanceBefore: balanceBefore.toString(),
        balanceAfter: newBalance.toString(),
      });
    }

    try {
      const journal = await db.query.glJournals.findFirst({
        where: and(
          eq(glJournals.organizationId, organization.id),
          eq(glJournals.sourceId, `EXP-${expenseId}`),
        ),
      });
      if (journal) {
        await db
          .update(glJournals)
          .set({ status: "Draft" })
          .where(eq(glJournals.id, journal.id));
        await deleteJournal(journal.id, organization.id);
      }
    } catch (e) {
      console.error("Failed to delete journal", e);
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
