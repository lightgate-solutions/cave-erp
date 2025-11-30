import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { employees } from "./hr";

// Define enum ONCE at module scope so Drizzle emits CREATE TYPE before using it
export const projectStatusEnum = pgEnum("project_status", [
  "pending",
  "in-progress",
  "completed",
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
    supervisorId: integer("supervisor_id").references(() => employees.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [index("projects_supervisor_idx").on(table.supervisorId)],
);

export const projectsRelations = relations(projects, ({ one }) => ({
  supervisor: one(employees, {
    fields: [projects.supervisorId],
    references: [employees.id],
  }),
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
