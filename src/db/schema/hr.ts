import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  index,
  date,
  integer,
  serial,
  boolean,
  numeric,
} from "drizzle-orm/pg-core";
import { tasks } from "./tasks/tasks";
import { taskSubmissions } from "./tasks/taskSubmissions";
import { taskReviews } from "./tasks/tasksReviews";
import { organization, user } from "./auth";

export const employmentTypeEnum = pgEnum("employment_type", [
  "Full-time",
  "Part-time",
  "Contract",
  "Intern",
]);

export const maritalStatusEnum = pgEnum("marital_status", [
  "Single",
  "Married",
  "Divorced",
  "Widowed",
]);

export const leaveStatusEnum = pgEnum("leave_status", [
  "Pending",
  "Approved",
  "Rejected",
  "Cancelled",
  "To be reviewed",
]);

export const leaveTypeEnum = pgEnum("leave_type", [
  "Annual",
  "Sick",
  "Personal",
  "Maternity",
  "Paternity",
  "Bereavement",
  "Unpaid",
  "Other",
]);

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "Approved",
  "Rejected",
]);

export const employees = pgTable(
  "employees",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    authId: text("auth_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    phone: text("phone"),
    staffNumber: text("staff_number"),
    role: text("role").notNull(),
    isManager: boolean("is_manager").notNull().default(false),
    department: text("department").notNull(),
    managerId: text("manager_id").references(() => user.id),
    organizationsCount: integer("organizations_count").default(0),
    dateOfBirth: date("date_of_birth"),
    address: text("address"),
    status: text("status"),
    maritalStatus: maritalStatusEnum("marital_status"),
    employmentType: employmentTypeEnum("employment_type"),
    documentCount: integer("document_count").default(0).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("employee_manager_idx").on(table.managerId),
    index("employees_department_role_idx").on(table.department, table.role),
  ],
);

export const employeesDocuments = pgTable("employees_documents", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  documentType: text("document_type").notNull(),
  documentName: text("document_name").notNull(),
  filePath: text("file_path").notNull(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  fileSize: numeric("file_size", { scale: 2, precision: 10 }).notNull(),
  mimeType: text("mime_type"),
  uploadedByUserId: text("uploaded_by_user_id").references(() => user.id),
  department: text("department").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const employeesBank = pgTable("employees_bank", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  bankName: text("bank_name").notNull(),
  accountName: text("account_name").notNull(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  accountNumber: text("account_number").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const employmentHistory = pgTable(
  "employment_history",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    startDate: date("start_date"),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    endDate: date("end_date"),
    department: text("department"),
    employmentType: employmentTypeEnum("employment_type"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("history_user_idx").on(table.userId),
    index("employment_history_active_idx")
      .on(table.endDate)
      .where(sql`end_date IS NULL`),
  ],
);

// Leave Types table - configurable leave types
export const leaveTypes = pgTable("leave_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  maxDays: integer("max_days"),
  requiresApproval: boolean("requires_approval").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Annual Leave Settings - Global annual leave allocation
export const annualLeaveSettings = pgTable("annual_leave_settings", {
  id: serial("id").primaryKey(),
  allocatedDays: integer("allocated_days").notNull().default(30),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  year: integer("year").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Leave Applications table
export const leaveApplications = pgTable(
  "leave_applications",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    leaveType: leaveTypeEnum("leave_type").notNull(),
    startDate: date("start_date").notNull(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    endDate: date("end_date").notNull(),
    totalDays: integer("total_days").notNull(),
    reason: text("reason").notNull(),
    status: leaveStatusEnum("status").notNull().default("Pending"),
    approvedByUserId: text("approved_by_user_id").references(() => user.id),
    approvedAt: timestamp("approved_at"),
    rejectionReason: text("rejection_reason"),
    appliedAt: timestamp("applied_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("leave_applications_user_idx").on(table.userId),
    index("leave_applications_status_idx").on(table.status),
    index("leave_applications_dates_idx").on(table.startDate, table.endDate),
  ],
);

// Leave Balances table - tracks remaining leave days per employee
export const leaveBalances = pgTable(
  "leave_balances",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    leaveType: leaveTypeEnum("leave_type").notNull(),
    totalDays: integer("total_days").notNull().default(0),
    usedDays: integer("used_days").notNull().default(0),
    remainingDays: integer("remaining_days").notNull().default(0),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("leave_balances_user_idx").on(table.userId),
    index("leave_balances_type_year_idx").on(table.leaveType, table.year),
  ],
);

export const attendance = pgTable(
  "attendance",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    date: date("date").notNull(),
    signInTime: timestamp("sign_in_time"),
    signOutTime: timestamp("sign_out_time"),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    status: attendanceStatusEnum("status").default("Approved").notNull(),
    rejectionReason: text("rejection_reason"),
    rejectedByUserId: text("rejected_by_user_id").references(() => user.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("attendance_user_date_idx").on(table.userId, table.date)],
);

export const employeeRelations = relations(employees, ({ one, many }) => ({
  manager: one(user, {
    fields: [employees.managerId],
    references: [user.id],
  }),

  tasksAssigned: many(tasks, {
    relationName: "assignedTo",
  }),

  tasksCreated: many(tasks, {
    relationName: "assignedBy",
  }),

  taskSubmissions: many(taskSubmissions),

  taskReviewsGiven: many(taskReviews),

  leaveApplications: many(leaveApplications),
  leaveBalances: many(leaveBalances),
  approvedLeaves: many(leaveApplications, {
    relationName: "approvedBy",
  }),
  attendance: many(attendance),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  user: one(user, {
    fields: [attendance.userId],
    references: [user.id],
  }),
}));
