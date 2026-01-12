import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth";

// Define enums ONCE at module scope so Drizzle emits CREATE TYPE before using it
export const projectStatusEnum = pgEnum("project_status", [
  "pending",
  "in-progress",
  "completed",
]);

export const projectAccessLevelEnum = pgEnum("project_access_level", [
  "read",
  "write",
]);

export const projects = pgTable(
  "projects",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    code: text("code").notNull().unique(),
    description: text("description"),
    location: text("location"),
    status: projectStatusEnum("status").default("pending").notNull(),
    budgetPlanned: integer("budget_planned").default(0).notNull(),
    budgetActual: integer("budget_actual").default(0).notNull(),
    supervisorId: text("supervisor_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("projects_supervisor_idx").on(table.supervisorId),
    index("projects_created_by_idx").on(table.createdBy),
    index("projects_organization_idx").on(table.organizationId),
  ],
);

export const projectsRelations = relations(projects, ({ one, many }) => ({
  supervisor: one(user, {
    fields: [projects.supervisorId],
    references: [user.id],
  }),
  creator: one(user, {
    fields: [projects.createdBy],
    references: [user.id],
  }),
  projectAccess: many(projectAccess),
}));

export const milestones = pgTable(
  "milestones",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    dueDate: timestamp("due_date"),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    completed: integer("completed").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("milestones_project_idx").on(table.projectId)],
);

export const milestonesRelations = relations(milestones, ({ one }) => ({
  project: one(projects, {
    fields: [milestones.projectId],
    references: [projects.id],
  }),
}));

export const expenses = pgTable(
  "expenses",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    amount: integer("amount").notNull().default(0),
    spentAt: timestamp("spent_at"),
    notes: text("notes"),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("expenses_project_idx").on(table.projectId)],
);

export const expensesRelations = relations(expenses, ({ one }) => ({
  project: one(projects, {
    fields: [expenses.projectId],
    references: [projects.id],
  }),
}));

export const projectAccess = pgTable(
  "project_access",
  {
    id: serial("id").primaryKey(),
    projectId: integer("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessLevel: projectAccessLevelEnum("access_level")
      .notNull()
      .default("read"),
    grantedBy: text("granted_by").references(() => user.id, {
      onDelete: "set null",
    }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("project_access_project_idx").on(table.projectId),
    index("project_access_user_idx").on(table.userId),
    index("project_access_organization_idx").on(table.organizationId),
    unique("project_access_unique").on(table.projectId, table.userId),
  ],
);

export const projectAccessRelations = relations(projectAccess, ({ one }) => ({
  project: one(projects, {
    fields: [projectAccess.projectId],
    references: [projects.id],
  }),
  user: one(user, {
    fields: [projectAccess.userId],
    references: [user.id],
  }),
  grantedByUser: one(user, {
    fields: [projectAccess.grantedBy],
    references: [user.id],
  }),
}));
