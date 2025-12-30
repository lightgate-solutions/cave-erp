"use server";

import { db } from "@/db";
import { eq, DrizzleQueryError, and, desc, sql } from "drizzle-orm";
import { getUser } from "../auth/dal";
import { revalidatePath } from "next/cache";
import { employees } from "@/db/schema/hr";
import {
  deductions,
  salaryDeductions,
  payrunItemDetails,
  type deductionTypeEnum,
} from "@/db/schema/payroll";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface CreateDeductionProps {
  name: string;
  type: (typeof deductionTypeEnum.enumValues)[number];
  percentage?: number;
  amount?: number;
  description?: string;
}

export async function createDeduction(
  data: CreateDeductionProps,
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
      const existing = await tx
        .select({ id: deductions.id })
        .from(deductions)
        .where(
          and(
            eq(deductions.name, data.name.trim().toLowerCase()),
            eq(deductions.organizationId, organization.id),
          ),
        )
        .limit(1);

      if (existing.length > 0) {
        return {
          error: {
            reason: "Deduction with this name already exists",
          },
          success: null,
        };
      }

      // Validation for percentage or amount
      if (
        (data.percentage === undefined || data.percentage === 0) &&
        (data.amount === undefined || data.amount === 0)
      ) {
        return {
          error: {
            reason:
              "Either percentage or amount must be provided and greater than 0",
          },
          success: null,
        };
      }

      await tx.insert(deductions).values({
        name: data.name.trim(),
        type: data.type,
        percentage: data.percentage?.toString(),
        amount: data.amount?.toString(),
        organizationId: organization.id,
        createdBy: user.id,
        updatedBy: user.id,
      });

      revalidatePath(pathname);
      return {
        success: {
          reason: "Deduction created successfully",
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
        reason: "Couldn't create deduction. Please check inputs and try again.",
      },
      success: null,
    };
  }
}

export async function getAllDeductions() {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");
  if (user.role !== "admin") throw new Error("Access Restricted");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  try {
    const allDeductions = await db
      .select({
        id: deductions.id,
        name: deductions.name,
        type: deductions.type,
        percentage: deductions.percentage,
        amount: deductions.amount,
        createdById: deductions.createdBy,
        updatedAt: deductions.updatedAt,
      })
      .from(deductions)
      .where(eq(deductions.organizationId, organization.id))
      .orderBy(desc(deductions.updatedAt));

    const creatorIds = [...new Set(allDeductions.map((d) => d.createdById))];

    const creators = await db
      .select({
        id: employees.id,
        name: employees.name,
      })
      .from(employees)
      .where(
        creatorIds.length > 0
          ? sql`${employees.id} IN (${creatorIds.join(", ")})`
          : sql`FALSE`,
      );

    const creatorsMap = creators.reduce(
      (map, creator) => {
        map[creator.id] = creator.name;
        return map;
      },
      {} as Record<number, string>,
    );

    return allDeductions.map((deduction) => ({
      ...deduction,
      createdBy: creatorsMap[deduction.createdById] || "Unknown",
    }));
  } catch (_error) {
    return [];
  }
}

export async function getAllRecurringDeductions() {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");
  if (user.role !== "admin") throw new Error("Access Restricted");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  try {
    const allDeductions = await db
      .select({
        id: deductions.id,
        name: deductions.name,
        type: deductions.type,
        percentage: deductions.percentage,
        amount: deductions.amount,
        createdById: deductions.createdBy,
        updatedAt: deductions.updatedAt,
      })
      .from(deductions)
      .where(
        and(
          eq(deductions.type, "recurring"),
          eq(deductions.organizationId, organization.id),
        ),
      )
      .orderBy(desc(deductions.updatedAt));

    const creatorIds = [...new Set(allDeductions.map((d) => d.createdById))];

    const creators = await db
      .select({
        id: employees.id,
        name: employees.name,
      })
      .from(employees)
      .where(
        creatorIds.length > 0
          ? sql`${employees.id} IN (${creatorIds.join(", ")})`
          : sql`FALSE`,
      );

    const creatorsMap = creators.reduce(
      (map, creator) => {
        map[creator.id] = creator.name;
        return map;
      },
      {} as Record<number, string>,
    );

    return allDeductions.map((deduction) => ({
      ...deduction,
      createdBy: creatorsMap[deduction.createdById] || "Unknown",
    }));
  } catch (_error) {
    return [];
  }
}

export async function getDeduction(id: number) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");
  if (user.role !== "admin") throw new Error("Access Restricted");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  try {
    const deduction = await db
      .select({
        id: deductions.id,
        name: deductions.name,
        type: deductions.type,
        percentage: deductions.percentage,
        amount: deductions.amount,
        createdById: deductions.createdBy,
        updatedAt: deductions.updatedAt,
      })
      .from(deductions)
      .where(
        and(
          eq(deductions.id, id),
          eq(deductions.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (deduction.length === 0) {
      return null;
    }

    const creator = await db
      .select({ name: employees.name })
      .from(employees)
      .where(eq(employees.id, deduction[0].createdById))
      .limit(1);

    return {
      ...deduction[0],
      createdBy: creator.length > 0 ? creator[0].name : "Unknown",
    };
  } catch (_error) {
    return null;
  }
}

export async function updateDeduction(
  id: number,
  data: Partial<CreateDeductionProps>,
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
      const existing = await tx
        .select({ id: deductions.id })
        .from(deductions)
        .where(
          and(
            eq(deductions.id, id),
            eq(deductions.organizationId, organization.id),
          ),
        )
        .limit(1);

      if (existing.length === 0) {
        return {
          error: {
            reason: "Deduction not found",
          },
          success: null,
        };
      }

      if (data.name) {
        const nameExists = await tx
          .select({ id: deductions.id })
          .from(deductions)
          .where(
            and(
              eq(deductions.name, data.name.trim().toLowerCase()),
              sql`${deductions.id} != ${id}`,
              eq(deductions.organizationId, organization.id),
            ),
          )
          .limit(1);

        if (nameExists.length > 0) {
          return {
            error: {
              reason: "Another deduction with this name already exists",
            },
            success: null,
          };
        }
      }

      await tx
        .update(deductions)
        .set({
          ...(data.name && { name: data.name.trim() }),
          ...(data.type && { type: data.type }),
          ...(data.percentage !== undefined && {
            percentage: data.percentage.toString(),
          }),
          ...(data.amount !== undefined && { amount: data.amount.toString() }),
          updatedBy: user.id,
          updatedAt: new Date(),
        })
        .where(eq(deductions.id, id));

      revalidatePath(pathname);
      return {
        success: {
          reason: "Deduction updated successfully",
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
        reason: "Couldn't update deduction. Please check inputs and try again.",
      },
      success: null,
    };
  }
}

export async function deleteDeduction(id: number, pathname: string) {
  const user = await getUser();
  if (!user) throw new Error("User not logged in");
  if (user.role !== "admin") throw new Error("Access Restricted");

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  try {
    return await db.transaction(async (tx) => {
      const existing = await tx
        .select({ id: deductions.id })
        .from(deductions)
        .where(
          and(
            eq(deductions.id, id),
            eq(deductions.organizationId, organization.id),
          ),
        )
        .limit(1);

      if (existing.length === 0) {
        return {
          error: {
            reason: "Deduction not found",
          },
          success: null,
        };
      }

      // Check if deduction is used in any salary structure
      const usedInStructure = await tx
        .select({ id: salaryDeductions.id })
        .from(salaryDeductions)
        .where(eq(salaryDeductions.deductionId, id))
        .limit(1);

      if (usedInStructure.length > 0) {
        return {
          error: {
            reason:
              "Cannot delete deduction. It is used in one or more salary structures.",
          },
          success: null,
        };
      }

      // Check if deduction is used in any payrun
      const usedInPayrun = await tx
        .select({ id: payrunItemDetails.id })
        .from(payrunItemDetails)
        .where(eq(payrunItemDetails.deductionId, id))
        .limit(1);

      if (usedInPayrun.length > 0) {
        return {
          error: {
            reason:
              "Cannot delete deduction. It has been used in payroll runs.",
          },
          success: null,
        };
      }

      await tx
        .delete(deductions)
        .where(
          and(
            eq(deductions.id, id),
            eq(deductions.organizationId, organization.id),
          ),
        );

      revalidatePath(pathname);
      return {
        success: {
          reason: "Deduction deleted successfully",
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
        reason: "Couldn't delete deduction. It might be in use.",
      },
      success: null,
    };
  }
}
