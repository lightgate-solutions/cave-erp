import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tasks } from "./tasks";
import { organization, user } from "../auth";

export const taskMessages = pgTable(
  "task_messages",
  {
    id: serial("id").primaryKey(),
    taskId: integer("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    senderId: text("sender_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("task_messages_organization_idx").on(table.organizationId)],
);

export const taskMessagesRelations = relations(taskMessages, ({ one }) => ({
  task: one(tasks, {
    fields: [taskMessages.taskId],
    references: [tasks.id],
  }),
  sender: one(user, {
    fields: [taskMessages.senderId],
    references: [user.id],
  }),
}));
