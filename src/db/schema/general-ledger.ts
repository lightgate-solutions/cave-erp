import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  index,
  integer,
  serial,
  date,
  numeric,
  boolean,
  unique,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth";

// ============================================
// ENUMS
// ============================================

export const glAccountTypeEnum = pgEnum("gl_account_type", [
  "Asset",
  "Liability",
  "Equity",
  "Income",
  "Expense",
]);

export const glAccountClassEnum = pgEnum("gl_account_class", [
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
]);

export const glJournalStatusEnum = pgEnum("gl_journal_status", [
  "Draft",
  "Posted",
  "Voided",
]);

export const glJournalSourceEnum = pgEnum("gl_journal_source", [
  "Manual",
  "Payables",
  "Receivables",
  "Payroll",
  "Inventory",
  "Fixed Assets",
  "Banking",
  "System",
]);

export const glPeriodStatusEnum = pgEnum("gl_period_status", [
  "Open",
  "Closed",
  "Locked",
]);

// ============================================
// TABLES
// ============================================

/**
 * Chart of Accounts (COA)
 */
export const glAccounts = pgTable(
  "gl_accounts",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull(), // e.g., "1000", "2000"
    name: text("name").notNull(), // e.g., "Cash on Hand", "Sales Revenue"
    type: glAccountTypeEnum("type").notNull(),
    accountClass: glAccountClassEnum("account_class"), // More granular classification
    description: text("description"),

    // Hierarchy
    parentId: integer("parent_id"), // Self-reference for sub-accounts

    // Status
    isActive: boolean("is_active").notNull().default(true),
    isSystem: boolean("is_system").notNull().default(false), // Prevent deletion of system accounts
    allowManualJournals: boolean("allow_manual_journals")
      .notNull()
      .default(true),

    // Balances (Denormalized for performance, updated via triggers or application logic)
    currentBalance: numeric("current_balance", { scale: 2, precision: 15 })
      .notNull()
      .default("0.00"),
    currency: text("currency").notNull().default("NGN"), // Base currency

    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("gl_accounts_org_idx").on(table.organizationId),
    index("gl_accounts_code_idx").on(table.organizationId, table.code), // Unique per org logically, enforced via unique below
    unique("gl_accounts_org_code_unique").on(table.organizationId, table.code),
    index("gl_accounts_type_idx").on(table.type),
    index("gl_accounts_parent_idx").on(table.parentId),
  ],
);

/**
 * General Ledger Journals (Header)
 */
export const glJournals = pgTable(
  "gl_journals",
  {
    id: serial("id").primaryKey(),
    journalNumber: text("journal_number").notNull(), // Generated Sequence e.g., JE-2026-0001
    transactionDate: date("transaction_date").notNull(),
    postingDate: date("posting_date").notNull(), // Usually same as transaction date

    description: text("description").notNull(),
    reference: text("reference"), // Source Doc # like Inv # or Bill #

    source: glJournalSourceEnum("source").notNull().default("Manual"),
    sourceId: text("source_id"), // ID of the source record (e.g. invoice ID) in string format for flexibility

    status: glJournalStatusEnum("status").notNull().default("Draft"),

    totalDebits: numeric("total_debits", { scale: 2, precision: 15 })
      .notNull()
      .default("0.00"),
    totalCredits: numeric("total_credits", { scale: 2, precision: 15 })
      .notNull()
      .default("0.00"),

    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    postedBy: text("posted_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("gl_journals_org_idx").on(table.organizationId),
    index("gl_journals_date_idx").on(table.transactionDate),
    index("gl_journals_source_idx").on(table.source, table.sourceId),
    unique("gl_journals_org_number_unique").on(
      table.organizationId,
      table.journalNumber,
    ),
  ],
);

/**
 * General Ledger Journal Lines (Debits/Credits)
 */
export const glJournalLines = pgTable(
  "gl_journal_lines",
  {
    id: serial("id").primaryKey(),
    journalId: integer("journal_id")
      .notNull()
      .references(() => glJournals.id, { onDelete: "cascade" }),
    accountId: integer("account_id")
      .notNull()
      .references(() => glAccounts.id, { onDelete: "restrict" }),

    description: text("description"), // Line-level description

    debit: numeric("debit", { scale: 2, precision: 15 })
      .notNull()
      .default("0.00"),
    credit: numeric("credit", { scale: 2, precision: 15 })
      .notNull()
      .default("0.00"),

    // Dimensions for reporting
    entityId: text("entity_id"), // Branch/Entity logic if needed

    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("gl_journal_lines_journal_idx").on(table.journalId),
    index("gl_journal_lines_account_idx").on(table.accountId),
    index("gl_journal_lines_org_idx").on(table.organizationId),
  ],
);

/**
 * Financial Periods
 */
export const glPeriods = pgTable(
  "gl_periods",
  {
    id: serial("id").primaryKey(),
    periodName: text("period_name").notNull(), // e.g., "Jan 2026", "Q1 2026"
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),

    status: glPeriodStatusEnum("status").notNull().default("Open"),

    isYearEnd: boolean("is_year_end").notNull().default(false), // Flag for year-end closing periods

    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    closedBy: text("closed_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("gl_periods_org_idx").on(table.organizationId),
    index("gl_periods_date_idx").on(table.startDate, table.endDate),
    unique("gl_periods_org_name_unique").on(
      table.organizationId,
      table.periodName,
    ),
  ],
);

// ============================================
// RELATIONS
// ============================================

export const glAccountsRelations = relations(glAccounts, ({ one, many }) => ({
  parent: one(glAccounts, {
    fields: [glAccounts.parentId],
    references: [glAccounts.id],
    relationName: "subAccounts",
  }),
  subAccounts: many(glAccounts, { relationName: "subAccounts" }),
  journalLines: many(glJournalLines),
}));

export const glJournalsRelations = relations(glJournals, ({ one, many }) => ({
  lines: many(glJournalLines),
  createdByUser: one(user, {
    fields: [glJournals.createdBy],
    references: [user.id],
    relationName: "journalCreatedBy",
  }),
  postedByUser: one(user, {
    fields: [glJournals.postedBy],
    references: [user.id],
    relationName: "journalPostedBy",
  }),
}));

export const glJournalLinesRelations = relations(glJournalLines, ({ one }) => ({
  journal: one(glJournals, {
    fields: [glJournalLines.journalId],
    references: [glJournals.id],
  }),
  account: one(glAccounts, {
    fields: [glJournalLines.accountId],
    references: [glAccounts.id],
  }),
}));
