"use server";

import { db } from "@/db";
import {
  glAccounts,
  glJournalLines,
  glJournals,
} from "@/db/schema/general-ledger";
import { eq, and, asc, desc, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

/** Default GL accounts created for every organization. Used by receivables, payables, and manual journals. */
const DEFAULT_GL_ACCOUNTS = [
  {
    code: "1000",
    name: "Cash / Bank",
    type: "Asset" as const,
    accountClass: "Current Asset" as const,
    description:
      "Payment received (debit). Used when recording customer payments.",
    isSystem: true,
  },
  {
    code: "1200",
    name: "Accounts Receivable",
    type: "Asset" as const,
    accountClass: "Current Asset" as const,
    description:
      "Invoice sent (debit), payment (credit). Amounts owed by customers.",
    isSystem: true,
  },
  {
    code: "2000",
    name: "Accounts Payable",
    type: "Liability" as const,
    accountClass: "Current Liability" as const,
    description: "Bill (credit), payment (debit). Amounts owed to vendors.",
    isSystem: true,
  },
  {
    code: "4000",
    name: "Sales Revenue",
    type: "Income" as const,
    accountClass: "Revenue" as const,
    description: "Invoice sent (credit). Revenue from sales.",
    isSystem: true,
  },
  {
    code: "6000",
    name: "Expenses",
    type: "Expense" as const,
    accountClass: "Expense" as const,
    description: "Bill (debit). Operating and cost of goods expenses.",
    isSystem: true,
  },
];

/**
 * Ensures every organization has the default GL accounts (1000, 1200, 2000, 4000, 6000).
 * Called when loading the Chart of Accounts so every user/org gets them automatically.
 * System accounts are not deletable.
 */
export async function ensureDefaultGLAccounts(
  organizationId: string,
): Promise<void> {
  const existing = await db.query.glAccounts.findMany({
    where: eq(glAccounts.organizationId, organizationId),
    columns: { code: true },
  });
  const existingCodes = new Set(existing.map((a) => a.code));

  const toInsert = DEFAULT_GL_ACCOUNTS.filter(
    (a) => !existingCodes.has(a.code),
  );
  if (toInsert.length === 0) return;

  await db.insert(glAccounts).values(
    toInsert.map((a) => ({
      organizationId,
      code: a.code,
      name: a.name,
      type: a.type,
      accountClass: a.accountClass,
      description: a.description,
      isSystem: a.isSystem,
      currentBalance: "0.00",
      allowManualJournals: true,
    })),
  );
}

const accountSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["Asset", "Liability", "Equity", "Income", "Expense"]),
  accountClass: z
    .enum([
      "Current Asset",
      "Non-Current Asset",
      "Current Liability",
      "Non-Current Liability",
      "Equity",
      "Revenue",
      "Cost of Goods Sold",
      "Expense",
      "Other Income",
      "Other Expense",
    ])
    .optional(),
  description: z.string().optional(),
  parentId: z.number().optional(),
  allowManualJournals: z.boolean().default(true),
  organizationId: z.string().min(1),
});

export type AccountFormValues = z.infer<typeof accountSchema>;

export async function createAccount(data: AccountFormValues) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.session?.activeOrganizationId) {
      return { success: false, error: "Unauthorized: No active organization" };
    }

    const validated = accountSchema.parse({
      ...data,
      organizationId: session.session.activeOrganizationId,
    });

    // Check for duplicate code
    const existing = await db.query.glAccounts.findFirst({
      where: and(
        eq(glAccounts.organizationId, validated.organizationId),
        eq(glAccounts.code, validated.code),
      ),
    });

    if (existing) {
      return { success: false, error: "Account code already exists" };
    }

    await db.insert(glAccounts).values({
      ...validated,
      currentBalance: "0.00",
    });

    revalidatePath("/finance/gl/accounts");
    return { success: true };
  } catch (error) {
    console.error("Failed to create account:", error);
    return { success: false, error: "Failed to create account" };
  }
}

export async function updateAccount(
  id: number,
  data: Partial<AccountFormValues>,
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const organizationId = session?.session?.activeOrganizationId;
    if (!organizationId) {
      return { success: false, error: "Unauthorized: No active organization" };
    }

    const account = await db.query.glAccounts.findFirst({
      where: and(
        eq(glAccounts.id, id),
        eq(glAccounts.organizationId, organizationId),
      ),
      columns: { isSystem: true },
    });
    if (!account) {
      return { success: false, error: "Account not found" };
    }
    if (account.isSystem) {
      return {
        success: false,
        error:
          "System default accounts cannot be edited. You can add custom accounts instead.",
      };
    }

    await db
      .update(glAccounts)
      .set(data)
      .where(
        and(
          eq(glAccounts.id, id),
          eq(glAccounts.organizationId, organizationId),
        ),
      );

    revalidatePath("/finance/gl/accounts");
    return { success: true };
  } catch (error) {
    console.error("Failed to update account:", error);
    return { success: false, error: "Failed to update account" };
  }
}

export async function deleteAccount(id: number, passedOrgId?: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const organizationId =
      session?.session?.activeOrganizationId ?? passedOrgId;
    if (!organizationId) {
      return { success: false, error: "Unauthorized: No active organization" };
    }

    const account = await db.query.glAccounts.findFirst({
      where: and(
        eq(glAccounts.id, id),
        eq(glAccounts.organizationId, organizationId),
      ),
      columns: { isSystem: true, code: true },
    });
    if (!account) {
      return { success: false, error: "Account not found" };
    }
    if (account.isSystem) {
      return {
        success: false,
        error:
          "System default accounts (1000, 1200, 2000, 4000, 6000) cannot be deleted. They are required for invoicing and payables.",
      };
    }

    await db
      .delete(glAccounts)
      .where(
        and(
          eq(glAccounts.id, id),
          eq(glAccounts.organizationId, organizationId),
        ),
      );

    revalidatePath("/finance/gl/accounts");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete account:", error);
    return { success: false, error: "Failed to delete account" };
  }
}

export async function getChartOfAccounts(passedOrgId?: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const organizationId =
      session?.session?.activeOrganizationId ?? passedOrgId;
    if (!organizationId) {
      return { success: false, error: "Unauthorized: No active organization" };
    }

    await ensureDefaultGLAccounts(organizationId);

    const accounts = await db.query.glAccounts.findMany({
      where: eq(glAccounts.organizationId, organizationId),
      orderBy: asc(glAccounts.code),
      with: {
        parent: true,
        subAccounts: true,
      },
    });
    return { success: true, data: accounts };
  } catch (error) {
    console.error("Failed to get accounts:", error);
    return { success: false, error: "Failed to get accounts" };
  }
}

/**
 * Get a single GL account by id (for account detail view).
 */
export async function getGLAccount(id: number, passedOrgId?: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const organizationId =
      session?.session?.activeOrganizationId ?? passedOrgId;
    if (!organizationId) {
      return { success: false, error: "Unauthorized", data: null };
    }

    const account = await db.query.glAccounts.findFirst({
      where: and(
        eq(glAccounts.id, id),
        eq(glAccounts.organizationId, organizationId),
      ),
      with: {
        parent: true,
        subAccounts: true,
      },
    });
    return account
      ? { success: true, data: account }
      : { success: false, error: "Account not found", data: null };
  } catch (error) {
    console.error("Failed to get account:", error);
    return { success: false, error: "Failed to get account", data: null };
  }
}

/**
 * Get transaction history (journal lines) for a GL account.
 * Optional startDate/endDate in YYYY-MM-DD format to filter by journal transaction date.
 */
export async function getGLAccountActivity(
  accountId: number,
  passedOrgId?: string,
  limit = 50,
  startDate?: string,
  endDate?: string,
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const organizationId =
      session?.session?.activeOrganizationId ?? passedOrgId;
    if (!organizationId) {
      return { success: false, error: "Unauthorized", data: [] };
    }

    const conditions = [
      eq(glJournalLines.accountId, accountId),
      eq(glJournalLines.organizationId, organizationId),
    ];
    if (startDate) {
      conditions.push(gte(glJournals.transactionDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(glJournals.transactionDate, endDate));
    }

    const lines = await db
      .select({
        id: glJournalLines.id,
        journalId: glJournalLines.journalId,
        description: glJournalLines.description,
        debit: glJournalLines.debit,
        credit: glJournalLines.credit,
        journalNumber: glJournals.journalNumber,
        journalDescription: glJournals.description,
        transactionDate: glJournals.transactionDate,
        source: glJournals.source,
        status: glJournals.status,
      })
      .from(glJournalLines)
      .innerJoin(glJournals, eq(glJournalLines.journalId, glJournals.id))
      .where(and(...conditions))
      .orderBy(desc(glJournals.transactionDate), desc(glJournalLines.id))
      .limit(limit);

    return { success: true, data: lines };
  } catch (error) {
    console.error("Failed to get account activity:", error);
    return { success: false, error: "Failed to get activity", data: [] };
  }
}
