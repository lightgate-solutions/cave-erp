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
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth";
import { companyBankAccounts, organizationCurrencies } from "./invoicing";

// ============================================
// ENUMS
// ============================================

export const billStatusEnum = pgEnum("bill_status", [
  "Draft",
  "Open",
  "Paid",
  "Overdue",
  "Partially Paid",
  "Void",
]);

export const billPaymentMethodEnum = pgEnum("bill_payment_method", [
  "Cash",
  "Bank Transfer",
  "Check",
  "Credit Card",
  "Debit Card",
  "Mobile Money",
  "Other",
]);

// ============================================
// TABLES
// ============================================

/**
 * Suppliers - Vendor records
 */
export const suppliers = pgTable(
  "suppliers",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    taxId: text("tax_id"), // VAT/Tax ID number

    // Address
    address: text("address"),
    city: text("city"),
    state: text("state"),
    postalCode: text("postal_code"),
    country: text("country"),

    // Financial Details
    currencyId: integer("currency_id").references(
      () => organizationCurrencies.id,
      { onDelete: "set null" },
    ),

    paymentTerms: text("payment_terms"), // e.g. "Net 30"

    notes: text("notes"),
    website: text("website"),

    isActive: boolean("is_active").notNull().default(true),

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
    index("suppliers_org_idx").on(table.organizationId),
    index("suppliers_active_idx").on(table.isActive),
  ],
);

/**
 * Bills - Purchase Invoices (Payables)
 */
export const bills = pgTable(
  "bills",
  {
    id: serial("id").primaryKey(),
    billNumber: text("bill_number").notNull(), // Vendor's invoice number or internal reference

    supplierId: integer("supplier_id")
      .notNull()
      .references(() => suppliers.id, { onDelete: "restrict" }),

    // Dates
    billDate: date("bill_date").notNull(),
    dueDate: date("due_date").notNull(),

    // Status
    status: billStatusEnum("status").notNull().default("Draft"),

    // Currency
    currencyId: integer("currency_id")
      .notNull()
      .references(() => organizationCurrencies.id, { onDelete: "restrict" }),

    // Amounts
    subtotal: numeric("subtotal", { scale: 2, precision: 12 })
      .notNull()
      .default("0.00"),
    taxAmount: numeric("tax_amount", { scale: 2, precision: 12 })
      .notNull()
      .default("0.00"),
    total: numeric("total", { scale: 2, precision: 12 })
      .notNull()
      .default("0.00"),

    // Payment Tracking
    amountPaid: numeric("amount_paid", { scale: 2, precision: 12 })
      .notNull()
      .default("0.00"),
    amountDue: numeric("amount_due", { scale: 2, precision: 12 })
      .notNull()
      .default("0.00"),

    notes: text("notes"),

    // Attachments (URL to file)
    attachmentPath: text("attachment_path"),

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
    index("bills_supplier_idx").on(table.supplierId),
    index("bills_status_idx").on(table.status),
    index("bills_org_idx").on(table.organizationId),
    index("bills_due_date_idx").on(table.dueDate),
    // Ensure uniqueness of bill number per supplier? Or per Org?
    // Usually vendors have their own numbers, but we might want to ensure we don't accidentally double entry.
    // For now, let's keep it simple.
  ],
);

/**
 * Bill Items - Line items on bills
 */
export const billItems = pgTable(
  "bill_items",
  {
    id: serial("id").primaryKey(),
    billId: integer("bill_id")
      .notNull()
      .references(() => bills.id, { onDelete: "cascade" }),

    description: text("description").notNull(),

    // Could link to a Chart of Accounts or Expense Category later
    category: text("category"),

    quantity: numeric("quantity", { scale: 2, precision: 10 })
      .notNull()
      .default("1.00"),
    unitPrice: numeric("unit_price", { scale: 2, precision: 12 })
      .notNull()
      .default("0.00"),
    amount: numeric("amount", { scale: 2, precision: 12 })
      .notNull()
      .default("0.00"),

    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("bill_items_bill_idx").on(table.billId)],
);

/**
 * Bill Payments - Outgoing payments
 */
export const billPayments = pgTable(
  "bill_payments",
  {
    id: serial("id").primaryKey(),
    billId: integer("bill_id")
      .notNull()
      .references(() => bills.id, { onDelete: "cascade" }),

    amount: numeric("amount", { scale: 2, precision: 12 }).notNull(),
    paymentDate: date("payment_date").notNull(),
    paymentMethod: billPaymentMethodEnum("payment_method").notNull(),
    referenceNumber: text("reference_number"), // Check #, Wire Ref

    // Source Account
    bankAccountId: integer("bank_account_id").references(
      () => companyBankAccounts.id,
      { onDelete: "restrict" },
    ),

    notes: text("notes"),

    recordedBy: text("recorded_by").references(() => user.id, {
      onDelete: "set null",
    }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("bill_payments_bill_idx").on(table.billId),
    index("bill_payments_org_idx").on(table.organizationId),
    index("bill_payments_date_idx").on(table.paymentDate),
  ],
);

// ============================================
// RELATIONS
// ============================================

export const suppliersRelations = relations(suppliers, ({ many, one }) => ({
  bills: many(bills),
  currency: one(organizationCurrencies, {
    fields: [suppliers.currencyId],
    references: [organizationCurrencies.id],
  }),
}));

export const billsRelations = relations(bills, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [bills.supplierId],
    references: [suppliers.id],
  }),
  currency: one(organizationCurrencies, {
    fields: [bills.currencyId],
    references: [organizationCurrencies.id],
  }),
  items: many(billItems),
  payments: many(billPayments),
  createdByUser: one(user, {
    fields: [bills.createdBy],
    references: [user.id],
  }),
}));

export const billItemsRelations = relations(billItems, ({ one }) => ({
  bill: one(bills, {
    fields: [billItems.billId],
    references: [bills.id],
  }),
}));

export const billPaymentsRelations = relations(billPayments, ({ one }) => ({
  bill: one(bills, {
    fields: [billPayments.billId],
    references: [bills.id],
  }),
  bankAccount: one(companyBankAccounts, {
    fields: [billPayments.bankAccountId],
    references: [companyBankAccounts.id],
  }),
  recordedByUser: one(user, {
    fields: [billPayments.recordedBy],
    references: [user.id],
  }),
}));
