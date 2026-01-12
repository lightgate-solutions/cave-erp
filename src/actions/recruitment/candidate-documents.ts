"use server";

import { db } from "@/db";
import {
  candidateDocuments,
  candidates,
  recruitmentActivityLog,
} from "@/db/schema";
import { DrizzleQueryError, eq, and, desc } from "drizzle-orm";
import { requireHROrAdmin } from "../auth/dal";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export type CandidateDocumentType =
  | "Resume"
  | "Cover Letter"
  | "Portfolio"
  | "Certificate"
  | "ID Proof"
  | "Other";

interface UploadCandidateDocumentProps {
  candidateId: number;
  documentType: CandidateDocumentType;
  documentName: string;
  originalFileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  pathname?: string;
}

/**
 * Upload a document for a candidate
 */
export async function uploadCandidateDocument(
  data: UploadCandidateDocumentProps,
) {
  try {
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

    await db.transaction(async (tx) => {
      // Verify the candidate exists and belongs to the same organization
      const [candidate] = await tx
        .select({ id: candidates.id, name: candidates.name })
        .from(candidates)
        .where(
          and(
            eq(candidates.id, data.candidateId),
            eq(candidates.organizationId, organization.id),
          ),
        )
        .limit(1);

      if (!candidate) {
        throw new Error(`Candidate not found`);
      }

      // Insert the document
      await tx.insert(candidateDocuments).values({
        candidateId: data.candidateId,
        documentType: data.documentType,
        documentName: data.documentName,
        originalFileName: data.originalFileName,
        filePath: data.filePath,
        fileSize: data.fileSize.toString(),
        mimeType: data.mimeType,
        uploadedBy: employee.userId,
        organizationId: organization.id,
      });

      // Log activity
      await tx.insert(recruitmentActivityLog).values({
        candidateId: data.candidateId,
        activityType: "Document Uploaded",
        description: `${data.documentType} uploaded: ${data.documentName}`,
        performedBy: employee.userId,
        metadata: {
          documentType: data.documentType,
          documentName: data.documentName,
          fileSize: data.fileSize,
        },
        organizationId: organization.id,
      });
    });

    if (data.pathname) {
      revalidatePath(data.pathname);
    }

    return {
      success: { reason: "Document uploaded successfully" },
      error: null,
    };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error" },
      };
    }

    if (err instanceof Error) {
      return {
        success: null,
        error: { reason: err.message },
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

/**
 * Get all documents for a candidate
 */
export async function getCandidateDocuments(candidateId: number) {
  try {
    await requireHROrAdmin();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: false,
        data: null,
        error: "Organization not found",
      };
    }

    // Verify candidate belongs to organization
    const [candidate] = await db
      .select({ id: candidates.id })
      .from(candidates)
      .where(
        and(
          eq(candidates.id, candidateId),
          eq(candidates.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!candidate) {
      return {
        success: false,
        data: null,
        error: "Candidate not found",
      };
    }

    const documents = await db
      .select()
      .from(candidateDocuments)
      .where(
        and(
          eq(candidateDocuments.candidateId, candidateId),
          eq(candidateDocuments.organizationId, organization.id),
        ),
      )
      .orderBy(desc(candidateDocuments.createdAt));

    return {
      success: true,
      data: documents,
      error: null,
    };
  } catch (_err) {
    return {
      success: false,
      data: null,
      error: "Failed to fetch candidate documents",
    };
  }
}

/**
 * Delete a candidate document
 */
export async function deleteCandidateDocument(
  documentId: number,
  pathname?: string,
) {
  try {
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

    // Get document details before deleting (for logging)
    const [document] = await db
      .select()
      .from(candidateDocuments)
      .where(
        and(
          eq(candidateDocuments.id, documentId),
          eq(candidateDocuments.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!document) {
      return {
        success: null,
        error: { reason: "Document not found" },
      };
    }

    await db.transaction(async (tx) => {
      // Delete the document
      await tx
        .delete(candidateDocuments)
        .where(
          and(
            eq(candidateDocuments.id, documentId),
            eq(candidateDocuments.organizationId, organization.id),
          ),
        );

      // Log activity
      await tx.insert(recruitmentActivityLog).values({
        candidateId: document.candidateId,
        activityType: "Note Added", // Using existing enum value since there's no "Document Deleted"
        description: `Document deleted: ${document.documentName} (${document.documentType})`,
        performedBy: employee.userId,
        metadata: {
          documentId,
          documentType: document.documentType,
          documentName: document.documentName,
        },
        organizationId: organization.id,
      });
    });

    if (pathname) {
      revalidatePath(pathname);
    }

    return {
      success: { reason: "Document deleted successfully" },
      error: null,
    };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error" },
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

/**
 * Get a specific document (for generating download URL)
 */
export async function getCandidateDocument(documentId: number) {
  try {
    await requireHROrAdmin();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return null;
    }

    const [document] = await db
      .select()
      .from(candidateDocuments)
      .where(
        and(
          eq(candidateDocuments.id, documentId),
          eq(candidateDocuments.organizationId, organization.id),
        ),
      )
      .limit(1);

    return document || null;
  } catch (_err) {
    return null;
  }
}
