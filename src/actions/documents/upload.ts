/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
// biome-ignore-all lint/style/noNonNullAssertion: <>
//
"use server";

import { db } from "@/db";
import {
  document,
  documentAccess,
  documentFolders,
  documentLogs,
  documentTags,
  documentVersions,
} from "@/db/schema/documents";
import { and, DrizzleQueryError, eq, inArray } from "drizzle-orm";
import { getUser } from "../auth/dal";
import { employees } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { upstashIndex } from "@/lib/upstash-client";
import { createNotification } from "../notification/notification";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface UploadActionProps {
  title: string;
  description?: string;
  folder: string;
  public: boolean;
  departmental: boolean;
  status: string;
  Files: {
    originalFileName: string;
    filePath: string;
    fileSize: string;
    mimeType: string;
  }[];
  tags: { name: string }[];
  permissions: { view: boolean; edit: boolean; manage: boolean }[];
  shares?: { email: string; accessLevel: "view" | "edit" | "manage" }[];
}

// NOTE: create personal folders on create user action

async function getUsersFolderId(folder: string, organizationId: string) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  let folderQuery: any;

  if (user.department === folder) {
    folderQuery = await db
      .select({ id: documentFolders.id })
      .from(documentFolders)
      .where(
        and(
          eq(documentFolders.name, folder),
          eq(documentFolders.department, user.department),
          eq(documentFolders.departmental, true),
          eq(documentFolders.organizationId, organizationId),
        ),
      )
      .limit(1);

    if (folderQuery.length > 0) return folderQuery;
  }

  if (folder === "public") {
    folderQuery = await db
      .select({ id: documentFolders.id })
      .from(documentFolders)
      .where(
        and(
          eq(documentFolders.name, "public"),
          eq(documentFolders.organizationId, organizationId),
        ),
      )
      .limit(1);

    if (folderQuery.length > 0) return folderQuery;
  }

  const existing = await db
    .select({ id: documentFolders.id })
    .from(documentFolders)
    .where(
      and(
        eq(documentFolders.name, folder),
        eq(documentFolders.createdBy, user.authId),
        eq(documentFolders.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (existing.length > 0) return existing;

  const [newFolder] = await db
    .insert(documentFolders)
    .values({
      name: folder,
      createdBy: user.authId,
      department: user.department,
      departmental: user.department === folder,
      organizationId,
    })
    .returning({ id: documentFolders.id });

  return [newFolder];
}

export async function uploadDocumentsAction(data: UploadActionProps) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  const folderResult = await getUsersFolderId(data.folder, organization.id);
  if (!folderResult.length) {
    throw new Error(`Folder '${data.folder}' not found for user`);
  }

  const folderId = folderResult[0].id;
  const isPersonal = data.folder === "personal";
  const effectivePublic = isPersonal ? false : data.public;
  const effectiveDepartmental = isPersonal ? false : data.departmental;

  try {
    const { shareNotifications } = await db.transaction(async (tx) => {
      const [currentCount] = await tx
        .select({ count: employees.documentCount })
        .from(employees)
        .where(
          and(
            eq(employees.authId, user.authId),
            eq(employees.organizationId, organization.id),
          ),
        );

      const updatedCount = (currentCount?.count ?? 0) + data.Files.length;

      await tx
        .update(employees)
        .set({ documentCount: updatedCount })
        .where(
          and(
            eq(employees.authId, user.authId),
            eq(employees.organizationId, organization.id),
          ),
        );

      const insertedDocuments = await tx
        .insert(document)
        .values(
          data.Files.map((file, idx) => ({
            title: data.Files.length > 1 ? `${data.title}-${idx}` : data.title,
            description: data.description ?? "No description",
            originalFileName: file.originalFileName,
            department: user.department,
            departmental: effectiveDepartmental,
            folderId,
            public: effectivePublic,
            uploadedBy: user.authId,
            status: data.status,
            organizationId: organization.id,
          })),
        )
        .returning();

      // Insert to upstash search
      insertedDocuments.map(async (doc) => {
        const item = {
          id: doc.upstashId,
          content: {
            title: doc.title,
            description: doc.description,
            tags: data.tags,
          },
          metadata: {
            department: doc.department,
            documentId: doc.id.toString(),
          },
        };
        await upstashIndex.upsert([item]);
      });

      const versionsToInsert = insertedDocuments.map((doc, index) => {
        const file = data.Files[index];
        return {
          documentId: doc.id,
          versionNumber: 1,
          filePath: file.filePath,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
          uploadedBy: user.authId,
          organizationId: organization.id,
        };
      });
      const insertedVersions = await tx
        .insert(documentVersions)
        .values(versionsToInsert)
        .returning();

      for (const version of insertedVersions) {
        await tx
          .update(document)
          .set({
            currentVersionId: version.id,
            currentVersion: version.versionNumber,
            updatedAt: new Date(), // Explicitly update updatedAt to ensure it's refreshed
          })
          .where(
            and(
              eq(document.id, version.documentId),
              eq(document.organizationId, organization.id),
            ),
          );
      }

      const tagsToInsert = insertedDocuments.flatMap((doc) =>
        data.tags.map((tag) => ({
          documentId: doc.id,
          tag: tag.name,
          organizationId: organization.id,
        })),
      );
      if (tagsToInsert.length > 0) {
        await tx.insert(documentTags).values(tagsToInsert);
      }

      const accessToInsert = insertedDocuments.flatMap((doc) => {
        const rows: any[] = [];
        // Uploader always has manage access
        rows.push({
          accessLevel: "manage",
          documentId: doc.id,
          userId: user.authId,
          department: null,
          grantedBy: user.authId,
          organizationId: organization.id,
        });
        // If departmental is enabled, add a department-level rule derived from provided permissions
        if (effectiveDepartmental) {
          const anyManage = data.permissions.some((p) => p.manage);
          const anyEdit = data.permissions.some((p) => p.edit);
          const anyView = data.permissions.some((p) => p.view);
          const deptLevel = anyManage
            ? "manage"
            : anyEdit
              ? "edit"
              : anyView
                ? "view"
                : null;

          if (deptLevel) {
            rows.push({
              accessLevel: deptLevel,
              documentId: doc.id,
              userId: null,
              department: user.department,
              grantedBy: user.authId,
              organizationId: organization.id,
            });
          }
        }
        return rows;
      });
      if (accessToInsert.length > 0) {
        await tx.insert(documentAccess).values(accessToInsert);
      }

      const shareNotifications: {
        userId: string;
        docId: number;
        docTitle: string;
        accessLevel: string;
      }[] = [];

      if (data.shares && data.shares.length > 0) {
        const uniqueEmails = Array.from(
          new Set(
            data.shares
              .map((s) => s.email?.toLowerCase())
              .filter((e): e is string => !!e),
          ),
        );
        if (uniqueEmails.length > 0) {
          const shareUsers = await tx
            .select({
              id: employees.authId,
              authId: employees.authId,
              email: employees.email,
            })
            .from(employees)
            .where(
              and(
                inArray(employees.email, uniqueEmails),
                eq(employees.organizationId, organization.id),
              ),
            );

          const shareAccessRows = insertedDocuments.flatMap((doc) =>
            shareUsers.map((u) => {
              const share = data.shares!.find(
                (s) => s.email.toLowerCase() === u.email.toLowerCase(),
              );
              const level = share?.accessLevel ?? "view";
              return {
                accessLevel: level,
                documentId: doc.id,
                userId: u.authId,
                department: null,
                grantedBy: user.authId,
                organizationId: organization.id,
              };
            }),
          );

          if (shareAccessRows.length > 0) {
            await tx.insert(documentAccess).values(shareAccessRows);

            insertedDocuments.forEach((doc) => {
              shareUsers.forEach((u) => {
                const share = data.shares!.find(
                  (s) => s.email.toLowerCase() === u.email.toLowerCase(),
                );
                const level = share?.accessLevel ?? "view";
                shareNotifications.push({
                  userId: u.id,
                  docId: doc.id,
                  docTitle: doc.title,
                  accessLevel: level,
                });
              });
            });
          }
        }
      }

      const logsToInsert = insertedDocuments.map((doc, i) => ({
        userId: user.authId,
        documentId: doc.id,
        action: "upload",
        details: `uploaded ${data.Files[i].originalFileName}`,
        documentVersionId: insertedVersions[i].id,
        organizationId: organization.id,
      }));
      await tx.insert(documentLogs).values(logsToInsert);

      return { shareNotifications };
    });

    for (const share of shareNotifications) {
      await createNotification({
        user_id: share.userId,
        title: "Document Shared With You",
        message: `${user.name} shared "${share.docTitle}" with ${share.accessLevel} access`,
        notification_type: "message",
        reference_id: share.docId,
      });
    }

    // CRITICAL: Revalidate all dashboard and document-related pages
    revalidatePath("/documents", "layout");

    return {
      success: { reason: "Uploaded document/s successfully!" },
      error: null,
    };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message },
      };
    }

    return {
      error: {
        reason: "Couldn't upload document. Check inputs and try again!",
      },
      success: null,
    };
  }
}

interface UploadNewVersionProps {
  id: number;
  newVersionNumber: number;
  url?: string | null;
  fileSize: string;
  mimeType: string;
  pathname?: string;
}

export async function uploadNewDocumentVersion(data: UploadNewVersionProps) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  try {
    await db.transaction(async (tx) => {
      const [version] = await tx
        .insert(documentVersions)
        .values({
          versionNumber: data.newVersionNumber,
          filePath: data.url ?? "",
          mimeType: data.mimeType,
          fileSize: data.fileSize,
          uploadedBy: user.authId,
          documentId: data.id,
          organizationId: organization.id,
        })
        .returning();

      await tx
        .update(document)
        .set({
          currentVersion: data.newVersionNumber,
          currentVersionId: version.id,
          updatedAt: new Date(),
          uploadedBy: user.authId,
        })
        .where(
          and(
            eq(document.id, data.id),
            eq(document.organizationId, organization.id),
          ),
        );

      await tx.insert(documentLogs).values({
        userId: user.authId,
        documentId: data.id,
        action: "upload",
        details: `uploaded new version v${data.newVersionNumber}`,
        documentVersionId: version.id,
        organizationId: organization.id,
      });
    });

    if (data.pathname) {
      revalidatePath(data.pathname);
    }
    return {
      success: { reason: "Updated version successfully" },
      error: null,
    };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message },
      };
    }

    return {
      error: {
        reason: "Couldn't upload document. Check inputs and try again!",
      },
      success: null,
    };
  }
}
