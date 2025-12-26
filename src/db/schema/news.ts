import {
  pgTable,
  text,
  uuid,
  boolean,
  timestamp,
  serial,
  pgEnum,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { employees } from "./hr";
import { organization } from "./auth";

export const newsStatusEnum = pgEnum("news_status", [
  "draft",
  "published",
  "archived",
]);

export const newsArticles = pgTable(
  "news_articles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: text("content").notNull(),
    excerpt: text("excerpt"),
    authorId: serial("author_id")
      .references(() => employees.id, { onDelete: "cascade" })
      .notNull(),
    status: newsStatusEnum("status").default("draft").notNull(),
    commentsEnabled: boolean("comments_enabled").default(true).notNull(),
    isPinned: boolean("is_pinned").default(false).notNull(),
    viewCount: integer("view_count").default(0).notNull(),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("news_articles_organization_idx").on(table.organizationId)],
);

export const newsComments = pgTable(
  "news_comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    articleId: uuid("article_id")
      .references(() => newsArticles.id, { onDelete: "cascade" })
      .notNull(),
    userId: serial("user_id")
      .references(() => employees.id, { onDelete: "cascade" })
      .notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("news_comments_organization_idx").on(table.organizationId)],
);

export const newsAttachments = pgTable(
  "news_attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    articleId: uuid("article_id")
      .references(() => newsArticles.id, { onDelete: "cascade" })
      .notNull(),
    fileName: text("file_name").notNull(),
    fileUrl: text("file_url").notNull(),
    fileSize: integer("file_size").notNull(),
    mimeType: text("mime_type").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("news_attachments_organization_idx").on(table.organizationId),
  ],
);
