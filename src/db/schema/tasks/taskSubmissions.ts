import {
  pgTable,
  serial,
  integer,
  text,
  jsonb,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { tasks } from "./tasks";
import { taskReviews } from "./tasksReviews";
import { organization, user } from "../auth";

export const taskSubmissions = pgTable(
  "task_submissions",
  {
    id: serial("id").primaryKey(),

    taskId: integer("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),

    submittedBy: text("submitted_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    submissionNote: text("submission_note"),
    submittedFiles:
      jsonb("submitted_files").$type<{ fileUrl: string; fileName: string }[]>(),
    submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  },
  (table) => [
    index("task_submissions_task_idx").on(table.taskId),
    index("task_submissions_employee_idx").on(table.submittedBy),
    index("task_submissions_organization_idx").on(table.organizationId),
  ],
);

export const taskSubmissionsRelations = relations(
  taskSubmissions,
  ({ one, many }) => ({
    task: one(tasks, {
      fields: [taskSubmissions.taskId],
      references: [tasks.id],
    }),
    submittedBy: one(user, {
      fields: [taskSubmissions.submittedBy],
      references: [user.id],
    }),
    reviews: many(taskReviews),
  }),
);
