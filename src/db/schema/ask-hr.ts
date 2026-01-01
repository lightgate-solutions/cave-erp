import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  index,
  integer,
  serial,
  boolean,
} from "drizzle-orm/pg-core";
import { organization, user } from "./auth";

// Enums for Ask HR module
export const askHrStatusEnum = pgEnum("ask_hr_status", [
  "Open", // New question
  "In Progress", // HR is working on it
  "Redirected", // Redirected to another department/user
  "Answered", // Question has been answered
  "Closed", // Question has been resolved and closed
]);

export const askHrCategoryEnum = pgEnum("ask_hr_category", [
  "General",
  "Benefits",
  "Payroll",
  "Leave",
  "Employment",
  "Workplace",
  "Training",
  "Other",
]);

// Questions table
export const askHrQuestions = pgTable(
  "ask_hr_questions",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    isAnonymous: boolean("is_anonymous").notNull().default(false),
    isPublic: boolean("is_public").notNull().default(false),
    allowPublicResponses: boolean("allow_public_responses")
      .notNull()
      .default(false),
    category: askHrCategoryEnum("category").notNull(),
    status: askHrStatusEnum("status").notNull().default("Open"),
    redirectedToUserId: text("redirected_to_user_id").references(() => user.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("ask_hr_questions_user_idx").on(table.userId),
    index("ask_hr_questions_status_idx").on(table.status),
    index("ask_hr_questions_category_idx").on(table.category),
    index("ask_hr_questions_redirected_to_user_idx").on(
      table.redirectedToUserId,
    ),
  ],
);

// Responses table
export const askHrResponses = pgTable(
  "ask_hr_responses",
  {
    id: serial("id").primaryKey(),
    questionId: integer("question_id")
      .notNull()
      .references(() => askHrQuestions.id, { onDelete: "cascade" }),
    respondentUserId: text("respondent_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    response: text("response").notNull(),
    isInternal: boolean("is_internal").notNull().default(false), // For HR internal notes
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("ask_hr_responses_question_idx").on(table.questionId),
    index("ask_hr_responses_respondent_user_idx").on(table.respondentUserId),
  ],
);

// Relations
export const askHrQuestionsRelations = relations(
  askHrQuestions,
  ({ one, many }) => ({
    user: one(user, {
      fields: [askHrQuestions.userId],
      references: [user.id],
    }),
    redirectedToUser: one(user, {
      fields: [askHrQuestions.redirectedToUserId],
      references: [user.id],
    }),
    responses: many(askHrResponses),
  }),
);

export const askHrResponsesRelations = relations(askHrResponses, ({ one }) => ({
  question: one(askHrQuestions, {
    fields: [askHrResponses.questionId],
    references: [askHrQuestions.id],
  }),
  respondent: one(user, {
    fields: [askHrResponses.respondentUserId],
    references: [user.id],
  }),
}));
