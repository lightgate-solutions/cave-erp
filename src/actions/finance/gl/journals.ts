"use server";

import { db } from "@/db";
import {
  glJournals,
  glJournalLines,
  glAccounts,
} from "@/db/schema/general-ledger";
import { glPeriods } from "@/db/schema/general-ledger";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

const journalLineSchema = z
  .object({
    accountId: z.number(),
    description: z.string().optional(),
    debit: z.number().min(0),
    credit: z.number().min(0),
    entityId: z.string().optional(),
  })
  .refine((line) => !(line.debit > 0 && line.credit > 0), {
    message: "Each line must not have both debit and credit",
  })
  .refine((line) => line.debit > 0 || line.credit > 0, {
    message: "Each line must have either a debit or a credit",
  });

const journalSchema = z.object({
  transactionDate: z.date(),
  postingDate: z.date(),
  description: z.string().min(1),
  reference: z.string().optional(),
  source: z.enum([
    "Manual",
    "Payables",
    "Receivables",
    "Payroll",
    "Inventory",
    "Fixed Assets",
    "Banking",
    "System",
  ]),
  sourceId: z.string().optional(),
  status: z.enum(["Draft", "Posted", "Voided"]).default("Draft"),
  lines: z.array(journalLineSchema).min(2),
  createdById: z.string().optional(),
  organizationId: z.string().optional(),
  adjustmentReason: z.string().optional(),
  reversalOfJournalId: z.number().int().positive().optional(),
});

export type JournalFormValues = z.infer<typeof journalSchema>;

/** Enforces fiscal period rules when periods exist (open only; closed/locked blocked). */
export async function validateTransactionDateInOpenPeriod(
  organizationId: string,
  transactionDate: Date,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const txStr = transactionDate.toISOString().split("T")[0];
  const anyPeriod = await db.query.glPeriods.findFirst({
    where: eq(glPeriods.organizationId, organizationId),
    columns: { id: true },
  });
  if (!anyPeriod) {
    return { ok: true };
  }

  const enclosing = await db.query.glPeriods.findFirst({
    where: and(
      eq(glPeriods.organizationId, organizationId),
      lte(glPeriods.startDate, txStr),
      gte(glPeriods.endDate, txStr),
    ),
  });

  if (!enclosing) {
    return {
      ok: false,
      error:
        "Transaction date is not inside any fiscal period. Create a period that contains this date.",
    };
  }

  if (enclosing.status === "Open") {
    return { ok: true };
  }

  if (enclosing.status === "Locked") {
    return {
      ok: false,
      error:
        "This fiscal period is locked. Reopen it from Fiscal Periods (with a documented reason) before posting.",
    };
  }

  return {
    ok: false,
    error:
      "This fiscal period is closed. Reopen it from Fiscal Periods (with audit reason) or choose a date in an open period.",
  };
}

export async function createJournal(data: JournalFormValues) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.session?.userId) {
      return { success: false, error: "Unauthorized: Not signed in" };
    }
    const validated = journalSchema.parse(data);
    // Use caller-provided org when present (e.g. from payables/receivables server actions); otherwise session org
    const organizationId =
      validated.organizationId?.trim() || session.session.activeOrganizationId;
    if (!organizationId) {
      return { success: false, error: "Unauthorized: No active organization" };
    }

    // 1. Validate Double Entry (Debits = Credits)
    const totalDebits = validated.lines.reduce(
      (sum, line) => sum + line.debit,
      0,
    );
    const totalCredits = validated.lines.reduce(
      (sum, line) => sum + line.credit,
      0,
    );

    // Allow for small floating point differences? Better to be strict or use cents.
    // Using simple epsilon check for now.
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      return {
        success: false,
        error: `Journal does not balance. Total Debits: ${totalDebits}, Total Credits: ${totalCredits}`,
      };
    }

    if (validated.status === "Posted") {
      const periodOk = await validateTransactionDateInOpenPeriod(
        organizationId,
        validated.transactionDate,
      );
      if (!periodOk.ok) {
        return { success: false, error: periodOk.error };
      }
    }

    // 2. Generate Journal Number (Simple sequence for now)
    // In production, this should be atomic or use a separate sequence table.
    // We'll use a timestamp-random approach or look for max for simplicity in this MVP step.
    const year = validated.transactionDate.getFullYear();
    const count = await db
      .select({ count: sql`count(*)` })
      .from(glJournals)
      .where(eq(glJournals.organizationId, organizationId));
    const nextNum = Number(count[0].count) + 1;
    const journalNumber = `JE-${year}-${String(nextNum).padStart(6, "0")}`;

    // 3. Transaction
    await db.transaction(async (tx) => {
      const [journal] = await tx
        .insert(glJournals)
        .values({
          organizationId,
          journalNumber: journalNumber,
          transactionDate: validated.transactionDate
            .toISOString()
            .split("T")[0], // yyyy-mm-dd
          postingDate: validated.postingDate.toISOString().split("T")[0],
          description: validated.description,
          reference: validated.reference,
          source: validated.source,
          sourceId: validated.sourceId,
          status: validated.status,
          totalDebits: String(totalDebits),
          totalCredits: String(totalCredits),
          createdBy: validated.createdById,
          postedBy:
            validated.status === "Posted" ? validated.createdById : undefined,
          adjustmentReason: validated.adjustmentReason ?? null,
          reversalOfJournalId: validated.reversalOfJournalId ?? null,
        })
        .returning();

      for (const line of validated.lines) {
        await tx.insert(glJournalLines).values({
          journalId: journal.id,
          accountId: line.accountId,
          description: line.description || validated.description,
          debit: String(line.debit),
          credit: String(line.credit),
          entityId: line.entityId,
          organizationId,
        });
      }
    });

    // 4. Update Account Balances
    const accountIds = Array.from(
      new Set(validated.lines.map((l) => l.accountId)),
    );
    // We can run these in parallel
    await Promise.all(
      accountIds.map((id) => recalculateAccountBalance(id, organizationId)),
    );

    revalidatePath("/finance/gl/journals");
    revalidatePath("/finance/gl/reports"); // Balances change
    revalidatePath("/finance/gl/accounts"); // Balances change

    return { success: true, journalNumber };
  } catch (error) {
    console.error("Failed to create journal:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create journal",
    };
  }
}

export async function getJournals(
  passedOrgId?: string,
  limit = 50,
  offset = 0,
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
    const journals = await db.query.glJournals.findMany({
      where: eq(glJournals.organizationId, organizationId),
      orderBy: desc(glJournals.transactionDate),
      limit,
      offset,
      with: {
        createdByUser: true,
        postedByUser: true,
        lines: {
          with: {
            account: true,
          },
        },
      },
    });
    return { success: true, data: journals };
  } catch (error) {
    console.error("Failed to get journals:", error);
    return { success: false, error: "Failed to get journals" };
  }
}

export async function postJournal(journalId: number, userId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const organizationId = session?.session?.activeOrganizationId;
    if (!organizationId) {
      return { success: false, error: "Unauthorized: No active organization" };
    }
    const journal = await db.query.glJournals.findFirst({
      where: and(
        eq(glJournals.id, journalId),
        eq(glJournals.organizationId, organizationId),
      ),
      columns: { organizationId: true, status: true, transactionDate: true },
      with: { lines: { columns: { accountId: true } } },
    });
    if (!journal) {
      return { success: false, error: "Journal not found" };
    }
    if (journal.status === "Posted") {
      return { success: false, error: "Journal is already posted" };
    }
    if (journal.status === "Voided") {
      return { success: false, error: "Cannot post a voided journal" };
    }

    const txDate = new Date(journal.transactionDate);
    const periodOk = await validateTransactionDateInOpenPeriod(
      organizationId,
      txDate,
    );
    if (!periodOk.ok) {
      return { success: false, error: periodOk.error };
    }

    await db
      .update(glJournals)
      .set({
        status: "Posted",
        postedBy: userId,
      })
      .where(eq(glJournals.id, journalId));

    const accountIds = Array.from(
      new Set(journal.lines.map((l) => l.accountId)),
    );
    await Promise.all(
      accountIds.map((accId) =>
        recalculateAccountBalance(accId, journal.organizationId),
      ),
    );

    revalidatePath("/finance/gl/journals");
    revalidatePath("/finance/gl/accounts");
    revalidatePath("/finance/gl/reports");
    return { success: true };
  } catch (error) {
    console.error("Failed to post journal:", error);
    return { success: false, error: "Failed to post journal" };
  }
}

export async function getJournalById(id: number, passedOrgId?: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const organizationId =
      session?.session?.activeOrganizationId ?? passedOrgId;
    if (!organizationId) {
      return { success: false, error: "Unauthorized: No active organization" };
    }
    const journal = await db.query.glJournals.findFirst({
      where: and(
        eq(glJournals.id, id),
        eq(glJournals.organizationId, organizationId),
      ),
      with: {
        createdByUser: true,
        postedByUser: true,
        lines: {
          with: {
            account: true,
          },
        },
      },
    });

    if (!journal) {
      return { success: false, error: "Journal not found" };
    }

    return { success: true, data: journal };
  } catch (error) {
    console.error("Failed to get journal:", error);
    return { success: false, error: "Failed to get journal" };
  }
}

export async function updateJournal(id: number, data: JournalFormValues) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const organizationId = session?.session?.activeOrganizationId;
    if (!organizationId) {
      return { success: false, error: "Unauthorized: No active organization" };
    }
    const existing = await db.query.glJournals.findFirst({
      where: and(
        eq(glJournals.id, id),
        eq(glJournals.organizationId, organizationId),
      ),
      columns: { status: true },
    });
    if (!existing) {
      return { success: false, error: "Journal not found" };
    }
    if (existing.status !== "Draft") {
      return {
        success: false,
        error:
          "Only draft journals can be edited. Posted or voided journals are locked.",
      };
    }

    const validated = journalSchema.parse(data);

    // 1. Validate Balance
    const totalDebits = validated.lines.reduce(
      (sum, line) => sum + line.debit,
      0,
    );
    const totalCredits = validated.lines.reduce(
      (sum, line) => sum + line.credit,
      0,
    );

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      return {
        success: false,
        error: `Journal does not balance. Total Debits: ${totalDebits}, Total Credits: ${totalCredits}`,
      };
    }

    // Get old accounts to recalculate them too (in case an account was removed)
    const oldLines = await db.query.glJournalLines.findMany({
      where: eq(glJournalLines.journalId, id),
      columns: { accountId: true },
    });
    const oldAccountIds = oldLines.map((l) => l.accountId);

    await db.transaction(async (tx) => {
      // 2. Update Header
      await tx
        .update(glJournals)
        .set({
          transactionDate: validated.transactionDate
            .toISOString()
            .split("T")[0],
          postingDate: validated.postingDate.toISOString().split("T")[0],
          description: validated.description,
          reference: validated.reference,
          status: validated.status,
          totalDebits: String(totalDebits),
          totalCredits: String(totalCredits),
          adjustmentReason: validated.adjustmentReason ?? null,
          reversalOfJournalId: validated.reversalOfJournalId ?? null,
        })
        .where(
          and(
            eq(glJournals.id, id),
            eq(glJournals.organizationId, organizationId),
          ),
        );

      // 3. Delete existing lines
      await tx.delete(glJournalLines).where(eq(glJournalLines.journalId, id));

      // 4. Insert new lines
      for (const line of validated.lines) {
        await tx.insert(glJournalLines).values({
          journalId: id,
          accountId: line.accountId,
          description: line.description || validated.description,
          debit: String(line.debit),
          credit: String(line.credit),
          entityId: line.entityId,
          organizationId,
        });
      }
    });

    // 5. Recalculate Balances
    const newAccountIds = validated.lines.map((l) => l.accountId);
    const allAccountIds = Array.from(
      new Set([...oldAccountIds, ...newAccountIds]),
    );

    await Promise.all(
      allAccountIds.map((accId) =>
        recalculateAccountBalance(accId, organizationId),
      ),
    );

    revalidatePath("/finance/gl/journals");
    revalidatePath(`/finance/gl/journals/${id}`);
    revalidatePath("/finance/gl/accounts");

    return { success: true };
  } catch (error) {
    console.error("Failed to update journal:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update journal",
    };
  }
}

/**
 * Post a reversing journal (swap debits/credits) instead of deleting history.
 * Original journal stays Posted for audit; reversal links via reversalOfJournalId.
 */
export async function reversePostedJournal(
  journalId: number,
  options?: { reversalDate?: Date; reason?: string },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const organizationId = session?.session?.activeOrganizationId;
    const userId = session?.session?.userId ?? session?.user?.id;
    if (!organizationId || !userId) {
      return { success: false, error: "Unauthorized" };
    }

    const existing = await db.query.glJournals.findFirst({
      where: and(
        eq(glJournals.id, journalId),
        eq(glJournals.organizationId, organizationId),
      ),
      with: {
        lines: true,
      },
    });

    if (!existing) {
      return { success: false, error: "Journal not found" };
    }
    if (existing.status !== "Posted") {
      return {
        success: false,
        error: "Only posted journals can be reversed (use delete for drafts).",
      };
    }

    const reversalDate = options?.reversalDate ?? new Date();
    const lines = existing.lines.map((l) => ({
      accountId: l.accountId,
      description:
        l.description ?? `Reversal of line — ${existing.description}`,
      debit: Number(l.credit),
      credit: Number(l.debit),
    }));

    return await createJournal({
      transactionDate: reversalDate,
      postingDate: reversalDate,
      description: `Reversal of ${existing.journalNumber}`,
      reference: existing.journalNumber,
      source: "Manual",
      status: "Posted",
      lines,
      createdById: userId,
      organizationId,
      adjustmentReason:
        options?.reason ??
        `System reversal of ${existing.journalNumber} (audit-preserving)`,
      reversalOfJournalId: journalId,
    });
  } catch (error) {
    console.error("reverseJournal:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to reverse journal",
    };
  }
}

export async function deleteJournal(id: number, passedOrgId?: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const organizationId =
      session?.session?.activeOrganizationId ?? passedOrgId;
    if (!organizationId) {
      return { success: false, error: "Unauthorized: No active organization" };
    }
    const journal = await db.query.glJournals.findFirst({
      where: and(
        eq(glJournals.id, id),
        eq(glJournals.organizationId, organizationId),
      ),
      columns: { status: true },
      with: { lines: { columns: { accountId: true } } },
    });
    if (!journal) {
      return { success: false, error: "Journal not found" };
    }
    if (journal.status !== "Draft") {
      return {
        success: false,
        error:
          "Only draft journals can be deleted. Posted or voided journals are locked.",
      };
    }

    const accountIds = Array.from(
      new Set(journal.lines.map((l) => l.accountId)),
    );

    await db
      .delete(glJournals)
      .where(
        and(
          eq(glJournals.id, id),
          eq(glJournals.organizationId, organizationId),
        ),
      );

    await Promise.all(
      accountIds.map((accId) =>
        recalculateAccountBalance(accId, organizationId),
      ),
    );

    revalidatePath("/finance/gl/journals");
    revalidatePath("/finance/gl/accounts");
    revalidatePath("/finance/gl/reports");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete journal:", error);
    return { success: false, error: "Failed to delete journal" };
  }
}

async function recalculateAccountBalance(
  accountId: number,
  organizationId: string,
) {
  // 1. Get Account Type
  const account = await db.query.glAccounts.findFirst({
    where: and(
      eq(glAccounts.id, accountId),
      eq(glAccounts.organizationId, organizationId),
    ),
    columns: { type: true },
  });
  if (!account) return;

  // 2. Sum Lines
  const result = await db
    .select({
      debitSum: sql<string>`sum(${glJournalLines.debit})`,
      creditSum: sql<string>`sum(${glJournalLines.credit})`,
    })
    .from(glJournalLines)
    .innerJoin(glJournals, eq(glJournalLines.journalId, glJournals.id))
    .where(
      and(
        eq(glJournalLines.accountId, accountId),
        eq(glJournalLines.organizationId, organizationId),
        // Only include Posted journals in the balance
        eq(glJournals.status, "Posted"),
      ),
    );

  const totalDebit = Number(result[0].debitSum || 0);
  const totalCredit = Number(result[0].creditSum || 0);

  let balance = 0;
  // Asset & Expense: Normal Debit Balance (Debit - Credit)
  if (["Asset", "Expense"].includes(account.type)) {
    balance = totalDebit - totalCredit;
  }
  // Liability, Equity, Income: Normal Credit Balance (Credit - Debit)
  // Note: Some systems show Liability as negative.
  // Here we usually want to show POSITIVE if it matches normal balance.
  // But if the UI expects a raw value where Asset is + and Liability is - (Net Worth style),
  // we would do Debit - Credit for everything.
  // Given standard accounting software UX, users often expect "Positive" means "Normal".
  // Let's stick to Normal Balance calculation.
  else {
    balance = totalCredit - totalDebit;
  }

  // 3. Update Account
  await db
    .update(glAccounts)
    .set({ currentBalance: String(balance) })
    .where(eq(glAccounts.id, accountId));
}
