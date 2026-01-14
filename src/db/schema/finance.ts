import { relations } from "drizzle-orm";
import {
  index,
  pgTable,
  serial,
  text,
  timestamp,
  numeric,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth";
import { vehicles, fleetExpenseCategoryEnum } from "./fleet";

export const companyBalance = pgTable("company_balance", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  balance: numeric("balance", { precision: 15, scale: 2 })
    .default("0")
    .notNull(),
  currency: text("currency").default("NGN").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const companyExpenses = pgTable(
  "company_expenses",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
    category: text("category"),
    expenseDate: timestamp("expense_date").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),

    // Fleet-specific fields
    isFleetExpense: boolean("is_fleet_expense").default(false).notNull(),
    vehicleId: integer("vehicle_id").references(() => vehicles.id, {
      onDelete: "set null",
    }),
    fleetExpenseCategory: fleetExpenseCategoryEnum("fleet_expense_category"),
  },
  (table) => [
    index("company_expenses_date_idx").on(table.expenseDate),
    index("company_expenses_vehicle_idx").on(table.vehicleId),
    index("company_expenses_fleet_idx").on(table.isFleetExpense),
  ],
);

export const companyExpensesRelations = relations(companyExpenses, () => ({}));

export const balanceTransactions = pgTable(
  "balance_transactions",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
    transactionType: text("transaction_type").notNull().default("top-up"), // top-up, expense, adjustment
    description: text("description"),
    balanceBefore: numeric("balance_before", {
      precision: 15,
      scale: 2,
    }).notNull(),
    balanceAfter: numeric("balance_after", {
      precision: 15,
      scale: 2,
    }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("balance_transactions_user_idx").on(table.userId),
    index("balance_transactions_date_idx").on(table.createdAt),
    index("balance_transactions_type_idx").on(table.transactionType),
  ],
);

export const balanceTransactionsRelations = relations(
  balanceTransactions,
  ({ one }) => ({
    user: one(user, {
      fields: [balanceTransactions.userId],
      references: [user.id],
    }),
  }),
);
