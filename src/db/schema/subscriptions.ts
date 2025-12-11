import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { member, organization, user } from "./auth";

export const subscriptionPlanEnum = pgEnum("subscription_plan", [
  "free",
  "pro",
  "proAI",
  "premium",
  "premiumAI",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "inactive",
  "past_due",
  "canceled",
  "trialing",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "open",
  "paid",
  "uncollectible",
  "void",
]);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" })
      .unique(),
    paystackSubscriptionCode: text("paystack_subscription_code").unique(),
    plan: subscriptionPlanEnum("plan").notNull().default("free"),
    status: subscriptionStatusEnum("status").notNull().default("inactive"),
    pricePerMember: numeric("price_per_member", { precision: 10, scale: 2 })
      .notNull()
      .default("0.00"),
    trialEnd: timestamp("trial_end"),
    currentPeriodStart: timestamp("current_period_start"),
    currentPeriodEnd: timestamp("current_period_end"),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
    canceledAt: timestamp("canceled_at"),
    billingAnniversaryDay: integer("billing_anniversary_day"),
    lastInvoicedAt: timestamp("last_invoiced_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    paystackSubscriptionCodeIdx: index("paystack_subscription_code_idx").on(
      table.paystackSubscriptionCode,
    ),
  }),
);

export const invoices = pgTable(
  "invoices",
  {
    id: text("id").primaryKey(),
    subscriptionId: text("subscription_id")
      .notNull()
      .references(() => subscriptions.id, { onDelete: "cascade" }),
    status: invoiceStatusEnum("status").notNull().default("draft"),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("NGN"),
    billingPeriodStart: timestamp("billing_period_start").notNull(),
    billingPeriodEnd: timestamp("billing_period_end").notNull(),
    dueDate: date("due_date"),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    subscriptionIdx: index("invoice_subscription_idx").on(table.subscriptionId),
  }),
);

export const invoiceItems = pgTable(
  "invoice_items",
  {
    id: text("id").primaryKey(),
    invoiceId: text("invoice_id")
      .notNull()
      .references(() => invoices.id, { onDelete: "cascade" }),
    memberId: text("member_id").references(() => member.id, {
      onDelete: "set null",
    }),
    organizationId: text("organization_id").references(() => organization.id, {
      onDelete: "set null",
    }),
    description: text("description").notNull(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    prorated: boolean("prorated").default(false),
    billingPeriodStart: timestamp("billing_period_start").notNull(),
    billingPeriodEnd: timestamp("billing_period_end").notNull(),
  },
  (table) => ({
    invoiceIdx: index("invoice_item_invoice_idx").on(table.invoiceId),
  }),
);

export const subscriptionRelations = relations(
  subscriptions,
  ({ one, many }) => ({
    user: one(user, {
      fields: [subscriptions.userId],
      references: [user.id],
    }),
    invoices: many(invoices),
  }),
);

export const invoiceRelations = relations(invoices, ({ one, many }) => ({
  subscription: one(subscriptions, {
    fields: [invoices.subscriptionId],
    references: [subscriptions.id],
  }),
  items: many(invoiceItems),
}));

export const invoiceItemRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  member: one(member, {
    fields: [invoiceItems.memberId],
    references: [member.id],
  }),
  organization: one(organization, {
    fields: [invoiceItems.organizationId],
    references: [organization.id],
  }),
}));
