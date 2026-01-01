"use server";

import { db } from "@/db";
import { eq, DrizzleQueryError, and, desc, sql, isNull } from "drizzle-orm";
import { getUser } from "../auth/dal";
import { revalidatePath } from "next/cache";
import { employees } from "@/db/schema/hr";
import {
  employeeAllowances,
  allowances as allowancesSchema,
} from "@/db/schema/payroll";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Get all allowances for a specific employee
export async function getEmployeeAllowances(userId: string) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");
  if (user.role !== "admin") throw new Error("Access Restricted");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  try {
    const result = await db
      .select({
        id: employeeAllowances.id,
        userId: employeeAllowances.userId,
        allowanceId: employeeAllowances.allowanceId,
        effectiveFrom: employeeAllowances.effectiveFrom,
        effectiveTo: employeeAllowances.effectiveTo,
        allowanceName: allowancesSchema.name,
        allowanceType: allowancesSchema.type,
        amount: allowancesSchema.amount,
        percentage: allowancesSchema.percentage,
        taxable: allowancesSchema.taxable,
        taxPercentage: allowancesSchema.taxPercentage,
        description: allowancesSchema.description,
      })
      .from(employeeAllowances)
      .innerJoin(
        allowancesSchema,
        eq(employeeAllowances.allowanceId, allowancesSchema.id),
      )
      .where(
        and(
          eq(employeeAllowances.userId, userId),
          eq(employeeAllowances.organizationId, organization.id),
        ),
      )
      .orderBy(desc(employeeAllowances.effectiveFrom));

    return result;
  } catch (_error) {
    return [];
  }
}

// Get active allowances for a specific employee
export async function getActiveEmployeeAllowances(userId: string) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");
  if (user.role !== "admin") throw new Error("Access Restricted");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  try {
    const result = await db
      .select({
        id: employeeAllowances.id,
        userId: employeeAllowances.userId,
        allowanceId: employeeAllowances.allowanceId,
        effectiveFrom: employeeAllowances.effectiveFrom,
        allowanceName: allowancesSchema.name,
        allowanceType: allowancesSchema.type,
        amount: allowancesSchema.amount,
        percentage: allowancesSchema.percentage,
        taxable: allowancesSchema.taxable,
        taxPercentage: allowancesSchema.taxPercentage,
        description: allowancesSchema.description,
      })
      .from(employeeAllowances)
      .innerJoin(
        allowancesSchema,
        eq(employeeAllowances.allowanceId, allowancesSchema.id),
      )
      .where(
        and(
          eq(employeeAllowances.userId, userId),
          isNull(employeeAllowances.effectiveTo),
          eq(employeeAllowances.organizationId, organization.id),
        ),
      )
      .orderBy(desc(employeeAllowances.effectiveFrom));

    return result;
  } catch (_error) {
    return [];
  }
}

// Get allowances that can be assigned to an employee
export async function getAvailableAllowancesForEmployee(userId: string) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");
  if (user.role !== "admin") throw new Error("Access Restricted");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  try {
    // Now get all allowances that are not assigned to this employee
    const availableAllowances = await db
      .select({
        id: allowancesSchema.id,
        name: allowancesSchema.name,
        type: allowancesSchema.type,
        percentage: allowancesSchema.percentage,
        amount: allowancesSchema.amount,
        taxable: allowancesSchema.taxable,
        taxPercentage: allowancesSchema.taxPercentage,
        description: allowancesSchema.description,
      })
      .from(allowancesSchema)
      .where(
        and(
          eq(allowancesSchema.organizationId, organization.id),
          sql`${allowancesSchema.id} NOT IN (
            SELECT ${employeeAllowances.allowanceId}
            FROM ${employeeAllowances}
            WHERE ${employeeAllowances.userId} = ${userId}
            AND ${employeeAllowances.effectiveTo} IS NULL
            AND ${employeeAllowances.organizationId} = ${organization.id}
          )`,
        ),
      )
      .orderBy(allowancesSchema.name);

    return availableAllowances;
  } catch (_error) {
    return [];
  }
}

// Add allowance to employee
export async function addAllowanceToEmployee(
  userId: string,
  allowanceId: number,
  effectiveFrom: Date = new Date(),
  pathname: string,
) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");
  if (user.role !== "admin") throw new Error("Access Restricted");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  try {
    return await db.transaction(async (tx) => {
      // Check if employee exists
      const employee = await tx
        .select({ id: employees.id, name: employees.name })
        .from(employees)
        .where(eq(employees.authId, userId))
        .limit(1);

      if (employee.length === 0) {
        return {
          error: { reason: "Employee not found" },
          success: null,
        };
      }

      // Check if allowance exists
      const allowance = await tx
        .select({ id: allowancesSchema.id, name: allowancesSchema.name })
        .from(allowancesSchema)
        .where(
          and(
            eq(allowancesSchema.id, allowanceId),
            eq(allowancesSchema.organizationId, organization.id),
          ),
        )
        .limit(1);

      if (allowance.length === 0) {
        return {
          error: { reason: "Allowance not found" },
          success: null,
        };
      }

      // Check if the allowance is already assigned to the employee
      const existing = await tx
        .select({ id: employeeAllowances.id })
        .from(employeeAllowances)
        .where(
          and(
            eq(employeeAllowances.userId, userId),
            eq(employeeAllowances.allowanceId, allowanceId),
            isNull(employeeAllowances.effectiveTo),
            eq(employeeAllowances.organizationId, organization.id),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        return {
          error: {
            reason: "This allowance is already assigned to the employee",
          },
          success: null,
        };
      }

      // Add the allowance to the employee
      await tx.insert(employeeAllowances).values({
        userId,
        allowanceId,
        organizationId: organization.id,
        effectiveFrom,
      });

      revalidatePath(pathname);
      return {
        success: {
          reason: `${allowance[0].name} allowance successfully assigned to ${employee[0].name}`,
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
      error: {
        reason:
          "Couldn't assign allowance to employee. Please try again later.",
      },
      success: null,
    };
  }
}

// Remove allowance from employee
export async function removeAllowanceFromEmployee(
  employeeAllowanceId: number,
  pathname: string,
) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");
  if (user.role !== "admin") throw new Error("Access Restricted");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  try {
    return await db.transaction(async (tx) => {
      // Check if the relationship exists
      const relationship = await tx
        .select({
          id: employeeAllowances.id,
          userId: employeeAllowances.userId,
          allowanceId: employeeAllowances.allowanceId,
        })
        .from(employeeAllowances)
        .where(
          and(
            eq(employeeAllowances.id, employeeAllowanceId),
            eq(employeeAllowances.organizationId, organization.id),
          ),
        )
        .limit(1);

      if (relationship.length === 0) {
        return {
          error: { reason: "Employee allowance not found" },
          success: null,
        };
      }

      // Get employee and allowance names for the success message
      const employee = await tx
        .select({ name: employees.name })
        .from(employees)
        .where(eq(employees.authId, relationship[0].userId))
        .limit(1);

      const allowance = await tx
        .select({ name: allowancesSchema.name })
        .from(allowancesSchema)
        .where(eq(allowancesSchema.id, relationship[0].allowanceId))
        .limit(1);

      // Remove the allowance from the employee by setting effectiveTo to now
      await tx
        .update(employeeAllowances)
        .set({
          effectiveTo: new Date(),
        })
        .where(eq(employeeAllowances.id, employeeAllowanceId));

      revalidatePath(pathname);
      return {
        success: {
          reason: `${allowance[0].name} allowance removed from ${employee[0].name}`,
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
      error: {
        reason:
          "Couldn't remove allowance from employee. Please try again later.",
      },
      success: null,
    };
  }
}
