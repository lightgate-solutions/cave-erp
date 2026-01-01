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
import { sql } from "drizzle-orm";
import { organization, user } from "./auth";

export const allowanceTypeEnum = pgEnum("allowance_type", [
  "one-time",
  "monthly",
  "annual",
  "bi-annual",
  "quarterly",
  "custom",
]);

export const deductionTypeEnum = pgEnum("deduction_type", [
  "recurring",
  "one-time",
  "statutory",
  "loan",
  "advance",
]);

export const payrollRunStatusEnum = pgEnum("payroll_run_status", [
  "draft",
  "pending",
  "processing",
  "completed",
  "approved",
  "paid",
  "archived",
]);

export const payrunTypeEnum = pgEnum("payrun_type", ["salary", "allowance"]);

export const payrollItemTypeEnum = pgEnum("payroll_item_type", [
  "salary",
  "allowance",
  "bonus",
  "overtime",
  "commission",
  "reimbursement",
]);

export const payrollDetailTypeEnum = pgEnum("payroll_detail_type", [
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

export const salaryStructure = pgTable(
  "salary_structure",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    baseSalary: numeric("base_salary", { precision: 15, scale: 2 }).notNull(),
    description: text("description").notNull(),
    active: boolean("active").default(true).notNull(),
    employeeCount: integer("employee_count").notNull().default(0),
    createdByUserId: text("created_by_user_id")
      .references(() => user.id, { onDelete: "no action" })
      .notNull(),
    updatedByUserId: text("updated_by_user_id")
      .references(() => user.id, { onDelete: "no action" })
      .notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("payroll_amount_idx").on(table.baseSalary)],
);

export const allowances = pgTable(
  "allowances",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    type: allowanceTypeEnum("type").notNull().default("one-time"),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    percentage: numeric("percentage", { precision: 5, scale: 2 }), // if percentage based
    amount: numeric("amount", { precision: 15, scale: 2 }), // if fixed amount
    taxable: boolean("taxable").notNull().default(false),
    taxPercentage: numeric("tax_percentage", { precision: 5, scale: 2 }),
    description: text("description"),
    createdByUserId: text("created_by_user_id")
      .references(() => user.id, { onDelete: "no action" })
      .notNull(),
    updatedByUserId: text("updated_by_user_id")
      .references(() => user.id, { onDelete: "no action" })
      .notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("allowance_amount_idx").on(table.amount)],
);

export const salaryAllowances = pgTable(
  "salary_allowances",
  {
    id: serial("id").primaryKey(),
    salaryStructureId: integer("salary_structure_id")
      .references(() => salaryStructure.id, { onDelete: "cascade" })
      .notNull(),
    allowanceId: integer("allowance_id")
      .references(() => allowances.id, {
        onDelete: "cascade",
      })
      .notNull(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    effectiveFrom: timestamp("effective_from").defaultNow(),
    effectiveTo: timestamp("effective_to"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("salary_allowance_id_idx").on(table.salaryStructureId)],
);

export const employeeAllowances = pgTable(
  "employee_allowances",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    allowanceId: integer("allowance_id")
      .references(() => allowances.id, {
        onDelete: "cascade",
      })
      .notNull(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    effectiveFrom: timestamp("effective_from").defaultNow(),
    effectiveTo: timestamp("effective_to"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("employee_allowance_id_idx").on(table.userId),
    index("employee_allowance_active_idx")
      .on(table.userId, table.allowanceId)
      .where(sql`effective_to IS NULL`),
  ],
);

export const deductions = pgTable("deductions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  percentage: numeric("percentage", { precision: 5, scale: 2 }), // if percentage based
  amount: numeric("amount", { precision: 15, scale: 2 }), // if fixed amount
  type: deductionTypeEnum("type").notNull().default("recurring"),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  createdByUserId: text("created_by_user_id")
    .references(() => user.id, { onDelete: "no action" })
    .notNull(),
  updatedByUserId: text("updated_by_user_id")
    .references(() => user.id, { onDelete: "no action" })
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const salaryDeductions = pgTable(
  "salary_deductions",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    salaryStructureId: integer("salary_structure_id")
      .references(() => salaryStructure.id, { onDelete: "cascade" })
      .notNull(),
    deductionId: integer("deduction_id")
      .references(() => deductions.id, {
        onDelete: "cascade",
      })
      .notNull(),
    effectiveFrom: timestamp("effective_from").defaultNow(),
    effectiveTo: timestamp("effective_to"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("salary_deduction_table_id_idx").on(table.salaryStructureId),
  ],
);

export const employeeDeductions = pgTable(
  "employee_deductions",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    salaryStructureId: integer("salary_structure_id")
      .notNull()
      .references(() => salaryStructure.id, { onDelete: "cascade" }),
    type: deductionTypeEnum("type"),
    amount: numeric("amount", { precision: 15, scale: 2 }),
    percentage: numeric("percentage", { precision: 5, scale: 2 }),
    originalAmount: numeric("original_amount", { precision: 15, scale: 2 }),
    remainingAmount: numeric("remaining_amount", { precision: 15, scale: 2 }),
    active: boolean("active").default(true).notNull(),
    effectiveFrom: timestamp("effective_from").defaultNow(),
    effectiveTo: timestamp("effective_to"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("emp_deduction_user_idx").on(table.userId)],
);

export const employeeSalary = pgTable(
  "employee_salary",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    salaryStructureId: integer("salary_structure_id")
      .notNull()
      .references(() => salaryStructure.id, { onDelete: "restrict" }),
    effectiveFrom: timestamp("effective_from").defaultNow(),
    effectiveTo: timestamp("effective_to"), // null = still active
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("employee_salary_active_idx")
      .on(table.userId)
      .where(sql`effective_to IS NULL`),
    index("employee_salary_user_idx").on(table.userId),
  ],
);

export const payrun = pgTable(
  "payrun",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: payrunTypeEnum("type").notNull().default("salary"),
    allowanceId: integer("allowance_id").references(() => allowances.id, {
      onDelete: "set null",
    }),
    day: integer("day").notNull(),
    month: integer("month").notNull(),
    year: integer("year").notNull(),
    totalEmployees: integer("total_employees").notNull().default(0),
    totalGrossPay: numeric("total_gross_pay", { precision: 15, scale: 2 })
      .notNull()
      .default("0"),
    totalDeductions: numeric("total_deductions", { precision: 15, scale: 2 })
      .notNull()
      .default("0"),
    totalNetPay: numeric("total_net_pay", { precision: 15, scale: 2 })
      .notNull()
      .default("0"),
    status: payrollRunStatusEnum("status").default("draft"),
    generatedByUserId: text("generated_by_user_id")
      .references(() => user.id, { onDelete: "no action" })
      .notNull(),
    approvedByUserId: text("approved_by_user_id").references(() => user.id),
    approvedAt: timestamp("approved_at"),
    completedByUserId: text("completed_by_user_id").references(() => user.id),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    unique("unique_payrun_payroll_period").on(
      table.year,
      table.month,
      table.day,
      table.type,
      table.allowanceId,
    ),
    index("payrun_status_idx").on(table.status),
    index("payrun_date_idx").on(table.year, table.month),
    index("payrun_type_idx").on(table.type),
  ],
);

export const payrunItems = pgTable(
  "payrun_items",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    type: payrollItemTypeEnum("type").notNull().default("salary"),
    payrunId: integer("payrun_id")
      .notNull()
      .references(() => payrun.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    baseSalary: numeric("base_salary", { precision: 15, scale: 2 })
      .notNull()
      .default("0"),
    totalAllowances: numeric("total_allowances", { precision: 15, scale: 2 })
      .notNull()
      .default("0"),
    totalDeductions: numeric("total_deductions", { precision: 15, scale: 2 })
      .notNull()
      .default("0"),
    grossPay: numeric("gross_pay", { precision: 15, scale: 2 })
      .notNull()
      .default("0"),
    taxableIncome: numeric("taxable_income", { precision: 15, scale: 2 })
      .notNull()
      .default("0"),
    totalTaxes: numeric("total_taxes", { precision: 15, scale: 2 })
      .notNull()
      .default("0"),
    netPay: numeric("net_pay", { precision: 15, scale: 2 })
      .notNull()
      .default("0"),
    status: payrollRunStatusEnum("status").default("pending"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    unique("unique_payrun_item").on(table.payrunId, table.userId),
    index("payrun_items_user_idx").on(table.userId),
    index("payrun_items_run_idx").on(table.payrunId),
    index("payroll_items_status_idx").on(table.status),
  ],
);

export const payrunItemDetails = pgTable(
  "payrun_item_details",
  {
    id: serial("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    payrunItemId: integer("payrun_item_id")
      .notNull()
      .references(() => payrunItems.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    detailType: payrollDetailTypeEnum("detail_type").notNull(),
    description: text("description").notNull(),
    allowanceId: integer("allowance_id").references(() => allowances.id, {
      onDelete: "set null",
    }),
    deductionId: integer("deduction_id").references(() => deductions.id, {
      onDelete: "set null",
    }),
    employeeAllowanceId: integer("employee_allowance_id").references(
      () => employeeAllowances.id,
      { onDelete: "set null" },
    ),
    employeeDeductionId: integer("employee_deduction_id").references(
      () => employeeDeductions.id,
      { onDelete: "set null" },
    ),
    loanApplicationId: integer("loan_application_id"),
    amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
    originalAmount: numeric("original_amount", { precision: 15, scale: 2 }),
    remainingAmount: numeric("remaining_amount", { precision: 15, scale: 2 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("payroll_item_details_payroll_item_idx").on(table.payrunItemId),
    index("payroll_item_details_user_idx").on(table.userId),
    index("payroll_item_details_type_idx").on(table.detailType),
    index("payroll_item_details_allowance_idx").on(table.allowanceId),
    index("payroll_item_details_deduction_idx").on(table.deductionId),
  ],
);

export const payslips = pgTable("payslips", {
  id: serial("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  payrollItemId: integer("payroll_item_id")
    .notNull()
    .references(() => payrunItems.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  filePath: text("file_path"),
  generatedAt: timestamp("generated_at").defaultNow(),
});
