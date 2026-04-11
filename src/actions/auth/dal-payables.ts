"use server";

import { cache } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { employees, organization as organizationTable } from "@/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * Get employee with payables access check.
 * Uses `session.activeOrganizationId` and the DB org row — not `getFullOrganization()`,
 * so data scoping matches the org switcher.
 */
export const getEmployeeForPayables = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    throw new Error("Unauthorized: No session found");
  }

  const organizationId = session.session?.activeOrganizationId;
  if (!organizationId) {
    throw new Error("Unauthorized: No active organization");
  }

  const [organization] = await db
    .select()
    .from(organizationTable)
    .where(eq(organizationTable.id, organizationId))
    .limit(1);

  if (!organization) {
    throw new Error("Unauthorized: Organization not found");
  }

  const [employee] = await db
    .select()
    .from(employees)
    .where(
      and(
        eq(employees.authId, session.user.id),
        eq(employees.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!employee) {
    throw new Error("Unauthorized: Employee record not found");
  }

  return {
    userId: session.user.id,
    employee,
    organization,
  };
});

/**
 * Check if user has payables view access
 * Allowed: Finance, HR, Admin, Procurement departments
 */
export async function requirePayablesViewAccess() {
  const { userId, employee, organization } = await getEmployeeForPayables();

  const allowedDepartments = ["finance", "hr", "admin", "procurement"];
  const allowedRoles = ["admin"];

  const hasAccess =
    allowedRoles.includes(employee.role || "") ||
    allowedDepartments.includes(employee.department?.toLowerCase() || "");

  if (!hasAccess) {
    throw new Error(
      "Unauthorized: You do not have permission to view accounts payable",
    );
  }

  return { userId, employee, organization };
}

/**
 * Check if user has payables write access
 * Allowed: Finance, Admin departments only
 */
export async function requirePayablesWriteAccess() {
  const { userId, employee, organization } = await getEmployeeForPayables();

  const allowedDepartments = ["finance", "admin"];
  const allowedRoles = ["admin"];

  const hasAccess =
    allowedRoles.includes(employee.role || "") ||
    allowedDepartments.includes(employee.department?.toLowerCase() || "");

  if (!hasAccess) {
    throw new Error(
      "Unauthorized: You do not have permission to modify accounts payable",
    );
  }

  return { userId, employee, organization };
}

/**
 * Check if user has payables approval access
 * Allowed: Finance Manager, Admin only
 */
export async function requirePayablesApprovalAccess() {
  const { userId, employee, organization } = await getEmployeeForPayables();

  const isFinanceManager =
    employee.department?.toLowerCase() === "finance" &&
    (employee.isManager || false);
  const isAdmin = employee.role === "admin";

  const hasAccess = isFinanceManager || isAdmin;

  if (!hasAccess) {
    throw new Error(
      "Unauthorized: You do not have permission to approve bills or purchase orders",
    );
  }

  return { userId, employee, organization };
}
