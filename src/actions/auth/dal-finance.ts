"use server";
import "server-only";
import { cache } from "react";
import { requireAuth } from "./dal";
import { DEPARTMENTS, type Department } from "@/lib/permissions/types";

/**
 * Require finance view access (Finance, Admin, HR departments)
 * Used for read-only operations like viewing bills, analytics
 */
export const requireFinanceViewAccess = cache(async () => {
  const authData = await requireAuth();

  const allowedDepartments: Department[] = [
    DEPARTMENTS.ADMIN,
    DEPARTMENTS.FINANCE,
    DEPARTMENTS.HR,
  ];

  if (
    authData.role !== "admin" &&
    !allowedDepartments.includes(authData.employee.department)
  ) {
    throw new Error("Forbidden: No access to finance module");
  }

  return authData;
});

/**
 * Require finance write access (Finance and Admin departments only)
 * Used for write operations like creating/editing bills, recording payments
 */
export const requireFinanceWriteAccess = cache(async () => {
  const authData = await requireAuth();

  if (
    authData.role !== "admin" &&
    authData.employee.department !== DEPARTMENTS.FINANCE
  ) {
    throw new Error(
      "Forbidden: Finance or Admin department access required for finance operations",
    );
  }

  return authData;
});
