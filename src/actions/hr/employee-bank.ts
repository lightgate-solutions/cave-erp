"use server";

import { db } from "@/db";
import { employeesBank } from "@/db/schema/hr";
import { eq, and } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { requireAuth, requireHROrAdmin } from "@/actions/auth/dal";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const bankDetailsSchema = z.object({
  userId: z.string(),
  bankName: z.string().min(2, "Bank name is required"),
  accountName: z.string().min(2, "Account name is required"),
  accountNumber: z.string().min(5, "Valid account number is required"),
});

export type BankDetailsFormValues = z.infer<typeof bankDetailsSchema>;

export async function getEmployeeBankDetails(userId: string) {
  await requireAuth();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return null;
  }

  try {
    const bankDetails = await db.query.employeesBank.findFirst({
      where: and(
        eq(employeesBank.userId, userId),
        eq(employeesBank.organizationId, organization.id),
      ),
    });

    return bankDetails ?? null;
  } catch (_error) {
    throw new Error("Failed to fetch employee bank details");
  }
}

export async function saveBankDetails(data: BankDetailsFormValues) {
  await requireHROrAdmin();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return {
      success: false,
      message: "Organization not found",
    };
  }

  try {
    const { userId, bankName, accountName, accountNumber } =
      bankDetailsSchema.parse(data);

    // Check if bank details already exist for this employee
    const existingDetails = await db.query.employeesBank.findFirst({
      where: and(
        eq(employeesBank.userId, userId),
        eq(employeesBank.organizationId, organization.id),
      ),
    });

    if (existingDetails) {
      // Update existing record
      await db
        .update(employeesBank)
        .set({
          bankName,
          accountName,
          accountNumber,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(employeesBank.id, existingDetails.id),
            eq(employeesBank.organizationId, organization.id),
          ),
        );
    } else {
      // Create new record
      await db.insert(employeesBank).values({
        userId,
        bankName,
        accountName,
        accountNumber,
        organizationId: organization.id,
      });
    }

    revalidateTag(`employee-bank-${userId}`);
    return { success: true, message: "Bank details saved successfully" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Invalid bank details",
        errors: error.message,
      };
    }
    return { success: false, message: "Failed to save bank details" };
  }
}

export async function deleteBankDetails(userId: string) {
  await requireHROrAdmin();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return {
      success: false,
      message: "Organization not found",
    };
  }

  try {
    await db
      .delete(employeesBank)
      .where(
        and(
          eq(employeesBank.userId, userId),
          eq(employeesBank.organizationId, organization.id),
        ),
      );

    revalidateTag(`employee-bank-${userId}`);
    return { success: true, message: "Bank details deleted successfully" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Failed to delete",
      };
    }
    return { success: false, message: "Failed to delete bank details" };
  }
}
