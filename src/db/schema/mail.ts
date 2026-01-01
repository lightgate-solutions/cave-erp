import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  serial,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { document } from "./documents";
import { organization, user } from "./auth";

export const email = pgTable(
  "email",
  {
    id: serial("id").primaryKey(),
    senderId: text("sender_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    parentEmailId: integer("parent_email_id"),
    type: text("type").notNull().default("sent"),
    hasBeenOpened: boolean("has_been_opened").default(false).notNull(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("email_sender_id_idx").on(table.senderId),
    index("email_created_at_idx").on(table.createdAt),
    index("email_parent_email_id_idx").on(table.parentEmailId),
    index("email_organization_id_idx").on(table.organizationId),
  ],
);

export const emailRecipient = pgTable(
  "email_recipient",
  {
    id: serial("id").primaryKey(),
    emailId: integer("email_id")
      .notNull()
      .references(() => email.id, { onDelete: "cascade" }),
    recipientId: text("recipient_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    isRead: boolean("is_read").default(false).notNull(),
    isArchived: boolean("is_archived").default(false).notNull(),
    isDeleted: boolean("is_deleted").default(false).notNull(),
    readAt: timestamp("read_at"),
    archivedAt: timestamp("archived_at"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("email_recipient_email_id_idx").on(table.emailId),
    index("email_recipient_recipient_id_idx").on(table.recipientId),
    index("email_recipient_is_read_idx").on(table.isRead),
    index("email_recipient_is_archived_idx").on(table.isArchived),
    index("email_recipient_is_deleted_idx").on(table.isDeleted),
  ],
);

// Relations
export const emailRelations = relations(email, ({ one, many }) => ({
  sender: one(user, {
    fields: [email.senderId],
    references: [user.id],
  }),
  recipients: many(emailRecipient),
  attachments: many(emailAttachment),
  parentEmail: one(email, {
    fields: [email.parentEmailId],
    references: [email.id],
  }),
}));

export const emailAttachment = pgTable(
  "email_attachment",
  {
    id: serial("id").primaryKey(),
    emailId: integer("email_id")
      .notNull()
      .references(() => email.id, { onDelete: "cascade" }),
    documentId: integer("document_id")
      .notNull()
      .references(() => document.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("email_attachment_email_id_idx").on(table.emailId),
    index("email_attachment_document_id_idx").on(table.documentId),
  ],
);

export const emailRecipientRelations = relations(emailRecipient, ({ one }) => ({
  email: one(email, {
    fields: [emailRecipient.emailId],
    references: [email.id],
  }),
  recipient: one(user, {
    fields: [emailRecipient.recipientId],
    references: [user.id],
  }),
}));

export const emailAttachmentRelations = relations(
  emailAttachment,
  ({ one }) => ({
    email: one(email, {
      fields: [emailAttachment.emailId],
      references: [email.id],
    }),
    document: one(document, {
      fields: [emailAttachment.documentId],
      references: [document.id],
    }),
  }),
);
