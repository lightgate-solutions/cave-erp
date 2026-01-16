"use server";
import "server-only";
import { cache } from "react";
import { requireAuth } from "./dal";
import { DEPARTMENTS, type Department } from "@/lib/permissions/types";

/**
 * Require invoicing view access (Finance, Admin, HR departments)
 * Used for read-only operations like viewing invoices, analytics
 */
export const requireInvoicingViewAccess = cache(async () => {
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
    throw new Error("Forbidden: No access to invoicing module");
  }

  return authData;
});

/**
 * Require invoicing write access (Finance and Admin departments only)
 * Used for write operations like creating/editing invoices, recording payments
 */
export const requireInvoicingWriteAccess = cache(async () => {
  const authData = await requireAuth();

  if (
    authData.role !== "admin" &&
    authData.employee.department !== DEPARTMENTS.FINANCE
  ) {
    throw new Error(
      "Forbidden: Finance or Admin department access required for invoicing operations",
    );
  }

  return authData;
});

/**
 * Alias for requireInvoicingWriteAccess for Finance-specific operations
 */
export const requireFinanceOrAdmin = requireInvoicingWriteAccess;
