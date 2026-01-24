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
import { organizationCurrencies, companyBankAccounts } from "./invoicing";

// ============================================
// ENUMS
// ============================================

export const vendorCategoryEnum = pgEnum("vendor_category", [
  "Services",
  "Goods",
  "Utilities",
  "Custom",
]);

export const vendorStatusEnum = pgEnum("vendor_status", [
  "Active",
  "Inactive",
  "Suspended",
  "Archived",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
  "Bank Transfer",
  "Wire",
  "Check",
  "Cash",
]);

export const poStatusEnum = pgEnum("po_status", [
  "Draft",
  "Pending Approval",
  "Approved",
  "Sent",
  "Partially Received",
  "Received",
  "Closed",
  "Cancelled",
]);

export const billStatusEnum = pgEnum("bill_status", [
  "Draft",
  "Pending",
  "Approved",
  "Paid",
  "Overdue",
  "Cancelled",
  "Partially Paid",
]);

export const billTaxTypeEnum = pgEnum("bill_tax_type", [
  "VAT",
  "WHT",
  "Sales Tax",
  "GST",
  "Custom",
]);

export const billDocumentTypeEnum = pgEnum("bill_document_type", [
  "Vendor Invoice",
  "Payment Receipt",
  "Tax Document",
  "Delivery Note",
  "Other",
]);

export const billActivityTypeEnum = pgEnum("bill_activity_type", [
  "Bill Created",
  "Bill Approved",
  "Status Changed",
  "Payment Recorded",
  "Payment Deleted",
  "Email Sent",
  "Bill Updated",
  "Bill Cancelled",
  "Note Added",
  "PO Matched",
]);

// ============================================
// TABLES
// ============================================

/**
 * Vendors - Supplier/vendor records
 */
export const vendors = pgTable(
  "vendors",
  {
    id: serial("id").primaryKey(),
    vendorCode: text("vendor_code").notNull().unique(), // e.g., "VEN-2026-0001"
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    companyName: text("company_name"),

    // Tax & Compliance
    taxId: text("tax_id"), // VAT/Tax ID number
    cacNumber: text("cac_number"), // Corporate Affairs Commission number

    // Category
    category: vendorCategoryEnum("category").notNull(),
    customCategory: text("custom_category"), // For user-defined categories

    // Billing Address
    billingAddress: text("billing_address"),
    billingCity: text("billing_city"),
    billingState: text("billing_state"),
    billingPostalCode: text("billing_postal_code"),
    billingCountry: text("billing_country"),

    // Additional Info
    website: text("website"),
    notes: text("notes"),

    // Status
    status: vendorStatusEnum("status").notNull().default("Active"),

    // Payment Terms
    defaultPaymentTerms: text("default_payment_terms"), // "Net 30", "Net 60", etc.
    defaultPaymentMethod: paymentMethodEnum("default_payment_method"),

    // Multi-tenancy
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
    index("vendors_email_idx").on(table.email),
    index("vendors_organization_idx").on(table.organizationId),
    index("vendors_category_idx").on(table.category),
    index("vendors_status_idx").on(table.status),
  ],
);

/**
 * Vendor Contacts - Multiple contact persons per vendor
 */
export const vendorContacts = pgTable(
  "vendor_contacts",
  {
    id: serial("id").primaryKey(),
    vendorId: integer("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    role: text("role"), // "AP Contact", "Sales Rep", "Manager", etc.
    isPrimary: boolean("is_primary").notNull().default(false),

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
    index("vendor_contacts_vendor_idx").on(table.vendorId),
    index("vendor_contacts_organization_idx").on(table.organizationId),
  ],
);

/**
 * Vendor Bank Accounts - Multiple bank accounts per vendor for payments
 */
export const vendorBankAccounts = pgTable(
  "vendor_bank_accounts",
  {
    id: serial("id").primaryKey(),
    vendorId: integer("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "cascade" }),

    accountName: text("account_name").notNull(), // e.g., "Primary Operations Account"
    bankName: text("bank_name").notNull(),
    accountNumber: text("account_number").notNull(),
    routingNumber: text("routing_number"), // or Sort Code
    swiftCode: text("swift_code"),
    iban: text("iban"),
    currency: text("currency").notNull(), // e.g., "USD"

    isDefault: boolean("is_default").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),

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
    index("vendor_bank_accounts_vendor_idx").on(table.vendorId),
    index("vendor_bank_accounts_organization_idx").on(table.organizationId),
    index("vendor_bank_accounts_active_idx").on(table.isActive),
  ],
);

/**
 * Purchase Orders - Track POs for 3-way matching
 */
export const purchaseOrders = pgTable(
  "purchase_orders",
  {
    id: serial("id").primaryKey(),
    poNumber: text("po_number").notNull().unique(), // e.g., "PO-2026-0001"

    vendorId: integer("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "restrict" }),

    // Dates
    poDate: date("po_date").notNull(),
    expectedDeliveryDate: date("expected_delivery_date"),

    // Status
    status: poStatusEnum("status").notNull().default("Draft"),

    // Currency
    currencyId: integer("currency_id")
      .notNull()
      .references(() => organizationCurrencies.id, { onDelete: "restrict" }),

    // Amounts (all in selected currency)
    subtotal: numeric("subtotal", { scale: 2, precision: 12 })
      .notNull()
      .default("0.00"),
    taxAmount: numeric("tax_amount", { scale: 2, precision: 12 })
      .notNull()
      .default("0.00"),
    total: numeric("total", { scale: 2, precision: 12 })
      .notNull()
      .default("0.00"),

    // Tracking for 3-way matching
    receivedAmount: numeric("received_amount", { scale: 2, precision: 12 })
      .notNull()
      .default("0.00"),
    billedAmount: numeric("billed_amount", { scale: 2, precision: 12 })
      .notNull()
      .default("0.00"),

    // Additional Info
    notes: text("notes"),
    termsAndConditions: text("terms_and_conditions"),
    deliveryAddress: text("delivery_address"),

    // Approval workflow
    approvedBy: text("approved_by").references(() => user.id, {
      onDelete: "set null",
    }),
    approvedAt: timestamp("approved_at"),
    sentAt: timestamp("sent_at"),
    closedAt: timestamp("closed_at"),
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
    index("purchase_orders_vendor_idx").on(table.vendorId),
    index("purchase_orders_status_idx").on(table.status),
    index("purchase_orders_organization_idx").on(table.organizationId),
    index("purchase_orders_po_date_idx").on(table.poDate),
  ],
);

/**
 * PO Line Items - Products/Services on purchase orders
 */
export const poLineItems = pgTable(
  "po_line_items",
  {
    id: serial("id").primaryKey(),
    poId: integer("po_id")
      .notNull()
      .references(() => purchaseOrders.id, { onDelete: "cascade" }),

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

    // Tracking for 3-way matching
    receivedQuantity: numeric("received_quantity", {
      scale: 2,
      precision: 10,
    })
      .notNull()
      .default("0.00"),
    billedQuantity: numeric("billed_quantity", { scale: 2, precision: 10 })
      .notNull()
      .default("0.00"),

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
    index("po_line_items_po_idx").on(table.poId),
    index("po_line_items_organization_idx").on(table.organizationId),
  ],
);

/**
 * Bills (Payables) - Vendor invoices/bills to be paid
 */
export const payablesBills = pgTable(
  "payables_bills",
  {
    id: serial("id").primaryKey(),
    billNumber: text("bill_number").notNull().unique(), // e.g., "BILL-2026-0001" (our internal number)
    vendorInvoiceNumber: text("vendor_invoice_number").notNull(), // Vendor's invoice number

    vendorId: integer("vendor_id")
      .notNull()
      .references(() => vendors.id, { onDelete: "restrict" }),

    // Optional PO link for 3-way matching
    poId: integer("po_id").references(() => purchaseOrders.id, {
      onDelete: "set null",
    }),

    // Bank Account to Debit (our account that will be debited)
    bankAccountId: integer("bank_account_id").references(
      () => companyBankAccounts.id,
      { onDelete: "restrict" },
    ),

    // Dates
    billDate: date("bill_date").notNull(), // Date on the vendor's invoice
    dueDate: date("due_date").notNull(),
    receivedDate: date("received_date").notNull(), // When we received the bill

    // Status
    status: billStatusEnum("status").notNull().default("Draft"),

    // Currency
    currencyId: integer("currency_id")
      .notNull()
      .references(() => organizationCurrencies.id, { onDelete: "restrict" }),

    // Amounts (all in selected currency)
    subtotal: numeric("subtotal", { scale: 2, precision: 12 })
      .notNull()
      .default("0.00"),
    taxAmount: numeric("tax_amount", { scale: 2, precision: 12 })
      .notNull()
      .default("0.00"), // Sum of all taxes
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

    // Recurring bills tracking
    isRecurring: boolean("is_recurring").notNull().default(false),
    recurringFrequency: text("recurring_frequency"), // "Monthly", "Quarterly", "Yearly"
    recurringEndDate: date("recurring_end_date"),

    // Additional Info
    notes: text("notes"), // Internal notes
    paymentTerms: text("payment_terms"), // Payment terms from vendor

    // Duplicate detection tracking
    duplicateCheckHash: text("duplicate_check_hash"), // Hash for quick duplicate lookup

    // PDF storage
    pdfPath: text("pdf_path"), // R2 storage path for uploaded vendor invoice

    // Email tracking
    confirmationEmailSentAt: timestamp("confirmation_email_sent_at"),

    // Timestamps
    paidAt: timestamp("paid_at"), // When fully paid
    approvedAt: timestamp("approved_at"),
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
    index("payables_bills_vendor_idx").on(table.vendorId),
    index("payables_bills_po_idx").on(table.poId),
    index("payables_bills_status_idx").on(table.status),
    index("payables_bills_organization_idx").on(table.organizationId),
    index("payables_bills_due_date_idx").on(table.dueDate),
    index("payables_bills_bill_date_idx").on(table.billDate),
    index("payables_bills_duplicate_hash_idx").on(table.duplicateCheckHash),
    // Composite index for duplicate detection
    index("payables_bills_vendor_invoice_idx").on(
      table.vendorId,
      table.vendorInvoiceNumber,
    ),
  ],
);

/**
 * Bill Line Items - Products/Services on bills
 */
export const billLineItems = pgTable(
  "bill_line_items",
  {
    id: serial("id").primaryKey(),
    billId: integer("bill_id")
      .notNull()
      .references(() => payablesBills.id, { onDelete: "cascade" }),

    // Optional link to PO line item for 3-way matching
    poLineItemId: integer("po_line_item_id").references(() => poLineItems.id, {
      onDelete: "set null",
    }),

    description: text("description").notNull(),
    quantity: numeric("quantity", { scale: 2, precision: 10 })
      .notNull()
      .default("1.00"),

    // PO Amount (from purchase order - for tracking/comparison)
    poUnitPrice: numeric("po_unit_price", { scale: 2, precision: 12 }),
    poAmount: numeric("po_amount", { scale: 2, precision: 12 }),

    // Vendor Amount (from vendor's invoice - used in bill calculations)
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
    index("bill_line_items_bill_idx").on(table.billId),
    index("bill_line_items_organization_idx").on(table.organizationId),
  ],
);

/**
 * Bill Taxes - Multiple taxes per bill (VAT, WHT, etc.)
 */
export const billTaxes = pgTable(
  "bill_taxes",
  {
    id: serial("id").primaryKey(),
    billId: integer("bill_id")
      .notNull()
      .references(() => payablesBills.id, { onDelete: "cascade" }),

    taxType: billTaxTypeEnum("tax_type").notNull(),
    taxName: text("tax_name").notNull(), // e.g., "VAT 15%", "WHT 10%"
    taxPercentage: numeric("tax_percentage", {
      scale: 2,
      precision: 5,
    }).notNull(), // e.g., 15.00
    taxAmount: numeric("tax_amount", { scale: 2, precision: 12 }).notNull(), // Calculated amount

    // WHT specific fields
    isWithholdingTax: boolean("is_withholding_tax").notNull().default(false),
    whtCertificateNumber: text("wht_certificate_number"),

    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("bill_taxes_bill_idx").on(table.billId),
    index("bill_taxes_organization_idx").on(table.organizationId),
    index("bill_taxes_type_idx").on(table.taxType),
  ],
);

/**
 * Bill Payments - Track payments made to vendors
 */
export const billPayments = pgTable(
  "bill_payments",
  {
    id: serial("id").primaryKey(),
    billId: integer("bill_id")
      .notNull()
      .references(() => payablesBills.id, { onDelete: "cascade" }),

    amount: numeric("amount", { scale: 2, precision: 12 }).notNull(),
    paymentDate: date("payment_date").notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    referenceNumber: text("reference_number"), // Check number, transaction ID, etc.
    notes: text("notes"),

    // Email confirmation tracking
    confirmationEmailSentAt: timestamp("confirmation_email_sent_at"),
    confirmationEmailSentTo: text("confirmation_email_sent_to"),

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
    index("bill_payments_bill_idx").on(table.billId),
    index("bill_payments_date_idx").on(table.paymentDate),
    index("bill_payments_organization_idx").on(table.organizationId),
  ],
);

/**
 * Bill Documents - PDFs and other attachments
 */
export const billDocuments = pgTable(
  "bill_documents",
  {
    id: serial("id").primaryKey(),
    billId: integer("bill_id")
      .notNull()
      .references(() => payablesBills.id, { onDelete: "cascade" }),

    documentType: billDocumentTypeEnum("document_type").notNull(),
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
    index("bill_documents_bill_idx").on(table.billId),
    index("bill_documents_organization_idx").on(table.organizationId),
  ],
);

/**
 * Bill Activity Log - Audit trail for all bill actions
 */
export const billActivityLog = pgTable(
  "bill_activity_log",
  {
    id: serial("id").primaryKey(),
    billId: integer("bill_id")
      .notNull()
      .references(() => payablesBills.id, { onDelete: "cascade" }),

    activityType: billActivityTypeEnum("activity_type").notNull(),
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
    index("bill_activity_bill_idx").on(table.billId),
    index("bill_activity_type_idx").on(table.activityType),
    index("bill_activity_organization_idx").on(table.organizationId),
  ],
);

/**
 * Vendor Custom Categories - User-defined vendor categories
 */
export const vendorCustomCategories = pgTable(
  "vendor_custom_categories",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),

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
    index("vendor_custom_categories_org_idx").on(table.organizationId),
    unique("vendor_custom_categories_org_name_idx").on(
      table.organizationId,
      table.name,
    ),
  ],
);

/**
 * Payables Tax Configuration - Organization-level tax settings
 */
export const payablesTaxConfig = pgTable(
  "payables_tax_config",
  {
    id: serial("id").primaryKey(),
    taxType: billTaxTypeEnum("tax_type").notNull(),
    taxName: text("tax_name").notNull(), // e.g., "Standard VAT"
    defaultRate: numeric("default_rate", { scale: 2, precision: 5 }).notNull(), // e.g., 15.00
    description: text("description"),
    isActive: boolean("is_active").notNull().default(true),

    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("payables_tax_config_org_idx").on(table.organizationId)],
);

// ============================================
// RELATIONS
// ============================================

export const vendorsRelations = relations(vendors, ({ many }) => ({
  contacts: many(vendorContacts),
  bankAccounts: many(vendorBankAccounts),
  purchaseOrders: many(purchaseOrders),
  bills: many(payablesBills),
}));

export const vendorContactsRelations = relations(vendorContacts, ({ one }) => ({
  vendor: one(vendors, {
    fields: [vendorContacts.vendorId],
    references: [vendors.id],
  }),
}));

export const vendorBankAccountsRelations = relations(
  vendorBankAccounts,
  ({ one }) => ({
    vendor: one(vendors, {
      fields: [vendorBankAccounts.vendorId],
      references: [vendors.id],
    }),
  }),
);

export const purchaseOrdersRelations = relations(
  purchaseOrders,
  ({ one, many }) => ({
    vendor: one(vendors, {
      fields: [purchaseOrders.vendorId],
      references: [vendors.id],
    }),
    currency: one(organizationCurrencies, {
      fields: [purchaseOrders.currencyId],
      references: [organizationCurrencies.id],
    }),
    createdByUser: one(user, {
      fields: [purchaseOrders.createdBy],
      references: [user.id],
      relationName: "poCreatedBy",
    }),
    updatedByUser: one(user, {
      fields: [purchaseOrders.updatedBy],
      references: [user.id],
      relationName: "poUpdatedBy",
    }),
    approvedByUser: one(user, {
      fields: [purchaseOrders.approvedBy],
      references: [user.id],
      relationName: "poApprovedBy",
    }),
    lineItems: many(poLineItems),
    bills: many(payablesBills),
  }),
);

export const poLineItemsRelations = relations(poLineItems, ({ one, many }) => ({
  purchaseOrder: one(purchaseOrders, {
    fields: [poLineItems.poId],
    references: [purchaseOrders.id],
  }),
  billLineItems: many(billLineItems),
}));

export const payablesBillsRelations = relations(
  payablesBills,
  ({ one, many }) => ({
    vendor: one(vendors, {
      fields: [payablesBills.vendorId],
      references: [vendors.id],
    }),
    purchaseOrder: one(purchaseOrders, {
      fields: [payablesBills.poId],
      references: [purchaseOrders.id],
    }),
    bankAccount: one(companyBankAccounts, {
      fields: [payablesBills.bankAccountId],
      references: [companyBankAccounts.id],
    }),
    currency: one(organizationCurrencies, {
      fields: [payablesBills.currencyId],
      references: [organizationCurrencies.id],
    }),
    createdByUser: one(user, {
      fields: [payablesBills.createdBy],
      references: [user.id],
      relationName: "billCreatedBy",
    }),
    updatedByUser: one(user, {
      fields: [payablesBills.updatedBy],
      references: [user.id],
      relationName: "billUpdatedBy",
    }),
    lineItems: many(billLineItems),
    taxes: many(billTaxes),
    payments: many(billPayments),
    documents: many(billDocuments),
    activityLog: many(billActivityLog),
  }),
);

export const billLineItemsRelations = relations(billLineItems, ({ one }) => ({
  bill: one(payablesBills, {
    fields: [billLineItems.billId],
    references: [payablesBills.id],
  }),
  poLineItem: one(poLineItems, {
    fields: [billLineItems.poLineItemId],
    references: [poLineItems.id],
  }),
}));

export const billTaxesRelations = relations(billTaxes, ({ one }) => ({
  bill: one(payablesBills, {
    fields: [billTaxes.billId],
    references: [payablesBills.id],
  }),
}));

export const billPaymentsRelations = relations(billPayments, ({ one }) => ({
  bill: one(payablesBills, {
    fields: [billPayments.billId],
    references: [payablesBills.id],
  }),
  recordedByUser: one(user, {
    fields: [billPayments.recordedBy],
    references: [user.id],
  }),
}));

export const billDocumentsRelations = relations(billDocuments, ({ one }) => ({
  bill: one(payablesBills, {
    fields: [billDocuments.billId],
    references: [payablesBills.id],
  }),
  uploadedByUser: one(user, {
    fields: [billDocuments.uploadedBy],
    references: [user.id],
  }),
}));

export const billActivityLogRelations = relations(
  billActivityLog,
  ({ one }) => ({
    bill: one(payablesBills, {
      fields: [billActivityLog.billId],
      references: [payablesBills.id],
    }),
    performedByUser: one(user, {
      fields: [billActivityLog.performedBy],
      references: [user.id],
    }),
  }),
);
