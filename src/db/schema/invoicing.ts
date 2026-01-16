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
  jsonb,
  boolean,
  unique,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth";

// ============================================
// ENUMS
// ============================================

export const invoicingStatusEnum = pgEnum("invoicing_status", [
  "Draft",
  "Sent",
  "Paid",
  "Overdue",
  "Cancelled",
  "Partially Paid",
]);

export const invoicingPaymentMethodEnum = pgEnum("invoicing_payment_method", [
  "Cash",
  "Bank Transfer",
  "Check",
  "Credit Card",
  "Debit Card",
  "Mobile Money",
  "Other",
]);

export const invoicingTemplateEnum = pgEnum("invoicing_template", [
  "Modern",
  "Classic",
  "Minimal",
  "Detailed",
  "Professional",
]);

export const invoicingDocumentTypeEnum = pgEnum("invoicing_document_type", [
  "Invoice PDF",
  "Payment Receipt",
  "Credit Note",
  "Tax Document",
  "Other",
]);

export const invoicingActivityTypeEnum = pgEnum("invoicing_activity_type", [
  "Invoice Created",
  "Invoice Sent",
  "Status Changed",
  "Payment Recorded",
  "Payment Deleted",
  "Email Sent",
  "Reminder Sent",
  "Invoice Updated",
  "Invoice Cancelled",
  "PDF Generated",
  "Client Updated",
  "Note Added",
]);

// ============================================
// TABLES
// ============================================

/**
 * Clients - Customer/client records
 */
export const clients = pgTable(
  "clients",
  {
    id: serial("id").primaryKey(),
    clientCode: text("client_code").notNull().unique(), // e.g., "CLI-2026-0001"
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    companyName: text("company_name"),
    taxId: text("tax_id"), // VAT/Tax ID number

    // Billing Address
    billingAddress: text("billing_address"),
    billingCity: text("billing_city"),
    billingState: text("billing_state"),
    billingPostalCode: text("billing_postal_code"),
    billingCountry: text("billing_country"),

    // Shipping Address (optional)
    shippingAddress: text("shipping_address"),
    shippingCity: text("shipping_city"),
    shippingState: text("shipping_state"),
    shippingPostalCode: text("shipping_postal_code"),
    shippingCountry: text("shipping_country"),

    // Additional Info
    website: text("website"),
    notes: text("notes"),
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
    index("clients_email_idx").on(table.email),
    index("clients_organization_idx").on(table.organizationId),
    index("clients_active_idx").on(table.isActive),
  ],
);

/**
 * Organization Currencies - Multi-currency support per organization
 */
export const organizationCurrencies = pgTable(
  "organization_currencies",
  {
    id: serial("id").primaryKey(),
    currencyCode: text("currency_code").notNull(), // USD, EUR, GBP, NGN, etc.
    currencySymbol: text("currency_symbol").notNull(), // $, €, £, ₦
    currencyName: text("currency_name").notNull(), // US Dollar, Euro, etc.
    isDefault: boolean("is_default").notNull().default(false),
    exchangeRate: numeric("exchange_rate", { scale: 6, precision: 12 }).default(
      "1.000000",
    ), // Rate to base currency

    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("org_currencies_organization_idx").on(table.organizationId),
    unique("org_currencies_org_code_idx").on(
      table.organizationId,
      table.currencyCode,
    ),
  ],
);

/**
 * Company Bank Accounts - Organization's bank accounts for receiving payments
 */
export const companyBankAccounts = pgTable(
  "company_bank_accounts",
  {
    id: serial("id").primaryKey(),
    accountName: text("account_name").notNull(), // e.g., "Business Checking"
    bankName: text("bank_name").notNull(),
    accountNumber: text("account_number").notNull(),
    routingNumber: text("routing_number"), // or Swift/IBAN
    swiftCode: text("swift_code"),
    currency: text("currency").notNull(), // e.g., "USD"

    // Organization Isolation
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    // Meta
    isDefault: boolean("is_default").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("company_bank_accounts_org_idx").on(table.organizationId),
    index("company_bank_accounts_active_idx").on(table.isActive),
  ],
);

/**
 * Invoices - Main invoice records
 */
export const receivablesInvoices = pgTable(
  "invoices",
  {
    id: serial("id").primaryKey(),
    invoiceNumber: text("invoice_number").notNull().unique(), // e.g., "LIG-2026-0001" (org-based)

    clientId: integer("client_id")
      .notNull()
      .references(() => clients.id, { onDelete: "restrict" }),

    // Bank Account to Credit
    bankAccountId: integer("bank_account_id").references(
      () => companyBankAccounts.id,
      { onDelete: "restrict" },
    ),

    // Dates
    invoiceDate: date("invoice_date").notNull(),
    dueDate: date("due_date").notNull(),

    // Status
    status: invoicingStatusEnum("status").notNull().default("Draft"),

    // Currency
    currencyId: integer("currency_id")
      .notNull()
      .references(() => organizationCurrencies.id, { onDelete: "restrict" }),

    // Amounts (all in selected currency)
    subtotal: numeric("subtotal", { scale: 2, precision: 12 })
      .notNull()
      .default("0.00"),
    // taxName and taxPercentage removed in favor of invoiceTaxes table
    taxAmount: numeric("tax_amount", { scale: 2, precision: 12 })
      .notNull()
      .default("0.00"), // Calculated (Sum of all taxes)
    total: numeric("total", { scale: 2, precision: 12 })
      .notNull()
      .default("0.00"), // subtotal + taxAmount

    // Payment Tracking
    amountPaid: numeric("amount_paid", { scale: 2, precision: 12 })
      .notNull()
      .default("0.00"),
    amountDue: numeric("amount_due", { scale: 2, precision: 12 })
      .notNull()
      .default("0.00"), // total - amountPaid

    // Additional Fields
    notes: text("notes"), // Internal notes
    termsAndConditions: text("terms_and_conditions"), // Payment terms
    footerNote: text("footer_note"), // Thank you message, etc.

    // PDF Template
    template: invoicingTemplateEnum("template").notNull().default("Modern"),
    pdfPath: text("pdf_path"), // R2 storage path

    // Email tracking
    emailSentAt: timestamp("email_sent_at"),
    emailSentCount: integer("email_sent_count").default(0).notNull(),
    lastReminderSentAt: timestamp("last_reminder_sent_at"),
    reminderCount: integer("reminder_count").default(0).notNull(),

    // Timestamps
    sentAt: timestamp("sent_at"), // When invoice was first sent
    paidAt: timestamp("paid_at"), // When fully paid
    cancelledAt: timestamp("cancelled_at"),

    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    updatedBy: text("updated_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("invoices_client_idx").on(table.clientId),
    index("invoices_status_idx").on(table.status),
    index("invoices_organization_idx").on(table.organizationId),
    index("invoices_due_date_idx").on(table.dueDate),
    index("invoices_invoice_date_idx").on(table.invoiceDate),
  ],
);

/**
 * Invoice Taxes - Multiple taxes per invoice
 */
export const invoiceTaxes = pgTable(
  "invoice_taxes",
  {
    id: serial("id").primaryKey(),
    invoiceId: integer("invoice_id")
      .notNull()
      .references(() => receivablesInvoices.id, { onDelete: "cascade" }),

    taxName: text("tax_name").notNull(), // e.g., "VAT", "Service Tax"
    taxPercentage: numeric("tax_percentage", {
      scale: 2,
      precision: 5,
    }).notNull(), // e.g., 15.00
    taxAmount: numeric("tax_amount", { scale: 2, precision: 12 }).notNull(), // Calculated amount for this tax

    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("invoice_taxes_invoice_idx").on(table.invoiceId),
    index("invoice_taxes_organization_idx").on(table.organizationId),
  ],
);

/**
 * Invoice Line Items - Products/Services on invoices
 */
export const invoiceLineItems = pgTable(
  "invoice_line_items",
  {
    id: serial("id").primaryKey(),
    invoiceId: integer("invoice_id")
      .notNull()
      .references(() => receivablesInvoices.id, { onDelete: "cascade" }),

    description: text("description").notNull(),
    quantity: numeric("quantity", { scale: 2, precision: 10 })
      .notNull()
      .default("1.00"),
    unitPrice: numeric("unit_price", { scale: 2, precision: 12 })
      .notNull()
      .default("0.00"),
    amount: numeric("amount", { scale: 2, precision: 12 })
      .notNull()
      .default("0.00"), // quantity * unitPrice

    sortOrder: integer("sort_order").notNull().default(0), // For ordering items

    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("invoice_line_items_invoice_idx").on(table.invoiceId),
    index("invoice_line_items_organization_idx").on(table.organizationId),
  ],
);

/**
 * Invoice Payments - Track partial and full payments
 */
export const invoicePayments = pgTable(
  "invoice_payments",
  {
    id: serial("id").primaryKey(),
    invoiceId: integer("invoice_id")
      .notNull()
      .references(() => receivablesInvoices.id, { onDelete: "cascade" }),

    amount: numeric("amount", { scale: 2, precision: 12 }).notNull(),
    paymentDate: date("payment_date").notNull(),
    paymentMethod: invoicingPaymentMethodEnum("payment_method").notNull(),
    referenceNumber: text("reference_number"), // Check number, transaction ID, etc.
    notes: text("notes"),

    recordedBy: text("recorded_by").references(() => user.id, {
      onDelete: "set null",
    }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("invoice_payments_invoice_idx").on(table.invoiceId),
    index("invoice_payments_date_idx").on(table.paymentDate),
    index("invoice_payments_organization_idx").on(table.organizationId),
  ],
);

/**
 * Invoice Documents - PDFs and other attachments
 */
export const invoiceDocuments = pgTable(
  "invoice_documents",
  {
    id: serial("id").primaryKey(),
    invoiceId: integer("invoice_id")
      .notNull()
      .references(() => receivablesInvoices.id, { onDelete: "cascade" }),

    documentType: invoicingDocumentTypeEnum("document_type").notNull(),
    documentName: text("document_name").notNull(),
    originalFileName: text("original_file_name").notNull(),
    filePath: text("file_path").notNull(), // R2 storage path
    fileSize: numeric("file_size", { scale: 2, precision: 10 }).notNull(),
    mimeType: text("mime_type"),

    uploadedBy: text("uploaded_by").references(() => user.id, {
      onDelete: "set null",
    }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("invoice_documents_invoice_idx").on(table.invoiceId),
    index("invoice_documents_organization_idx").on(table.organizationId),
  ],
);

/**
 * Invoice Activity Log - Audit trail for all invoice actions
 */
export const invoiceActivityLog = pgTable(
  "invoice_activity_log",
  {
    id: serial("id").primaryKey(),
    invoiceId: integer("invoice_id")
      .notNull()
      .references(() => receivablesInvoices.id, { onDelete: "cascade" }),

    activityType: invoicingActivityTypeEnum("activity_type").notNull(),
    description: text("description").notNull(),
    performedBy: text("performed_by").references(() => user.id, {
      onDelete: "set null",
    }),
    metadata: jsonb("metadata"), // Store additional data (e.g., previous/new values)

    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("invoice_activity_invoice_idx").on(table.invoiceId),
    index("invoice_activity_type_idx").on(table.activityType),
    index("invoice_activity_organization_idx").on(table.organizationId),
  ],
);

/**
 * Invoice Metrics - Cached metrics for dashboard performance
 */
export const invoiceMetrics = pgTable(
  "invoice_metrics",
  {
    id: serial("id").primaryKey(),

    // Revenue Metrics
    totalRevenue: numeric("total_revenue", { scale: 2, precision: 12 })
      .default("0.00")
      .notNull(),
    paidRevenue: numeric("paid_revenue", { scale: 2, precision: 12 })
      .default("0.00")
      .notNull(),
    pendingRevenue: numeric("pending_revenue", { scale: 2, precision: 12 })
      .default("0.00")
      .notNull(),
    overdueRevenue: numeric("overdue_revenue", { scale: 2, precision: 12 })
      .default("0.00")
      .notNull(),

    // Count Metrics
    totalInvoices: integer("total_invoices").default(0).notNull(),
    draftInvoices: integer("draft_invoices").default(0).notNull(),
    sentInvoices: integer("sent_invoices").default(0).notNull(),
    paidInvoices: integer("paid_invoices").default(0).notNull(),
    overdueInvoices: integer("overdue_invoices").default(0).notNull(),
    partiallyPaidInvoices: integer("partially_paid_invoices")
      .default(0)
      .notNull(),
    cancelledInvoices: integer("cancelled_invoices").default(0).notNull(),

    // Time-based Metrics
    avgPaymentTime: integer("avg_payment_time").default(0), // in days
    avgInvoiceValue: numeric("avg_invoice_value", {
      scale: 2,
      precision: 12,
    }).default("0.00"),

    // Client Metrics
    totalClients: integer("total_clients").default(0).notNull(),
    activeClients: integer("active_clients").default(0).notNull(),

    // Period tracking (for time-series analytics)
    periodType: text("period_type").notNull(), // "all-time", "year", "month", "week"
    periodValue: text("period_value"), // e.g., "2026", "2026-01", "2026-W01"

    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    lastUpdated: timestamp("last_updated")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("invoice_metrics_organization_idx").on(table.organizationId),
    index("invoice_metrics_period_idx").on(table.periodType, table.periodValue),
    unique("invoice_metrics_org_period_idx").on(
      table.organizationId,
      table.periodType,
      table.periodValue,
    ),
  ],
);

// ============================================
// RELATIONS
// ============================================

export const clientsRelations = relations(clients, ({ many }) => ({
  invoices: many(receivablesInvoices),
}));

export const organizationCurrenciesRelations = relations(
  organizationCurrencies,
  ({ many }) => ({
    invoices: many(receivablesInvoices),
  }),
);

export const companyBankAccountsRelations = relations(
  companyBankAccounts,
  ({ many }) => ({
    invoices: many(receivablesInvoices),
  }),
);

export const invoicesRelations = relations(
  receivablesInvoices,
  ({ one, many }) => ({
    client: one(clients, {
      fields: [receivablesInvoices.clientId],
      references: [clients.id],
    }),
    bankAccount: one(companyBankAccounts, {
      fields: [receivablesInvoices.bankAccountId],
      references: [companyBankAccounts.id],
    }),
    currency: one(organizationCurrencies, {
      fields: [receivablesInvoices.currencyId],
      references: [organizationCurrencies.id],
    }),
    createdByUser: one(user, {
      fields: [receivablesInvoices.createdBy],
      references: [user.id],
    }),
    updatedByUser: one(user, {
      fields: [receivablesInvoices.updatedBy],
      references: [user.id],
    }),
    lineItems: many(invoiceLineItems),
    taxes: many(invoiceTaxes),
    payments: many(invoicePayments),
    documents: many(invoiceDocuments),
    activityLog: many(invoiceActivityLog),
  }),
);

export const invoiceTaxesRelations = relations(invoiceTaxes, ({ one }) => ({
  invoice: one(receivablesInvoices, {
    fields: [invoiceTaxes.invoiceId],
    references: [receivablesInvoices.id],
  }),
}));

export const invoiceLineItemsRelations = relations(
  invoiceLineItems,
  ({ one }) => ({
    invoice: one(receivablesInvoices, {
      fields: [invoiceLineItems.invoiceId],
      references: [receivablesInvoices.id],
    }),
  }),
);

export const invoicePaymentsRelations = relations(
  invoicePayments,
  ({ one }) => ({
    invoice: one(receivablesInvoices, {
      fields: [invoicePayments.invoiceId],
      references: [receivablesInvoices.id],
    }),
    recordedByUser: one(user, {
      fields: [invoicePayments.recordedBy],
      references: [user.id],
    }),
  }),
);

export const invoiceDocumentsRelations = relations(
  invoiceDocuments,
  ({ one }) => ({
    invoice: one(receivablesInvoices, {
      fields: [invoiceDocuments.invoiceId],
      references: [receivablesInvoices.id],
    }),
    uploadedByUser: one(user, {
      fields: [invoiceDocuments.uploadedBy],
      references: [user.id],
    }),
  }),
);

export const invoiceActivityLogRelations = relations(
  invoiceActivityLog,
  ({ one }) => ({
    invoice: one(receivablesInvoices, {
      fields: [invoiceActivityLog.invoiceId],
      references: [receivablesInvoices.id],
    }),
    performedByUser: one(user, {
      fields: [invoiceActivityLog.performedBy],
      references: [user.id],
    }),
  }),
);
