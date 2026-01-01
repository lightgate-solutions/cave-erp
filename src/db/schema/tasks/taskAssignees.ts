import {
  pgTable,
  serial,
  integer,
  timestamp,
  index,
  text,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tasks } from "./tasks";
import { user } from "../auth";
import { organization } from "../auth";

export const taskAssignees = pgTable(
  "task_assignees",
  {
    id: serial("id").primaryKey(),
    taskId: integer("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("task_assignees_task_idx").on(t.taskId),
    index("task_assignees_user_idx").on(t.userId),
    index("task_assignees_organization_idx").on(t.organizationId),
  ],
);

export const taskAssigneesRelations = relations(taskAssignees, ({ one }) => ({
  task: one(tasks, {
    fields: [taskAssignees.taskId],
    references: [tasks.id],
  }),
  user: one(user, {
    fields: [taskAssignees.userId],
    references: [user.id],
  }),
}));
