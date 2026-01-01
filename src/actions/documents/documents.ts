// biome-ignore-all lint/style/noNonNullAssertion: <>

"use server";

import { db } from "@/db";
import { and, eq, inArray } from "drizzle-orm";
import { getUser } from "../auth/dal";
import {
  document,
  documentAccess,
  documentFolders,
  documentTags,
  documentVersions,
  documentComments,
  documentLogs,
  employees,
} from "@/db/schema";
import { DrizzleQueryError, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { upstashIndex } from "@/lib/upstash-client";
import { createNotification } from "../notification/notification";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getActiveFolderDocuments(
  folderId: number,
  page = 1,
  pageSize = 20,
) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  try {
    const { docs, total } = await db.transaction(async (tx) => {
      const folder = await tx
        .select({
          id: documentFolders.id,
          name: documentFolders.name,
          createdBy: documentFolders.createdBy,
          public: documentFolders.public,
          departmental: documentFolders.departmental,
          department: documentFolders.department,
        })
        .from(documentFolders)
        .where(
          and(
            eq(documentFolders.id, folderId),
            eq(documentFolders.organizationId, organization.id),
          ),
        )
        .limit(1);

      if (folder.length === 0) throw new Error("Folder not found");

      const currentFolder = folder[0];
      const isOwner = currentFolder.createdBy === user.authId;
      const isDepartmental =
        currentFolder.departmental &&
        currentFolder.department === user.department;
      const isPublic = currentFolder.public;

      if (!isOwner && !isDepartmental && !isPublic) {
        throw new Error("Access denied to this folder");
      }

      const offset = Math.max(0, (page - 1) * pageSize);

      const visibilityCondition = isOwner
        ? sql`TRUE`
        : sql`(
            ${document.public} = true
            OR (${document.departmental} = true AND ${document.department} = ${user.department})
            OR EXISTS (
              SELECT 1 FROM ${documentAccess}
              WHERE ${documentAccess.documentId} = ${document.id}
                AND ${documentAccess.organizationId} = ${organization.id}
                AND (
                  ${documentAccess.userId} = ${user.authId}
                  OR (${documentAccess.department} IS NOT NULL AND ${documentAccess.department} = ${user.department})
                )
            )
          )`;

      const [{ total }] = await tx
        .select({
          total: sql<number>`count(distinct ${document.id})`,
        })
        .from(document)
        .where(
          and(
            eq(document.folderId, folderId),
            eq(document.status, "active"),
            eq(document.organizationId, organization.id),
            visibilityCondition,
          ),
        );

      const documents = await tx
        .select({
          id: document.id,
          title: document.title,
          description: document.description,
          public: document.public,
          departmental: document.departmental,
          department: document.department,
          status: document.status,
          createdAt: document.createdAt,
          updatedAt: document.updatedAt,
          currentVersion: document.currentVersion,
          uploader: employees.name,
          uploaderId: employees.id,
          uploaderEmail: employees.email,
          folderName: documentFolders.name,
          fileSize: documentVersions.fileSize,
          filePath: documentVersions.filePath,
          mimeType: documentVersions.mimeType,
          loggedUser: sql`${user.authId}`,
        })
        .from(document)
        .leftJoin(employees, eq(document.uploadedBy, employees.authId))
        .leftJoin(documentFolders, eq(document.folderId, documentFolders.id))
        .leftJoin(
          documentVersions,
          eq(documentVersions.id, document.currentVersionId),
        )
        .where(
          and(
            eq(document.folderId, folderId),
            eq(document.status, "active"),
            eq(document.organizationId, organization.id),
            visibilityCondition,
          ),
        )
        .orderBy(sql`${document.updatedAt} DESC`)
        .limit(pageSize)
        .offset(offset);

      if (documents.length === 0) {
        return { docs: [], total: Number(total ?? 0) };
      }

      const docIds = documents.map((d) => d.id);

      const [tags, accessRules] = await Promise.all([
        tx
          .select({
            documentId: documentTags.documentId,
            tag: documentTags.tag,
          })
          .from(documentTags)
          .where(
            and(
              inArray(documentTags.documentId, docIds),
              eq(documentTags.organizationId, organization.id),
            ),
          ),

        tx
          .select({
            documentId: documentAccess.documentId,
            accessLevel: documentAccess.accessLevel,
            userId: documentAccess.userId,
            name: employees.name,
            email: employees.email,
            department: documentAccess.department,
          })
          .from(documentAccess)
          .where(
            and(
              inArray(documentAccess.documentId, docIds),
              eq(documentAccess.organizationId, organization.id),
            ),
          )
          .leftJoin(employees, eq(documentAccess.userId, employees.authId)),
      ]);

      const enrichedDocs = documents.map((doc) => ({
        ...doc,
        tags: tags.filter((t) => t.documentId === doc.id).map((t) => t.tag),
        accessRules: accessRules
          .filter((a) => a.documentId === doc.id)
          .map((a) => ({
            accessLevel: a.accessLevel,
            userId: a.userId,
            name: a.name,
            email: a.email,
            department: a.department,
          })),
      }));

      return { docs: enrichedDocs, total: Number(total ?? 0) };
    });

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
      success: {
        docs,
        count: docs.length,
        total,
        page,
        pageSize,
        totalPages,
        hasMore: page < totalPages,
      },
      error: null,
    };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error occurred" },
      };
    }

    return {
      error: {
        reason: "Couldn't fetch documents. Please try again.",
      },
      success: null,
    };
  }
}

export async function deleteDocumentAction(
  documentId: number,
  pathname: string,
) {
  const user = await getUser();
  if (!user) throw new Error("Unauthorized");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  try {
    const result = await db.transaction(async (tx) => {
      const doc = await tx.query.document.findFirst({
        where: and(
          eq(document.id, documentId),
          eq(document.organizationId, organization.id),
        ),
      });

      if (!doc) throw new Error("Document not found");
      if (doc.uploadedBy !== user.authId && user.role !== "admin") {
        throw new Error("You don't have permission to delete this document");
      }

      const accessUsers = await tx
        .select({ userId: documentAccess.userId })
        .from(documentAccess)
        .where(
          and(
            eq(documentAccess.documentId, documentId),
            eq(documentAccess.organizationId, organization.id),
          ),
        );

      await Promise.all([
        tx
          .delete(documentAccess)
          .where(
            and(
              eq(documentAccess.documentId, documentId),
              eq(documentAccess.organizationId, organization.id),
            ),
          ),
        tx
          .delete(documentTags)
          .where(
            and(
              eq(documentTags.documentId, documentId),
              eq(documentTags.organizationId, organization.id),
            ),
          ),
        tx
          .delete(documentVersions)
          .where(
            and(
              eq(documentVersions.documentId, documentId),
              eq(documentVersions.organizationId, organization.id),
            ),
          ),
        tx
          .delete(documentComments)
          .where(
            and(
              eq(documentComments.documentId, documentId),
              eq(documentComments.organizationId, organization.id),
            ),
          ),
        tx
          .delete(documentLogs)
          .where(
            and(
              eq(documentLogs.documentId, documentId),
              eq(documentLogs.organizationId, organization.id),
            ),
          ),
        upstashIndex.delete(doc.upstashId),
      ]);

      await tx
        .delete(document)
        .where(
          and(
            eq(document.id, documentId),
            eq(document.organizationId, organization.id),
          ),
        );

      const recipients = accessUsers
        .map((row) => row.userId)
        .filter((id): id is string => !!id);
      if (doc.uploadedBy) recipients.push(doc.uploadedBy);

      return {
        docTitle: doc.title,
        docId: doc.id,
        recipients,
      };
    });

    revalidatePath(pathname);

    if (result) {
      const uniqueRecipients = new Set<string>(result.recipients);
      uniqueRecipients.delete(user.authId);

      for (const recipientId of uniqueRecipients) {
        const [emp] = await db
          .select({ id: employees.authId })
          .from(employees)
          .where(eq(employees.authId, recipientId))
          .limit(1);

        if (emp) {
          await createNotification({
            user_id: emp.id,
            title: "Document Deleted",
            message: `${user.name} removed "${result.docTitle}"`,
            notification_type: "message",
            reference_id: result.docId,
          });
        }
      }
    }

    return {
      success: { reason: "Document deleted successfully" },
      error: null,
    };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error occurred" },
      };
    }

    return {
      error: {
        reason: "Couldn't delete document. Please try again.",
      },
      success: null,
    };
  }
}
export async function archiveDocumentAction(
  documentId: number,
  pathname: string,
) {
  try {
    const user = await getUser();
    if (!user) {
      return {
        success: null,
        error: { reason: "User not logged in" },
      };
    }

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) throw new Error("Organization not found");

    const doc = await db.query.document.findFirst({
      where: and(
        eq(document.id, documentId),
        eq(document.organizationId, organization.id),
      ),
    });

    if (!doc) {
      return {
        success: null,
        error: { reason: "Document not found" },
      };
    }
    if (doc.uploadedBy !== user.authId && user.role !== "admin") {
      return {
        success: null,
        error: { reason: "You dont have permission to archive this document" },
      };
    }

    const accessRows = await db
      .select({ userId: documentAccess.userId })
      .from(documentAccess)
      .where(
        and(
          eq(documentAccess.documentId, documentId),
          eq(documentAccess.organizationId, organization.id),
        ),
      );

    await db
      .update(document)
      .set({ status: "archived", updatedAt: new Date() })
      .where(
        and(
          eq(document.id, documentId),
          eq(document.organizationId, organization.id),
        ),
      );

    const recipients = accessRows
      .map((row) => row.userId)
      .filter((id): id is string => !!id);
    if (doc.uploadedBy) recipients.push(doc.uploadedBy);

    const uniqueRecipients = new Set<string>(recipients);
    uniqueRecipients.delete(user.authId);

    for (const recipientId of uniqueRecipients) {
      const [emp] = await db
        .select({ id: employees.authId })
        .from(employees)
        .where(eq(employees.authId, recipientId))
        .limit(1);

      if (emp) {
        await createNotification({
          user_id: emp.id,
          title: "Document Archived",
          message: `${user.name} archived "${doc.title}"`,
          notification_type: "message",
          reference_id: doc.id,
        });
      }
    }

    revalidatePath(pathname);
    return {
      success: { reason: "Document archived successfully" },
      error: null,
    };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error occurred" },
      };
    }

    return {
      error: {
        reason: "Couldn't delete document. Please try again.",
      },
      success: null,
    };
  }
}

export async function getDocumentComments(documentId: number) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  try {
    const result = await db.transaction(async (tx) => {
      const doc = await tx.query.document.findFirst({
        where: and(
          eq(document.id, documentId),
          eq(document.organizationId, organization.id),
        ),
      });
      if (!doc) throw new Error("Document not found");

      const accessRows = await tx
        .select({
          userId: documentAccess.userId,
          department: documentAccess.department,
          accessLevel: documentAccess.accessLevel,
        })
        .from(documentAccess)
        .where(
          and(
            eq(documentAccess.documentId, documentId),
            eq(documentAccess.organizationId, organization.id),
          ),
        );

      const hasExplicitAccess = accessRows.some(
        (a) =>
          a.userId === user.authId ||
          (a.department && a.department === user.department),
      );

      const canView =
        doc.public ||
        (doc.departmental && doc.department === user.department) ||
        doc.uploadedBy === user.authId ||
        hasExplicitAccess;

      if (!canView) throw new Error("Access denied");

      const comments = await tx
        .select({
          id: documentComments.id,
          comment: documentComments.comment,
          createdAt: documentComments.createdAt,
          userId: documentComments.userId,
          userName: employees.name,
          userEmail: employees.email,
        })
        .from(documentComments)
        .leftJoin(employees, eq(documentComments.userId, employees.authId))
        .where(
          and(
            eq(documentComments.documentId, documentId),
            eq(documentComments.organizationId, organization.id),
          ),
        )
        .orderBy(sql`${documentComments.createdAt} DESC`);

      return comments;
    });

    return { success: result, error: null };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error occurred" },
      };
    }

    if (err instanceof Error && err.message === "Access denied") {
      return {
        success: null,
        error: { reason: "Dont have permissions to view comments" },
      };
    }
    return {
      success: null,
      error: { reason: "Couldn't fetch comments. Please try again." },
    };
  }
}

export async function addDocumentComment(documentId: number, content: string) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  if (!content || content.trim().length === 0) {
    return { success: null, error: { reason: "Comment cannot be empty" } };
  }

  try {
    const result = await db.transaction(async (tx) => {
      const doc = await tx.query.document.findFirst({
        where: and(
          eq(document.id, documentId),
          eq(document.organizationId, organization.id),
        ),
      });
      if (!doc) throw new Error("Document not found");

      const accessRows = await tx
        .select({
          userId: documentAccess.userId,
          department: documentAccess.department,
          accessLevel: documentAccess.accessLevel,
        })
        .from(documentAccess)
        .where(
          and(
            eq(documentAccess.documentId, documentId),
            eq(documentAccess.organizationId, organization.id),
          ),
        );

      const hasEditOrManage =
        accessRows.some(
          (a) =>
            (a.userId === user.authId ||
              (a.department && a.department === user.department)) &&
            (a.accessLevel === "edit" || a.accessLevel === "manage"),
        ) || user.role === "admin";

      const canComment = doc.uploadedBy === user.authId || hasEditOrManage;
      if (!canComment) throw new Error("Access denied");

      const [commentRow] = await tx
        .insert(documentComments)
        .values({
          documentId,
          userId: user.authId,
          comment: content.trim(),
          organizationId: organization.id,
        })
        .returning();

      await tx.insert(documentLogs).values({
        userId: user.authId,
        documentId,
        documentVersionId: doc.currentVersionId,
        action: "comment",
        details: "added a comment",
        organizationId: organization.id,
      });

      const explicitUsers = accessRows
        .map((row) => row.userId)
        .filter((id): id is string => !!id);

      return {
        commentRow,
        docTitle: doc.title,
        recipients: explicitUsers,
        uploaderId: doc.uploadedBy,
      };
    });

    const notificationRecipients = new Set<string>(result.recipients ?? []);
    if (result.uploaderId) notificationRecipients.add(result.uploaderId);
    notificationRecipients.delete(user.authId);

    if (notificationRecipients.size > 0) {
      const preview =
        content.trim().length > 120
          ? `${content.trim().substring(0, 120)}...`
          : content.trim();

      for (const recipientId of notificationRecipients) {
        const [emp] = await db
          .select({ id: employees.authId })
          .from(employees)
          .where(eq(employees.authId, recipientId))
          .limit(1);

        if (emp) {
          await createNotification({
            user_id: emp.id,
            title: "New Document Comment",
            message: `${user.name} commented on "${result.docTitle}" • ${preview}`,
            notification_type: "message",
            reference_id: documentId,
          });
        }
      }
    }

    return { success: result.commentRow, error: null };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error occurred" },
      };
    }

    if (err instanceof Error && err.message === "Access denied") {
      return {
        success: null,
        error: { reason: "Dont have permissions to comment" },
      };
    }
    return {
      success: null,
      error: { reason: "Couldn't add comment. Please try again." },
    };
  }
}

export async function deleteDocumentComment(commentId: number) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  try {
    await db.transaction(async (tx) => {
      const [commentRow] = await tx
        .select({
          id: documentComments.id,
          documentId: documentComments.documentId,
          userId: documentComments.userId,
        })
        .from(documentComments)
        .where(
          and(
            eq(documentComments.id, commentId),
            eq(documentComments.organizationId, organization.id),
          ),
        )
        .limit(1);

      if (!commentRow) throw new Error("Comment not found");

      const doc = await tx.query.document.findFirst({
        where: and(
          eq(document.id, commentRow.documentId!),
          eq(document.organizationId, organization.id),
        ),
      });
      if (!doc) throw new Error("Document not found");

      const accessRows = await tx
        .select({
          userId: documentAccess.userId,
          department: documentAccess.department,
          accessLevel: documentAccess.accessLevel,
        })
        .from(documentAccess)
        .where(
          and(
            eq(documentAccess.documentId, doc.id),
            eq(documentAccess.organizationId, organization.id),
          ),
        );

      const hasManageAccess = accessRows.some(
        (a) =>
          (a.userId === user.authId ||
            (a.department && a.department === user.department)) &&
          a.accessLevel === "manage",
      );

      const isAuthor = commentRow.userId === user.authId;
      const isDocOwner = doc.uploadedBy === user.authId;

      if (!(isAuthor || isDocOwner || hasManageAccess)) {
        throw new Error("Access denied");
      }

      await tx
        .delete(documentComments)
        .where(
          and(
            eq(documentComments.id, commentId),
            eq(documentComments.organizationId, organization.id),
          ),
        );

      await tx.insert(documentLogs).values({
        userId: user.authId,
        documentId: doc.id,
        documentVersionId: doc.currentVersionId,
        action: "delete_comment",
        details: "deleted a comment",
        organizationId: organization.id,
      });
    });

    return { success: { reason: "Comment deleted successfully" }, error: null };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error occurred" },
      };
    }
    if (err instanceof Error && err.message === "Access denied") {
      return {
        success: null,
        error: { reason: "Dont have permissions to delete comment" },
      };
    }
    return {
      success: null,
      error: { reason: "Couldn't delete comment. Please try again." },
    };
  }
}

export async function getDocumentVersions(documentId: number) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  try {
    const versions = await db.transaction(async (tx) => {
      const doc = await tx.query.document.findFirst({
        where: and(
          eq(document.id, documentId),
          eq(document.organizationId, organization.id),
        ),
      });
      if (!doc) throw new Error("Document not found");

      const accessRows = await tx
        .select({
          userId: documentAccess.userId,
          department: documentAccess.department,
          accessLevel: documentAccess.accessLevel,
        })
        .from(documentAccess)
        .where(
          and(
            eq(documentAccess.documentId, documentId),
            eq(documentAccess.organizationId, organization.id),
          ),
        );

      const hasExplicitAccess = accessRows.some(
        (a) =>
          a.userId === user.authId ||
          (a.department && a.department === user.department),
      );

      const canView =
        doc.public ||
        (doc.departmental && doc.department === user.department) ||
        doc.uploadedBy === user.authId ||
        hasExplicitAccess;

      if (!canView) throw new Error("Access denied");

      const rows = await tx
        .select({
          id: documentVersions.id,
          versionNumber: documentVersions.versionNumber,
          filePath: documentVersions.filePath,
          fileSize: documentVersions.fileSize,
          mimeType: documentVersions.mimeType,
          createdAt: documentVersions.createdAt,
          uploadedBy: documentVersions.uploadedBy,
          uploadedByName: employees.name,
          uploadedByEmail: employees.email,
        })
        .from(documentVersions)
        .leftJoin(employees, eq(documentVersions.uploadedBy, employees.authId))
        .where(
          and(
            eq(documentVersions.documentId, documentId),
            eq(documentVersions.organizationId, organization.id),
          ),
        )
        .orderBy(sql`${documentVersions.createdAt} DESC`);

      return rows;
    });

    return { success: versions, error: null };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error occurred" },
      };
    }
    if (err instanceof Error && err.message === "Access denied") {
      return {
        success: null,
        error: { reason: "Dont have permissions to view versions" },
      };
    }
    return {
      success: null,
      error: { reason: "Couldn't fetch versions. Please try again." },
    };
  }
}

export async function deleteDocumentVersion(
  versionId: number,
  pathname?: string,
) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  try {
    await db.transaction(async (tx) => {
      const [version] = await tx
        .select({
          id: documentVersions.id,
          documentId: documentVersions.documentId,
          versionNumber: documentVersions.versionNumber,
        })
        .from(documentVersions)
        .where(
          and(
            eq(documentVersions.id, versionId),
            eq(documentVersions.organizationId, organization.id),
          ),
        )
        .limit(1);

      if (!version) throw new Error("Version not found");

      const doc = await tx.query.document.findFirst({
        where: and(
          eq(document.id, version.documentId),
          eq(document.organizationId, organization.id),
        ),
      });
      if (!doc) throw new Error("Document not found");

      if (doc.currentVersionId === version.id) {
        throw new Error("Cannot delete the current version");
      }

      const accessRows = await tx
        .select({
          userId: documentAccess.userId,
          department: documentAccess.department,
          accessLevel: documentAccess.accessLevel,
        })
        .from(documentAccess)
        .where(
          and(
            eq(documentAccess.documentId, version.documentId),
            eq(documentAccess.organizationId, organization.id),
          ),
        );

      const hasManageAccess = accessRows.some(
        (a) =>
          (a.userId === user.authId ||
            (a.department && a.department === user.department)) &&
          a.accessLevel === "manage",
      );

      const isDocOwner = doc.uploadedBy === user.authId;
      if (!(isDocOwner || hasManageAccess)) {
        throw new Error("Access denied");
      }

      await tx
        .delete(documentVersions)
        .where(
          and(
            eq(documentVersions.id, versionId),
            eq(documentVersions.organizationId, organization.id),
          ),
        );

      await tx.insert(documentLogs).values({
        userId: user.authId,
        documentId: version.documentId,
        documentVersionId: version.id,
        action: "delete_version",
        details: `deleted version v${version.versionNumber}`,
        organizationId: organization.id,
      });
    });

    if (pathname) revalidatePath(pathname);
    return { success: { reason: "Version deleted successfully" }, error: null };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error occurred" },
      };
    }
    if (err instanceof Error && err.message === "Access denied") {
      return {
        success: null,
        error: { reason: "Dont have permissions to view versions" },
      };
    }
    return {
      success: null,
      error: { reason: "Couldn't delete version. Please try again." },
    };
  }
}

export async function getDocumentLogs(documentId: number) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  try {
    const logs = await db.transaction(async (tx) => {
      const doc = await tx.query.document.findFirst({
        where: and(
          eq(document.id, documentId),
          eq(document.organizationId, organization.id),
        ),
      });
      if (!doc) throw new Error("Document not found");

      const accessRows = await tx
        .select({
          userId: documentAccess.userId,
          department: documentAccess.department,
          accessLevel: documentAccess.accessLevel,
        })
        .from(documentAccess)
        .where(
          and(
            eq(documentAccess.documentId, documentId),
            eq(documentAccess.organizationId, organization.id),
          ),
        );

      const isOwner = doc.uploadedBy === user.authId;
      const hasManageAccess = accessRows.some(
        (a) =>
          (a.userId === user.authId ||
            (a.department && a.department === user.department)) &&
          a.accessLevel === "manage",
      );

      const canView = isOwner || hasManageAccess;

      if (!canView) throw new Error("Access denied");

      const rows = await tx
        .select({
          id: documentLogs.id,
          action: documentLogs.action,
          details: documentLogs.details,
          createdAt: documentLogs.createdAt,
          userId: documentLogs.userId,
          userName: employees.name,
          userEmail: employees.email,
          documentVersionId: documentLogs.documentVersionId,
        })
        .from(documentLogs)
        .leftJoin(employees, eq(documentLogs.userId, employees.authId))
        .where(
          and(
            eq(documentLogs.documentId, documentId),
            eq(documentLogs.organizationId, organization.id),
          ),
        )
        .orderBy(sql`${documentLogs.createdAt} DESC`);

      return rows;
    });

    return { success: logs, error: null };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error occurred" },
      };
    }
    if (err instanceof Error && err.message === "Access denied") {
      return {
        success: null,
        error: { reason: "Dont have permissions to view logs" },
      };
    }
    return {
      success: null,
      error: { reason: "Couldn't fetch logs. Please try again." },
    };
  }
}

export async function updateDocumentPublic(
  documentId: number,
  isPublic: boolean,
  pathname?: string,
) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  try {
    await db.transaction(async (tx) => {
      const doc = await tx.query.document.findFirst({
        where: and(
          eq(document.id, documentId),
          eq(document.organizationId, organization.id),
        ),
      });
      if (!doc) throw new Error("Document not found");

      const accessRows = await tx
        .select({
          userId: documentAccess.userId,
          department: documentAccess.department,
          accessLevel: documentAccess.accessLevel,
        })
        .from(documentAccess)
        .where(
          and(
            eq(documentAccess.documentId, documentId),
            eq(documentAccess.organizationId, organization.id),
          ),
        );

      const isOwner = doc.uploadedBy === user.authId;
      const hasManageAccess =
        accessRows.some(
          (a) =>
            (a.userId === user.authId ||
              (a.department && a.department === user.department)) &&
            a.accessLevel === "manage",
        ) || user.department === "admin";

      if (!(isOwner || hasManageAccess)) {
        throw new Error("Access denied");
      }

      await tx
        .update(document)
        .set({ public: isPublic, updatedAt: new Date() })
        .where(
          and(
            eq(document.id, documentId),
            eq(document.organizationId, organization.id),
          ),
        );

      await tx.insert(documentLogs).values({
        userId: user.authId,
        documentId,
        documentVersionId: doc.currentVersionId,
        action: "update_public",
        details: `set public=${isPublic ? "true" : "false"}`,
        organizationId: organization.id,
      });
    });

    if (pathname) revalidatePath(pathname);
    return { success: { reason: "Updated public setting" }, error: null };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error occurred" },
      };
    }
    if (err instanceof Error && err.message === "Access denied") {
      return { success: null, error: { reason: "Dont have permissions" } };
    }
    return {
      success: null,
      error: { reason: "Couldn't update public setting. Please try again." },
    };
  }
}

export async function updateDepartmentAccess(
  documentId: number,
  departmental: boolean,
  accessLevel?: "view" | "edit" | "manage",
  pathname?: string,
) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  try {
    await db.transaction(async (tx) => {
      const doc = await tx.query.document.findFirst({
        where: and(
          eq(document.id, documentId),
          eq(document.organizationId, organization.id),
        ),
      });
      if (!doc) throw new Error("Document not found");

      const accessRows = await tx
        .select({
          userId: documentAccess.userId,
          department: documentAccess.department,
          accessLevel: documentAccess.accessLevel,
        })
        .from(documentAccess)
        .where(
          and(
            eq(documentAccess.documentId, documentId),
            eq(documentAccess.organizationId, organization.id),
          ),
        );

      const isOwner = doc.uploadedBy === user.authId;
      const hasManageAccess =
        accessRows.some(
          (a) =>
            (a.userId === user.authId ||
              (a.department && a.department === user.department)) &&
            a.accessLevel === "manage",
        ) || user.department === "admin";

      if (!(isOwner || hasManageAccess)) {
        throw new Error("Access denied");
      }

      if (!departmental) {
        // Turn off departmental and remove department-level rule
        await tx
          .update(document)
          .set({ departmental: false, updatedAt: new Date() })
          .where(
            and(
              eq(document.id, documentId),
              eq(document.organizationId, organization.id),
            ),
          );

        await tx
          .delete(documentAccess)
          .where(
            and(
              eq(documentAccess.documentId, documentId),
              eq(documentAccess.department, doc.department),
              eq(documentAccess.organizationId, organization.id),
              sql`${documentAccess.userId} IS NULL`,
            ),
          );

        await tx.insert(documentLogs).values({
          userId: user.authId,
          documentId,
          documentVersionId: doc.currentVersionId,
          action: "update_departmental_access",
          details: "disabled departmental access",
          organizationId: organization.id,
        });
        return;
      }

      const level = accessLevel ?? "view";

      await tx
        .update(document)
        .set({ departmental: true, updatedAt: new Date() })
        .where(
          and(
            eq(document.id, documentId),
            eq(document.organizationId, organization.id),
          ),
        );

      const existing = await tx
        .select({ id: documentAccess.id })
        .from(documentAccess)
        .where(
          and(
            eq(documentAccess.documentId, documentId),
            eq(documentAccess.department, doc.department),
            eq(documentAccess.organizationId, organization.id),
            sql`${documentAccess.userId} IS NULL`,
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        await tx
          .update(documentAccess)
          .set({ accessLevel: level, updatedAt: new Date() })
          .where(
            and(
              eq(documentAccess.id, existing[0].id),
              eq(documentAccess.organizationId, organization.id),
            ),
          );
      } else {
        await tx.insert(documentAccess).values({
          accessLevel: level,
          documentId,
          userId: null,
          department: doc.department,
          grantedBy: user.authId,
          organizationId: organization.id,
        });
      }

      await tx.insert(documentLogs).values({
        userId: user.authId,
        documentId,
        documentVersionId: doc.currentVersionId,
        action: "update_departmental_access",
        details: `enabled departmental (${doc.department}) level=${level}`,
        organizationId: organization.id,
      });
    });

    if (pathname) revalidatePath(pathname);
    return { success: { reason: "Updated departmental access" }, error: null };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error occurred" },
      };
    }
    if (err instanceof Error && err.message === "Access denied") {
      return {
        success: null,
        error: { reason: "Dont have permissions to update access" },
      };
    }
    return {
      success: null,
      error: {
        reason: "Couldn't update departmental access. Please try again.",
      },
    };
  }
}

export async function searchEmployeesForShare(query: string, limit = 8) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  try {
    const q = query.trim();
    if (!q) return { success: [], error: null };

    const results = await db
      .select({
        id: employees.id,
        name: employees.name,
        email: employees.email,
        department: employees.department,
      })
      .from(employees)
      .where(
        sql`(${employees.name} ILIKE ${`%${q}%`} OR ${employees.email} ILIKE ${`%${q}%`}) AND ${employees.authId} <> ${user.authId} AND ${employees.organizationId} = ${organization.id}`,
      )
      .limit(limit);

    return { success: results, error: null };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error occurred" },
      };
    }
    return {
      success: null,
      error: { reason: "Couldn't search employees. Please try again." },
    };
  }
}

export async function getDocumentShares(documentId: number) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  try {
    const rows = await db.transaction(async (tx) => {
      const doc = await tx.query.document.findFirst({
        where: and(
          eq(document.id, documentId),
          eq(document.organizationId, organization.id),
        ),
      });
      if (!doc) throw new Error("Document not found");

      const accessRows = await tx
        .select({
          userId: documentAccess.userId,
          department: documentAccess.department,
          accessLevel: documentAccess.accessLevel,
        })
        .from(documentAccess)
        .where(
          and(
            eq(documentAccess.documentId, documentId),
            eq(documentAccess.organizationId, organization.id),
          ),
        );

      const isOwner = doc.uploadedBy === user.authId;
      const hasManageAccess = accessRows.some(
        (a) =>
          (a.userId === user.authId ||
            (a.department && a.department === user.department)) &&
          a.accessLevel === "manage",
      );
      if (!(isOwner || hasManageAccess)) {
        throw new Error("Access denied");
      }

      const shares = await tx
        .select({
          userId: documentAccess.userId,
          accessLevel: documentAccess.accessLevel,
          createdAt: documentAccess.createdAt,
          name: employees.name,
          email: employees.email,
        })
        .from(documentAccess)
        .leftJoin(employees, eq(documentAccess.userId, employees.authId))
        .where(
          and(
            eq(documentAccess.documentId, documentId),
            eq(documentAccess.organizationId, organization.id),
            sql`${documentAccess.userId} IS NOT NULL`,
          ),
        )
        .orderBy(sql`${employees.name} ASC`);

      return shares;
    });

    return { success: rows, error: null };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error occurred" },
      };
    }
    if (err instanceof Error && err.message === "Access denied") {
      return { success: null, error: { reason: "Dont have permissions" } };
    }
    return {
      success: null,
      error: { reason: "Couldn't fetch shares. Please try again." },
    };
  }
}

export async function addDocumentShare(
  documentId: number,
  email: string,
  accessLevel: "view" | "edit" | "manage",
) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  try {
    const result = await db.transaction(async (tx) => {
      const doc = await tx.query.document.findFirst({
        where: and(
          eq(document.id, documentId),
          eq(document.organizationId, organization.id),
        ),
      });
      if (!doc) throw new Error("Document not found");

      const accessRows = await tx
        .select({
          userId: documentAccess.userId,
          department: documentAccess.department,
          accessLevel: documentAccess.accessLevel,
        })
        .from(documentAccess)
        .where(
          and(
            eq(documentAccess.documentId, documentId),
            eq(documentAccess.organizationId, organization.id),
          ),
        );

      const isOwner = doc.uploadedBy === user.authId;
      const hasManageAccess = accessRows.some(
        (a) =>
          (a.userId === user.authId ||
            (a.department && a.department === user.department)) &&
          a.accessLevel === "manage",
      );
      if (!(isOwner || hasManageAccess)) {
        throw new Error("Access denied");
      }

      const [target] = await tx
        .select({
          id: employees.authId,
          authId: employees.authId,
          email: employees.email,
        })
        .from(employees)
        .where(
          and(
            eq(employees.email, email.toLowerCase()),
            eq(employees.organizationId, organization.id),
          ),
        )
        .limit(1);

      if (!target) {
        return {
          notFound: true as const,
          email,
        };
      }

      const [existing] = await tx
        .select({
          id: documentAccess.id,
          accessLevel: documentAccess.accessLevel,
        })
        .from(documentAccess)
        .where(
          and(
            eq(documentAccess.documentId, documentId),
            eq(documentAccess.userId, target.authId),
            eq(documentAccess.organizationId, organization.id),
          ),
        )
        .limit(1);

      if (existing) {
        await tx
          .update(documentAccess)
          .set({ accessLevel, updatedAt: new Date() })
          .where(
            and(
              eq(documentAccess.id, existing.id),
              eq(documentAccess.organizationId, organization.id),
            ),
          );
      } else {
        await tx.insert(documentAccess).values({
          accessLevel,
          documentId,
          userId: target.authId,
          department: null,
          grantedBy: user.authId,
          organizationId: organization.id,
        });
      }

      await tx.insert(documentLogs).values({
        userId: user.authId,
        documentId,
        action: "share",
        details: `granted ${accessLevel} to ${target.email}`,
        documentVersionId: doc.currentVersionId,
        organizationId: organization.id,
      });

      return {
        notFound: false as const,
        userId: target.id,
        email: target.email,
        documentName: doc.title,
      };
    });

    if (result.notFound) {
      return {
        success: null,
        error: { reason: `No employee found with email ${result.email}` },
      };
    }

    // Notify the user that a document was shared with them
    await createNotification({
      user_id: result.userId,
      title: "Document Shared With You",
      message: `${user.name} shared "${result.documentName}" with ${accessLevel} access`,
      notification_type: "message",
      reference_id: documentId,
    });

    return {
      success: {
        reason: "Share updated",
        userId: result.userId,
        email: result.email,
      },
      error: null,
    };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error occurred" },
      };
    }
    if (err instanceof Error && err.message === "Access denied") {
      return {
        success: null,
        error: { reason: "Dont have permissions to manage shares" },
      };
    }
    return {
      success: null,
      error: { reason: "Couldn't add share. Please try again." },
    };
  }
}

export async function removeDocumentShare(
  documentId: number,
  targetUserId: string,
) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  try {
    const result = await db.transaction(async (tx) => {
      const doc = await tx.query.document.findFirst({
        where: and(
          eq(document.id, documentId),
          eq(document.organizationId, organization.id),
        ),
      });
      if (!doc) throw new Error("Document not found");

      const accessRows = await tx
        .select({
          userId: documentAccess.userId,
          department: documentAccess.department,
          accessLevel: documentAccess.accessLevel,
        })
        .from(documentAccess)
        .where(
          and(
            eq(documentAccess.documentId, documentId),
            eq(documentAccess.organizationId, organization.id),
          ),
        );

      const isOwner = doc.uploadedBy === user.authId;
      const hasManageAccess = accessRows.some(
        (a) =>
          (a.userId === user.authId ||
            (a.department && a.department === user.department)) &&
          a.accessLevel === "manage",
      );
      if (!(isOwner || hasManageAccess)) {
        throw new Error("Access denied");
      }

      if (targetUserId === doc.uploadedBy) {
        throw new Error("Cannot revoke uploader's access");
      }

      await tx
        .delete(documentAccess)
        .where(
          and(
            eq(documentAccess.documentId, documentId),
            eq(documentAccess.userId, targetUserId),
            eq(documentAccess.organizationId, organization.id),
          ),
        );

      await tx.insert(documentLogs).values({
        userId: user.authId,
        documentId,
        action: "revoke_share",
        details: `revoked access from user ${targetUserId}`,
        documentVersionId: doc.currentVersionId,
        organizationId: organization.id,
      });

      return { documentName: doc.title };
    });

    // Notify the user that their access was revoked
    const [targetEmp] = await db
      .select({ id: employees.authId })
      .from(employees)
      .where(eq(employees.authId, targetUserId))
      .limit(1);

    if (targetEmp) {
      await createNotification({
        user_id: targetEmp.id,
        title: "Document Access Revoked",
        message: `Your access to "${result.documentName}" has been revoked`,
        notification_type: "message",
        reference_id: documentId,
      });
    }

    return { success: { reason: "Share removed" }, error: null };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error occurred" },
      };
    }
    if (err instanceof Error && err.message === "Access denied") {
      return {
        success: null,
        error: { reason: "Dont have permissions to manage shares" },
      };
    }
    return {
      success: null,
      error: {
        reason:
          err instanceof Error
            ? err.message
            : "Couldn't remove share. Please try again.",
      },
    };
  }
}

export async function getMyDocumentAccess(documentId: number) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  try {
    const result = await db.transaction(async (tx) => {
      const doc = await tx.query.document.findFirst({
        where: and(
          eq(document.id, documentId),
          eq(document.organizationId, organization.id),
        ),
      });
      if (!doc) throw new Error("Document not found");

      if (doc.uploadedBy === user.authId) {
        return {
          level: "manage" as const,
          isOwner: true,
          isAdminDepartment: user.department === "admin",
        };
      }

      const rules = await tx
        .select({
          accessLevel: documentAccess.accessLevel,
          userId: documentAccess.userId,
          department: documentAccess.department,
        })
        .from(documentAccess)
        .where(
          and(
            eq(documentAccess.documentId, documentId),
            eq(documentAccess.organizationId, organization.id),
          ),
        );

      const rank = (lvl: string) =>
        lvl === "manage" ? 3 : lvl === "edit" ? 2 : lvl === "view" ? 1 : 0;

      let best: "none" | "view" | "edit" | "manage" = "none";

      for (const r of rules) {
        const applies =
          r.userId === user.authId ||
          (r.department && r.department === user.department);
        if (!applies) continue;
        if (rank(r.accessLevel) > rank(best)) {
          best = r.accessLevel as typeof best;
        }
      }

      if (best === "none") {
        if (
          doc.public ||
          (doc.departmental && doc.department === user.department)
        ) {
          best = "view";
        }
      }

      return {
        level: best,
        isOwner: false,
        isAdminDepartment: user.department === "admin",
      };
    });

    return { success: result, error: null };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error occurred" },
      };
    }
    return {
      success: null,
      error: { reason: "Couldn't resolve access. Please try again." },
    };
  }
}

/**
 * Get all documents I own or have access to (public, departmental, or explicit share),
 * across all folders. Flat list, paginated.
 */
export async function getAllAccessibleDocuments(page = 1, pageSize = 20) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  try {
    const offset = Math.max(0, (page - 1) * pageSize);

    const visibilityCondition = sql`(
      ${document.uploadedBy} = ${user.authId}
      OR ${document.public} = true
      OR (${document.departmental} = true AND ${document.department} = ${user.department})
      OR EXISTS (
        SELECT 1 FROM ${documentAccess}
        WHERE ${documentAccess.documentId} = ${document.id}
          AND ${documentAccess.organizationId} = ${organization.id}
          AND (
            ${documentAccess.userId} = ${user.authId}
            OR (${documentAccess.department} IS NOT NULL AND ${documentAccess.department} = ${user.department})
          )
      )
    )`;

    const [{ total }] = await db
      .select({
        total: sql<number>`count(distinct ${document.id})`,
      })
      .from(document)
      .where(
        and(
          eq(document.status, "active"),
          eq(document.organizationId, organization.id),
          visibilityCondition,
        ),
      );

    const rows = await db
      .select({
        id: document.id,
        title: document.title,
        description: document.description,
        public: document.public,
        departmental: document.departmental,
        department: document.department,
        status: document.status,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
        currentVersion: document.currentVersion,
        uploader: employees.name,
        uploaderId: employees.id,
        uploaderEmail: employees.email,
        folderName: documentFolders.name,
        fileSize: documentVersions.fileSize,
        filePath: documentVersions.filePath,
        mimeType: documentVersions.mimeType,
        loggedUser: sql`${user.authId}`,
      })
      .from(document)
      .leftJoin(employees, eq(document.uploadedBy, employees.authId))
      .leftJoin(documentFolders, eq(document.folderId, documentFolders.id))
      .leftJoin(
        documentVersions,
        eq(documentVersions.id, document.currentVersionId),
      )
      .where(
        and(
          eq(document.status, "active"),
          eq(document.organizationId, organization.id),
          visibilityCondition,
        ),
      )
      .orderBy(sql`${document.updatedAt} DESC`)
      .limit(pageSize)
      .offset(offset);

    const docIds = rows.map((d) => d.id);
    let tags: { documentId: number | null; tag: string }[] = [];
    let accessRules: {
      documentId: number;
      accessLevel: string;
      userId: string | null;
      name: string | null;
      email: string | null;
      department: string | null;
    }[] = [];

    if (docIds.length > 0) {
      [tags, accessRules] = await Promise.all([
        db
          .select({
            documentId: documentTags.documentId,
            tag: documentTags.tag,
          })
          .from(documentTags)
          .where(
            and(
              inArray(documentTags.documentId, docIds),
              eq(documentTags.organizationId, organization.id),
            ),
          ),
        db
          .select({
            documentId: documentAccess.documentId,
            accessLevel: documentAccess.accessLevel,
            userId: documentAccess.userId,
            name: employees.name,
            email: employees.email,
            department: documentAccess.department,
          })
          .from(documentAccess)
          .where(
            and(
              inArray(documentAccess.documentId, docIds),
              eq(documentAccess.organizationId, organization.id),
            ),
          )
          .leftJoin(employees, eq(documentAccess.userId, employees.authId)),
      ]);
    }

    const enriched = rows.map((doc) => ({
      ...doc,
      tags: tags.filter((t) => t.documentId === doc.id).map((t) => t.tag),
      accessRules: accessRules
        .filter((a) => a.documentId === doc.id)
        .map((a) => ({
          accessLevel: a.accessLevel,
          userId: a.userId,
          name: a.name,
          email: a.email,
          department: a.department,
        })),
    }));

    const totalPages = Math.max(1, Math.ceil((Number(total) || 0) / pageSize));

    return {
      success: {
        docs: enriched,
        count: enriched.length,
        total: Number(total ?? 0),
        page,
        pageSize,
        totalPages,
        hasMore: page < totalPages,
      },
      error: null,
    };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error occurred" },
      };
    }
    return {
      success: null,
      error: { reason: "Couldn't fetch documents. Please try again." },
    };
  }
}

export async function getMyArchivedDocuments(page = 1, pageSize = 20) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  try {
    const offset = Math.max(0, (page - 1) * pageSize);

    const visibilityCondition = sql`(
      ${document.uploadedBy} = ${user.authId}
      OR ${document.public} = true
      OR (${document.departmental} = true AND ${document.department} = ${user.department})
      OR EXISTS (
        SELECT 1 FROM ${documentAccess}
        WHERE ${documentAccess.documentId} = ${document.id}
          AND ${documentAccess.organizationId} = ${organization.id}
          AND (
            ${documentAccess.userId} = ${user.authId}
            OR (${documentAccess.department} IS NOT NULL AND ${documentAccess.department} = ${user.department})
          )
      )
    )`;

    const [{ total }] = await db
      .select({
        total: sql<number>`count(distinct ${document.id})`,
      })
      .from(document)
      .where(
        and(
          eq(document.status, "archived"),
          eq(document.organizationId, organization.id),
          visibilityCondition,
        ),
      );

    const rows = await db
      .select({
        id: document.id,
        title: document.title,
        description: document.description,
        public: document.public,
        departmental: document.departmental,
        department: document.department,
        status: document.status,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
        currentVersion: document.currentVersion,
        uploader: employees.name,
        uploaderId: employees.id,
        uploaderEmail: employees.email,
        folderName: documentFolders.name,
        fileSize: documentVersions.fileSize,
        filePath: documentVersions.filePath,
        mimeType: documentVersions.mimeType,
        loggedUser: sql`${user.authId}`,
      })
      .from(document)
      .leftJoin(employees, eq(document.uploadedBy, employees.authId))
      .leftJoin(documentFolders, eq(document.folderId, documentFolders.id))
      .leftJoin(
        documentVersions,
        eq(documentVersions.id, document.currentVersionId),
      )
      .where(
        and(
          eq(document.status, "archived"),
          eq(document.organizationId, organization.id),
          visibilityCondition,
        ),
      )
      .orderBy(sql`${document.updatedAt} DESC`)
      .limit(pageSize)
      .offset(offset);

    const docIds = rows.map((d) => d.id);
    let tags: { documentId: number | null; tag: string }[] = [];
    let accessRules: {
      documentId: number;
      accessLevel: string;
      userId: string | null;
      name: string | null;
      email: string | null;
      department: string | null;
    }[] = [];

    if (docIds.length > 0) {
      [tags, accessRules] = await Promise.all([
        db
          .select({
            documentId: documentTags.documentId,
            tag: documentTags.tag,
          })
          .from(documentTags)
          .where(
            and(
              inArray(documentTags.documentId, docIds),
              eq(documentTags.organizationId, organization.id),
            ),
          ),
        db
          .select({
            documentId: documentAccess.documentId,
            accessLevel: documentAccess.accessLevel,
            userId: documentAccess.userId,
            name: employees.name,
            email: employees.email,
            department: documentAccess.department,
          })
          .from(documentAccess)
          .where(
            and(
              inArray(documentAccess.documentId, docIds),
              eq(documentAccess.organizationId, organization.id),
            ),
          )
          .leftJoin(employees, eq(documentAccess.userId, employees.authId)),
      ]);
    }

    const enriched = rows.map((doc) => ({
      ...doc,
      tags: tags.filter((t) => t.documentId === doc.id).map((t) => t.tag),
      accessRules: accessRules
        .filter((a) => a.documentId === doc.id)
        .map((a) => ({
          accessLevel: a.accessLevel,
          userId: a.userId,
          name: a.name,
          email: a.email,
          department: a.department,
        })),
    }));

    const totalPages = Math.max(1, Math.ceil((Number(total) || 0) / pageSize));

    return {
      success: {
        docs: enriched,
        count: enriched.length,
        total: Number(total ?? 0),
        page,
        pageSize,
        totalPages,
        hasMore: page < totalPages,
      },
      error: null,
    };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error occurred" },
      };
    }
    return {
      success: null,
      error: { reason: "Couldn't fetch archived documents. Please try again." },
    };
  }
}
