import {
  pgTable,
  index,
  foreignKey,
  unique,
  text,
  timestamp,
  integer,
  boolean,
  serial,
  date,
  jsonb,
  numeric,
  uuid,
  varchar,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const allowanceType = pgEnum("allowance_type", [
  "one-time",
  "monthly",
  "annual",
  "bi-annual",
  "quarterly",
  "custom",
]);
export const askHrCategory = pgEnum("ask_hr_category", [
  "General",
  "Benefits",
  "Payroll",
  "Leave",
  "Employment",
  "Workplace",
  "Training",
  "Other",
]);
export const askHrStatus = pgEnum("ask_hr_status", [
  "Open",
  "In Progress",
  "Redirected",
  "Answered",
  "Closed",
]);
export const assetDocumentType = pgEnum("asset_document_type", [
  "Receipt",
  "Invoice",
  "Warranty",
  "Photos",
  "Manual",
  "Maintenance Record",
  "Inspection Report",
  "Disposal Certificate",
  "Other",
]);
export const assetMaintenanceStatus = pgEnum("asset_maintenance_status", [
  "Scheduled",
  "In Progress",
  "Completed",
  "Cancelled",
  "Overdue",
]);
export const assetStatus = pgEnum("asset_status", [
  "Active",
  "In Maintenance",
  "Retired",
  "Disposed",
  "Lost/Stolen",
]);
export const assignmentTargetType = pgEnum("assignment_target_type", [
  "Employee",
  "Department",
  "Project",
]);
export const attendanceStatus = pgEnum("attendance_status", [
  "Approved",
  "Rejected",
]);
export const attendanceWarningType = pgEnum("attendance_warning_type", [
  "late_arrival",
  "early_departure",
  "missing_signout",
  "general",
]);
export const billActivityType = pgEnum("bill_activity_type", [
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
export const billDocumentType = pgEnum("bill_document_type", [
  "Vendor Invoice",
  "Payment Receipt",
  "Tax Document",
  "Delivery Note",
  "Other",
]);
export const billPaymentMethod = pgEnum("bill_payment_method", [
  "Cash",
  "Bank Transfer",
  "Check",
  "Credit Card",
  "Debit Card",
  "Mobile Money",
  "Other",
]);
export const billStatus = pgEnum("bill_status", [
  "Draft",
  "Open",
  "Paid",
  "Overdue",
  "Partially Paid",
  "Void",
]);
export const billTaxType = pgEnum("bill_tax_type", [
  "VAT",
  "WHT",
  "Sales Tax",
  "GST",
  "Custom",
]);
export const candidateDocumentType = pgEnum("candidate_document_type", [
  "Resume",
  "Cover Letter",
  "Portfolio",
  "Certificate",
  "ID Proof",
  "Other",
]);
export const candidateStatus = pgEnum("candidate_status", [
  "Applied",
  "Screening",
  "Interview",
  "Offer",
  "Hired",
  "Rejected",
]);
export const dateFormat = pgEnum("date_format", [
  "MM/DD/YYYY",
  "DD/MM/YYYY",
  "YYYY-MM-DD",
  "DD MMM YYYY",
]);
export const deductionType = pgEnum("deduction_type", [
  "recurring",
  "one-time",
  "statutory",
  "loan",
  "advance",
]);
export const depreciationMethod = pgEnum("depreciation_method", [
  "Straight-Line",
]);
export const driverStatus = pgEnum("driver_status", [
  "Active",
  "Inactive",
  "Suspended",
]);
export const employeesDepartment = pgEnum("employees_department", [
  "hr",
  "admin",
  "finance",
  "operations",
]);
export const employeesRole = pgEnum("employees_role", ["admin", "user"]);
export const employmentType = pgEnum("employment_type", [
  "Full-time",
  "Part-time",
  "Contract",
  "Intern",
]);
export const fleetExpenseCategory = pgEnum("fleet_expense_category", [
  "Fuel",
  "Maintenance",
  "Insurance",
  "Registration",
  "Repairs",
  "Tires",
  "Parts",
  "Inspection",
  "Other",
]);
export const incidentResolutionStatus = pgEnum("incident_resolution_status", [
  "Reported",
  "Under Investigation",
  "Resolved",
  "Closed",
]);
export const incidentSeverity = pgEnum("incident_severity", [
  "Minor",
  "Major",
  "Critical",
]);
export const incidentType = pgEnum("incident_type", [
  "Accident",
  "Damage",
  "Theft",
  "Breakdown",
  "Other",
]);
export const interviewRecommendation = pgEnum("interview_recommendation", [
  "Strong Hire",
  "Hire",
  "Maybe",
  "No Hire",
]);
export const interviewStatus = pgEnum("interview_status", [
  "Scheduled",
  "Completed",
  "Cancelled",
  "Rescheduled",
  "No Show",
]);
export const interviewType = pgEnum("interview_type", [
  "Phone Screening",
  "Technical",
  "Behavioral",
  "HR Round",
  "Final Round",
]);
export const invoiceStatus = pgEnum("invoice_status", [
  "draft",
  "open",
  "paid",
  "uncollectible",
  "void",
]);
export const invoicingActivityType = pgEnum("invoicing_activity_type", [
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
export const invoicingDocumentType = pgEnum("invoicing_document_type", [
  "Invoice PDF",
  "Payment Receipt",
  "Credit Note",
  "Tax Document",
  "Other",
]);
export const invoicingPaymentMethod = pgEnum("invoicing_payment_method", [
  "Cash",
  "Bank Transfer",
  "Check",
  "Credit Card",
  "Debit Card",
  "Mobile Money",
  "Other",
]);
export const invoicingStatus = pgEnum("invoicing_status", [
  "Draft",
  "Sent",
  "Paid",
  "Overdue",
  "Cancelled",
  "Partially Paid",
]);
export const invoicingTemplate = pgEnum("invoicing_template", [
  "Modern",
  "Classic",
  "Minimal",
  "Detailed",
  "Professional",
]);
export const jobPostingStatus = pgEnum("job_posting_status", [
  "Draft",
  "Published",
  "Closed",
  "Cancelled",
]);
export const language = pgEnum("language", ["en", "fr", "es", "de"]);
export const leaveStatus = pgEnum("leave_status", [
  "Pending",
  "Approved",
  "Rejected",
  "Cancelled",
  "To be reviewed",
]);
export const leaveType = pgEnum("leave_type", [
  "Annual",
  "Sick",
  "Personal",
  "Maternity",
  "Paternity",
  "Bereavement",
  "Unpaid",
  "Other",
]);
export const loanAmountType = pgEnum("loan_amount_type", [
  "fixed",
  "percentage",
]);
export const loanApplicationStatus = pgEnum("loan_application_status", [
  "pending",
  "hr_approved",
  "hr_rejected",
  "disbursed",
  "active",
  "completed",
  "cancelled",
]);
export const maintenanceIntervalUnit = pgEnum("maintenance_interval_unit", [
  "Days",
  "Weeks",
  "Months",
  "Years",
]);
export const maintenanceType = pgEnum("maintenance_type", [
  "Oil Change",
  "Tire Rotation",
  "Inspection",
  "Repair",
  "Brake Service",
  "Battery Replacement",
  "Transmission Service",
  "Other",
]);
export const maritalStatus = pgEnum("marital_status", [
  "Single",
  "Married",
  "Divorced",
  "Widowed",
]);
export const newsStatus = pgEnum("news_status", [
  "draft",
  "published",
  "archived",
]);
export const notificationType = pgEnum("notification_type", [
  "approval",
  "deadline",
  "message",
]);
export const offerStatus = pgEnum("offer_status", [
  "Draft",
  "Pending Approval",
  "Approved",
  "Sent",
  "Accepted",
  "Rejected",
  "Expired",
]);
export const paymentMethod = pgEnum("payment_method", [
  "Bank Transfer",
  "Wire",
  "Check",
  "Cash",
]);
export const paymentStatusType = pgEnum("payment_status_type", [
  "successful",
  "pending",
  "failed",
]);
export const payrollDetailType = pgEnum("payroll_detail_type", [
  "base_salary",
  "allowance",
  "deduction",
  "bonus",
  "overtime",
  "commission",
  "reimbursement",
  "tax",
  "loan",
  "advance",
]);
export const payrollItemType = pgEnum("payroll_item_type", [
  "salary",
  "allowance",
  "bonus",
  "overtime",
  "commission",
  "reimbursement",
]);
export const payrollRunStatus = pgEnum("payroll_run_status", [
  "draft",
  "pending",
  "processing",
  "completed",
  "approved",
  "paid",
  "archived",
]);
export const payrunType = pgEnum("payrun_type", ["salary", "allowance"]);
export const poStatus = pgEnum("po_status", [
  "Draft",
  "Pending Approval",
  "Approved",
  "Sent",
  "Partially Received",
  "Received",
  "Closed",
  "Cancelled",
]);
export const projectAccessLevel = pgEnum("project_access_level", [
  "read",
  "write",
]);
export const projectStatus = pgEnum("project_status", [
  "pending",
  "in-progress",
  "completed",
]);
export const recruitmentActivityType = pgEnum("recruitment_activity_type", [
  "Application Received",
  "Status Changed",
  "Interview Scheduled",
  "Interview Completed",
  "Offer Generated",
  "Offer Sent",
  "Offer Accepted",
  "Offer Rejected",
  "Document Uploaded",
  "Note Added",
  "Email Sent",
]);
export const repaymentStatus = pgEnum("repayment_status", [
  "pending",
  "paid",
  "partial",
  "overdue",
  "waived",
]);
export const reviewStatus = pgEnum("review_status", ["Accepted", "Rejected"]);
export const subscriptionPlan = pgEnum("subscription_plan", [
  "free",
  "pro",
  "proAI",
  "premium",
  "premiumAI",
]);
export const subscriptionStatus = pgEnum("subscription_status", [
  "active",
  "inactive",
  "past_due",
  "canceled",
  "trialing",
]);
export const taskPriority = pgEnum("task_priority", [
  "Low",
  "Medium",
  "High",
  "Urgent",
]);
export const taskStatus = pgEnum("task_status", [
  "Backlog",
  "Todo",
  "In Progress",
  "Review",
  "Completed",
  "Pending",
]);
export const theme = pgEnum("theme", [
  "light",
  "dark",
  "system",
  "ocean",
  "forest",
  "sunset",
]);
export const timezone = pgEnum("timezone", [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Dubai",
  "Africa/Lagos",
]);
export const valueAdjustmentType = pgEnum("value_adjustment_type", [
  "Depreciation",
  "Appreciation",
  "Impairment",
  "Revaluation",
]);
export const vehicleDocumentType = pgEnum("vehicle_document_type", [
  "Registration",
  "Insurance",
  "Maintenance",
  "Inspection",
  "Purchase",
  "Photos",
  "Other",
]);
export const vehicleFuelType = pgEnum("vehicle_fuel_type", [
  "Petrol",
  "Diesel",
  "Electric",
  "Hybrid",
  "CNG",
  "Other",
]);
export const vehicleStatus = pgEnum("vehicle_status", [
  "Active",
  "Inactive",
  "Maintenance",
]);
export const vendorCategory = pgEnum("vendor_category", [
  "Services",
  "Goods",
  "Utilities",
  "Custom",
]);
export const vendorStatus = pgEnum("vendor_status", [
  "Active",
  "Inactive",
  "Suspended",
  "Archived",
]);

export const session = pgTable(
  "session",
  {
    id: text().primaryKey().notNull(),
    expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
    token: text().notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull(),
    activeOrganizationId: text("active_organization_id"),
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [
    index("session_userId_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "session_user_id_user_id_fk",
    }).onDelete("cascade"),
    unique("session_token_unique").on(table.token),
  ],
);

export const twoFactor = pgTable(
  "two_factor",
  {
    id: text().primaryKey().notNull(),
    secret: text().notNull(),
    backupCodes: text("backup_codes").notNull(),
    userId: text("user_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "two_factor_user_id_user_id_fk",
    }).onDelete("cascade"),
  ],
);

export const organization = pgTable(
  "organization",
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    slug: text().notNull(),
    logo: text(),
    membersCount: integer("members_count").default(0),
    status: text().default("active"),
    ownerId: text("owner_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    metadata: text(),
  },
  (table) => [
    foreignKey({
      columns: [table.ownerId],
      foreignColumns: [user.id],
      name: "organization_owner_id_user_id_fk",
    }).onDelete("cascade"),
  ],
);

export const verification = pgTable(
  "verification",
  {
    id: text().primaryKey().notNull(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("verification_identifier_idx").using(
      "btree",
      table.identifier.asc().nullsLast().op("text_ops"),
    ),
  ],
);

export const user = pgTable(
  "user",
  {
    id: text().primaryKey().notNull(),
    name: text().notNull(),
    email: text().notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text(),
    organizationsCount: integer("organizations_count").default(0),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    username: text(),
    displayUsername: text("display_username"),
    twoFactorEnabled: boolean("two_factor_enabled").default(false),
    role: text(),
    banned: boolean().default(false),
    banReason: text("ban_reason"),
    banExpires: timestamp("ban_expires", { mode: "string" }),
  },
  (table) => [
    unique("user_email_unique").on(table.email),
    unique("user_username_unique").on(table.username),
  ],
);

export const employees = pgTable(
  "employees",
  {
    id: serial().primaryKey().notNull(),
    name: text().notNull(),
    organizationId: text("organization_id").notNull(),
    authId: text("auth_id").notNull(),
    email: text().notNull(),
    phone: text(),
    staffNumber: text("staff_number"),
    role: employeesRole().default("user").notNull(),
    isManager: boolean("is_manager").default(false).notNull(),
    department: employeesDepartment().default("operations").notNull(),
    managerId: text("manager_id"),
    organizationsCount: integer("organizations_count").default(0),
    dateOfBirth: date("date_of_birth"),
    address: text(),
    status: text(),
    maritalStatus: maritalStatus("marital_status"),
    employmentType: employmentType("employment_type"),
    documentCount: integer("document_count").default(0).notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("employee_manager_idx").using(
      "btree",
      table.managerId.asc().nullsLast().op("text_ops"),
    ),
    index("employees_department_role_idx").using(
      "btree",
      table.department.asc().nullsLast().op("enum_ops"),
      table.role.asc().nullsLast().op("enum_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "employees_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.authId],
      foreignColumns: [user.id],
      name: "employees_auth_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.managerId],
      foreignColumns: [user.id],
      name: "employees_manager_id_user_id_fk",
    }),
  ],
);

export const billActivityLog = pgTable("bill_activity_log", {
  id: serial().primaryKey().notNull(),
  billId: integer("bill_id").notNull(),
  activityType: billActivityType("activity_type").notNull(),
  description: text().notNull(),
  performedBy: text("performed_by"),
  metadata: jsonb(),
  organizationId: text("organization_id").notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
});

export const billDocuments = pgTable("bill_documents", {
  id: serial().primaryKey().notNull(),
  billId: integer("bill_id").notNull(),
  documentType: billDocumentType("document_type").notNull(),
  documentName: text("document_name").notNull(),
  originalFileName: text("original_file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: numeric("file_size", { precision: 10, scale: 2 }).notNull(),
  mimeType: text("mime_type"),
  uploadedBy: text("uploaded_by"),
  organizationId: text("organization_id").notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
});

export const billLineItems = pgTable("bill_line_items", {
  id: serial().primaryKey().notNull(),
  billId: integer("bill_id").notNull(),
  poLineItemId: integer("po_line_item_id"),
  description: text().notNull(),
  quantity: numeric({ precision: 10, scale: 2 }).default("1.00").notNull(),
  poUnitPrice: numeric("po_unit_price", { precision: 12, scale: 2 }),
  poAmount: numeric("po_amount", { precision: 12, scale: 2 }),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 })
    .default("0.00")
    .notNull(),
  amount: numeric({ precision: 12, scale: 2 }).default("0.00").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  organizationId: text("organization_id").notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
});

export const billTaxes = pgTable("bill_taxes", {
  id: serial().primaryKey().notNull(),
  billId: integer("bill_id").notNull(),
  taxType: billTaxType("tax_type").notNull(),
  taxName: text("tax_name").notNull(),
  taxPercentage: numeric("tax_percentage", {
    precision: 5,
    scale: 2,
  }).notNull(),
  taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).notNull(),
  isWithholdingTax: boolean("is_withholding_tax").default(false).notNull(),
  whtCertificateNumber: text("wht_certificate_number"),
  organizationId: text("organization_id").notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
});

export const payablesBills = pgTable(
  "payables_bills",
  {
    id: serial().primaryKey().notNull(),
    billNumber: text("bill_number").notNull(),
    vendorInvoiceNumber: text("vendor_invoice_number").notNull(),
    vendorId: integer("vendor_id").notNull(),
    poId: integer("po_id"),
    bankAccountId: integer("bank_account_id"),
    billDate: date("bill_date").notNull(),
    dueDate: date("due_date").notNull(),
    receivedDate: date("received_date").notNull(),
    status: billStatus().default("Draft").notNull(),
    currencyId: integer("currency_id").notNull(),
    subtotal: numeric({ precision: 12, scale: 2 }).default("0.00").notNull(),
    taxAmount: numeric("tax_amount", { precision: 12, scale: 2 })
      .default("0.00")
      .notNull(),
    total: numeric({ precision: 12, scale: 2 }).default("0.00").notNull(),
    amountPaid: numeric("amount_paid", { precision: 12, scale: 2 })
      .default("0.00")
      .notNull(),
    amountDue: numeric("amount_due", { precision: 12, scale: 2 })
      .default("0.00")
      .notNull(),
    isRecurring: boolean("is_recurring").default(false).notNull(),
    recurringFrequency: text("recurring_frequency"),
    recurringEndDate: date("recurring_end_date"),
    notes: text(),
    paymentTerms: text("payment_terms"),
    duplicateCheckHash: text("duplicate_check_hash"),
    pdfPath: text("pdf_path"),
    confirmationEmailSentAt: timestamp("confirmation_email_sent_at", {
      mode: "string",
    }),
    paidAt: timestamp("paid_at", { mode: "string" }),
    approvedAt: timestamp("approved_at", { mode: "string" }),
    cancelledAt: timestamp("cancelled_at", { mode: "string" }),
    organizationId: text("organization_id").notNull(),
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique("payables_bills_bill_number_unique").on(table.billNumber)],
);

export const employeesBank = pgTable(
  "employees_bank",
  {
    id: serial().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    bankName: text("bank_name").notNull(),
    accountName: text("account_name").notNull(),
    organizationId: text("organization_id").notNull(),
    accountNumber: text("account_number").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "employees_bank_user_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "employees_bank_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const payablesTaxConfig = pgTable("payables_tax_config", {
  id: serial().primaryKey().notNull(),
  taxType: billTaxType("tax_type").notNull(),
  taxName: text("tax_name").notNull(),
  defaultRate: numeric("default_rate", { precision: 5, scale: 2 }).notNull(),
  description: text(),
  isActive: boolean("is_active").default(true).notNull(),
  organizationId: text("organization_id").notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
});

export const poLineItems = pgTable("po_line_items", {
  id: serial().primaryKey().notNull(),
  poId: integer("po_id").notNull(),
  description: text().notNull(),
  quantity: numeric({ precision: 10, scale: 2 }).default("1.00").notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 })
    .default("0.00")
    .notNull(),
  amount: numeric({ precision: 12, scale: 2 }).default("0.00").notNull(),
  receivedQuantity: numeric("received_quantity", { precision: 10, scale: 2 })
    .default("0.00")
    .notNull(),
  billedQuantity: numeric("billed_quantity", { precision: 10, scale: 2 })
    .default("0.00")
    .notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  organizationId: text("organization_id").notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
});

export const purchaseOrders = pgTable(
  "purchase_orders",
  {
    id: serial().primaryKey().notNull(),
    poNumber: text("po_number").notNull(),
    vendorId: integer("vendor_id").notNull(),
    poDate: date("po_date").notNull(),
    expectedDeliveryDate: date("expected_delivery_date"),
    status: poStatus().default("Draft").notNull(),
    currencyId: integer("currency_id").notNull(),
    subtotal: numeric({ precision: 12, scale: 2 }).default("0.00").notNull(),
    taxAmount: numeric("tax_amount", { precision: 12, scale: 2 })
      .default("0.00")
      .notNull(),
    total: numeric({ precision: 12, scale: 2 }).default("0.00").notNull(),
    receivedAmount: numeric("received_amount", { precision: 12, scale: 2 })
      .default("0.00")
      .notNull(),
    billedAmount: numeric("billed_amount", { precision: 12, scale: 2 })
      .default("0.00")
      .notNull(),
    notes: text(),
    termsAndConditions: text("terms_and_conditions"),
    deliveryAddress: text("delivery_address"),
    approvedBy: text("approved_by"),
    approvedAt: timestamp("approved_at", { mode: "string" }),
    sentAt: timestamp("sent_at", { mode: "string" }),
    closedAt: timestamp("closed_at", { mode: "string" }),
    cancelledAt: timestamp("cancelled_at", { mode: "string" }),
    organizationId: text("organization_id").notNull(),
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique("purchase_orders_po_number_unique").on(table.poNumber)],
);

export const vendorBankAccounts = pgTable("vendor_bank_accounts", {
  id: serial().primaryKey().notNull(),
  vendorId: integer("vendor_id").notNull(),
  accountName: text("account_name").notNull(),
  bankName: text("bank_name").notNull(),
  accountNumber: text("account_number").notNull(),
  routingNumber: text("routing_number"),
  swiftCode: text("swift_code"),
  iban: text(),
  currency: text().notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  organizationId: text("organization_id").notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
});

export const email = pgTable(
  "email",
  {
    id: serial().primaryKey().notNull(),
    senderId: text("sender_id").notNull(),
    subject: text().notNull(),
    body: text().notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    parentEmailId: integer("parent_email_id"),
    type: text().default("sent").notNull(),
    hasBeenOpened: boolean("has_been_opened").default(false).notNull(),
    organizationId: text("organization_id").notNull(),
  },
  (table) => [
    index("email_created_at_idx").using(
      "btree",
      table.createdAt.asc().nullsLast().op("timestamp_ops"),
    ),
    index("email_organization_id_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("email_parent_email_id_idx").using(
      "btree",
      table.parentEmailId.asc().nullsLast().op("int4_ops"),
    ),
    index("email_sender_id_idx").using(
      "btree",
      table.senderId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.senderId],
      foreignColumns: [user.id],
      name: "email_sender_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "email_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const vendorContacts = pgTable("vendor_contacts", {
  id: serial().primaryKey().notNull(),
  vendorId: integer("vendor_id").notNull(),
  name: text().notNull(),
  email: text().notNull(),
  phone: text(),
  role: text(),
  isPrimary: boolean("is_primary").default(false).notNull(),
  organizationId: text("organization_id").notNull(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow().notNull(),
});

export const vendorCustomCategories = pgTable(
  "vendor_custom_categories",
  {
    id: serial().primaryKey().notNull(),
    name: text().notNull(),
    description: text(),
    isActive: boolean("is_active").default(true).notNull(),
    organizationId: text("organization_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("vendor_custom_categories_org_name_idx").on(
      table.name,
      table.organizationId,
    ),
  ],
);

export const vendors = pgTable(
  "vendors",
  {
    id: serial().primaryKey().notNull(),
    vendorCode: text("vendor_code").notNull(),
    name: text().notNull(),
    email: text().notNull(),
    phone: text(),
    companyName: text("company_name"),
    taxId: text("tax_id"),
    cacNumber: text("cac_number"),
    category: vendorCategory().notNull(),
    customCategory: text("custom_category"),
    billingAddress: text("billing_address"),
    billingCity: text("billing_city"),
    billingState: text("billing_state"),
    billingPostalCode: text("billing_postal_code"),
    billingCountry: text("billing_country"),
    website: text(),
    notes: text(),
    status: vendorStatus().default("Active").notNull(),
    defaultPaymentTerms: text("default_payment_terms"),
    defaultPaymentMethod: paymentMethod("default_payment_method"),
    organizationId: text("organization_id").notNull(),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique("vendors_vendor_code_unique").on(table.vendorCode)],
);

export const document = pgTable(
  "document",
  {
    id: serial().primaryKey().notNull(),
    title: text().notNull(),
    description: text(),
    upstashId: uuid("upstash_id").defaultRandom().notNull(),
    originalFileName: text("original_file_name"),
    department: text().notNull(),
    departmental: boolean().default(false),
    folderId: integer("folder_id"),
    currentVersion: integer("current_version").default(0).notNull(),
    currentVersionId: integer("current_version_id").default(0).notNull(),
    public: boolean().default(false),
    uploadedBy: text("uploaded_by"),
    organizationId: text("organization_id").notNull(),
    status: text().default("active").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("documents_name_idx").using(
      "btree",
      table.title.asc().nullsLast().op("text_ops"),
    ),
    index("documents_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("documents_version_id_idx").using(
      "btree",
      table.currentVersionId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.folderId],
      foreignColumns: [documentFolders.id],
      name: "document_folder_id_document_folders_id_fk",
    }),
    foreignKey({
      columns: [table.uploadedBy],
      foreignColumns: [user.id],
      name: "document_uploaded_by_user_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "document_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const documentComments = pgTable(
  "document_comments",
  {
    id: serial().primaryKey().notNull(),
    documentId: integer("document_id"),
    userId: text("user_id"),
    comment: text().notNull(),
    organizationId: text("organization_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("document_comment_idx").using(
      "btree",
      table.comment.asc().nullsLast().op("text_ops"),
    ),
    index("document_comment_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.documentId],
      foreignColumns: [document.id],
      name: "document_comments_document_id_document_id_fk",
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "document_comments_user_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "document_comments_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const companyExpenses = pgTable(
  "company_expenses",
  {
    id: serial().primaryKey().notNull(),
    title: text().notNull(),
    description: text(),
    organizationId: text("organization_id").notNull(),
    amount: numeric({ precision: 15, scale: 2 }).notNull(),
    category: text(),
    expenseDate: timestamp("expense_date", { mode: "string" })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    isFleetExpense: boolean("is_fleet_expense").default(false).notNull(),
    vehicleId: integer("vehicle_id"),
    fleetExpenseCategory: fleetExpenseCategory("fleet_expense_category"),
  },
  (table) => [
    index("company_expenses_date_idx").using(
      "btree",
      table.expenseDate.asc().nullsLast().op("timestamp_ops"),
    ),
    index("company_expenses_fleet_idx").using(
      "btree",
      table.isFleetExpense.asc().nullsLast().op("bool_ops"),
    ),
    index("company_expenses_vehicle_idx").using(
      "btree",
      table.vehicleId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "company_expenses_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.vehicleId],
      foreignColumns: [vehicles.id],
      name: "company_expenses_vehicle_id_vehicles_id_fk",
    }).onDelete("set null"),
  ],
);

export const employeeAllowances = pgTable(
  "employee_allowances",
  {
    id: serial().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    allowanceId: integer("allowance_id").notNull(),
    organizationId: text("organization_id").notNull(),
    effectiveFrom: timestamp("effective_from", { mode: "string" }).defaultNow(),
    effectiveTo: timestamp("effective_to", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("employee_allowance_active_idx")
      .using(
        "btree",
        table.userId.asc().nullsLast().op("int4_ops"),
        table.allowanceId.asc().nullsLast().op("int4_ops"),
      )
      .where(sql`(effective_to IS NULL)`),
    index("employee_allowance_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "employee_allowances_user_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.allowanceId],
      foreignColumns: [allowances.id],
      name: "employee_allowances_allowance_id_allowances_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "employee_allowances_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const salaryDeductions = pgTable(
  "salary_deductions",
  {
    id: serial().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    salaryStructureId: integer("salary_structure_id").notNull(),
    deductionId: integer("deduction_id").notNull(),
    effectiveFrom: timestamp("effective_from", { mode: "string" }).defaultNow(),
    effectiveTo: timestamp("effective_to", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("salary_deduction_table_id_idx").using(
      "btree",
      table.salaryStructureId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "salary_deductions_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.salaryStructureId],
      foreignColumns: [salaryStructure.id],
      name: "salary_deductions_salary_structure_id_salary_structure_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.deductionId],
      foreignColumns: [deductions.id],
      name: "salary_deductions_deduction_id_deductions_id_fk",
    }).onDelete("cascade"),
  ],
);

export const subscriptionsInvoices = pgTable(
  "subscriptions_invoices",
  {
    id: text().primaryKey().notNull(),
    subscriptionId: text("subscription_id").notNull(),
    status: invoiceStatus().default("draft").notNull(),
    amount: numeric({ precision: 10, scale: 2 }).notNull(),
    currency: text().default("NGN").notNull(),
    billingPeriodStart: timestamp("billing_period_start", {
      mode: "string",
    }).notNull(),
    billingPeriodEnd: timestamp("billing_period_end", {
      mode: "string",
    }).notNull(),
    dueDate: date("due_date"),
    paidAt: timestamp("paid_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("invoice_subscription_idx").using(
      "btree",
      table.subscriptionId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.subscriptionId],
      foreignColumns: [subscriptions.id],
      name: "subscriptions_invoices_subscription_id_subscriptions_id_fk",
    }).onDelete("cascade"),
  ],
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: text().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    paystackSubscriptionCode: text("paystack_subscription_code"),
    plan: subscriptionPlan().default("free").notNull(),
    status: subscriptionStatus().default("inactive").notNull(),
    pricePerMember: numeric("price_per_member", { precision: 10, scale: 2 })
      .default("0.00")
      .notNull(),
    trialEnd: timestamp("trial_end", { mode: "string" }),
    currentPeriodStart: timestamp("current_period_start", { mode: "string" }),
    currentPeriodEnd: timestamp("current_period_end", { mode: "string" }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
    canceledAt: timestamp("canceled_at", { mode: "string" }),
    billingAnniversaryDay: integer("billing_anniversary_day"),
    lastInvoicedAt: timestamp("last_invoiced_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("paystack_subscription_code_idx").using(
      "btree",
      table.paystackSubscriptionCode.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "subscriptions_user_id_user_id_fk",
    }).onDelete("cascade"),
    unique("subscriptions_user_id_unique").on(table.userId),
    unique("subscriptions_paystack_subscription_code_unique").on(
      table.paystackSubscriptionCode,
    ),
  ],
);

export const loanTypeSalaryStructures = pgTable(
  "loan_type_salary_structures",
  {
    id: serial().primaryKey().notNull(),
    loanTypeId: integer("loan_type_id").notNull(),
    organizationId: text("organization_id").notNull(),
    salaryStructureId: integer("salary_structure_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("loan_type_structure_loan_idx").using(
      "btree",
      table.loanTypeId.asc().nullsLast().op("int4_ops"),
    ),
    index("loan_type_structure_salary_idx").using(
      "btree",
      table.salaryStructureId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.loanTypeId],
      foreignColumns: [loanTypes.id],
      name: "loan_type_salary_structures_loan_type_id_loan_types_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "loan_type_salary_structures_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    unique("unique_loan_type_salary_structure").on(
      table.loanTypeId,
      table.salaryStructureId,
    ),
  ],
);

export const clients = pgTable(
  "clients",
  {
    id: serial().primaryKey().notNull(),
    clientCode: text("client_code").notNull(),
    name: text().notNull(),
    email: text().notNull(),
    phone: text(),
    companyName: text("company_name"),
    taxId: text("tax_id"),
    billingAddress: text("billing_address"),
    billingCity: text("billing_city"),
    billingState: text("billing_state"),
    billingPostalCode: text("billing_postal_code"),
    billingCountry: text("billing_country"),
    shippingAddress: text("shipping_address"),
    shippingCity: text("shipping_city"),
    shippingState: text("shipping_state"),
    shippingPostalCode: text("shipping_postal_code"),
    shippingCountry: text("shipping_country"),
    website: text(),
    notes: text(),
    isActive: boolean("is_active").default(true).notNull(),
    organizationId: text("organization_id").notNull(),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("clients_active_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
    index("clients_email_idx").using(
      "btree",
      table.email.asc().nullsLast().op("text_ops"),
    ),
    index("clients_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "clients_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [user.id],
      name: "clients_created_by_user_id_fk",
    }).onDelete("set null"),
    unique("clients_client_code_unique").on(table.clientCode),
  ],
);

export const invoices = pgTable(
  "invoices",
  {
    id: serial().primaryKey().notNull(),
    invoiceNumber: text("invoice_number").notNull(),
    clientId: integer("client_id").notNull(),
    bankAccountId: integer("bank_account_id"),
    invoiceDate: date("invoice_date").notNull(),
    dueDate: date("due_date").notNull(),
    status: invoicingStatus().default("Draft").notNull(),
    currencyId: integer("currency_id").notNull(),
    subtotal: numeric({ precision: 12, scale: 2 }).default("0.00").notNull(),
    taxAmount: numeric("tax_amount", { precision: 12, scale: 2 })
      .default("0.00")
      .notNull(),
    total: numeric({ precision: 12, scale: 2 }).default("0.00").notNull(),
    amountPaid: numeric("amount_paid", { precision: 12, scale: 2 })
      .default("0.00")
      .notNull(),
    amountDue: numeric("amount_due", { precision: 12, scale: 2 })
      .default("0.00")
      .notNull(),
    notes: text(),
    termsAndConditions: text("terms_and_conditions"),
    footerNote: text("footer_note"),
    template: invoicingTemplate().default("Modern").notNull(),
    pdfPath: text("pdf_path"),
    emailSentAt: timestamp("email_sent_at", { mode: "string" }),
    emailSentCount: integer("email_sent_count").default(0).notNull(),
    lastReminderSentAt: timestamp("last_reminder_sent_at", { mode: "string" }),
    reminderCount: integer("reminder_count").default(0).notNull(),
    sentAt: timestamp("sent_at", { mode: "string" }),
    paidAt: timestamp("paid_at", { mode: "string" }),
    cancelledAt: timestamp("cancelled_at", { mode: "string" }),
    organizationId: text("organization_id").notNull(),
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("invoices_client_idx").using(
      "btree",
      table.clientId.asc().nullsLast().op("int4_ops"),
    ),
    index("invoices_due_date_idx").using(
      "btree",
      table.dueDate.asc().nullsLast().op("date_ops"),
    ),
    index("invoices_invoice_date_idx").using(
      "btree",
      table.invoiceDate.asc().nullsLast().op("date_ops"),
    ),
    index("invoices_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("invoices_status_idx").using(
      "btree",
      table.status.asc().nullsLast().op("enum_ops"),
    ),
    foreignKey({
      columns: [table.clientId],
      foreignColumns: [clients.id],
      name: "invoices_client_id_clients_id_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.bankAccountId],
      foreignColumns: [companyBankAccounts.id],
      name: "invoices_bank_account_id_company_bank_accounts_id_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.currencyId],
      foreignColumns: [organizationCurrencies.id],
      name: "invoices_currency_id_organization_currencies_id_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "invoices_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [user.id],
      name: "invoices_created_by_user_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.updatedBy],
      foreignColumns: [user.id],
      name: "invoices_updated_by_user_id_fk",
    }).onDelete("set null"),
    unique("invoices_invoice_number_unique").on(table.invoiceNumber),
  ],
);

export const account = pgTable(
  "account",
  {
    id: text().primaryKey().notNull(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      mode: "string",
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      mode: "string",
    }),
    scope: text(),
    password: text(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).notNull(),
  },
  (table) => [
    index("account_userId_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "account_user_id_user_id_fk",
    }).onDelete("cascade"),
  ],
);

export const invitation = pgTable(
  "invitation",
  {
    id: text().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    email: text().notNull(),
    role: text(),
    status: text().default("pending").notNull(),
    department: text().default("operations").notNull(),
    expiresAt: timestamp("expires_at", { mode: "string" }).notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    inviterId: text("inviter_id").notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "invitation_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.inviterId],
      foreignColumns: [user.id],
      name: "invitation_inviter_id_user_id_fk",
    }).onDelete("cascade"),
  ],
);

export const member = pgTable(
  "member",
  {
    id: text().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    userId: text("user_id").notNull(),
    role: text().default("member").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    deletedAt: timestamp("deleted_at", { mode: "string" }),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "member_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "member_user_id_user_id_fk",
    }).onDelete("cascade"),
  ],
);

export const annualLeaveSettings = pgTable(
  "annual_leave_settings",
  {
    id: serial().primaryKey().notNull(),
    allocatedDays: integer("allocated_days").default(30).notNull(),
    organizationId: text("organization_id").notNull(),
    year: integer().notNull(),
    description: text(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "annual_leave_settings_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    unique("annual_leave_settings_year_unique").on(table.year),
  ],
);

export const attendance = pgTable(
  "attendance",
  {
    id: serial().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    date: date().notNull(),
    signInTime: timestamp("sign_in_time", { mode: "string" }),
    signOutTime: timestamp("sign_out_time", { mode: "string" }),
    organizationId: text("organization_id").notNull(),
    signInLatitude: numeric("sign_in_latitude", { precision: 10, scale: 8 }),
    signInLongitude: numeric("sign_in_longitude", { precision: 11, scale: 8 }),
    signInLocation: text("sign_in_location"),
    status: attendanceStatus().default("Approved").notNull(),
    rejectionReason: text("rejection_reason"),
    rejectedByUserId: text("rejected_by_user_id"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("attendance_user_date_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("date_ops"),
      table.date.asc().nullsLast().op("date_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "attendance_user_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "attendance_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.rejectedByUserId],
      foreignColumns: [user.id],
      name: "attendance_rejected_by_user_id_user_id_fk",
    }),
  ],
);

export const attendanceSettings = pgTable(
  "attendance_settings",
  {
    id: serial().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    signInStartHour: integer("sign_in_start_hour").default(6).notNull(),
    signInEndHour: integer("sign_in_end_hour").default(9).notNull(),
    signOutStartHour: integer("sign_out_start_hour").default(14).notNull(),
    signOutEndHour: integer("sign_out_end_hour").default(20).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "attendance_settings_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const attendanceWarnings = pgTable(
  "attendance_warnings",
  {
    id: serial().primaryKey().notNull(),
    attendanceId: integer("attendance_id").notNull(),
    userId: text("user_id").notNull(),
    warningType: attendanceWarningType("warning_type").notNull(),
    reason: text().notNull(),
    message: text().notNull(),
    issuedByUserId: text("issued_by_user_id").notNull(),
    organizationId: text("organization_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("attendance_warnings_attendance_idx").using(
      "btree",
      table.attendanceId.asc().nullsLast().op("int4_ops"),
    ),
    index("attendance_warnings_user_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.attendanceId],
      foreignColumns: [attendance.id],
      name: "attendance_warnings_attendance_id_attendance_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "attendance_warnings_user_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.issuedByUserId],
      foreignColumns: [user.id],
      name: "attendance_warnings_issued_by_user_id_user_id_fk",
    }),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "attendance_warnings_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const employeesDocuments = pgTable(
  "employees_documents",
  {
    id: serial().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    documentType: text("document_type").notNull(),
    documentName: text("document_name").notNull(),
    filePath: text("file_path").notNull(),
    organizationId: text("organization_id").notNull(),
    fileSize: numeric("file_size", { precision: 10, scale: 2 }).notNull(),
    mimeType: text("mime_type"),
    uploadedByUserId: text("uploaded_by_user_id"),
    department: text().notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "employees_documents_user_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "employees_documents_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.uploadedByUserId],
      foreignColumns: [user.id],
      name: "employees_documents_uploaded_by_user_id_user_id_fk",
    }),
  ],
);

export const employmentHistory = pgTable(
  "employment_history",
  {
    id: serial().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    startDate: date("start_date"),
    organizationId: text("organization_id").notNull(),
    endDate: date("end_date"),
    department: text(),
    employmentType: employmentType("employment_type"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("employment_history_active_idx")
      .using("btree", table.endDate.asc().nullsLast().op("date_ops"))
      .where(sql`(end_date IS NULL)`),
    index("history_user_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "employment_history_user_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "employment_history_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const leaveApplications = pgTable(
  "leave_applications",
  {
    id: serial().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    leaveType: leaveType("leave_type").notNull(),
    startDate: date("start_date").notNull(),
    organizationId: text("organization_id").notNull(),
    endDate: date("end_date").notNull(),
    totalDays: integer("total_days").notNull(),
    reason: text().notNull(),
    status: leaveStatus().default("Pending").notNull(),
    approvedByUserId: text("approved_by_user_id"),
    approvedAt: timestamp("approved_at", { mode: "string" }),
    rejectionReason: text("rejection_reason"),
    appliedAt: timestamp("applied_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("leave_applications_dates_idx").using(
      "btree",
      table.startDate.asc().nullsLast().op("date_ops"),
      table.endDate.asc().nullsLast().op("date_ops"),
    ),
    index("leave_applications_status_idx").using(
      "btree",
      table.status.asc().nullsLast().op("enum_ops"),
    ),
    index("leave_applications_user_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "leave_applications_user_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "leave_applications_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.approvedByUserId],
      foreignColumns: [user.id],
      name: "leave_applications_approved_by_user_id_user_id_fk",
    }),
  ],
);

export const leaveBalances = pgTable(
  "leave_balances",
  {
    id: serial().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    leaveType: leaveType("leave_type").notNull(),
    totalDays: integer("total_days").default(0).notNull(),
    usedDays: integer("used_days").default(0).notNull(),
    remainingDays: integer("remaining_days").default(0).notNull(),
    organizationId: text("organization_id").notNull(),
    year: integer().notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("leave_balances_type_year_idx").using(
      "btree",
      table.leaveType.asc().nullsLast().op("int4_ops"),
      table.year.asc().nullsLast().op("int4_ops"),
    ),
    index("leave_balances_user_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "leave_balances_user_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "leave_balances_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const leaveTypes = pgTable(
  "leave_types",
  {
    id: serial().primaryKey().notNull(),
    name: text().notNull(),
    description: text(),
    organizationId: text("organization_id").notNull(),
    maxDays: integer("max_days"),
    requiresApproval: boolean("requires_approval").default(true).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "leave_types_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    unique("leave_types_name_unique").on(table.name),
  ],
);

export const emailAttachment = pgTable(
  "email_attachment",
  {
    id: serial().primaryKey().notNull(),
    emailId: integer("email_id").notNull(),
    documentId: integer("document_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    organizationId: text("organization_id").notNull(),
  },
  (table) => [
    index("email_attachment_document_id_idx").using(
      "btree",
      table.documentId.asc().nullsLast().op("int4_ops"),
    ),
    index("email_attachment_email_id_idx").using(
      "btree",
      table.emailId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.emailId],
      foreignColumns: [email.id],
      name: "email_attachment_email_id_email_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.documentId],
      foreignColumns: [document.id],
      name: "email_attachment_document_id_document_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "email_attachment_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const emailRecipient = pgTable(
  "email_recipient",
  {
    id: serial().primaryKey().notNull(),
    emailId: integer("email_id").notNull(),
    recipientId: text("recipient_id").notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    isArchived: boolean("is_archived").default(false).notNull(),
    isDeleted: boolean("is_deleted").default(false).notNull(),
    readAt: timestamp("read_at", { mode: "string" }),
    archivedAt: timestamp("archived_at", { mode: "string" }),
    deletedAt: timestamp("deleted_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    organizationId: text("organization_id").notNull(),
  },
  (table) => [
    index("email_recipient_email_id_idx").using(
      "btree",
      table.emailId.asc().nullsLast().op("int4_ops"),
    ),
    index("email_recipient_is_archived_idx").using(
      "btree",
      table.isArchived.asc().nullsLast().op("bool_ops"),
    ),
    index("email_recipient_is_deleted_idx").using(
      "btree",
      table.isDeleted.asc().nullsLast().op("bool_ops"),
    ),
    index("email_recipient_is_read_idx").using(
      "btree",
      table.isRead.asc().nullsLast().op("bool_ops"),
    ),
    index("email_recipient_recipient_id_idx").using(
      "btree",
      table.recipientId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.emailId],
      foreignColumns: [email.id],
      name: "email_recipient_email_id_email_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.recipientId],
      foreignColumns: [user.id],
      name: "email_recipient_recipient_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "email_recipient_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const expenses = pgTable(
  "expenses",
  {
    id: serial().primaryKey().notNull(),
    projectId: integer("project_id").notNull(),
    title: text().notNull(),
    amount: integer().default(0).notNull(),
    spentAt: timestamp("spent_at", { mode: "string" }),
    notes: text(),
    organizationId: text("organization_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("expenses_project_idx").using(
      "btree",
      table.projectId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "expenses_project_id_projects_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "expenses_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const milestones = pgTable(
  "milestones",
  {
    id: serial().primaryKey().notNull(),
    projectId: integer("project_id").notNull(),
    title: text().notNull(),
    description: text(),
    dueDate: timestamp("due_date", { mode: "string" }),
    organizationId: text("organization_id").notNull(),
    completed: integer().default(0).notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("milestones_project_idx").using(
      "btree",
      table.projectId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "milestones_project_id_projects_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "milestones_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const projectAccess = pgTable(
  "project_access",
  {
    id: serial().primaryKey().notNull(),
    projectId: integer("project_id").notNull(),
    userId: text("user_id").notNull(),
    accessLevel: projectAccessLevel("access_level").default("read").notNull(),
    grantedBy: text("granted_by"),
    organizationId: text("organization_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("project_access_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("project_access_project_idx").using(
      "btree",
      table.projectId.asc().nullsLast().op("int4_ops"),
    ),
    index("project_access_user_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "project_access_project_id_projects_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "project_access_user_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.grantedBy],
      foreignColumns: [user.id],
      name: "project_access_granted_by_user_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "project_access_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    unique("project_access_unique").on(table.projectId, table.userId),
  ],
);

export const projects = pgTable(
  "projects",
  {
    id: serial().primaryKey().notNull(),
    name: text().notNull(),
    code: text().notNull(),
    description: text(),
    location: text(),
    status: projectStatus().default("pending").notNull(),
    budgetPlanned: integer("budget_planned").default(0).notNull(),
    budgetActual: integer("budget_actual").default(0).notNull(),
    supervisorId: text("supervisor_id"),
    createdBy: text("created_by"),
    organizationId: text("organization_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("projects_created_by_idx").using(
      "btree",
      table.createdBy.asc().nullsLast().op("text_ops"),
    ),
    index("projects_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("projects_supervisor_idx").using(
      "btree",
      table.supervisorId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.supervisorId],
      foreignColumns: [user.id],
      name: "projects_supervisor_id_user_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [user.id],
      name: "projects_created_by_user_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "projects_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    unique("projects_code_unique").on(table.code),
  ],
);

export const documentAccess = pgTable(
  "document_access",
  {
    id: serial().primaryKey().notNull(),
    accessLevel: text("access_level").notNull(),
    documentId: integer("document_id").notNull(),
    userId: text("user_id"),
    department: text(),
    grantedBy: text("granted_by"),
    organizationId: text("organization_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("documents_access_department_idx").using(
      "btree",
      table.department.asc().nullsLast().op("text_ops"),
    ),
    index("documents_access_granted_idx").using(
      "btree",
      table.grantedBy.asc().nullsLast().op("text_ops"),
    ),
    index("documents_access_id_idx").using(
      "btree",
      table.documentId.asc().nullsLast().op("int4_ops"),
    ),
    index("documents_access_level_idx").using(
      "btree",
      table.accessLevel.asc().nullsLast().op("text_ops"),
    ),
    index("documents_access_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("documents_access_user_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.documentId],
      foreignColumns: [document.id],
      name: "document_access_document_id_document_id_fk",
    }),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "document_access_user_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.grantedBy],
      foreignColumns: [user.id],
      name: "document_access_granted_by_user_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "document_access_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const documentFolders = pgTable(
  "document_folders",
  {
    id: serial().primaryKey().notNull(),
    name: text().notNull(),
    parentId: integer("parent_id"),
    root: boolean().default(true).notNull(),
    department: text().notNull(),
    status: text().default("active").notNull(),
    public: boolean().default(false).notNull(),
    departmental: boolean().default(false).notNull(),
    createdBy: text("created_by"),
    organizationId: text("organization_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("folders_department_idx").using(
      "btree",
      table.department.asc().nullsLast().op("text_ops"),
    ),
    index("folders_name_idx").using(
      "btree",
      table.name.asc().nullsLast().op("text_ops"),
    ),
    index("folders_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("folders_parent_idx").using(
      "btree",
      table.parentId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [user.id],
      name: "document_folders_created_by_user_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "document_folders_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "document_folders_parent_id_fk",
    }),
  ],
);

export const documentLogs = pgTable(
  "document_logs",
  {
    id: serial().primaryKey().notNull(),
    userId: text("user_id"),
    documentId: integer("document_id"),
    documentVersionId: integer("document_version_id"),
    action: text().notNull(),
    details: text(),
    organizationId: text("organization_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("documents_logs_action_idx").using(
      "btree",
      table.action.asc().nullsLast().op("text_ops"),
    ),
    index("documents_logs_document_idx").using(
      "btree",
      table.documentId.asc().nullsLast().op("int4_ops"),
    ),
    index("documents_logs_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "document_logs_user_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.documentId],
      foreignColumns: [document.id],
      name: "document_logs_document_id_document_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.documentVersionId],
      foreignColumns: [documentVersions.id],
      name: "document_logs_document_version_id_document_versions_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "document_logs_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const documentSharedLink = pgTable(
  "document_shared_link",
  {
    id: serial().primaryKey().notNull(),
    documentId: integer("document_id"),
    token: text().notNull(),
    expiresAt: timestamp("expires_at", { mode: "string" }),
    accessLevel: text("access_level").default("View"),
    createdBy: text("created_by"),
    organizationId: text("organization_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("documents_shared_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("documents_shared_token").using(
      "btree",
      table.token.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.documentId],
      foreignColumns: [document.id],
      name: "document_shared_link_document_id_document_id_fk",
    }),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [user.id],
      name: "document_shared_link_created_by_user_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "document_shared_link_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    unique("document_shared_link_token_unique").on(table.token),
  ],
);

export const documentTags = pgTable(
  "document_tags",
  {
    id: serial().primaryKey().notNull(),
    documentId: integer("document_id"),
    tag: text().notNull(),
    organizationId: text("organization_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("documents_tag_id_idx").using(
      "btree",
      table.documentId.asc().nullsLast().op("int4_ops"),
    ),
    index("documents_tag_idx").using(
      "btree",
      table.tag.asc().nullsLast().op("text_ops"),
    ),
    index("documents_tag_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.documentId],
      foreignColumns: [document.id],
      name: "document_tags_document_id_document_id_fk",
    }),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "document_tags_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const documentVersions = pgTable(
  "document_versions",
  {
    id: serial().primaryKey().notNull(),
    documentId: integer("document_id").notNull(),
    versionNumber: integer("version_number").notNull(),
    filePath: text("file_path").notNull(),
    fileSize: numeric("file_size", { precision: 10, scale: 2 }).notNull(),
    mimeType: text("mime_type"),
    scannedOcr: text("scanned_ocr"),
    uploadedBy: text("uploaded_by"),
    organizationId: text("organization_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("documents_version_number_idx").using(
      "btree",
      table.versionNumber.asc().nullsLast().op("int4_ops"),
    ),
    index("documents_version_ocr_idx").using(
      "btree",
      table.scannedOcr.asc().nullsLast().op("text_ops"),
    ),
    index("documents_version_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("documents_version_uploaded_by_idx").using(
      "btree",
      table.uploadedBy.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.documentId],
      foreignColumns: [document.id],
      name: "document_versions_document_id_document_id_fk",
    }),
    foreignKey({
      columns: [table.uploadedBy],
      foreignColumns: [user.id],
      name: "document_versions_uploaded_by_user_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "document_versions_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    organizationId: text("organization_id").notNull(),
    title: text().notNull(),
    message: text().notNull(),
    notificationType: notificationType("notification_type").notNull(),
    createdBy: text("created_by"),
    referenceId: serial("reference_id").notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("notifications_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "notifications_user_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "notifications_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [user.id],
      name: "notifications_created_by_user_id_fk",
    }).onDelete("set null"),
  ],
);

export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    organizationId: text("organization_id").notNull(),
    emailNotifications: boolean("email_notifications").default(true).notNull(),
    inAppNotifications: boolean("in_app_notifications").default(true).notNull(),
    emailOnInAppMessage: boolean("email_on_in_app_message")
      .default(true)
      .notNull(),
    emailOnTaskNotification: boolean("email_on_task_notification")
      .default(false)
      .notNull(),
    emailOnGeneralNotification: boolean("email_on_general_notification")
      .default(false)
      .notNull(),
    notifyOnMessage: boolean("notify_on_message").default(true).notNull(),
  },
  (table) => [
    index("notification_preferences_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "notification_preferences_user_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "notification_preferences_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    payerName: text("payer_name").notNull(),
    accountNumber: text("account_number").notNull(),
    bankName: text("bank_name"),
    amount: serial().notNull(),
    currency: text().default("NGN"),
    paymentReference: text("payment_reference"),
    paymentDate: timestamp("payment_date", { mode: "string" }).defaultNow(),
    paymentStatusType: paymentStatusType("payment_status_type").default(
      "pending",
    ),
    description: text(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("payments_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "payments_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const taskReviews = pgTable(
  "task_reviews",
  {
    id: serial().primaryKey().notNull(),
    taskId: integer("task_id").notNull(),
    submissionId: integer("submission_id").notNull(),
    reviewedBy: text("reviewed_by").notNull(),
    organizationId: text("organization_id").notNull(),
    status: reviewStatus().notNull(),
    reviewNote: text("review_note"),
    reviewedAt: timestamp("reviewed_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("task_reviews_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("task_reviews_reviewer_idx").using(
      "btree",
      table.reviewedBy.asc().nullsLast().op("text_ops"),
    ),
    index("task_reviews_submission_idx").using(
      "btree",
      table.submissionId.asc().nullsLast().op("int4_ops"),
    ),
    index("task_reviews_task_idx").using(
      "btree",
      table.taskId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.taskId],
      foreignColumns: [tasks.id],
      name: "task_reviews_task_id_tasks_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.submissionId],
      foreignColumns: [taskSubmissions.id],
      name: "task_reviews_submission_id_task_submissions_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.reviewedBy],
      foreignColumns: [user.id],
      name: "task_reviews_reviewed_by_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "task_reviews_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const taskSubmissions = pgTable(
  "task_submissions",
  {
    id: serial().primaryKey().notNull(),
    taskId: integer("task_id").notNull(),
    submittedBy: text("submitted_by").notNull(),
    organizationId: text("organization_id").notNull(),
    submissionNote: text("submission_note"),
    submittedFiles: jsonb("submitted_files"),
    submittedAt: timestamp("submitted_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("task_submissions_employee_idx").using(
      "btree",
      table.submittedBy.asc().nullsLast().op("text_ops"),
    ),
    index("task_submissions_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("task_submissions_task_idx").using(
      "btree",
      table.taskId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.taskId],
      foreignColumns: [tasks.id],
      name: "task_submissions_task_id_tasks_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.submittedBy],
      foreignColumns: [user.id],
      name: "task_submissions_submitted_by_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "task_submissions_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const tasks = pgTable(
  "tasks",
  {
    id: serial().primaryKey().notNull(),
    title: text().notNull(),
    description: text(),
    assignedTo: text("assigned_to").notNull(),
    assignedBy: text("assigned_by").notNull(),
    organizationId: text("organization_id").notNull(),
    status: taskStatus().default("Todo").notNull(),
    priority: taskPriority().default("Medium").notNull(),
    dueDate: date("due_date"),
    attachments: jsonb(),
    links: jsonb(),
    progressCompleted: integer("progress_completed").default(0),
    progressTotal: integer("progress_total").default(0),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("tasks_assigned_by_idx").using(
      "btree",
      table.assignedBy.asc().nullsLast().op("text_ops"),
    ),
    index("tasks_assigned_to_idx").using(
      "btree",
      table.assignedTo.asc().nullsLast().op("text_ops"),
    ),
    index("tasks_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("tasks_status_idx").using(
      "btree",
      table.status.asc().nullsLast().op("enum_ops"),
    ),
    foreignKey({
      columns: [table.assignedTo],
      foreignColumns: [user.id],
      name: "tasks_assigned_to_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.assignedBy],
      foreignColumns: [user.id],
      name: "tasks_assigned_by_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "tasks_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const taskMessages = pgTable(
  "task_messages",
  {
    id: serial().primaryKey().notNull(),
    taskId: integer("task_id").notNull(),
    senderId: text("sender_id").notNull(),
    organizationId: text("organization_id").notNull(),
    content: text().notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("task_messages_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.taskId],
      foreignColumns: [tasks.id],
      name: "task_messages_task_id_tasks_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.senderId],
      foreignColumns: [user.id],
      name: "task_messages_sender_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "task_messages_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const taskAssignees = pgTable(
  "task_assignees",
  {
    id: serial().primaryKey().notNull(),
    taskId: integer("task_id").notNull(),
    userId: text("user_id").notNull(),
    organizationId: text("organization_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("task_assignees_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("task_assignees_task_idx").using(
      "btree",
      table.taskId.asc().nullsLast().op("int4_ops"),
    ),
    index("task_assignees_user_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.taskId],
      foreignColumns: [tasks.id],
      name: "task_assignees_task_id_tasks_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "task_assignees_user_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "task_assignees_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const taskLabelAssignments = pgTable(
  "task_label_assignments",
  {
    id: serial().primaryKey().notNull(),
    taskId: integer("task_id").notNull(),
    labelId: integer("label_id").notNull(),
    organizationId: text("organization_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("task_label_assignments_label_idx").using(
      "btree",
      table.labelId.asc().nullsLast().op("int4_ops"),
    ),
    index("task_label_assignments_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("task_label_assignments_task_idx").using(
      "btree",
      table.taskId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.taskId],
      foreignColumns: [tasks.id],
      name: "task_label_assignments_task_id_tasks_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.labelId],
      foreignColumns: [taskLabels.id],
      name: "task_label_assignments_label_id_task_labels_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "task_label_assignments_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const taskLabels = pgTable(
  "task_labels",
  {
    id: serial().primaryKey().notNull(),
    name: text().notNull(),
    color: text().notNull(),
    organizationId: text("organization_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("task_labels_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "task_labels_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const balanceTransactions = pgTable(
  "balance_transactions",
  {
    id: serial().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    organizationId: text("organization_id").notNull(),
    amount: numeric({ precision: 15, scale: 2 }).notNull(),
    transactionType: text("transaction_type").default("top-up").notNull(),
    description: text(),
    balanceBefore: numeric("balance_before", {
      precision: 15,
      scale: 2,
    }).notNull(),
    balanceAfter: numeric("balance_after", {
      precision: 15,
      scale: 2,
    }).notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("balance_transactions_date_idx").using(
      "btree",
      table.createdAt.asc().nullsLast().op("timestamp_ops"),
    ),
    index("balance_transactions_type_idx").using(
      "btree",
      table.transactionType.asc().nullsLast().op("text_ops"),
    ),
    index("balance_transactions_user_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "balance_transactions_user_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "balance_transactions_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const companyBalance = pgTable(
  "company_balance",
  {
    id: serial().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    balance: numeric({ precision: 15, scale: 2 }).default("0").notNull(),
    currency: text().default("NGN").notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "company_balance_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const driverAssignments = pgTable(
  "driver_assignments",
  {
    id: serial().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    driverId: integer("driver_id").notNull(),
    vehicleId: integer("vehicle_id").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
    notes: text(),
    assignedBy: text("assigned_by"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("driver_assignments_active_idx").using(
      "btree",
      table.endDate.asc().nullsLast().op("date_ops"),
    ),
    index("driver_assignments_driver_idx").using(
      "btree",
      table.driverId.asc().nullsLast().op("int4_ops"),
    ),
    index("driver_assignments_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("driver_assignments_vehicle_idx").using(
      "btree",
      table.vehicleId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "driver_assignments_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.driverId],
      foreignColumns: [drivers.id],
      name: "driver_assignments_driver_id_drivers_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.vehicleId],
      foreignColumns: [vehicles.id],
      name: "driver_assignments_vehicle_id_vehicles_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.assignedBy],
      foreignColumns: [user.id],
      name: "driver_assignments_assigned_by_user_id_fk",
    }).onDelete("set null"),
  ],
);

export const drivers = pgTable(
  "drivers",
  {
    id: serial().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    name: text().notNull(),
    email: text(),
    phone: text(),
    licenseNumber: text("license_number").notNull(),
    licenseExpiryDate: date("license_expiry_date"),
    licenseClass: text("license_class"),
    dateOfBirth: date("date_of_birth"),
    employeeId: integer("employee_id"),
    hireDate: date("hire_date"),
    status: driverStatus().default("Active").notNull(),
    notes: text(),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("drivers_employee_idx").using(
      "btree",
      table.employeeId.asc().nullsLast().op("int4_ops"),
    ),
    index("drivers_license_idx").using(
      "btree",
      table.licenseNumber.asc().nullsLast().op("text_ops"),
    ),
    index("drivers_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("drivers_status_idx").using(
      "btree",
      table.status.asc().nullsLast().op("enum_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "drivers_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [employees.id],
      name: "drivers_employee_id_employees_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [user.id],
      name: "drivers_created_by_user_id_fk",
    }).onDelete("set null"),
  ],
);

export const fleetIncidents = pgTable(
  "fleet_incidents",
  {
    id: serial().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    vehicleId: integer("vehicle_id").notNull(),
    driverId: integer("driver_id"),
    incidentType: incidentType("incident_type").notNull(),
    severity: incidentSeverity().notNull(),
    incidentDate: timestamp("incident_date", { mode: "string" }).notNull(),
    location: text(),
    description: text().notNull(),
    estimatedCost: numeric("estimated_cost", { precision: 15, scale: 2 }),
    resolutionStatus: incidentResolutionStatus("resolution_status")
      .default("Reported")
      .notNull(),
    resolutionNotes: text("resolution_notes"),
    resolvedAt: timestamp("resolved_at", { mode: "string" }),
    reportedBy: text("reported_by"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("fleet_incidents_date_idx").using(
      "btree",
      table.incidentDate.asc().nullsLast().op("timestamp_ops"),
    ),
    index("fleet_incidents_driver_idx").using(
      "btree",
      table.driverId.asc().nullsLast().op("int4_ops"),
    ),
    index("fleet_incidents_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("fleet_incidents_severity_idx").using(
      "btree",
      table.severity.asc().nullsLast().op("enum_ops"),
    ),
    index("fleet_incidents_status_idx").using(
      "btree",
      table.resolutionStatus.asc().nullsLast().op("enum_ops"),
    ),
    index("fleet_incidents_vehicle_idx").using(
      "btree",
      table.vehicleId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "fleet_incidents_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.vehicleId],
      foreignColumns: [vehicles.id],
      name: "fleet_incidents_vehicle_id_vehicles_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.driverId],
      foreignColumns: [drivers.id],
      name: "fleet_incidents_driver_id_drivers_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.reportedBy],
      foreignColumns: [user.id],
      name: "fleet_incidents_reported_by_user_id_fk",
    }).onDelete("set null"),
  ],
);

export const fleetMaintenance = pgTable(
  "fleet_maintenance",
  {
    id: serial().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    vehicleId: integer("vehicle_id").notNull(),
    maintenanceType: maintenanceType("maintenance_type").notNull(),
    maintenanceDate: date("maintenance_date").notNull(),
    description: text().notNull(),
    cost: numeric({ precision: 15, scale: 2 }).notNull(),
    mileageAtService: numeric("mileage_at_service", {
      precision: 10,
      scale: 2,
    }),
    performedBy: text("performed_by"),
    nextServiceDue: text("next_service_due"),
    notes: text(),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("fleet_maintenance_date_idx").using(
      "btree",
      table.maintenanceDate.asc().nullsLast().op("date_ops"),
    ),
    index("fleet_maintenance_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("fleet_maintenance_type_idx").using(
      "btree",
      table.maintenanceType.asc().nullsLast().op("enum_ops"),
    ),
    index("fleet_maintenance_vehicle_idx").using(
      "btree",
      table.vehicleId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "fleet_maintenance_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.vehicleId],
      foreignColumns: [vehicles.id],
      name: "fleet_maintenance_vehicle_id_vehicles_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [user.id],
      name: "fleet_maintenance_created_by_user_id_fk",
    }).onDelete("set null"),
  ],
);

export const vehicleDocuments = pgTable(
  "vehicle_documents",
  {
    id: serial().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    vehicleId: integer("vehicle_id").notNull(),
    documentType: vehicleDocumentType("document_type").notNull(),
    documentName: text("document_name").notNull(),
    filePath: text("file_path").notNull(),
    fileSize: numeric("file_size", { precision: 10, scale: 2 }).notNull(),
    mimeType: text("mime_type"),
    uploadedBy: text("uploaded_by"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("vehicle_documents_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("vehicle_documents_type_idx").using(
      "btree",
      table.documentType.asc().nullsLast().op("enum_ops"),
    ),
    index("vehicle_documents_vehicle_idx").using(
      "btree",
      table.vehicleId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "vehicle_documents_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.vehicleId],
      foreignColumns: [vehicles.id],
      name: "vehicle_documents_vehicle_id_vehicles_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.uploadedBy],
      foreignColumns: [user.id],
      name: "vehicle_documents_uploaded_by_user_id_fk",
    }).onDelete("set null"),
  ],
);

export const vehicles = pgTable(
  "vehicles",
  {
    id: serial().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    make: text().notNull(),
    model: text().notNull(),
    year: integer().notNull(),
    vin: text(),
    licensePlate: text("license_plate").notNull(),
    color: text(),
    currentMileage: numeric("current_mileage", { precision: 10, scale: 2 })
      .default("0")
      .notNull(),
    fuelType: vehicleFuelType("fuel_type").notNull(),
    status: vehicleStatus().default("Active").notNull(),
    purchaseDate: date("purchase_date"),
    purchasePrice: numeric("purchase_price", { precision: 15, scale: 2 }),
    currentValue: numeric("current_value", { precision: 15, scale: 2 }),
    depreciationRate: numeric("depreciation_rate", { precision: 5, scale: 2 }),
    insurancePolicyNumber: text("insurance_policy_number"),
    insuranceProvider: text("insurance_provider"),
    insuranceExpiryDate: date("insurance_expiry_date"),
    insurancePremiumAmount: numeric("insurance_premium_amount", {
      precision: 15,
      scale: 2,
    }),
    registrationNumber: text("registration_number"),
    registrationExpiryDate: date("registration_expiry_date"),
    notes: text(),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("vehicles_license_plate_idx").using(
      "btree",
      table.licensePlate.asc().nullsLast().op("text_ops"),
    ),
    index("vehicles_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("vehicles_status_idx").using(
      "btree",
      table.status.asc().nullsLast().op("enum_ops"),
    ),
    index("vehicles_vin_idx").using(
      "btree",
      table.vin.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "vehicles_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [user.id],
      name: "vehicles_created_by_user_id_fk",
    }).onDelete("set null"),
  ],
);

export const allowances = pgTable(
  "allowances",
  {
    id: serial().primaryKey().notNull(),
    name: text().notNull(),
    type: allowanceType().default("one-time").notNull(),
    organizationId: text("organization_id").notNull(),
    percentage: numeric({ precision: 5, scale: 2 }),
    amount: numeric({ precision: 15, scale: 2 }),
    taxable: boolean().default(false).notNull(),
    taxPercentage: numeric("tax_percentage", { precision: 5, scale: 2 }),
    description: text(),
    createdByUserId: text("created_by_user_id").notNull(),
    updatedByUserId: text("updated_by_user_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("allowance_amount_idx").using(
      "btree",
      table.amount.asc().nullsLast().op("numeric_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "allowances_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.createdByUserId],
      foreignColumns: [user.id],
      name: "allowances_created_by_user_id_user_id_fk",
    }),
    foreignKey({
      columns: [table.updatedByUserId],
      foreignColumns: [user.id],
      name: "allowances_updated_by_user_id_user_id_fk",
    }),
  ],
);

export const deductions = pgTable(
  "deductions",
  {
    id: serial().primaryKey().notNull(),
    name: text().notNull(),
    percentage: numeric({ precision: 5, scale: 2 }),
    amount: numeric({ precision: 15, scale: 2 }),
    type: deductionType().default("recurring").notNull(),
    organizationId: text("organization_id").notNull(),
    createdByUserId: text("created_by_user_id").notNull(),
    updatedByUserId: text("updated_by_user_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "deductions_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.createdByUserId],
      foreignColumns: [user.id],
      name: "deductions_created_by_user_id_user_id_fk",
    }),
    foreignKey({
      columns: [table.updatedByUserId],
      foreignColumns: [user.id],
      name: "deductions_updated_by_user_id_user_id_fk",
    }),
  ],
);

export const employeeDeductions = pgTable(
  "employee_deductions",
  {
    id: serial().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    name: text().notNull(),
    userId: text("user_id").notNull(),
    salaryStructureId: integer("salary_structure_id").notNull(),
    type: deductionType(),
    amount: numeric({ precision: 15, scale: 2 }),
    percentage: numeric({ precision: 5, scale: 2 }),
    originalAmount: numeric("original_amount", { precision: 15, scale: 2 }),
    remainingAmount: numeric("remaining_amount", { precision: 15, scale: 2 }),
    active: boolean().default(true).notNull(),
    effectiveFrom: timestamp("effective_from", { mode: "string" }).defaultNow(),
    effectiveTo: timestamp("effective_to", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("emp_deduction_user_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "employee_deductions_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "employee_deductions_user_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.salaryStructureId],
      foreignColumns: [salaryStructure.id],
      name: "employee_deductions_salary_structure_id_salary_structure_id_fk",
    }).onDelete("cascade"),
  ],
);

export const employeeSalary = pgTable(
  "employee_salary",
  {
    id: serial().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    userId: text("user_id").notNull(),
    salaryStructureId: integer("salary_structure_id").notNull(),
    effectiveFrom: timestamp("effective_from", { mode: "string" }).defaultNow(),
    effectiveTo: timestamp("effective_to", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    index("employee_salary_active_idx")
      .using("btree", table.userId.asc().nullsLast().op("text_ops"))
      .where(sql`(effective_to IS NULL)`),
    index("employee_salary_user_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "employee_salary_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "employee_salary_user_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.salaryStructureId],
      foreignColumns: [salaryStructure.id],
      name: "employee_salary_salary_structure_id_salary_structure_id_fk",
    }).onDelete("restrict"),
  ],
);

export const payrun = pgTable(
  "payrun",
  {
    id: serial().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    name: text().notNull(),
    type: payrunType().default("salary").notNull(),
    allowanceId: integer("allowance_id"),
    day: integer().notNull(),
    month: integer().notNull(),
    year: integer().notNull(),
    totalEmployees: integer("total_employees").default(0).notNull(),
    totalGrossPay: numeric("total_gross_pay", { precision: 15, scale: 2 })
      .default("0")
      .notNull(),
    totalDeductions: numeric("total_deductions", { precision: 15, scale: 2 })
      .default("0")
      .notNull(),
    totalNetPay: numeric("total_net_pay", { precision: 15, scale: 2 })
      .default("0")
      .notNull(),
    status: payrollRunStatus().default("draft"),
    generatedByUserId: text("generated_by_user_id").notNull(),
    approvedByUserId: text("approved_by_user_id"),
    approvedAt: timestamp("approved_at", { mode: "string" }),
    completedByUserId: text("completed_by_user_id"),
    completedAt: timestamp("completed_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    index("payrun_date_idx").using(
      "btree",
      table.year.asc().nullsLast().op("int4_ops"),
      table.month.asc().nullsLast().op("int4_ops"),
    ),
    index("payrun_status_idx").using(
      "btree",
      table.status.asc().nullsLast().op("enum_ops"),
    ),
    index("payrun_type_idx").using(
      "btree",
      table.type.asc().nullsLast().op("enum_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "payrun_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.allowanceId],
      foreignColumns: [allowances.id],
      name: "payrun_allowance_id_allowances_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.generatedByUserId],
      foreignColumns: [user.id],
      name: "payrun_generated_by_user_id_user_id_fk",
    }),
    foreignKey({
      columns: [table.approvedByUserId],
      foreignColumns: [user.id],
      name: "payrun_approved_by_user_id_user_id_fk",
    }),
    foreignKey({
      columns: [table.completedByUserId],
      foreignColumns: [user.id],
      name: "payrun_completed_by_user_id_user_id_fk",
    }),
  ],
);

export const payrunItemDetails = pgTable(
  "payrun_item_details",
  {
    id: serial().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    payrunItemId: integer("payrun_item_id").notNull(),
    userId: text("user_id").notNull(),
    detailType: payrollDetailType("detail_type").notNull(),
    description: text().notNull(),
    allowanceId: integer("allowance_id"),
    deductionId: integer("deduction_id"),
    employeeAllowanceId: integer("employee_allowance_id"),
    employeeDeductionId: integer("employee_deduction_id"),
    loanApplicationId: integer("loan_application_id"),
    amount: numeric({ precision: 15, scale: 2 }).notNull(),
    originalAmount: numeric("original_amount", { precision: 15, scale: 2 }),
    remainingAmount: numeric("remaining_amount", { precision: 15, scale: 2 }),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("payroll_item_details_allowance_idx").using(
      "btree",
      table.allowanceId.asc().nullsLast().op("int4_ops"),
    ),
    index("payroll_item_details_deduction_idx").using(
      "btree",
      table.deductionId.asc().nullsLast().op("int4_ops"),
    ),
    index("payroll_item_details_payroll_item_idx").using(
      "btree",
      table.payrunItemId.asc().nullsLast().op("int4_ops"),
    ),
    index("payroll_item_details_type_idx").using(
      "btree",
      table.detailType.asc().nullsLast().op("enum_ops"),
    ),
    index("payroll_item_details_user_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "payrun_item_details_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.payrunItemId],
      foreignColumns: [payrunItems.id],
      name: "payrun_item_details_payrun_item_id_payrun_items_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "payrun_item_details_user_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.allowanceId],
      foreignColumns: [allowances.id],
      name: "payrun_item_details_allowance_id_allowances_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.deductionId],
      foreignColumns: [deductions.id],
      name: "payrun_item_details_deduction_id_deductions_id_fk",
    }).onDelete("set null"),
  ],
);

export const payrunItems = pgTable(
  "payrun_items",
  {
    id: serial().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    type: payrollItemType().default("salary").notNull(),
    payrunId: integer("payrun_id").notNull(),
    userId: text("user_id").notNull(),
    baseSalary: numeric("base_salary", { precision: 15, scale: 2 })
      .default("0")
      .notNull(),
    totalAllowances: numeric("total_allowances", { precision: 15, scale: 2 })
      .default("0")
      .notNull(),
    totalDeductions: numeric("total_deductions", { precision: 15, scale: 2 })
      .default("0")
      .notNull(),
    grossPay: numeric("gross_pay", { precision: 15, scale: 2 })
      .default("0")
      .notNull(),
    taxableIncome: numeric("taxable_income", { precision: 15, scale: 2 })
      .default("0")
      .notNull(),
    totalTaxes: numeric("total_taxes", { precision: 15, scale: 2 })
      .default("0")
      .notNull(),
    netPay: numeric("net_pay", { precision: 15, scale: 2 })
      .default("0")
      .notNull(),
    status: payrollRunStatus().default("pending"),
    notes: text(),
    createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    index("payroll_items_status_idx").using(
      "btree",
      table.status.asc().nullsLast().op("enum_ops"),
    ),
    index("payrun_items_run_idx").using(
      "btree",
      table.payrunId.asc().nullsLast().op("int4_ops"),
    ),
    index("payrun_items_user_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "payrun_items_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.payrunId],
      foreignColumns: [payrun.id],
      name: "payrun_items_payrun_id_payrun_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "payrun_items_user_id_user_id_fk",
    }).onDelete("cascade"),
    unique("unique_payrun_item").on(table.payrunId, table.userId),
  ],
);

export const payslips = pgTable(
  "payslips",
  {
    id: serial().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    payrollItemId: integer("payroll_item_id").notNull(),
    userId: text("user_id").notNull(),
    filePath: text("file_path"),
    generatedAt: timestamp("generated_at", { mode: "string" }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "payslips_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.payrollItemId],
      foreignColumns: [payrunItems.id],
      name: "payslips_payroll_item_id_payrun_items_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "payslips_user_id_user_id_fk",
    }).onDelete("cascade"),
  ],
);

export const salaryAllowances = pgTable(
  "salary_allowances",
  {
    id: serial().primaryKey().notNull(),
    salaryStructureId: integer("salary_structure_id").notNull(),
    allowanceId: integer("allowance_id").notNull(),
    organizationId: text("organization_id").notNull(),
    effectiveFrom: timestamp("effective_from", { mode: "string" }).defaultNow(),
    effectiveTo: timestamp("effective_to", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("salary_allowance_id_idx").using(
      "btree",
      table.salaryStructureId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.salaryStructureId],
      foreignColumns: [salaryStructure.id],
      name: "salary_allowances_salary_structure_id_salary_structure_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.allowanceId],
      foreignColumns: [allowances.id],
      name: "salary_allowances_allowance_id_allowances_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "salary_allowances_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const salaryStructure = pgTable(
  "salary_structure",
  {
    id: serial().primaryKey().notNull(),
    name: text().notNull(),
    organizationId: text("organization_id").notNull(),
    baseSalary: numeric("base_salary", { precision: 15, scale: 2 }).notNull(),
    description: text().notNull(),
    active: boolean().default(true).notNull(),
    employeeCount: integer("employee_count").default(0).notNull(),
    createdByUserId: text("created_by_user_id").notNull(),
    updatedByUserId: text("updated_by_user_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("payroll_amount_idx").using(
      "btree",
      table.baseSalary.asc().nullsLast().op("numeric_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "salary_structure_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.createdByUserId],
      foreignColumns: [user.id],
      name: "salary_structure_created_by_user_id_user_id_fk",
    }),
    foreignKey({
      columns: [table.updatedByUserId],
      foreignColumns: [user.id],
      name: "salary_structure_updated_by_user_id_user_id_fk",
    }),
  ],
);

export const userPreferences = pgTable(
  "user_preferences",
  {
    id: serial().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    organizationId: text("organization_id").notNull(),
    theme: theme().default("system").notNull(),
    language: language().default("en").notNull(),
    dateFormat: dateFormat("date_format").default("MM/DD/YYYY").notNull(),
    timezone: timezone().default("UTC").notNull(),
    sidebarCollapsed: text("sidebar_collapsed").default("false"),
    defaultView: text("default_view").default("dashboard"),
    itemsPerPage: text("items_per_page").default("10"),
    profileVisibility: text("profile_visibility").default("private"),
    emailDigest: text("email_digest").default("daily"),
    compactMode: text("compact_mode").default("false"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("user_preferences_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "user_preferences_user_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "user_preferences_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    unique("user_preferences_user_id_unique").on(table.userId),
  ],
);

export const askHrQuestions = pgTable(
  "ask_hr_questions",
  {
    id: serial().primaryKey().notNull(),
    userId: text("user_id").notNull(),
    title: text().notNull(),
    organizationId: text("organization_id").notNull(),
    question: text().notNull(),
    isAnonymous: boolean("is_anonymous").default(false).notNull(),
    isPublic: boolean("is_public").default(false).notNull(),
    allowPublicResponses: boolean("allow_public_responses")
      .default(false)
      .notNull(),
    category: askHrCategory().notNull(),
    status: askHrStatus().default("Open").notNull(),
    redirectedToUserId: text("redirected_to_user_id"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("ask_hr_questions_category_idx").using(
      "btree",
      table.category.asc().nullsLast().op("enum_ops"),
    ),
    index("ask_hr_questions_redirected_to_user_idx").using(
      "btree",
      table.redirectedToUserId.asc().nullsLast().op("text_ops"),
    ),
    index("ask_hr_questions_status_idx").using(
      "btree",
      table.status.asc().nullsLast().op("enum_ops"),
    ),
    index("ask_hr_questions_user_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "ask_hr_questions_user_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "ask_hr_questions_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.redirectedToUserId],
      foreignColumns: [user.id],
      name: "ask_hr_questions_redirected_to_user_id_user_id_fk",
    }),
  ],
);

export const askHrResponses = pgTable(
  "ask_hr_responses",
  {
    id: serial().primaryKey().notNull(),
    questionId: integer("question_id").notNull(),
    respondentUserId: text("respondent_user_id").notNull(),
    organizationId: text("organization_id").notNull(),
    response: text().notNull(),
    isInternal: boolean("is_internal").default(false).notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("ask_hr_responses_question_idx").using(
      "btree",
      table.questionId.asc().nullsLast().op("int4_ops"),
    ),
    index("ask_hr_responses_respondent_user_idx").using(
      "btree",
      table.respondentUserId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.questionId],
      foreignColumns: [askHrQuestions.id],
      name: "ask_hr_responses_question_id_ask_hr_questions_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.respondentUserId],
      foreignColumns: [user.id],
      name: "ask_hr_responses_respondent_user_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "ask_hr_responses_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const loanApplications = pgTable(
  "loan_applications",
  {
    id: serial().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    referenceNumber: text("reference_number").notNull(),
    userId: text("user_id").notNull(),
    loanTypeId: integer("loan_type_id").notNull(),
    requestedAmount: numeric("requested_amount", {
      precision: 15,
      scale: 2,
    }).notNull(),
    approvedAmount: numeric("approved_amount", { precision: 15, scale: 2 }),
    monthlyDeduction: numeric("monthly_deduction", { precision: 15, scale: 2 }),
    tenureMonths: integer("tenure_months").notNull(),
    reason: text().notNull(),
    status: loanApplicationStatus().default("pending").notNull(),
    hrReviewedByUserId: text("hr_reviewed_by_user_id"),
    hrReviewedAt: timestamp("hr_reviewed_at", { mode: "string" }),
    hrRemarks: text("hr_remarks"),
    disbursedByUserId: text("disbursed_by_user_id"),
    disbursedAt: timestamp("disbursed_at", { mode: "string" }),
    disbursementRemarks: text("disbursement_remarks"),
    employeeDeductionId: integer("employee_deduction_id"),
    totalRepaid: numeric("total_repaid", { precision: 15, scale: 2 })
      .default("0")
      .notNull(),
    remainingBalance: numeric("remaining_balance", { precision: 15, scale: 2 })
      .default("0")
      .notNull(),
    appliedAt: timestamp("applied_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("loan_app_active_idx")
      .using(
        "btree",
        table.userId.asc().nullsLast().op("enum_ops"),
        table.status.asc().nullsLast().op("enum_ops"),
      )
      .where(
        sql`(status = ANY (ARRAY['active'::loan_application_status, 'disbursed'::loan_application_status, 'hr_approved'::loan_application_status, 'pending'::loan_application_status]))`,
      ),
    index("loan_app_disbursed_user_idx").using(
      "btree",
      table.disbursedByUserId.asc().nullsLast().op("text_ops"),
    ),
    index("loan_app_hr_reviewed_user_idx").using(
      "btree",
      table.hrReviewedByUserId.asc().nullsLast().op("text_ops"),
    ),
    index("loan_app_reference_idx").using(
      "btree",
      table.referenceNumber.asc().nullsLast().op("text_ops"),
    ),
    index("loan_app_status_idx").using(
      "btree",
      table.status.asc().nullsLast().op("enum_ops"),
    ),
    index("loan_app_type_idx").using(
      "btree",
      table.loanTypeId.asc().nullsLast().op("int4_ops"),
    ),
    index("loan_app_user_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "loan_applications_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "loan_applications_user_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.loanTypeId],
      foreignColumns: [loanTypes.id],
      name: "loan_applications_loan_type_id_loan_types_id_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.hrReviewedByUserId],
      foreignColumns: [user.id],
      name: "loan_applications_hr_reviewed_by_user_id_user_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.disbursedByUserId],
      foreignColumns: [user.id],
      name: "loan_applications_disbursed_by_user_id_user_id_fk",
    }).onDelete("set null"),
    unique("loan_applications_reference_number_unique").on(
      table.referenceNumber,
    ),
  ],
);

export const loanHistory = pgTable(
  "loan_history",
  {
    id: serial().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    loanApplicationId: integer("loan_application_id").notNull(),
    action: text().notNull(),
    description: text().notNull(),
    performedByUserId: text("performed_by_user_id"),
    metadata: text(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("loan_history_action_idx").using(
      "btree",
      table.action.asc().nullsLast().op("text_ops"),
    ),
    index("loan_history_date_idx").using(
      "btree",
      table.createdAt.asc().nullsLast().op("timestamp_ops"),
    ),
    index("loan_history_loan_idx").using(
      "btree",
      table.loanApplicationId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "loan_history_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.loanApplicationId],
      foreignColumns: [loanApplications.id],
      name: "loan_history_loan_application_id_loan_applications_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.performedByUserId],
      foreignColumns: [user.id],
      name: "loan_history_performed_by_user_id_user_id_fk",
    }).onDelete("set null"),
  ],
);

export const loanRepayments = pgTable(
  "loan_repayments",
  {
    id: serial().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    loanApplicationId: integer("loan_application_id").notNull(),
    userId: text("user_id").notNull(),
    installmentNumber: integer("installment_number").notNull(),
    dueDate: timestamp("due_date", { mode: "string" }).notNull(),
    expectedAmount: numeric("expected_amount", {
      precision: 15,
      scale: 2,
    }).notNull(),
    paidAmount: numeric("paid_amount", { precision: 15, scale: 2 })
      .default("0")
      .notNull(),
    balanceAfter: numeric("balance_after", { precision: 15, scale: 2 }),
    status: repaymentStatus().default("pending").notNull(),
    paidAt: timestamp("paid_at", { mode: "string" }),
    payrunId: integer("payrun_id"),
    payrunItemId: integer("payrun_item_id"),
    notes: text(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("loan_repayment_due_idx").using(
      "btree",
      table.dueDate.asc().nullsLast().op("timestamp_ops"),
    ),
    index("loan_repayment_loan_idx").using(
      "btree",
      table.loanApplicationId.asc().nullsLast().op("int4_ops"),
    ),
    index("loan_repayment_status_idx").using(
      "btree",
      table.status.asc().nullsLast().op("enum_ops"),
    ),
    index("loan_repayment_user_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "loan_repayments_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.loanApplicationId],
      foreignColumns: [loanApplications.id],
      name: "loan_repayments_loan_application_id_loan_applications_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "loan_repayments_user_id_user_id_fk",
    }).onDelete("cascade"),
    unique("unique_loan_installment").on(
      table.loanApplicationId,
      table.installmentNumber,
    ),
  ],
);

export const loanTypes = pgTable(
  "loan_types",
  {
    id: serial().primaryKey().notNull(),
    name: text().notNull(),
    description: text(),
    amountType: loanAmountType("amount_type").default("fixed").notNull(),
    organizationId: text("organization_id").notNull(),
    fixedAmount: numeric("fixed_amount", { precision: 15, scale: 2 }),
    maxPercentage: numeric("max_percentage", { precision: 5, scale: 2 }),
    tenureMonths: integer("tenure_months").notNull(),
    interestRate: numeric("interest_rate", { precision: 5, scale: 2 }).default(
      "0",
    ),
    minServiceMonths: integer("min_service_months").default(0),
    maxActiveLoans: integer("max_active_loans").default(1),
    isActive: boolean("is_active").default(true).notNull(),
    createdByUserId: text("created_by_user_id").notNull(),
    updatedByUserId: text("updated_by_user_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("loan_type_active_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
    index("loan_type_name_idx").using(
      "btree",
      table.name.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "loan_types_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.createdByUserId],
      foreignColumns: [user.id],
      name: "loan_types_created_by_user_id_user_id_fk",
    }),
    foreignKey({
      columns: [table.updatedByUserId],
      foreignColumns: [user.id],
      name: "loan_types_updated_by_user_id_user_id_fk",
    }),
    unique("loan_types_name_unique").on(table.name),
  ],
);

export const newsArticles = pgTable(
  "news_articles",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    title: text().notNull(),
    content: text().notNull(),
    excerpt: text(),
    authorId: text("author_id").notNull(),
    status: newsStatus().default("draft").notNull(),
    commentsEnabled: boolean("comments_enabled").default(true).notNull(),
    isPinned: boolean("is_pinned").default(false).notNull(),
    viewCount: integer("view_count").default(0).notNull(),
    publishedAt: timestamp("published_at", { mode: "string" }),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("news_articles_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "news_articles_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.authorId],
      foreignColumns: [user.id],
      name: "news_articles_author_id_user_id_fk",
    }).onDelete("cascade"),
  ],
);

export const newsAttachments = pgTable(
  "news_attachments",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    articleId: uuid("article_id").notNull(),
    fileName: text("file_name").notNull(),
    fileUrl: text("file_url").notNull(),
    fileSize: integer("file_size").notNull(),
    mimeType: text("mime_type").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("news_attachments_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "news_attachments_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.articleId],
      foreignColumns: [newsArticles.id],
      name: "news_attachments_article_id_news_articles_id_fk",
    }).onDelete("cascade"),
  ],
);

export const newsComments = pgTable(
  "news_comments",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    articleId: uuid("article_id").notNull(),
    userId: text("user_id").notNull(),
    content: text().notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("news_comments_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "news_comments_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.articleId],
      foreignColumns: [newsArticles.id],
      name: "news_comments_article_id_news_articles_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "news_comments_user_id_user_id_fk",
    }).onDelete("cascade"),
  ],
);

export const bugReportAttachments = pgTable(
  "bug_report_attachments",
  {
    id: serial().primaryKey().notNull(),
    bugReportId: serial("bug_report_id").notNull(),
    organizationId: text("organization_id").notNull(),
    upstashId: varchar("upstash_id", { length: 255 }).notNull(),
    originalFileName: varchar("original_file_name", { length: 500 }).notNull(),
    filePath: text("file_path").notNull(),
    fileSize: varchar("file_size", { length: 50 }).notNull(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    uploadedAt: timestamp("uploaded_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("bug_report_attachments_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.bugReportId],
      foreignColumns: [bugReports.id],
      name: "bug_report_attachments_bug_report_id_bug_reports_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "bug_report_attachments_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const bugReports = pgTable(
  "bug_reports",
  {
    id: serial().primaryKey().notNull(),
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull(),
    organizationId: text("organization_id").notNull(),
    title: varchar({ length: 500 }).notNull(),
    severity: varchar({ length: 50 }).notNull(),
    description: text().notNull(),
    stepsToReproduce: text("steps_to_reproduce"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("bug_reports_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "bug_reports_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const invoiceItems = pgTable(
  "invoice_items",
  {
    id: text().primaryKey().notNull(),
    invoiceId: text("invoice_id").notNull(),
    memberId: text("member_id"),
    organizationId: text("organization_id"),
    description: text().notNull(),
    amount: numeric({ precision: 10, scale: 2 }).notNull(),
    prorated: boolean().default(false),
    billingPeriodStart: timestamp("billing_period_start", {
      mode: "string",
    }).notNull(),
    billingPeriodEnd: timestamp("billing_period_end", {
      mode: "string",
    }).notNull(),
  },
  (table) => [
    index("invoice_item_invoice_idx").using(
      "btree",
      table.invoiceId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.invoiceId],
      foreignColumns: [subscriptionsInvoices.id],
      name: "invoice_items_invoice_id_subscriptions_invoices_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.memberId],
      foreignColumns: [member.id],
      name: "invoice_items_member_id_member_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "invoice_items_organization_id_organization_id_fk",
    }).onDelete("set null"),
  ],
);

export const candidateDocuments = pgTable(
  "candidate_documents",
  {
    id: serial().primaryKey().notNull(),
    candidateId: integer("candidate_id").notNull(),
    documentType: candidateDocumentType("document_type").notNull(),
    documentName: text("document_name").notNull(),
    originalFileName: text("original_file_name").notNull(),
    filePath: text("file_path").notNull(),
    fileSize: numeric("file_size", { precision: 10, scale: 2 }).notNull(),
    mimeType: text("mime_type"),
    uploadedBy: text("uploaded_by"),
    organizationId: text("organization_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("candidate_documents_candidate_idx").using(
      "btree",
      table.candidateId.asc().nullsLast().op("int4_ops"),
    ),
    index("candidate_documents_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("candidate_documents_type_idx").using(
      "btree",
      table.documentType.asc().nullsLast().op("enum_ops"),
    ),
    foreignKey({
      columns: [table.candidateId],
      foreignColumns: [candidates.id],
      name: "candidate_documents_candidate_id_candidates_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.uploadedBy],
      foreignColumns: [user.id],
      name: "candidate_documents_uploaded_by_user_id_fk",
    }),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "candidate_documents_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const candidates = pgTable(
  "candidates",
  {
    id: serial().primaryKey().notNull(),
    jobPostingId: integer("job_posting_id").notNull(),
    candidateCode: text("candidate_code").notNull(),
    name: text().notNull(),
    email: text().notNull(),
    phone: text().notNull(),
    currentCompany: text("current_company"),
    currentPosition: text("current_position"),
    yearsExperience: integer("years_experience"),
    expectedSalary: integer("expected_salary"),
    noticePeriod: text("notice_period"),
    linkedinUrl: text("linkedin_url"),
    portfolioUrl: text("portfolio_url"),
    referredBy: text("referred_by"),
    notes: text(),
    status: candidateStatus().default("Applied").notNull(),
    appliedAt: timestamp("applied_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    screenedBy: text("screened_by"),
    screenedAt: timestamp("screened_at", { mode: "string" }),
    screeningNotes: text("screening_notes"),
    rejectionReason: text("rejection_reason"),
    rejectedAt: timestamp("rejected_at", { mode: "string" }),
    rejectedBy: text("rejected_by"),
    hiredAt: timestamp("hired_at", { mode: "string" }),
    organizationId: text("organization_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("candidates_email_idx").using(
      "btree",
      table.email.asc().nullsLast().op("text_ops"),
    ),
    index("candidates_job_posting_idx").using(
      "btree",
      table.jobPostingId.asc().nullsLast().op("int4_ops"),
    ),
    index("candidates_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("candidates_status_idx").using(
      "btree",
      table.status.asc().nullsLast().op("enum_ops"),
    ),
    foreignKey({
      columns: [table.jobPostingId],
      foreignColumns: [jobPostings.id],
      name: "candidates_job_posting_id_job_postings_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.screenedBy],
      foreignColumns: [user.id],
      name: "candidates_screened_by_user_id_fk",
    }),
    foreignKey({
      columns: [table.rejectedBy],
      foreignColumns: [user.id],
      name: "candidates_rejected_by_user_id_fk",
    }),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "candidates_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    unique("candidates_candidate_code_unique").on(table.candidateCode),
  ],
);

export const interviews = pgTable(
  "interviews",
  {
    id: serial().primaryKey().notNull(),
    candidateId: integer("candidate_id").notNull(),
    interviewType: interviewType("interview_type").notNull(),
    round: integer().default(1).notNull(),
    scheduledDate: timestamp("scheduled_date", { mode: "string" }).notNull(),
    scheduledEndDate: timestamp("scheduled_end_date", { mode: "string" }),
    location: text(),
    interviewerIds: text("interviewer_ids").array(),
    status: interviewStatus().default("Scheduled").notNull(),
    feedback: text(),
    rating: integer(),
    recommendation: interviewRecommendation(),
    conductedAt: timestamp("conducted_at", { mode: "string" }),
    scheduledBy: text("scheduled_by"),
    organizationId: text("organization_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("interviews_candidate_idx").using(
      "btree",
      table.candidateId.asc().nullsLast().op("int4_ops"),
    ),
    index("interviews_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("interviews_scheduled_date_idx").using(
      "btree",
      table.scheduledDate.asc().nullsLast().op("timestamp_ops"),
    ),
    index("interviews_status_idx").using(
      "btree",
      table.status.asc().nullsLast().op("enum_ops"),
    ),
    foreignKey({
      columns: [table.candidateId],
      foreignColumns: [candidates.id],
      name: "interviews_candidate_id_candidates_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.scheduledBy],
      foreignColumns: [user.id],
      name: "interviews_scheduled_by_user_id_fk",
    }),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "interviews_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const jobPostings = pgTable(
  "job_postings",
  {
    id: serial().primaryKey().notNull(),
    title: text().notNull(),
    code: text().notNull(),
    department: employeesDepartment().notNull(),
    position: text().notNull(),
    description: text().notNull(),
    requirements: text(),
    responsibilities: text(),
    employmentType: employmentType("employment_type").notNull(),
    salaryRangeMin: integer("salary_range_min"),
    salaryRangeMax: integer("salary_range_max"),
    location: text(),
    openings: integer().default(1).notNull(),
    status: jobPostingStatus().default("Draft").notNull(),
    publishedAt: timestamp("published_at", { mode: "string" }),
    closedAt: timestamp("closed_at", { mode: "string" }),
    postedBy: text("posted_by"),
    organizationId: text("organization_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("job_postings_department_idx").using(
      "btree",
      table.department.asc().nullsLast().op("enum_ops"),
    ),
    index("job_postings_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("job_postings_status_idx").using(
      "btree",
      table.status.asc().nullsLast().op("enum_ops"),
    ),
    foreignKey({
      columns: [table.postedBy],
      foreignColumns: [user.id],
      name: "job_postings_posted_by_user_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "job_postings_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    unique("job_postings_code_unique").on(table.code),
  ],
);

export const offers = pgTable(
  "offers",
  {
    id: serial().primaryKey().notNull(),
    candidateId: integer("candidate_id").notNull(),
    jobPostingId: integer("job_posting_id").notNull(),
    offerCode: text("offer_code").notNull(),
    position: text().notNull(),
    department: employeesDepartment().notNull(),
    employmentType: employmentType("employment_type").notNull(),
    salary: integer().notNull(),
    startDate: date("start_date").notNull(),
    joiningBonus: integer("joining_bonus").default(0),
    benefits: text(),
    validUntil: date("valid_until").notNull(),
    status: offerStatus().default("Draft").notNull(),
    offerLetterPath: text("offer_letter_path"),
    sentAt: timestamp("sent_at", { mode: "string" }),
    acceptedAt: timestamp("accepted_at", { mode: "string" }),
    rejectedAt: timestamp("rejected_at", { mode: "string" }),
    candidateResponse: text("candidate_response"),
    preparedBy: text("prepared_by"),
    approvedBy: text("approved_by"),
    approvedAt: timestamp("approved_at", { mode: "string" }),
    organizationId: text("organization_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("offers_candidate_idx").using(
      "btree",
      table.candidateId.asc().nullsLast().op("int4_ops"),
    ),
    index("offers_job_posting_idx").using(
      "btree",
      table.jobPostingId.asc().nullsLast().op("int4_ops"),
    ),
    index("offers_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("offers_status_idx").using(
      "btree",
      table.status.asc().nullsLast().op("enum_ops"),
    ),
    foreignKey({
      columns: [table.candidateId],
      foreignColumns: [candidates.id],
      name: "offers_candidate_id_candidates_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.jobPostingId],
      foreignColumns: [jobPostings.id],
      name: "offers_job_posting_id_job_postings_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.preparedBy],
      foreignColumns: [user.id],
      name: "offers_prepared_by_user_id_fk",
    }),
    foreignKey({
      columns: [table.approvedBy],
      foreignColumns: [user.id],
      name: "offers_approved_by_user_id_fk",
    }),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "offers_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    unique("offers_offer_code_unique").on(table.offerCode),
  ],
);

export const recruitmentActivityLog = pgTable(
  "recruitment_activity_log",
  {
    id: serial().primaryKey().notNull(),
    candidateId: integer("candidate_id").notNull(),
    activityType: recruitmentActivityType("activity_type").notNull(),
    description: text().notNull(),
    performedBy: text("performed_by"),
    metadata: jsonb(),
    organizationId: text("organization_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("recruitment_activity_candidate_idx").using(
      "btree",
      table.candidateId.asc().nullsLast().op("int4_ops"),
    ),
    index("recruitment_activity_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("recruitment_activity_type_idx").using(
      "btree",
      table.activityType.asc().nullsLast().op("enum_ops"),
    ),
    foreignKey({
      columns: [table.candidateId],
      foreignColumns: [candidates.id],
      name: "recruitment_activity_log_candidate_id_candidates_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.performedBy],
      foreignColumns: [user.id],
      name: "recruitment_activity_log_performed_by_user_id_fk",
    }),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "recruitment_activity_log_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const recruitmentMetrics = pgTable(
  "recruitment_metrics",
  {
    id: serial().primaryKey().notNull(),
    jobPostingId: integer("job_posting_id").notNull(),
    totalApplications: integer("total_applications").default(0).notNull(),
    screened: integer().default(0).notNull(),
    interviewed: integer().default(0).notNull(),
    offered: integer().default(0).notNull(),
    hired: integer().default(0).notNull(),
    rejected: integer().default(0).notNull(),
    avgTimeToHire: integer("avg_time_to_hire").default(0),
    avgTimeToInterview: integer("avg_time_to_interview").default(0),
    organizationId: text("organization_id").notNull(),
    lastUpdated: timestamp("last_updated", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("recruitment_metrics_job_posting_idx").using(
      "btree",
      table.jobPostingId.asc().nullsLast().op("int4_ops"),
    ),
    index("recruitment_metrics_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.jobPostingId],
      foreignColumns: [jobPostings.id],
      name: "recruitment_metrics_job_posting_id_job_postings_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "recruitment_metrics_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const companyBankAccounts = pgTable(
  "company_bank_accounts",
  {
    id: serial().primaryKey().notNull(),
    accountName: text("account_name").notNull(),
    bankName: text("bank_name").notNull(),
    accountNumber: text("account_number").notNull(),
    routingNumber: text("routing_number"),
    swiftCode: text("swift_code"),
    currency: text().notNull(),
    organizationId: text("organization_id").notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("company_bank_accounts_active_idx").using(
      "btree",
      table.isActive.asc().nullsLast().op("bool_ops"),
    ),
    index("company_bank_accounts_org_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "company_bank_accounts_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const invoiceMetrics = pgTable(
  "invoice_metrics",
  {
    id: serial().primaryKey().notNull(),
    totalRevenue: numeric("total_revenue", { precision: 12, scale: 2 })
      .default("0.00")
      .notNull(),
    paidRevenue: numeric("paid_revenue", { precision: 12, scale: 2 })
      .default("0.00")
      .notNull(),
    pendingRevenue: numeric("pending_revenue", { precision: 12, scale: 2 })
      .default("0.00")
      .notNull(),
    overdueRevenue: numeric("overdue_revenue", { precision: 12, scale: 2 })
      .default("0.00")
      .notNull(),
    totalInvoices: integer("total_invoices").default(0).notNull(),
    draftInvoices: integer("draft_invoices").default(0).notNull(),
    sentInvoices: integer("sent_invoices").default(0).notNull(),
    paidInvoices: integer("paid_invoices").default(0).notNull(),
    overdueInvoices: integer("overdue_invoices").default(0).notNull(),
    partiallyPaidInvoices: integer("partially_paid_invoices")
      .default(0)
      .notNull(),
    cancelledInvoices: integer("cancelled_invoices").default(0).notNull(),
    avgPaymentTime: integer("avg_payment_time").default(0),
    avgInvoiceValue: numeric("avg_invoice_value", {
      precision: 12,
      scale: 2,
    }).default("0.00"),
    totalClients: integer("total_clients").default(0).notNull(),
    activeClients: integer("active_clients").default(0).notNull(),
    periodType: text("period_type").notNull(),
    periodValue: text("period_value"),
    organizationId: text("organization_id").notNull(),
    lastUpdated: timestamp("last_updated", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("invoice_metrics_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("invoice_metrics_period_idx").using(
      "btree",
      table.periodType.asc().nullsLast().op("text_ops"),
      table.periodValue.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "invoice_metrics_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const assetAssignmentHistory = pgTable(
  "asset_assignment_history",
  {
    id: serial().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    assetId: integer("asset_id").notNull(),
    transferDate: timestamp("transfer_date", { mode: "string" }).notNull(),
    fromTargetType: assignmentTargetType("from_target_type"),
    fromEmployeeId: text("from_employee_id"),
    fromDepartment: text("from_department"),
    fromProjectId: integer("from_project_id"),
    toTargetType: assignmentTargetType("to_target_type"),
    toEmployeeId: text("to_employee_id"),
    toDepartment: text("to_department"),
    toProjectId: integer("to_project_id"),
    reason: text().notNull(),
    notes: text(),
    transferredBy: text("transferred_by"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("asset_assignment_history_asset_idx").using(
      "btree",
      table.assetId.asc().nullsLast().op("int4_ops"),
    ),
    index("asset_assignment_history_date_idx").using(
      "btree",
      table.transferDate.asc().nullsLast().op("timestamp_ops"),
    ),
    index("asset_assignment_history_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "asset_assignment_history_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.assetId],
      foreignColumns: [assets.id],
      name: "asset_assignment_history_asset_id_assets_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.fromEmployeeId],
      foreignColumns: [user.id],
      name: "asset_assignment_history_from_employee_id_user_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.fromProjectId],
      foreignColumns: [projects.id],
      name: "asset_assignment_history_from_project_id_projects_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.toEmployeeId],
      foreignColumns: [user.id],
      name: "asset_assignment_history_to_employee_id_user_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.toProjectId],
      foreignColumns: [projects.id],
      name: "asset_assignment_history_to_project_id_projects_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.transferredBy],
      foreignColumns: [user.id],
      name: "asset_assignment_history_transferred_by_user_id_fk",
    }).onDelete("set null"),
  ],
);

export const assetAssignments = pgTable(
  "asset_assignments",
  {
    id: serial().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    assetId: integer("asset_id").notNull(),
    targetType: assignmentTargetType("target_type").notNull(),
    employeeId: text("employee_id"),
    department: text(),
    projectId: integer("project_id"),
    assignedDate: date("assigned_date").notNull(),
    expectedReturnDate: date("expected_return_date"),
    actualReturnDate: date("actual_return_date"),
    notes: text(),
    assignedBy: text("assigned_by"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("asset_assignments_active_idx").using(
      "btree",
      table.actualReturnDate.asc().nullsLast().op("date_ops"),
    ),
    index("asset_assignments_asset_idx").using(
      "btree",
      table.assetId.asc().nullsLast().op("int4_ops"),
    ),
    index("asset_assignments_department_idx").using(
      "btree",
      table.department.asc().nullsLast().op("text_ops"),
    ),
    index("asset_assignments_employee_idx").using(
      "btree",
      table.employeeId.asc().nullsLast().op("text_ops"),
    ),
    index("asset_assignments_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("asset_assignments_project_idx").using(
      "btree",
      table.projectId.asc().nullsLast().op("int4_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "asset_assignments_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.assetId],
      foreignColumns: [assets.id],
      name: "asset_assignments_asset_id_assets_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [user.id],
      name: "asset_assignments_employee_id_user_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: "asset_assignments_project_id_projects_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.assignedBy],
      foreignColumns: [user.id],
      name: "asset_assignments_assigned_by_user_id_fk",
    }).onDelete("set null"),
  ],
);

export const assetCategories = pgTable(
  "asset_categories",
  {
    id: serial().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    name: text().notNull(),
    description: text(),
    codePrefix: text("code_prefix").notNull(),
    depreciationMethod: depreciationMethod("depreciation_method").default(
      "Straight-Line",
    ),
    defaultUsefulLifeYears: integer("default_useful_life_years"),
    defaultResidualValuePercent: numeric("default_residual_value_percent", {
      precision: 5,
      scale: 2,
    }),
    isActive: boolean("is_active").default(true).notNull(),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("asset_categories_code_prefix_idx").using(
      "btree",
      table.codePrefix.asc().nullsLast().op("text_ops"),
    ),
    index("asset_categories_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "asset_categories_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [user.id],
      name: "asset_categories_created_by_user_id_fk",
    }).onDelete("set null"),
    unique("asset_categories_org_prefix_unique").on(
      table.organizationId,
      table.codePrefix,
    ),
  ],
);

export const assetDocuments = pgTable(
  "asset_documents",
  {
    id: serial().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    assetId: integer("asset_id").notNull(),
    documentType: assetDocumentType("document_type").notNull(),
    documentName: text("document_name").notNull(),
    originalFileName: text("original_file_name").notNull(),
    filePath: text("file_path").notNull(),
    fileSize: numeric("file_size", { precision: 10, scale: 2 }).notNull(),
    mimeType: text("mime_type"),
    uploadedBy: text("uploaded_by"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("asset_documents_asset_idx").using(
      "btree",
      table.assetId.asc().nullsLast().op("int4_ops"),
    ),
    index("asset_documents_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("asset_documents_type_idx").using(
      "btree",
      table.documentType.asc().nullsLast().op("enum_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "asset_documents_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.assetId],
      foreignColumns: [assets.id],
      name: "asset_documents_asset_id_assets_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.uploadedBy],
      foreignColumns: [user.id],
      name: "asset_documents_uploaded_by_user_id_fk",
    }).onDelete("set null"),
  ],
);

export const assetLocations = pgTable(
  "asset_locations",
  {
    id: serial().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    name: text().notNull(),
    address: text(),
    type: text(),
    description: text(),
    isActive: boolean("is_active").default(true).notNull(),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("asset_locations_name_idx").using(
      "btree",
      table.name.asc().nullsLast().op("text_ops"),
    ),
    index("asset_locations_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "asset_locations_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [user.id],
      name: "asset_locations_created_by_user_id_fk",
    }).onDelete("set null"),
  ],
);

export const assetMaintenance = pgTable(
  "asset_maintenance",
  {
    id: serial().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    assetId: integer("asset_id").notNull(),
    scheduleId: integer("schedule_id"),
    title: text().notNull(),
    description: text(),
    scheduledDate: date("scheduled_date").notNull(),
    completedDate: date("completed_date"),
    status: assetMaintenanceStatus().default("Scheduled").notNull(),
    cost: numeric({ precision: 15, scale: 2 }),
    performedBy: text("performed_by"),
    notes: text(),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("asset_maintenance_asset_idx").using(
      "btree",
      table.assetId.asc().nullsLast().op("int4_ops"),
    ),
    index("asset_maintenance_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("asset_maintenance_schedule_idx").using(
      "btree",
      table.scheduleId.asc().nullsLast().op("int4_ops"),
    ),
    index("asset_maintenance_scheduled_date_idx").using(
      "btree",
      table.scheduledDate.asc().nullsLast().op("date_ops"),
    ),
    index("asset_maintenance_status_idx").using(
      "btree",
      table.status.asc().nullsLast().op("enum_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "asset_maintenance_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.assetId],
      foreignColumns: [assets.id],
      name: "asset_maintenance_asset_id_assets_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.scheduleId],
      foreignColumns: [assetMaintenanceSchedules.id],
      name: "asset_maintenance_schedule_id_asset_maintenance_schedules_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [user.id],
      name: "asset_maintenance_created_by_user_id_fk",
    }).onDelete("set null"),
  ],
);

export const assetMaintenanceSchedules = pgTable(
  "asset_maintenance_schedules",
  {
    id: serial().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    assetId: integer("asset_id").notNull(),
    name: text().notNull(),
    description: text(),
    intervalValue: integer("interval_value").notNull(),
    intervalUnit: maintenanceIntervalUnit("interval_unit").notNull(),
    lastPerformedDate: date("last_performed_date"),
    nextDueDate: date("next_due_date"),
    estimatedCost: numeric("estimated_cost", { precision: 15, scale: 2 }),
    isActive: boolean("is_active").default(true).notNull(),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("asset_maintenance_schedules_asset_idx").using(
      "btree",
      table.assetId.asc().nullsLast().op("int4_ops"),
    ),
    index("asset_maintenance_schedules_next_due_idx").using(
      "btree",
      table.nextDueDate.asc().nullsLast().op("date_ops"),
    ),
    index("asset_maintenance_schedules_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "asset_maintenance_schedules_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.assetId],
      foreignColumns: [assets.id],
      name: "asset_maintenance_schedules_asset_id_assets_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [user.id],
      name: "asset_maintenance_schedules_created_by_user_id_fk",
    }).onDelete("set null"),
  ],
);

export const assetManagementTeams = pgTable(
  "asset_management_teams",
  {
    id: serial().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    userId: text("user_id").notNull(),
    canManageAssets: boolean("can_manage_assets").default(false).notNull(),
    canApproveDisposal: boolean("can_approve_disposal")
      .default(false)
      .notNull(),
    canPerformAdjustments: boolean("can_perform_adjustments")
      .default(false)
      .notNull(),
    addedBy: text("added_by"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("asset_management_teams_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("asset_management_teams_user_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "asset_management_teams_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "asset_management_teams_user_id_user_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.addedBy],
      foreignColumns: [user.id],
      name: "asset_management_teams_added_by_user_id_fk",
    }).onDelete("set null"),
    unique("asset_management_teams_user_unique").on(
      table.organizationId,
      table.userId,
    ),
  ],
);

export const assetValueAdjustments = pgTable(
  "asset_value_adjustments",
  {
    id: serial().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    assetId: integer("asset_id").notNull(),
    adjustmentType: valueAdjustmentType("adjustment_type").notNull(),
    adjustmentDate: date("adjustment_date").notNull(),
    previousValue: numeric("previous_value", {
      precision: 15,
      scale: 2,
    }).notNull(),
    adjustmentAmount: numeric("adjustment_amount", {
      precision: 15,
      scale: 2,
    }).notNull(),
    newValue: numeric("new_value", { precision: 15, scale: 2 }).notNull(),
    reason: text().notNull(),
    notes: text(),
    calculationDetails: jsonb("calculation_details"),
    adjustedBy: text("adjusted_by"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("asset_value_adjustments_asset_idx").using(
      "btree",
      table.assetId.asc().nullsLast().op("int4_ops"),
    ),
    index("asset_value_adjustments_date_idx").using(
      "btree",
      table.adjustmentDate.asc().nullsLast().op("date_ops"),
    ),
    index("asset_value_adjustments_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("asset_value_adjustments_type_idx").using(
      "btree",
      table.adjustmentType.asc().nullsLast().op("enum_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "asset_value_adjustments_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.assetId],
      foreignColumns: [assets.id],
      name: "asset_value_adjustments_asset_id_assets_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.adjustedBy],
      foreignColumns: [user.id],
      name: "asset_value_adjustments_adjusted_by_user_id_fk",
    }).onDelete("set null"),
  ],
);

export const assets = pgTable(
  "assets",
  {
    id: serial().primaryKey().notNull(),
    organizationId: text("organization_id").notNull(),
    assetCode: text("asset_code").notNull(),
    name: text().notNull(),
    description: text(),
    categoryId: integer("category_id").notNull(),
    locationId: integer("location_id"),
    purchaseDate: date("purchase_date"),
    purchasePrice: numeric("purchase_price", { precision: 15, scale: 2 }),
    vendor: text(),
    poNumber: text("po_number"),
    currentValue: numeric("current_value", { precision: 15, scale: 2 }),
    depreciationMethod: depreciationMethod("depreciation_method").default(
      "Straight-Line",
    ),
    usefulLifeYears: integer("useful_life_years"),
    residualValue: numeric("residual_value", { precision: 15, scale: 2 }),
    depreciationStartDate: date("depreciation_start_date"),
    accumulatedDepreciation: numeric("accumulated_depreciation", {
      precision: 15,
      scale: 2,
    }).default("0"),
    warrantyStartDate: date("warranty_start_date"),
    warrantyEndDate: date("warranty_end_date"),
    warrantyProvider: text("warranty_provider"),
    warrantyTerms: text("warranty_terms"),
    serialNumber: text("serial_number"),
    model: text(),
    manufacturer: text(),
    barcode: text(),
    requiresMaintenance: boolean("requires_maintenance")
      .default(false)
      .notNull(),
    status: assetStatus().default("Active").notNull(),
    disposalDate: date("disposal_date"),
    disposalReason: text("disposal_reason"),
    disposalPrice: numeric("disposal_price", { precision: 15, scale: 2 }),
    disposedBy: text("disposed_by"),
    notes: text(),
    customFields: jsonb("custom_fields"),
    createdBy: text("created_by"),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("assets_category_idx").using(
      "btree",
      table.categoryId.asc().nullsLast().op("int4_ops"),
    ),
    index("assets_code_idx").using(
      "btree",
      table.assetCode.asc().nullsLast().op("text_ops"),
    ),
    index("assets_location_idx").using(
      "btree",
      table.locationId.asc().nullsLast().op("int4_ops"),
    ),
    index("assets_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("assets_serial_number_idx").using(
      "btree",
      table.serialNumber.asc().nullsLast().op("text_ops"),
    ),
    index("assets_status_idx").using(
      "btree",
      table.status.asc().nullsLast().op("enum_ops"),
    ),
    index("assets_warranty_end_idx").using(
      "btree",
      table.warrantyEndDate.asc().nullsLast().op("date_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "assets_organization_id_organization_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [assetCategories.id],
      name: "assets_category_id_asset_categories_id_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.locationId],
      foreignColumns: [assetLocations.id],
      name: "assets_location_id_asset_locations_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.disposedBy],
      foreignColumns: [user.id],
      name: "assets_disposed_by_user_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [user.id],
      name: "assets_created_by_user_id_fk",
    }).onDelete("set null"),
    unique("assets_asset_code_unique").on(table.assetCode),
  ],
);

export const organizationCurrencies = pgTable(
  "organization_currencies",
  {
    id: serial().primaryKey().notNull(),
    currencyCode: text("currency_code").notNull(),
    currencySymbol: text("currency_symbol").notNull(),
    currencyName: text("currency_name").notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
    exchangeRate: numeric("exchange_rate", { precision: 12, scale: 6 }).default(
      "1.000000",
    ),
    organizationId: text("organization_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("org_currencies_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "organization_currencies_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const invoiceActivityLog = pgTable(
  "invoice_activity_log",
  {
    id: serial().primaryKey().notNull(),
    invoiceId: integer("invoice_id").notNull(),
    activityType: invoicingActivityType("activity_type").notNull(),
    description: text().notNull(),
    performedBy: text("performed_by"),
    metadata: jsonb(),
    organizationId: text("organization_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("invoice_activity_invoice_idx").using(
      "btree",
      table.invoiceId.asc().nullsLast().op("int4_ops"),
    ),
    index("invoice_activity_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    index("invoice_activity_type_idx").using(
      "btree",
      table.activityType.asc().nullsLast().op("enum_ops"),
    ),
    foreignKey({
      columns: [table.invoiceId],
      foreignColumns: [invoices.id],
      name: "invoice_activity_log_invoice_id_invoices_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.performedBy],
      foreignColumns: [user.id],
      name: "invoice_activity_log_performed_by_user_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "invoice_activity_log_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const invoiceDocuments = pgTable(
  "invoice_documents",
  {
    id: serial().primaryKey().notNull(),
    invoiceId: integer("invoice_id").notNull(),
    documentType: invoicingDocumentType("document_type").notNull(),
    documentName: text("document_name").notNull(),
    originalFileName: text("original_file_name").notNull(),
    filePath: text("file_path").notNull(),
    fileSize: numeric("file_size", { precision: 10, scale: 2 }).notNull(),
    mimeType: text("mime_type"),
    uploadedBy: text("uploaded_by"),
    organizationId: text("organization_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("invoice_documents_invoice_idx").using(
      "btree",
      table.invoiceId.asc().nullsLast().op("int4_ops"),
    ),
    index("invoice_documents_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.invoiceId],
      foreignColumns: [invoices.id],
      name: "invoice_documents_invoice_id_invoices_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.uploadedBy],
      foreignColumns: [user.id],
      name: "invoice_documents_uploaded_by_user_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "invoice_documents_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const invoiceLineItems = pgTable(
  "invoice_line_items",
  {
    id: serial().primaryKey().notNull(),
    invoiceId: integer("invoice_id").notNull(),
    description: text().notNull(),
    quantity: numeric({ precision: 10, scale: 2 }).default("1.00").notNull(),
    unitPrice: numeric("unit_price", { precision: 12, scale: 2 })
      .default("0.00")
      .notNull(),
    amount: numeric({ precision: 12, scale: 2 }).default("0.00").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    organizationId: text("organization_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("invoice_line_items_invoice_idx").using(
      "btree",
      table.invoiceId.asc().nullsLast().op("int4_ops"),
    ),
    index("invoice_line_items_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.invoiceId],
      foreignColumns: [invoices.id],
      name: "invoice_line_items_invoice_id_invoices_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "invoice_line_items_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const invoicePayments = pgTable(
  "invoice_payments",
  {
    id: serial().primaryKey().notNull(),
    invoiceId: integer("invoice_id").notNull(),
    amount: numeric({ precision: 12, scale: 2 }).notNull(),
    paymentDate: date("payment_date").notNull(),
    paymentMethod: invoicingPaymentMethod("payment_method").notNull(),
    referenceNumber: text("reference_number"),
    notes: text(),
    recordedBy: text("recorded_by"),
    organizationId: text("organization_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("invoice_payments_date_idx").using(
      "btree",
      table.paymentDate.asc().nullsLast().op("date_ops"),
    ),
    index("invoice_payments_invoice_idx").using(
      "btree",
      table.invoiceId.asc().nullsLast().op("int4_ops"),
    ),
    index("invoice_payments_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.invoiceId],
      foreignColumns: [invoices.id],
      name: "invoice_payments_invoice_id_invoices_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.recordedBy],
      foreignColumns: [user.id],
      name: "invoice_payments_recorded_by_user_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "invoice_payments_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const invoiceTaxes = pgTable(
  "invoice_taxes",
  {
    id: serial().primaryKey().notNull(),
    invoiceId: integer("invoice_id").notNull(),
    taxName: text("tax_name").notNull(),
    taxPercentage: numeric("tax_percentage", {
      precision: 5,
      scale: 2,
    }).notNull(),
    taxAmount: numeric("tax_amount", { precision: 12, scale: 2 }).notNull(),
    organizationId: text("organization_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("invoice_taxes_invoice_idx").using(
      "btree",
      table.invoiceId.asc().nullsLast().op("int4_ops"),
    ),
    index("invoice_taxes_organization_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.invoiceId],
      foreignColumns: [invoices.id],
      name: "invoice_taxes_invoice_id_invoices_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "invoice_taxes_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);

export const billPayments = pgTable(
  "bill_payments",
  {
    id: serial().primaryKey().notNull(),
    billId: integer("bill_id").notNull(),
    amount: numeric({ precision: 12, scale: 2 }).notNull(),
    paymentDate: date("payment_date").notNull(),
    paymentMethod: billPaymentMethod("payment_method").notNull(),
    referenceNumber: text("reference_number"),
    bankAccountId: integer("bank_account_id"),
    notes: text(),
    recordedBy: text("recorded_by"),
    organizationId: text("organization_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("bill_payments_bill_idx").using(
      "btree",
      table.billId.asc().nullsLast().op("int4_ops"),
    ),
    index("bill_payments_date_idx").using(
      "btree",
      table.paymentDate.asc().nullsLast().op("date_ops"),
    ),
    index("bill_payments_org_idx").using(
      "btree",
      table.organizationId.asc().nullsLast().op("text_ops"),
    ),
    foreignKey({
      columns: [table.bankAccountId],
      foreignColumns: [companyBankAccounts.id],
      name: "bill_payments_bank_account_id_company_bank_accounts_id_fk",
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.recordedBy],
      foreignColumns: [user.id],
      name: "bill_payments_recorded_by_user_id_fk",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organization.id],
      name: "bill_payments_organization_id_organization_id_fk",
    }).onDelete("cascade"),
  ],
);
