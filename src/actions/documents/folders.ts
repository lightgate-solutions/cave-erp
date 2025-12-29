"use server";

import { db } from "@/db";
import {
  document,
  documentAccess,
  documentComments,
  documentFolders,
  documentLogs,
  documentSharedLinks,
  documentTags,
  documentVersions,
} from "@/db/schema";
import { and, DrizzleQueryError, eq, inArray, isNull, or } from "drizzle-orm";
import { getUser } from "../auth/dal";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface CreateFoldersProps {
  name: string;
  parentId?: number | null;
  parent?: string;
  public: boolean;
  departmental: boolean;
}

export async function createFolder(data: CreateFoldersProps, pathname: string) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  if (data.name.trim().toLowerCase() === "public") {
    return {
      error: {
        reason: "Couldn't create folder. Public folder already exists",
      },
      success: null,
    };
  }

  if (data.name.trim().toLowerCase() === user.department.toLowerCase()) {
    return {
      error: {
        reason: "Couldn't create folder. Name is the same as department folder",
      },
      success: null,
    };
  }

  try {
    return await db.transaction(async (tx) => {
      let parentIdToUse: number | null = null;
      if (typeof data.parentId === "number") {
        parentIdToUse = data.parentId;
      } else if (data.parent) {
        const parentRow = await tx
          .select({ id: documentFolders.id })
          .from(documentFolders)
          .where(
            and(
              eq(documentFolders.name, data.parent),
              eq(documentFolders.createdBy, user.id),
              eq(documentFolders.organizationId, organization.id),
            ),
          )
          .limit(1);
        if (parentRow.length === 0) {
          return {
            error: { reason: "Selected parent folder not found" },
            success: null,
          };
        }
        parentIdToUse = parentRow[0].id;
      }
      const existing = await tx
        .select({ name: documentFolders.name })
        .from(documentFolders)
        .where(
          and(
            eq(documentFolders.name, data.name),
            eq(documentFolders.createdBy, user.id),
            eq(documentFolders.organizationId, organization.id),
            parentIdToUse !== null
              ? eq(documentFolders.parentId, parentIdToUse)
              : isNull(documentFolders.parentId),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        return {
          error: {
            reason: "Folder name already exists",
          },
          success: null,
        };
      }

      await tx.insert(documentFolders).values({
        name: data.name.trim().toLowerCase(),
        parentId: parentIdToUse,
        public: data.public,
        root: parentIdToUse === null,
        departmental: data.departmental,
        department: user.department,
        createdBy: user.id,
        organizationId: organization.id,
      });

      revalidatePath(pathname);
      return {
        success: {
          reason: "Folder created successfully",
        },
        error: null,
      };
    });
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message },
      };
    }

    return {
      error: {
        reason: "Couldn't create folder. Check inputs and try again!",
      },
      success: null,
    };
  }
}

export async function getFoldersNames(ids: string[]) {
  if (!ids || ids.length === 0) return [];

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  const numericIds = ids
    .map((id) => Number(id))
    .filter((id) => !Number.isNaN(id));

  const folders = await db
    .select({
      id: documentFolders.id,
      name: documentFolders.name,
    })
    .from(documentFolders)
    .where(
      and(
        inArray(documentFolders.id, numericIds),
        eq(documentFolders.organizationId, organization.id),
      ),
    );

  return numericIds.map((id) => folders.find((f) => f.id === id)?.name || null);
}

export async function getSubFolders(id: number) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  const folders = await db
    .select({
      id: documentFolders.id,
      name: documentFolders.name,
      updatedAt: documentFolders.updatedAt,
    })
    .from(documentFolders)
    .where(
      and(
        eq(documentFolders.parentId, id),
        eq(documentFolders.status, "active"),
        eq(documentFolders.organizationId, organization.id),
        or(
          eq(documentFolders.createdBy, user.id),
          eq(documentFolders.public, true),
          and(
            eq(documentFolders.departmental, true),
            eq(documentFolders.department, user.department),
          ),
        ),
      ),
    );

  return folders;
}

export async function deleteFolder(folderId: number, pathname: string) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  const organizationId = organization.id;

  try {
    return await db.transaction(async (tx) => {
      if (user.role !== "admin") {
        const folder = await tx
          .select()
          .from(documentFolders)
          .where(
            and(
              eq(documentFolders.id, folderId),
              eq(documentFolders.createdBy, user.id),
              eq(documentFolders.organizationId, organizationId),
            ),
          )
          .limit(1);

        if (folder.length === 0) {
          return {
            error: { reason: "User doesn't have the proper permissions" },
            success: null,
          };
        }
      }

      async function getAllSubfolderIds(
        currentFolderId: number,
      ): Promise<number[]> {
        const subFolders = await tx
          .select({ id: documentFolders.id })
          .from(documentFolders)
          .where(
            and(
              eq(documentFolders.parentId, currentFolderId),
              eq(documentFolders.organizationId, organizationId),
            ),
          );

        const subIds = subFolders.map((f) => f.id);
        for (const subId of subIds) {
          const nested = await getAllSubfolderIds(subId);
          subIds.push(...nested);
        }
        return subIds;
      }

      const allFolderIds = [folderId, ...(await getAllSubfolderIds(folderId))];

      const docs = await tx
        .select({ id: document.id })
        .from(document)
        .where(
          and(
            inArray(document.folderId, allFolderIds),
            eq(document.organizationId, organizationId),
          ),
        );

      const docIds = docs.map((d) => d.id);

      if (docIds.length > 0) {
        await tx
          .delete(documentVersions)
          .where(
            and(
              inArray(documentVersions.documentId, docIds),
              eq(documentVersions.organizationId, organizationId),
            ),
          );
        await tx
          .delete(documentTags)
          .where(
            and(
              inArray(documentTags.documentId, docIds),
              eq(documentTags.organizationId, organizationId),
            ),
          );
        await tx
          .delete(documentAccess)
          .where(
            and(
              inArray(documentAccess.documentId, docIds),
              eq(documentAccess.organizationId, organizationId),
            ),
          );
        await tx
          .delete(documentLogs)
          .where(
            and(
              inArray(documentLogs.documentId, docIds),
              eq(documentLogs.organizationId, organizationId),
            ),
          );
        await tx
          .delete(documentSharedLinks)
          .where(
            and(
              inArray(documentSharedLinks.documentId, docIds),
              eq(documentSharedLinks.organizationId, organizationId),
            ),
          );
        await tx
          .delete(documentComments)
          .where(
            and(
              inArray(documentComments.documentId, docIds),
              eq(documentComments.organizationId, organizationId),
            ),
          );

        await tx
          .delete(document)
          .where(
            and(
              inArray(document.id, docIds),
              eq(document.organizationId, organizationId),
            ),
          );
      }

      await tx
        .delete(documentFolders)
        .where(
          and(
            inArray(documentFolders.id, allFolderIds),
            eq(documentFolders.organizationId, organizationId),
          ),
        );

      revalidatePath(pathname);
      return {
        success: { reason: "Folder and related data deleted successfully" },
        error: null,
      };
    });
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error occurred" },
      };
    }

    return {
      error: { reason: "Couldn't delete folder. Check inputs and try again!" },
      success: null,
    };
  }
}

export async function archiveFolder(folderId: number, pathname: string) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  const organizationId = organization.id;

  try {
    return await db.transaction(async (tx) => {
      if (user.role !== "admin") {
        const folder = await tx
          .select()
          .from(documentFolders)
          .where(
            and(
              eq(documentFolders.id, folderId),
              eq(documentFolders.createdBy, user.id),
              eq(documentFolders.organizationId, organizationId),
            ),
          )
          .limit(1);

        if (folder.length === 0) {
          return {
            error: { reason: "User doesn't have the proper permissions" },
            success: null,
          };
        }
      }

      async function getAllSubfolderIds(
        currentFolderId: number,
      ): Promise<number[]> {
        const subFolders = await tx
          .select({ id: documentFolders.id })
          .from(documentFolders)
          .where(
            and(
              eq(documentFolders.parentId, currentFolderId),
              eq(documentFolders.organizationId, organizationId),
            ),
          );

        const subIds = subFolders.map((f) => f.id);
        for (const subId of subIds) {
          const nested = await getAllSubfolderIds(subId);
          subIds.push(...nested);
        }
        return subIds;
      }

      const allFolderIds = [folderId, ...(await getAllSubfolderIds(folderId))];

      const docs = await tx
        .select({ id: document.id })
        .from(document)
        .where(
          and(
            inArray(document.folderId, allFolderIds),
            eq(document.organizationId, organizationId),
          ),
        );

      const docIds = docs.map((d) => d.id);

      if (docIds.length > 0) {
        await tx
          .update(document)
          .set({ status: "archived", updatedAt: new Date() })
          .where(
            and(
              inArray(document.id, docIds),
              eq(document.organizationId, organizationId),
            ),
          );
      }

      await tx
        .update(documentFolders)
        .set({ status: "archived", updatedAt: new Date() })
        .where(
          and(
            inArray(documentFolders.id, allFolderIds),
            eq(documentFolders.organizationId, organizationId),
          ),
        );

      revalidatePath(pathname);
      return {
        success: {
          reason: "Folder and all related content archived successfully",
        },
        error: null,
      };
    });
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error occurred" },
      };
    }

    return {
      error: { reason: "Couldn't archive folder. Check inputs and try again!" },
      success: null,
    };
  }
}
