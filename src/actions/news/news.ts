/** biome-ignore-all lint/style/noNonNullAssertion: <> */

"use server";

import { db } from "@/db";
import {
  newsArticles,
  newsComments,
  newsAttachments,
  employees,
} from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getUser, requireHROrAdmin } from "@/actions/auth/dal";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createNotification } from "@/actions/notification/notification";

export type NewsArticle = {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  authorId: string;
  authorName: string;
  status: "draft" | "published" | "archived";
  commentsEnabled: boolean;
  isPinned: boolean;
  viewCount: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  commentCount: number;
  attachments: {
    id: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }[];
};

export type CreateNewsInput = {
  title: string;
  content: string;
  excerpt?: string;
  status: "draft" | "published";
  commentsEnabled: boolean;
  isPinned: boolean;
  attachments: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }[];
};

export type UpdateNewsInput = {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  status: "draft" | "published" | "archived";
  commentsEnabled: boolean;
  isPinned: boolean;
  attachments: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  }[];
};

export async function createNewsArticle(data: CreateNewsInput) {
  const { employee } = await requireHROrAdmin();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return {
      success: null,
      error: { reason: "Organization not found" },
    };
  }

  try {
    const [article] = await db
      .insert(newsArticles)
      .values({
        organizationId: organization.id,
        title: data.title,
        content: data.content,
        excerpt: data.excerpt || null,
        authorId: employee.userId,
        status: data.status,
        commentsEnabled: data.commentsEnabled,
        isPinned: data.isPinned,
        publishedAt: data.status === "published" ? new Date() : null,
      })
      .returning();

    if (data.attachments.length > 0) {
      await db.insert(newsAttachments).values(
        data.attachments.map((att) => ({
          organizationId: organization.id,
          articleId: article.id,
          fileName: att.fileName,
          fileUrl: att.fileUrl,
          fileSize: att.fileSize,
          mimeType: att.mimeType,
        })),
      );
    }

    if (data.status === "published") {
      const allEmployees = await db
        .select({ authId: employees.authId })
        .from(employees)
        .where(
          and(
            eq(employees.organizationId, organization.id),
            sql`${employees.authId} != ${employee.userId}`,
          ),
        );

      for (const emp of allEmployees) {
        await createNotification({
          user_id: emp.authId,
          title: "New News Article",
          message: `${employee.name} published: "${article.title}"`,
          notification_type: "message",
          reference_id: undefined,
        });
      }
    }

    revalidatePath("/news");

    return {
      success: { reason: "News article created successfully" },
      error: null,
    };
  } catch (_err) {
    return {
      success: null,
      error: { reason: "Failed to create news article" },
    };
  }
}

export async function updateNewsArticle(data: UpdateNewsInput) {
  const { employee } = await requireHROrAdmin();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return {
      success: null,
      error: { reason: "Organization not found" },
    };
  }

  try {
    const [existing] = await db
      .select()
      .from(newsArticles)
      .where(
        and(
          eq(newsArticles.id, data.id),
          eq(newsArticles.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!existing) {
      return { success: null, error: { reason: "News article not found" } };
    }

    const wasPublished = existing.status === "published";
    const isNowPublished = data.status === "published";

    await db
      .update(newsArticles)
      .set({
        title: data.title,
        content: data.content,
        excerpt: data.excerpt || null,
        status: data.status,
        commentsEnabled: data.commentsEnabled,
        isPinned: data.isPinned,
        publishedAt:
          !wasPublished && isNowPublished ? new Date() : existing.publishedAt,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(newsArticles.id, data.id),
          eq(newsArticles.organizationId, organization.id),
        ),
      );

    await db
      .delete(newsAttachments)
      .where(
        and(
          eq(newsAttachments.articleId, data.id),
          eq(newsAttachments.organizationId, organization.id),
        ),
      );

    if (data.attachments.length > 0) {
      await db.insert(newsAttachments).values(
        data.attachments.map((att) => ({
          organizationId: organization.id,
          articleId: data.id,
          fileName: att.fileName,
          fileUrl: att.fileUrl,
          fileSize: att.fileSize,
          mimeType: att.mimeType,
        })),
      );
    }

    if (!wasPublished && isNowPublished) {
      const allEmployees = await db
        .select({ authId: employees.authId })
        .from(employees)
        .where(
          and(
            eq(employees.organizationId, organization.id),
            sql`${employees.authId} != ${employee.userId}`,
          ),
        );

      for (const emp of allEmployees) {
        await createNotification({
          user_id: emp.authId,
          title: "New News Article",
          message: `${employee.name} published: "${data.title}"`,
          notification_type: "message",
          reference_id: undefined,
        });
      }
    }

    revalidatePath("/news");
    revalidatePath(`/news/${data.id}`);

    return {
      success: { reason: "News article updated successfully" },
      error: null,
    };
  } catch (_err) {
    return {
      success: null,
      error: { reason: "Failed to update news article" },
    };
  }
}

export async function deleteNewsArticle(id: string) {
  await requireHROrAdmin();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return {
      success: null,
      error: { reason: "Organization not found" },
    };
  }

  try {
    await db
      .delete(newsArticles)
      .where(
        and(
          eq(newsArticles.id, id),
          eq(newsArticles.organizationId, organization.id),
        ),
      );

    revalidatePath("/news");

    return {
      success: { reason: "News article deleted successfully" },
      error: null,
    };
  } catch (_err) {
    return {
      success: null,
      error: { reason: "Failed to delete news article" },
    };
  }
}

export async function getPublishedNews() {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return [];
  }

  const articles = await db
    .select({
      id: newsArticles.id,
      title: newsArticles.title,
      content: newsArticles.content,
      excerpt: newsArticles.excerpt,
      authorId: newsArticles.authorId,
      authorName: employees.name,
      status: newsArticles.status,
      commentsEnabled: newsArticles.commentsEnabled,
      isPinned: newsArticles.isPinned,
      viewCount: newsArticles.viewCount,
      publishedAt: newsArticles.publishedAt,
      createdAt: newsArticles.createdAt,
      updatedAt: newsArticles.updatedAt,
    })
    .from(newsArticles)
    .innerJoin(employees, eq(newsArticles.authorId, employees.authId))
    .where(
      and(
        eq(newsArticles.status, "published"),
        eq(newsArticles.organizationId, organization.id),
      ),
    )
    .orderBy(desc(newsArticles.isPinned), desc(newsArticles.publishedAt));

  const articleIds = articles.map((a) => a.id);

  const [comments, attachments] = await Promise.all([
    articleIds.length > 0
      ? db
          .select({
            articleId: newsComments.articleId,
            count: sql<number>`count(*)::int`,
          })
          .from(newsComments)
          .where(
            and(
              sql`${newsComments.articleId} IN ${articleIds}`,
              eq(newsComments.organizationId, organization.id),
            ),
          )
          .groupBy(newsComments.articleId)
      : [],
    articleIds.length > 0
      ? db
          .select()
          .from(newsAttachments)
          .where(
            and(
              sql`${newsAttachments.articleId} IN ${articleIds}`,
              eq(newsAttachments.organizationId, organization.id),
            ),
          )
      : [],
  ]);

  const commentCountMap = new Map(comments.map((c) => [c.articleId, c.count]));
  const attachmentMap = new Map<string, (typeof attachments)[number][]>();
  for (const att of attachments) {
    if (!attachmentMap.has(att.articleId)) {
      attachmentMap.set(att.articleId, []);
    }
    attachmentMap.get(att.articleId)!.push(att);
  }

  return articles.map((article) => ({
    ...article,
    commentCount: commentCountMap.get(article.id) || 0,
    attachments: (attachmentMap.get(article.id) || []).map((a) => ({
      id: a.id,
      fileName: a.fileName,
      fileUrl: a.fileUrl,
      fileSize: a.fileSize,
      mimeType: a.mimeType,
    })),
  })) as NewsArticle[];
}

export async function getAllNews() {
  await requireHROrAdmin();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return [];
  }

  const articles = await db
    .select({
      id: newsArticles.id,
      title: newsArticles.title,
      content: newsArticles.content,
      excerpt: newsArticles.excerpt,
      authorId: newsArticles.authorId,
      authorName: employees.name,
      status: newsArticles.status,
      commentsEnabled: newsArticles.commentsEnabled,
      isPinned: newsArticles.isPinned,
      viewCount: newsArticles.viewCount,
      publishedAt: newsArticles.publishedAt,
      createdAt: newsArticles.createdAt,
      updatedAt: newsArticles.updatedAt,
    })
    .from(newsArticles)
    .innerJoin(employees, eq(newsArticles.authorId, employees.authId))
    .where(eq(newsArticles.organizationId, organization.id))
    .orderBy(desc(newsArticles.createdAt));

  const articleIds = articles.map((a) => a.id);

  const [comments, attachments] = await Promise.all([
    articleIds.length > 0
      ? db
          .select({
            articleId: newsComments.articleId,
            count: sql<number>`count(*)::int`,
          })
          .from(newsComments)
          .where(
            and(
              sql`${newsComments.articleId} IN ${articleIds}`,
              eq(newsComments.organizationId, organization.id),
            ),
          )
          .groupBy(newsComments.articleId)
      : [],
    articleIds.length > 0
      ? db
          .select()
          .from(newsAttachments)
          .where(
            and(
              sql`${newsAttachments.articleId} IN ${articleIds}`,
              eq(newsAttachments.organizationId, organization.id),
            ),
          )
      : [],
  ]);

  const commentCountMap = new Map(comments.map((c) => [c.articleId, c.count]));
  const attachmentMap = new Map<string, (typeof attachments)[number][]>();
  for (const att of attachments) {
    if (!attachmentMap.has(att.articleId)) {
      attachmentMap.set(att.articleId, []);
    }
    attachmentMap.get(att.articleId)!.push(att);
  }

  return articles.map((article) => ({
    ...article,
    commentCount: commentCountMap.get(article.id) || 0,
    attachments: (attachmentMap.get(article.id) || []).map((a) => ({
      id: a.id,
      fileName: a.fileName,
      fileUrl: a.fileUrl,
      fileSize: a.fileSize,
      mimeType: a.mimeType,
    })),
  })) as NewsArticle[];
}

export async function getNewsArticle(id: string) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return null;
  }

  const [article] = await db
    .select({
      id: newsArticles.id,
      title: newsArticles.title,
      content: newsArticles.content,
      excerpt: newsArticles.excerpt,
      authorId: newsArticles.authorId,
      authorName: employees.name,
      status: newsArticles.status,
      commentsEnabled: newsArticles.commentsEnabled,
      isPinned: newsArticles.isPinned,
      viewCount: newsArticles.viewCount,
      publishedAt: newsArticles.publishedAt,
      createdAt: newsArticles.createdAt,
      updatedAt: newsArticles.updatedAt,
    })
    .from(newsArticles)
    .innerJoin(employees, eq(newsArticles.authorId, employees.authId))
    .where(
      and(
        eq(newsArticles.id, id),
        eq(newsArticles.organizationId, organization.id),
      ),
    )
    .limit(1);

  if (!article) return null;

  const isHROrAdmin = user.role === "admin" || user.role === "hr";
  if (article.status !== "published" && !isHROrAdmin) {
    return null;
  }

  await db
    .update(newsArticles)
    .set({ viewCount: sql`${newsArticles.viewCount} + 1` })
    .where(
      and(
        eq(newsArticles.id, id),
        eq(newsArticles.organizationId, organization.id),
      ),
    );

  const [comments, attachments] = await Promise.all([
    db
      .select({
        articleId: newsComments.articleId,
        count: sql<number>`count(*)::int`,
      })
      .from(newsComments)
      .where(
        and(
          eq(newsComments.articleId, id),
          eq(newsComments.organizationId, organization.id),
        ),
      )
      .groupBy(newsComments.articleId),
    db
      .select()
      .from(newsAttachments)
      .where(
        and(
          eq(newsAttachments.articleId, id),
          eq(newsAttachments.organizationId, organization.id),
        ),
      ),
  ]);

  return {
    ...article,
    commentCount: comments[0]?.count || 0,
    attachments: attachments.map((a) => ({
      id: a.id,
      fileName: a.fileName,
      fileUrl: a.fileUrl,
      fileSize: a.fileSize,
      mimeType: a.mimeType,
    })),
  } as NewsArticle;
}

export async function getNewsComments(articleId: string) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return [];
  }

  const comments = await db
    .select({
      id: newsComments.id,
      content: newsComments.content,
      userId: newsComments.userId,
      userName: employees.name,
      createdAt: newsComments.createdAt,
    })
    .from(newsComments)
    .innerJoin(employees, eq(newsComments.userId, employees.authId))
    .where(
      and(
        eq(newsComments.articleId, articleId),
        eq(newsComments.organizationId, organization.id),
      ),
    )
    .orderBy(desc(newsComments.createdAt));

  return comments;
}

export async function addNewsComment(articleId: string, content: string) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return {
      success: null,
      error: { reason: "Organization not found" },
    };
  }

  const [article] = await db
    .select()
    .from(newsArticles)
    .where(
      and(
        eq(newsArticles.id, articleId),
        eq(newsArticles.organizationId, organization.id),
        eq(newsArticles.commentsEnabled, true),
        eq(newsArticles.status, "published"),
      ),
    )
    .limit(1);

  if (!article) {
    return {
      success: null,
      error: { reason: "Article not found or comments disabled" },
    };
  }

  try {
    await db.insert(newsComments).values({
      organizationId: organization.id,
      articleId,
      userId: user.authId,
      content,
    });

    revalidatePath(`/news/${articleId}`);

    return { success: { reason: "Comment added successfully" }, error: null };
  } catch (_err) {
    return { success: null, error: { reason: "Failed to add comment" } };
  }
}

export async function deleteNewsComment(commentId: string) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return {
      success: null,
      error: { reason: "Organization not found" },
    };
  }

  const [comment] = await db
    .select()
    .from(newsComments)
    .where(
      and(
        eq(newsComments.id, commentId),
        eq(newsComments.organizationId, organization.id),
      ),
    )
    .limit(1);

  if (!comment) {
    return { success: null, error: { reason: "Comment not found" } };
  }

  const isHROrAdmin = user.role === "admin" || user.role === "hr";
  if (comment.userId !== user.authId && !isHROrAdmin) {
    return {
      success: null,
      error: { reason: "Not authorized to delete this comment" },
    };
  }

  try {
    await db
      .delete(newsComments)
      .where(
        and(
          eq(newsComments.id, commentId),
          eq(newsComments.organizationId, organization.id),
        ),
      );

    revalidatePath(`/news/${comment.articleId}`);

    return { success: { reason: "Comment deleted successfully" }, error: null };
  } catch (_err) {
    return { success: null, error: { reason: "Failed to delete comment" } };
  }
}
