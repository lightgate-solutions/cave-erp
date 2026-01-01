import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  index,
  date,
  integer,
  serial,
  jsonb,
} from "drizzle-orm/pg-core";
import { taskStatusEnum, taskPriorityEnum } from "./enums";
import { organization, user } from "../auth";

export const tasks = pgTable(
  "tasks",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),

    assignedTo: text("assigned_to")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    assignedBy: text("assigned_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    status: taskStatusEnum("status").notNull().default("Todo"),
    priority: taskPriorityEnum("priority").notNull().default("Medium"),
    dueDate: date("due_date"),

    // Board-specific fields
    attachments: jsonb("attachments").$type<{ url: string; name: string }[]>(),
    links: jsonb("links").$type<{ url: string; title: string }[]>(),
    progressCompleted: integer("progress_completed").default(0),
    progressTotal: integer("progress_total").default(0),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("tasks_assigned_to_idx").on(table.assignedTo),
    index("tasks_assigned_by_idx").on(table.assignedBy),
    index("tasks_status_idx").on(table.status),
    index("tasks_organization_idx").on(table.organizationId),
  ],
);

export const taskRelations = relations(tasks, ({ one }) => ({
  assignedTo: one(user, {
    fields: [tasks.assignedTo],
    references: [user.id],
    relationName: "assignedTo",
  }),
  assignedBy: one(user, {
    fields: [tasks.assignedBy],
    references: [user.id],
    relationName: "assignedBy",
  }),
}));
