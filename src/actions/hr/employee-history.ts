"use server";

import { db } from "@/db";
import { employmentHistory } from "@/db/schema/hr";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireAuth, requireHROrAdmin } from "@/actions/auth/dal";
import { toast } from "sonner";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const employmentHistorySchema = z.object({
  userId: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  department: z.string().nullable(),
  employmentType: z
    .enum(["Full-time", "Part-time", "Contract", "Intern"])
    .nullable(),
});

export type EmploymentHistoryFormValues = z.infer<
  typeof employmentHistorySchema
>;

export async function getEmployeeHistory(userId: string) {
  await requireAuth();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return [];
  }

  try {
    const history = await db.query.employmentHistory.findMany({
      where: and(
        eq(employmentHistory.userId, userId),
        eq(employmentHistory.organizationId, organization.id),
      ),
      orderBy: (history) => [history.startDate],
    });

    return history;
  } catch (_error) {
    toast.error("Error fetching employee history:");
  }
}

export async function addEmploymentHistory(data: EmploymentHistoryFormValues) {
  await requireHROrAdmin();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return { success: false, error: "Organization not found" };
  }

  try {
    await db.insert(employmentHistory).values({
      userId: data.userId,
      startDate: data.startDate
        ? new Date(data.startDate).toDateString()
        : null,
      endDate: data.endDate ? new Date(data.endDate).toDateString() : null,
      department: data.department || null,
      employmentType: data.employmentType || null,
      organizationId: organization.id,
    });

    revalidatePath(`/hr/employees`);
    return { success: true };
  } catch (_error) {
    return { success: false, error: "Failed to add employment history" };
  }
}

export async function updateEmploymentHistory(
  id: number,
  data: EmploymentHistoryFormValues,
) {
  await requireHROrAdmin();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return { success: false, error: "Organization not found" };
  }

  try {
    await db
      .update(employmentHistory)
      .set({
        startDate: data.startDate
          ? new Date(data.startDate).toDateString()
          : null,
        endDate: data.endDate ? new Date(data.endDate).toDateString() : null,
        department: data.department || null,
        employmentType: data.employmentType || null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(employmentHistory.id, id),
          eq(employmentHistory.organizationId, organization.id),
        ),
      );

    revalidatePath(`/hr/employees`);
    return { success: true };
  } catch (_error) {
    return { success: false, error: "Failed to update employment history" };
  }
}

// Delete an employment history record
export async function deleteEmploymentHistory(id: number) {
  await requireHROrAdmin();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return { success: false, error: "Organization not found" };
  }

  try {
    await db
      .delete(employmentHistory)
      .where(
        and(
          eq(employmentHistory.id, id),
          eq(employmentHistory.organizationId, organization.id),
        ),
      );

    revalidatePath(`/hr/employees`);
    return { success: true };
  } catch (_error) {
    return { success: false, error: "Failed to delete employment history" };
  }
}
