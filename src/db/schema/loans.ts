import {
  pgTable,
  text,
  timestamp,
  index,
  serial,
  numeric,
  integer,
  boolean,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { salaryStructure, employeeDeductions } from "./payroll";
import { sql } from "drizzle-orm";
import { organization, user } from "./auth";

export const loanAmountTypeEnum = pgEnum("loan_amount_type", [
  "fixed",
  "percentage",
]);

export const loanApplicationStatusEnum = pgEnum("loan_application_status", [
  "pending",
  "hr_approved",
  "hr_rejected",
  "disbursed",
  "active",
  "completed",
  "cancelled",
]);

export const repaymentStatusEnum = pgEnum("repayment_status", [
  "pending",
  "paid",
  "partial",
  "overdue",
  "waived",
]);

export const loanTypes = pgTable(
  "loan_types",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(),
    description: text("description"),
    amountType: loanAmountTypeEnum("amount_type").notNull().default("fixed"),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    fixedAmount: numeric("fixed_amount", { precision: 15, scale: 2 }),
    maxPercentage: numeric("max_percentage", { precision: 5, scale: 2 }),
    tenureMonths: integer("tenure_months").notNull(),
    interestRate: numeric("interest_rate", {
      precision: 5,
      scale: 2,
    }).default("0"),
    minServiceMonths: integer("min_service_months").default(0), // Minimum months of service
    maxActiveLoans: integer("max_active_loans").default(1), // Max concurrent loans of this type
    isActive: boolean("is_active").notNull().default(true),
    createdByUserId: text("created_by_user_id")
      .references(() => user.id, { onDelete: "no action" })
      .notNull(),
    updatedByUserId: text("updated_by_user_id")
      .references(() => user.id, { onDelete: "no action" })
      .notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("loan_type_active_idx").on(table.isActive),
    index("loan_type_name_idx").on(table.name),
  ],
);

export const loanTypeSalaryStructures = pgTable(
  "loan_type_salary_structures",
  {
    id: serial("id").primaryKey(),
    loanTypeId: integer("loan_type_id")
      .references(() => loanTypes.id, { onDelete: "cascade" })
      .notNull(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    salaryStructureId: integer("salary_structure_id")
      .references(() => salaryStructure.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    unique("unique_loan_type_salary_structure").on(
      table.loanTypeId,
      table.salaryStructureId,
    ),
    index("loan_type_structure_loan_idx").on(table.loanTypeId),
    index("loan_type_structure_salary_idx").on(table.salaryStructureId),
  ],
);

export const loanApplications = pgTable(
  "loan_applications",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    referenceNumber: text("reference_number").notNull().unique(),
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    loanTypeId: integer("loan_type_id")
      .references(() => loanTypes.id, { onDelete: "restrict" })
      .notNull(),
    requestedAmount: numeric("requested_amount", {
      precision: 15,
      scale: 2,
    }).notNull(),
    approvedAmount: numeric("approved_amount", { precision: 15, scale: 2 }),
    monthlyDeduction: numeric("monthly_deduction", { precision: 15, scale: 2 }),
    tenureMonths: integer("tenure_months").notNull(),
    reason: text("reason").notNull(),
    status: loanApplicationStatusEnum("status").notNull().default("pending"),
    hrReviewedByUserId: text("hr_reviewed_by_user_id").references(
      () => user.id,
      {
        onDelete: "set null",
      },
    ),
    hrReviewedAt: timestamp("hr_reviewed_at"),
    hrRemarks: text("hr_remarks"),
    disbursedByUserId: text("disbursed_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    disbursedAt: timestamp("disbursed_at"),
    disbursementRemarks: text("disbursement_remarks"),
    employeeDeductionId: integer("employee_deduction_id").references(
      () => employeeDeductions.id,
      { onDelete: "set null" },
    ),
    totalRepaid: numeric("total_repaid", { precision: 15, scale: 2 })
      .notNull()
      .default("0"),
    remainingBalance: numeric("remaining_balance", { precision: 15, scale: 2 })
      .notNull()
      .default("0"),
    appliedAt: timestamp("applied_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("loan_app_user_idx").on(table.userId),
    index("loan_app_type_idx").on(table.loanTypeId),
    index("loan_app_status_idx").on(table.status),
    index("loan_app_reference_idx").on(table.referenceNumber),
    index("loan_app_hr_reviewed_user_idx").on(table.hrReviewedByUserId),
    index("loan_app_disbursed_user_idx").on(table.disbursedByUserId),
    index("loan_app_active_idx")
      .on(table.userId, table.status)
      .where(sql`status IN ('active', 'disbursed', 'hr_approved', 'pending')`),
  ],
);

export const loanRepayments = pgTable(
  "loan_repayments",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    loanApplicationId: integer("loan_application_id")
      .references(() => loanApplications.id, { onDelete: "cascade" })
      .notNull(),
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    installmentNumber: integer("installment_number").notNull(),
    dueDate: timestamp("due_date").notNull(),
    expectedAmount: numeric("expected_amount", {
      precision: 15,
      scale: 2,
    }).notNull(),
    paidAmount: numeric("paid_amount", { precision: 15, scale: 2 })
      .notNull()
      .default("0"),
    balanceAfter: numeric("balance_after", { precision: 15, scale: 2 }),
    status: repaymentStatusEnum("status").notNull().default("pending"),
    paidAt: timestamp("paid_at"),
    payrunId: integer("payrun_id"),
    payrunItemId: integer("payrun_item_id"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("loan_repayment_loan_idx").on(table.loanApplicationId),
    index("loan_repayment_user_idx").on(table.userId),
    index("loan_repayment_status_idx").on(table.status),
    index("loan_repayment_due_idx").on(table.dueDate),
    unique("unique_loan_installment").on(
      table.loanApplicationId,
      table.installmentNumber,
    ),
  ],
);

export const loanHistory = pgTable(
  "loan_history",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    loanApplicationId: integer("loan_application_id")
      .references(() => loanApplications.id, { onDelete: "cascade" })
      .notNull(),
    action: text("action").notNull(), // e.g., "applied", "hr_approved", "disbursed", "payment_received"
    description: text("description").notNull(),
    performedByUserId: text("performed_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    metadata: text("metadata"), // JSON string for additional data
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("loan_history_loan_idx").on(table.loanApplicationId),
    index("loan_history_action_idx").on(table.action),
    index("loan_history_date_idx").on(table.createdAt),
  ],
);
