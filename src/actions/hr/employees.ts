/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
// biome-ignore-all lint/style/noNonNullAssertion: <>

"use server";

import { db } from "@/db";
import {
  documentFolders,
  employees,
  employmentHistory,
  notification_preferences,
  user,
} from "@/db/schema";
import { DrizzleQueryError, eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth, requireHROrAdmin } from "@/actions/auth/dal";
import { APIError } from "better-auth";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getAllEmployees() {
  await requireAuth();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return [];
  }

  return await db
    .select({
      id: employees.authId,
      email: employees.email,
      role: employees.role,
      name: employees.name,
      department: employees.department,
      employmentType: employees.employmentType,
      phone: employees.phone,
      isManager: employees.isManager,
      dateOfBirth: employees.dateOfBirth,
      staffNumber: employees.staffNumber,
      status: employees.status,
      maritalStatus: employees.maritalStatus,
      startDate: employmentHistory.startDate,
    })
    .from(employees)
    .leftJoin(employmentHistory, eq(employees.authId, employmentHistory.userId))
    .where(eq(employees.organizationId, organization.id));
}

export async function getEmployee(userId: string) {
  await requireAuth();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return null;
  }

  return await db
    .select()
    .from(employees)
    .where(
      and(
        eq(employees.authId, userId),
        eq(employees.organizationId, organization.id),
      ),
    )
    .limit(1)
    .then((res) => res[0]);
}

export async function updateEmployee(
  userId: string,
  updates: Partial<{
    name: string;
    email: string;
    phone: string;
    staffNumber: string;
    isManager: boolean;
    department: string;
    managerId: string | null;
    dateOfBirth: string;
    address: string;
    maritalStatus: string;
    employmentType: string;
  }>,
) {
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

  const processedUpdates: any = { ...updates, updatedAt: new Date() };

  for (const key in processedUpdates) {
    if (processedUpdates[key] === "") {
      processedUpdates[key] = null;
    }
  }
  try {
    await db.transaction(async (tx) => {
      const [emp] = await tx
        .update(employees)
        .set(processedUpdates)
        .where(
          and(
            eq(employees.authId, userId),
            eq(employees.organizationId, organization.id),
          ),
        )
        .returning();

      await tx
        .update(user)
        .set({ name: updates.name, email: updates.email })
        .where(eq(user.id, emp.authId));
    });

    revalidatePath("/hr/employees");
    return {
      success: { reason: "Employee updated successfully" },
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
        reason: "Couldn't update employee. Check inputs and try again!",
      },
      success: null,
    };
  }
}

export async function createEmployee(data: {
  name: string;
  email: string;
  authId: string;
  role: "user" | "admin";
  organizationId?: string; // Optional: pass directly when creating new org
  data?: Record<string, any> & {
    phone?: string;
    staffNumber?: string;
    department?: string;
    managerId?: string | number | null;
    dateOfBirth?: string | Date | null;
    address?: string;
    maritalStatus?: "Single" | "Married" | "Divorced" | "Widowed";
    employmentType?: "Full-time" | "Part-time" | "Contract" | "Intern";
  };
  isManager: boolean;
}) {
  let orgId = data.organizationId;

  // If organizationId not provided, get from session
  if (!orgId) {
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return {
        error: { reason: "Organization not found" },
        success: null,
        data: null,
      };
    }
    orgId = organization.id;
  }

  const { ...userData } = data;

  try {
    const parsedManagerId =
      userData.data?.managerId === undefined ||
      userData.data?.managerId === null ||
      userData.data?.managerId === ""
        ? null
        : String(userData.data.managerId);

    const dobValue = userData.data?.dateOfBirth
      ? typeof userData.data.dateOfBirth === "string"
        ? userData.data.dateOfBirth
        : userData.data.dateOfBirth.toISOString().split("T")[0]
      : null;

    await db.transaction(async (tx) => {
      const [emp] = await tx
        .insert(employees)
        .values({
          name: data.name,
          email: data.email,
          authId: data.authId,
          phone: userData.data?.phone ?? "",
          staffNumber: userData.data?.staffNumber ?? "",
          role: data.role,
          isManager: data.isManager,
          status: "active",
          department:
            (userData.data?.department as
              | "hr"
              | "admin"
              | "finance"
              | "operations") ?? "operations",
          managerId: parsedManagerId,
          dateOfBirth: dobValue,
          documentCount: 0,
          address: userData.data?.address ?? null,
          maritalStatus: userData.data?.maritalStatus ?? null,
          employmentType: userData.data?.employmentType ?? null,
          organizationId: orgId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      await tx.insert(documentFolders).values({
        name: "personal",
        createdBy: emp.authId,
        department: emp.department,
        root: true,
        status: "active",
        public: false,
        departmental: false,
        organizationId: orgId,
      });

      await db
        .update(user)
        .set({ role: data.role })
        .where(eq(user.id, data.authId));

      await tx.insert(notification_preferences).values({
        user_id: emp.authId,
        email_notifications: true,
        in_app_notifications: true,
        email_on_in_app_message: true,
        email_on_task_notification: false,
        email_on_general_notification: false,
        notify_on_message: true,
        organizationId: orgId,
      });
    });

    return {
      success: { reason: "User created successfully" },
      error: null,
      data: null,
    };
  } catch (err) {
    if (err instanceof APIError) {
      return {
        error: { reason: err.message },
        success: null,
        data: null,
      };
    }

    return {
      error: { reason: "Couldn't create user. Try again!" },
      success: null,
      data: null,
    };
  }
}
