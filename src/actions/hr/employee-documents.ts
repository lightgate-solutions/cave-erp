"use server";

import { db } from "@/db";
import { employees, employeesDocuments } from "@/db/schema";
import { DrizzleQueryError, eq, and } from "drizzle-orm";
import { getUser } from "../auth/dal";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface UploadEmployeeDocumentProps {
  employeeId: number;
  documentType: string;
  documentName: string;
  filePath: string;
  fileSize: string;
  mimeType: string;
  pathname?: string;
}

export async function uploadEmployeeDocumentAction(
  data: UploadEmployeeDocumentProps,
) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  try {
    await db.transaction(async (tx) => {
      // Verify the employee exists and belongs to the same organization
      const [employee] = await tx
        .select({ id: employees.id, department: employees.department })
        .from(employees)
        .where(
          and(
            eq(employees.id, data.employeeId),
            eq(employees.organizationId, organization.id),
          ),
        )
        .limit(1);

      if (!employee) {
        throw new Error(`Employee with id ${data.employeeId} not found`);
      }

      // Insert the document
      await tx.insert(employeesDocuments).values({
        employeeId: data.employeeId,
        documentType: data.documentType,
        documentName: data.documentName,
        filePath: data.filePath,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        uploadedBy: user.id,
        department: employee.department,
        organizationId: organization.id,
      });
    });

    if (data.pathname) {
      revalidatePath(data.pathname);
    }

    return {
      success: { reason: "Employee document uploaded successfully" },
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

export async function getEmployeeDocuments(employeeId: number) {
  try {
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

    const documents = await db
      .select()
      .from(employeesDocuments)
      .where(
        and(
          eq(employeesDocuments.employeeId, employeeId),
          eq(employeesDocuments.organizationId, organization.id),
        ),
      )
      .orderBy(employeesDocuments.createdAt);

    return {
      success: true,
      data: documents,
      error: null,
    };
  } catch (_err) {
    return {
      success: false,
      data: null,
      error: "Failed to fetch employee documents",
    };
  }
}

export async function deleteEmployeeDocument(
  documentId: number,
  pathname?: string,
) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  try {
    await db
      .delete(employeesDocuments)
      .where(
        and(
          eq(employeesDocuments.id, documentId),
          eq(employeesDocuments.organizationId, organization.id),
        ),
      );

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
        error: { reason: err.cause?.message },
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
