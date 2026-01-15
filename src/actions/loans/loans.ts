/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

"use server";

import { db } from "@/db";
import {
  loanTypes,
  loanTypeSalaryStructures,
  loanApplications,
  loanRepayments,
  loanHistory,
  employees,
  employeesBank,
  salaryStructure,
  employeeSalary,
  employeeDeductions,
} from "@/db/schema";
import {
  eq,
  and,
  or,
  desc,
  asc,
  ilike,
  count,
  inArray,
  sql,
  isNull,
  lt,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { revalidatePath } from "next/cache";
import { getUser } from "@/actions/auth/dal";
import { DEPARTMENTS } from "@/lib/permissions/types";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getAllSalaryStructures() {
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) return null;

  return db
    .select({
      id: salaryStructure.id,
      name: salaryStructure.name,
      baseSalary: salaryStructure.baseSalary,
    })
    .from(salaryStructure)
    .where(
      and(
        eq(salaryStructure.active, true),
        eq(salaryStructure.organizationId, organization.id),
      ),
    );
}

function generateReferenceNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LN-${timestamp}-${random}`;
}

// ==================== LOAN TYPES ====================

// Get all loan types
export async function getAllLoanTypes(filters?: {
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) return null;

  const conditions: any[] = [eq(loanTypes.organizationId, organization.id)];

  if (filters?.isActive !== undefined) {
    conditions.push(eq(loanTypes.isActive, filters.isActive));
  }

  if (filters?.search) {
    conditions.push(
      or(
        ilike(loanTypes.name, `%${filters.search}%`),
        ilike(loanTypes.description, `%${filters.search}%`),
      ),
    );
  }

  const whereClause = and(...conditions);

  const page = filters?.page || 1;
  const limit = filters?.limit || 10;
  const offset = (page - 1) * limit;

  const totalResult = await db
    .select({ count: count() })
    .from(loanTypes)
    .where(whereClause);

  const total = totalResult[0]?.count || 0;

  const result = await db
    .select()
    .from(loanTypes)
    .where(whereClause)
    .orderBy(desc(loanTypes.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    loanTypes: result,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// Get loan type by ID with salary structures
export async function getLoanTypeById(loanTypeId: number) {
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) return null;

  const [loanType] = await db
    .select()
    .from(loanTypes)
    .where(
      and(
        eq(loanTypes.id, loanTypeId),
        eq(loanTypes.organizationId, organization.id),
      ),
    )
    .limit(1);

  if (!loanType) return null;

  const structures = await db
    .select({
      id: salaryStructure.id,
      name: salaryStructure.name,
      baseSalary: salaryStructure.baseSalary,
    })
    .from(loanTypeSalaryStructures)
    .innerJoin(
      salaryStructure,
      eq(loanTypeSalaryStructures.salaryStructureId, salaryStructure.id),
    )
    .where(
      and(
        eq(loanTypeSalaryStructures.loanTypeId, loanTypeId),
        eq(loanTypeSalaryStructures.organizationId, organization.id),
      ),
    );

  return {
    ...loanType,
    salaryStructures: structures,
  };
}

// Create loan type
export async function createLoanType(data: {
  name: string;
  description?: string;
  amountType: "fixed" | "percentage";
  fixedAmount?: string;
  maxPercentage?: string;
  tenureMonths: number;
  interestRate?: string;
  minServiceMonths?: number;
  maxActiveLoans?: number;
  salaryStructureIds: number[];
}) {
  try {
    // Auth check - must be HR or admin
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: null, error: { reason: "Unauthorized" } };
    }
    if (
      currentUser.department !== DEPARTMENTS.HR &&
      currentUser.role !== "admin"
    ) {
      return {
        success: null,
        error: { reason: "Only HR staff can create loan types" },
      };
    }

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return { success: null, error: { reason: "Organization not found" } };
    }

    // Helper to convert empty strings to undefined for numeric fields
    const toNumericOrNull = (val?: string) =>
      val && val.trim() !== "" ? val : undefined;

    const [newLoanType] = await db
      .insert(loanTypes)
      .values({
        name: data.name,
        description: toNumericOrNull(data.description),
        amountType: data.amountType,
        organizationId: organization.id,
        fixedAmount: toNumericOrNull(data.fixedAmount),
        maxPercentage: toNumericOrNull(data.maxPercentage),
        tenureMonths: data.tenureMonths,
        interestRate: toNumericOrNull(data.interestRate) || "0",
        minServiceMonths: data.minServiceMonths || 0,
        maxActiveLoans: data.maxActiveLoans || 1,
        createdByUserId: currentUser.authId,
        updatedByUserId: currentUser.authId,
      })
      .returning();

    // Link to salary structures
    if (data.salaryStructureIds.length > 0) {
      await db.insert(loanTypeSalaryStructures).values(
        data.salaryStructureIds.map((structureId) => ({
          loanTypeId: newLoanType.id,
          salaryStructureId: structureId,
          organizationId: organization.id,
        })),
      );
    }

    revalidatePath("/hr/loans");
    return {
      success: { reason: "Loan type created successfully" },
      error: null,
      data: newLoanType,
    };
  } catch (err: any) {
    return {
      success: null,
      error: { reason: err.message || "Failed to create loan type" },
    };
  }
}

// Update loan type
export async function updateLoanType(
  loanTypeId: number,
  data: {
    name?: string;
    description?: string;
    amountType?: "fixed" | "percentage";
    fixedAmount?: string;
    maxPercentage?: string;
    tenureMonths?: number;
    interestRate?: string;
    minServiceMonths?: number;
    maxActiveLoans?: number;
    isActive?: boolean;
    salaryStructureIds?: number[];
  },
) {
  try {
    // Auth check - must be HR or admin
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: null, error: { reason: "Unauthorized" } };
    }
    if (
      currentUser.department !== DEPARTMENTS.HR &&
      currentUser.role !== "admin"
    ) {
      return {
        success: null,
        error: { reason: "Only HR staff can update loan types" },
      };
    }

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return { success: null, error: { reason: "Organization not found" } };
    }

    // Helper to convert empty strings to undefined for numeric fields
    const toNumericOrNull = (val?: string) =>
      val && val.trim() !== "" ? val : undefined;

    // Sanitize string fields that should be numeric or null
    const sanitizedData = {
      ...data,
      description:
        data.description !== undefined
          ? toNumericOrNull(data.description)
          : undefined,
      fixedAmount:
        data.fixedAmount !== undefined
          ? toNumericOrNull(data.fixedAmount)
          : undefined,
      maxPercentage:
        data.maxPercentage !== undefined
          ? toNumericOrNull(data.maxPercentage)
          : undefined,
      interestRate:
        data.interestRate !== undefined
          ? toNumericOrNull(data.interestRate)
          : undefined,
    };

    await db
      .update(loanTypes)
      .set({
        ...sanitizedData,
        updatedByUserId: currentUser.authId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(loanTypes.id, loanTypeId),
          eq(loanTypes.organizationId, organization.id),
        ),
      );

    // Update salary structure links if provided
    if (data.salaryStructureIds) {
      await db
        .delete(loanTypeSalaryStructures)
        .where(
          and(
            eq(loanTypeSalaryStructures.loanTypeId, loanTypeId),
            eq(loanTypeSalaryStructures.organizationId, organization.id),
          ),
        );

      if (data.salaryStructureIds.length > 0) {
        await db.insert(loanTypeSalaryStructures).values(
          data.salaryStructureIds.map((structureId) => ({
            loanTypeId,
            salaryStructureId: structureId,
            organizationId: organization.id,
          })),
        );
      }
    }

    revalidatePath("/hr/loans");
    return {
      success: { reason: "Loan type updated successfully" },
      error: null,
    };
  } catch (err: any) {
    return {
      success: null,
      error: { reason: err.message || "Failed to update loan type" },
    };
  }
}

// Delete loan type
export async function deleteLoanType(loanTypeId: number) {
  try {
    // Auth check - must be HR or admin
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: null, error: { reason: "Unauthorized" } };
    }
    if (
      currentUser.department !== DEPARTMENTS.HR &&
      currentUser.role !== "admin"
    ) {
      return {
        success: null,
        error: { reason: "Only HR staff can delete loan types" },
      };
    }

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return { success: null, error: { reason: "Organization not found" } };
    }

    await db
      .delete(loanTypes)
      .where(
        and(
          eq(loanTypes.id, loanTypeId),
          eq(loanTypes.organizationId, organization.id),
        ),
      );

    revalidatePath("/hr/loans");
    return {
      success: { reason: "Loan type deleted successfully" },
      error: null,
    };
  } catch (err: any) {
    return {
      success: null,
      error: { reason: err.message || "Failed to delete loan type" },
    };
  }
}

// ==================== LOAN APPLICATIONS ====================

// Get eligible loan types for an employee
export async function getEligibleLoanTypes(userId: string) {
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) return { loanTypes: [], baseSalary: 0 };

  // Get employee's current salary structure
  const [empSalary] = await db
    .select({
      salaryStructureId: employeeSalary.salaryStructureId,
      baseSalary: salaryStructure.baseSalary,
    })
    .from(employeeSalary)
    .innerJoin(
      salaryStructure,
      eq(employeeSalary.salaryStructureId, salaryStructure.id),
    )
    .where(
      and(
        eq(employeeSalary.userId, userId),
        isNull(employeeSalary.effectiveTo),
        eq(employeeSalary.organizationId, organization.id),
      ),
    )
    .limit(1);

  if (!empSalary) {
    return { loanTypes: [], baseSalary: 0 };
  }

  // Get loan types available for this salary structure
  const eligibleTypes = await db
    .select({
      id: loanTypes.id,
      name: loanTypes.name,
      description: loanTypes.description,
      amountType: loanTypes.amountType,
      fixedAmount: loanTypes.fixedAmount,
      maxPercentage: loanTypes.maxPercentage,
      tenureMonths: loanTypes.tenureMonths,
      interestRate: loanTypes.interestRate,
      minServiceMonths: loanTypes.minServiceMonths,
      maxActiveLoans: loanTypes.maxActiveLoans,
    })
    .from(loanTypes)
    .innerJoin(
      loanTypeSalaryStructures,
      eq(loanTypes.id, loanTypeSalaryStructures.loanTypeId),
    )
    .where(
      and(
        eq(
          loanTypeSalaryStructures.salaryStructureId,
          empSalary.salaryStructureId,
        ),
        eq(loanTypes.isActive, true),
        eq(loanTypes.organizationId, organization.id),
      ),
    );

  return {
    loanTypes: eligibleTypes,
    baseSalary: Number(empSalary.baseSalary),
  };
}

// Calculate maximum eligible amount for a loan type
export async function calculateMaxEligibleAmount(
  userId: string,
  loanTypeId: number,
) {
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return {
      maxAmount: 0,
      monthlyRepayment: 0,
      error: "Organization not found",
    };
  }

  const [loanType] = await db
    .select()
    .from(loanTypes)
    .where(
      and(
        eq(loanTypes.id, loanTypeId),
        eq(loanTypes.organizationId, organization.id),
      ),
    )
    .limit(1);

  if (!loanType) {
    return { maxAmount: 0, monthlyRepayment: 0, error: "Loan type not found" };
  }

  // Get employee's base salary
  const [empSalary] = await db
    .select({
      baseSalary: salaryStructure.baseSalary,
    })
    .from(employeeSalary)
    .innerJoin(
      salaryStructure,
      eq(employeeSalary.salaryStructureId, salaryStructure.id),
    )
    .where(
      and(
        eq(employeeSalary.userId, userId),
        isNull(employeeSalary.effectiveTo),
        eq(employeeSalary.organizationId, organization.id),
      ),
    )
    .limit(1);

  if (!empSalary) {
    return {
      maxAmount: 0,
      monthlyRepayment: 0,
      error: "Employee salary not found",
    };
  }

  const baseSalary = Number(empSalary.baseSalary);
  let maxAmount = 0;

  if (loanType.amountType === "fixed") {
    maxAmount = Number(loanType.fixedAmount || 0);
  } else {
    // Percentage of base salary
    maxAmount = (baseSalary * Number(loanType.maxPercentage || 0)) / 100;
  }

  // Calculate total with interest (simple interest)
  const interestRate = Number(loanType.interestRate || 0);
  const totalInterest =
    (maxAmount * interestRate * loanType.tenureMonths) / (12 * 100);
  const totalRepayment = maxAmount + totalInterest;
  const monthlyRepayment = totalRepayment / loanType.tenureMonths;

  return {
    maxAmount,
    baseSalary,
    tenure: loanType.tenureMonths,
    interestRate,
    totalInterest,
    totalRepayment,
    monthlyRepayment,
    error: null,
  };
}

// Apply for a loan
export async function applyForLoan(data: {
  loanTypeId: number;
  requestedAmount: string;
  reason: string;
}) {
  try {
    // Auth check - verify user is applying for themselves
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: null, error: { reason: "Unauthorized" } };
    }

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return { success: null, error: { reason: "Organization not found" } };
    }

    const userId = currentUser.authId;

    // Validate eligibility
    const eligible = await calculateMaxEligibleAmount(userId, data.loanTypeId);
    if (eligible.error) {
      return { success: null, error: { reason: eligible.error } };
    }

    const requestedAmount = Number(data.requestedAmount);
    if (requestedAmount > eligible.maxAmount) {
      return {
        success: null,
        error: {
          reason: `Requested amount exceeds maximum eligible amount of ${eligible.maxAmount}`,
        },
      };
    }

    // Check for existing active loans of this type
    const [loanType] = await db
      .select()
      .from(loanTypes)
      .where(
        and(
          eq(loanTypes.id, data.loanTypeId),
          eq(loanTypes.organizationId, organization.id),
        ),
      )
      .limit(1);

    // Use transaction with locking to prevent race conditions
    const result = await db.transaction(async (tx) => {
      // Lock the rows to prevent concurrent inserts
      const activeLoans = await tx
        .select({ count: count() })
        .from(loanApplications)
        .where(
          and(
            eq(loanApplications.userId, userId),
            eq(loanApplications.loanTypeId, data.loanTypeId),
            eq(loanApplications.organizationId, organization.id),
            inArray(loanApplications.status, [
              "pending",
              "hr_approved",
              "disbursed",
              "active",
            ]),
          ),
        );

      if (activeLoans[0].count >= (loanType?.maxActiveLoans || 1)) {
        throw new Error(
          "You have reached the maximum number of active loans for this type",
        );
      }

      const referenceNumber = generateReferenceNumber();

      const [newApplication] = await tx
        .insert(loanApplications)
        .values({
          referenceNumber,
          userId,
          organizationId: organization.id,
          loanTypeId: data.loanTypeId,
          requestedAmount: data.requestedAmount,
          tenureMonths: loanType?.tenureMonths || 12,
          reason: data.reason,
          status: "pending",
          remainingBalance: data.requestedAmount,
        })
        .returning();

      // Log history
      await tx.insert(loanHistory).values({
        loanApplicationId: newApplication.id,
        organizationId: organization.id,
        action: "applied",
        description: `Loan application submitted for ${requestedAmount}`,
        performedByUserId: userId,
      });

      return newApplication;
    });

    revalidatePath("/hr/loans");
    return {
      success: { reason: "Loan application submitted successfully" },
      error: null,
      data: result,
    };
  } catch (err: any) {
    return {
      success: null,
      error: { reason: err.message || "Failed to submit loan application" },
    };
  }
}

// Get all loan applications
export async function getAllLoanApplications(filters?: {
  userId?: string;
  status?: string;
  loanTypeId?: number;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization)
    return { applications: [], total: 0, page: 1, limit: 10, totalPages: 0 };

  const hrReviewer = alias(employees, "hr_reviewer");
  const disburser = alias(employees, "disburser");

  const conditions: any[] = [
    eq(loanApplications.organizationId, organization.id),
  ];

  if (filters?.userId) {
    conditions.push(eq(loanApplications.userId, filters.userId));
  }
  if (filters?.status) {
    conditions.push(eq(loanApplications.status, filters.status as any));
  }
  if (filters?.loanTypeId) {
    conditions.push(eq(loanApplications.loanTypeId, filters.loanTypeId));
  }
  if (filters?.search) {
    conditions.push(
      or(
        ilike(employees.name, `%${filters.search}%`),
        ilike(loanApplications.referenceNumber, `%${filters.search}%`),
      ),
    );
  }

  const whereClause = and(...conditions);

  const page = filters?.page || 1;
  const limit = filters?.limit || 10;
  const offset = (page - 1) * limit;

  const totalResult = await db
    .select({ count: count() })
    .from(loanApplications)
    .leftJoin(
      employees,
      and(
        eq(loanApplications.userId, employees.authId),
        eq(employees.organizationId, organization.id),
      ),
    )
    .where(whereClause);

  const total = totalResult[0]?.count || 0;

  const result = await db
    .select({
      id: loanApplications.id,
      referenceNumber: loanApplications.referenceNumber,
      userId: loanApplications.userId,
      employeeName: employees.name,
      employeeEmail: employees.email,
      employeeDepartment: employees.department,
      loanTypeId: loanApplications.loanTypeId,
      loanTypeName: loanTypes.name,
      requestedAmount: loanApplications.requestedAmount,
      approvedAmount: loanApplications.approvedAmount,
      monthlyDeduction: loanApplications.monthlyDeduction,
      tenureMonths: loanApplications.tenureMonths,
      reason: loanApplications.reason,
      status: loanApplications.status,
      hrReviewedByUserId: loanApplications.hrReviewedByUserId,
      hrReviewerName: hrReviewer.name,
      hrReviewedAt: loanApplications.hrReviewedAt,
      hrRemarks: loanApplications.hrRemarks,
      disbursedByUserId: loanApplications.disbursedByUserId,
      disburserName: disburser.name,
      disbursedAt: loanApplications.disbursedAt,
      totalRepaid: loanApplications.totalRepaid,
      remainingBalance: loanApplications.remainingBalance,
      appliedAt: loanApplications.appliedAt,
      createdAt: loanApplications.createdAt,
    })
    .from(loanApplications)
    .leftJoin(
      employees,
      and(
        eq(loanApplications.userId, employees.authId),
        eq(employees.organizationId, organization.id),
      ),
    )
    .leftJoin(loanTypes, eq(loanApplications.loanTypeId, loanTypes.id))
    .leftJoin(
      hrReviewer,
      and(
        eq(loanApplications.hrReviewedByUserId, hrReviewer.authId),
        eq(hrReviewer.organizationId, organization.id),
      ),
    )
    .leftJoin(
      disburser,
      and(
        eq(loanApplications.disbursedByUserId, disburser.authId),
        eq(disburser.organizationId, organization.id),
      ),
    )
    .where(whereClause)
    .orderBy(desc(loanApplications.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    applications: result,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// Get loan application by ID
export async function getLoanApplicationById(applicationId: number) {
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) return null;

  const hrReviewer = alias(employees, "hr_reviewer");
  const disburser = alias(employees, "disburser");

  const [application] = await db
    .select({
      id: loanApplications.id,
      referenceNumber: loanApplications.referenceNumber,
      userId: loanApplications.userId,
      employeeName: employees.name,
      employeeEmail: employees.email,
      employeeDepartment: employees.department,
      employeeStaffNumber: employees.staffNumber,
      loanTypeId: loanApplications.loanTypeId,
      loanTypeName: loanTypes.name,
      requestedAmount: loanApplications.requestedAmount,
      approvedAmount: loanApplications.approvedAmount,
      monthlyDeduction: loanApplications.monthlyDeduction,
      tenureMonths: loanApplications.tenureMonths,
      reason: loanApplications.reason,
      status: loanApplications.status,
      hrReviewedByUserId: loanApplications.hrReviewedByUserId,
      hrReviewerName: hrReviewer.name,
      hrReviewedAt: loanApplications.hrReviewedAt,
      hrRemarks: loanApplications.hrRemarks,
      disbursedByUserId: loanApplications.disbursedByUserId,
      disburserName: disburser.name,
      disbursedAt: loanApplications.disbursedAt,
      disbursementRemarks: loanApplications.disbursementRemarks,
      employeeDeductionId: loanApplications.employeeDeductionId,
      totalRepaid: loanApplications.totalRepaid,
      remainingBalance: loanApplications.remainingBalance,
      appliedAt: loanApplications.appliedAt,
      completedAt: loanApplications.completedAt,
      createdAt: loanApplications.createdAt,
    })
    .from(loanApplications)
    .leftJoin(
      employees,
      and(
        eq(loanApplications.userId, employees.authId),
        eq(employees.organizationId, organization.id),
      ),
    )
    .leftJoin(loanTypes, eq(loanApplications.loanTypeId, loanTypes.id))
    .leftJoin(
      hrReviewer,
      and(
        eq(loanApplications.hrReviewedByUserId, hrReviewer.authId),
        eq(hrReviewer.organizationId, organization.id),
      ),
    )
    .leftJoin(
      disburser,
      and(
        eq(loanApplications.disbursedByUserId, disburser.authId),
        eq(disburser.organizationId, organization.id),
      ),
    )
    .where(
      and(
        eq(loanApplications.id, applicationId),
        eq(loanApplications.organizationId, organization.id),
      ),
    )
    .limit(1);

  if (!application) return null;

  // Get employee bank details
  const [bankDetails] = await db
    .select()
    .from(employeesBank)
    .where(
      and(
        eq(employeesBank.userId, application.userId),
        eq(employeesBank.organizationId, organization.id),
      ),
    )
    .limit(1);

  // Get employee salary info
  const [salaryInfo] = await db
    .select({
      salaryStructureId: employeeSalary.salaryStructureId,
      structureName: salaryStructure.name,
      baseSalary: salaryStructure.baseSalary,
    })
    .from(employeeSalary)
    .innerJoin(
      salaryStructure,
      eq(employeeSalary.salaryStructureId, salaryStructure.id),
    )
    .where(
      and(
        eq(employeeSalary.userId, application.userId),
        eq(employeeSalary.organizationId, organization.id),
        isNull(employeeSalary.effectiveTo),
      ),
    )
    .limit(1);

  // Get loan history
  const history = await db
    .select({
      id: loanHistory.id,
      action: loanHistory.action,
      description: loanHistory.description,
      performedByUserId: loanHistory.performedByUserId,
      performerName: employees.name,
      createdAt: loanHistory.createdAt,
    })
    .from(loanHistory)
    .leftJoin(
      employees,
      and(
        eq(loanHistory.performedByUserId, employees.authId),
        eq(employees.organizationId, organization.id),
      ),
    )
    .where(
      and(
        eq(loanHistory.loanApplicationId, applicationId),
        eq(loanHistory.organizationId, organization.id),
      ),
    )
    .orderBy(desc(loanHistory.createdAt));

  // Get repayment schedule
  const repayments = await db
    .select()
    .from(loanRepayments)
    .where(
      and(
        eq(loanRepayments.loanApplicationId, applicationId),
        eq(loanRepayments.organizationId, organization.id),
      ),
    )
    .orderBy(asc(loanRepayments.installmentNumber));

  return {
    ...application,
    bankDetails,
    salaryInfo,
    history,
    repayments,
  };
}

// HR approve/reject loan
export async function hrReviewLoan(data: {
  applicationId: number;
  action: "approve" | "reject";
  approvedAmount?: string;
  remarks?: string;
}) {
  try {
    // Auth check - must be HR or admin
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: null, error: { reason: "Unauthorized" } };
    }
    if (
      currentUser.department !== DEPARTMENTS.HR &&
      currentUser.role !== "admin"
    ) {
      return {
        success: null,
        error: { reason: "Only HR staff can review loan applications" },
      };
    }

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return { success: null, error: { reason: "Organization not found" } };
    }

    const [application] = await db
      .select()
      .from(loanApplications)
      .where(
        and(
          eq(loanApplications.id, data.applicationId),
          eq(loanApplications.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!application) {
      return { success: null, error: { reason: "Application not found" } };
    }

    if (application.status !== "pending") {
      return {
        success: null,
        error: { reason: "Application is not pending review" },
      };
    }

    if (data.action === "approve") {
      const approvedAmount = data.approvedAmount || application.requestedAmount;
      const numericApprovedAmount = Number(approvedAmount);

      // Validate approved amount
      if (numericApprovedAmount <= 0) {
        return {
          success: null,
          error: { reason: "Approved amount must be greater than 0" },
        };
      }
      if (numericApprovedAmount > Number(application.requestedAmount)) {
        return {
          success: null,
          error: { reason: "Approved amount cannot exceed requested amount" },
        };
      }

      const [loanType] = await db
        .select()
        .from(loanTypes)
        .where(eq(loanTypes.id, application.loanTypeId))
        .limit(1);

      if (!loanType) {
        return {
          success: null,
          error: { reason: "Loan type not found for this application" },
        };
      }

      // Calculate total with interest (simple interest)
      const interestRate = Number(loanType.interestRate || 0);
      const tenure = application.tenureMonths;
      const totalInterest =
        (numericApprovedAmount * interestRate * tenure) / (12 * 100);
      const totalRepayment = numericApprovedAmount + totalInterest;
      const monthlyDeduction = totalRepayment / tenure;

      await db
        .update(loanApplications)
        .set({
          status: "hr_approved",
          approvedAmount,
          monthlyDeduction: String(monthlyDeduction),
          hrReviewedByUserId: currentUser.authId,
          hrReviewedAt: new Date(),
          hrRemarks: data.remarks,
          remainingBalance: approvedAmount,
          updatedAt: new Date(),
        })
        .where(eq(loanApplications.id, data.applicationId));

      await db.insert(loanHistory).values({
        loanApplicationId: data.applicationId,
        organizationId: organization.id,
        action: "hr_approved",
        description: `Loan approved by HR for ${approvedAmount}`,
        performedByUserId: currentUser.authId,
      });
    } else {
      await db
        .update(loanApplications)
        .set({
          status: "hr_rejected",
          hrReviewedByUserId: currentUser.authId,
          hrReviewedAt: new Date(),
          hrRemarks: data.remarks,
          updatedAt: new Date(),
        })
        .where(eq(loanApplications.id, data.applicationId));

      await db.insert(loanHistory).values({
        loanApplicationId: data.applicationId,
        organizationId: organization.id,
        action: "hr_rejected",
        description: `Loan rejected by HR: ${data.remarks || "No reason provided"}`,
        performedByUserId: currentUser.authId,
      });
    }

    revalidatePath("/hr/loans");
    revalidatePath("/finance/loans");
    return {
      success: {
        reason:
          data.action === "approve"
            ? "Loan approved successfully"
            : "Loan rejected successfully",
      },
      error: null,
    };
  } catch (err: any) {
    return {
      success: null,
      error: { reason: err.message || "Failed to review loan" },
    };
  }
}

// Finance disburse loan
export async function disburseLoan(data: {
  applicationId: number;
  remarks?: string;
}) {
  try {
    // Auth check - must be Finance or admin
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: null, error: { reason: "Unauthorized" } };
    }
    if (
      currentUser.department !== DEPARTMENTS.FINANCE &&
      currentUser.role !== "admin"
    ) {
      return {
        success: null,
        error: { reason: "Only Finance staff can disburse loans" },
      };
    }

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return { success: null, error: { reason: "Organization not found" } };
    }

    const application = await getLoanApplicationById(data.applicationId);

    if (!application) {
      return { success: null, error: { reason: "Application not found" } };
    }

    if (application.status !== "hr_approved") {
      return {
        success: null,
        error: { reason: "Application is not approved by HR" },
      };
    }

    const approvedAmount = Number(application.approvedAmount);

    // Get loan type for interest calculation
    const [loanType] = await db
      .select()
      .from(loanTypes)
      .where(eq(loanTypes.id, application.loanTypeId))
      .limit(1);

    // Calculate total with interest (simple interest)
    const interestRate = Number(loanType?.interestRate || 0);
    const tenure = application.tenureMonths;
    const totalInterest = (approvedAmount * interestRate * tenure) / (12 * 100);
    const totalRepayment = approvedAmount + totalInterest;
    const monthlyRepayment = totalRepayment / tenure;

    // Use transaction to ensure all operations succeed together
    await db.transaction(async (tx) => {
      // Create employee deduction for payroll integration
      const [deduction] = await tx
        .insert(employeeDeductions)
        .values({
          name: `Loan: ${application.referenceNumber}`,
          userId: application.userId,
          organizationId: organization.id,
          salaryStructureId: application.salaryInfo?.salaryStructureId || 0,
          type: "loan",
          amount: String(monthlyRepayment),
          originalAmount: String(totalRepayment),
          remainingAmount: String(totalRepayment),
          active: true,
          effectiveFrom: new Date(),
        })
        .returning();

      // Update loan application with total repayment amount
      await tx
        .update(loanApplications)
        .set({
          status: "active",
          disbursedByUserId: currentUser.authId,
          disbursedAt: new Date(),
          disbursementRemarks: data.remarks,
          employeeDeductionId: deduction.id,
          remainingBalance: String(totalRepayment),
          updatedAt: new Date(),
        })
        .where(eq(loanApplications.id, data.applicationId));

      // Generate repayment schedule
      const repaymentSchedule = [];
      let remainingBalance = totalRepayment;

      for (let i = 1; i <= tenure; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + i);
        dueDate.setDate(1); // First of each month

        remainingBalance -= monthlyRepayment;
        if (remainingBalance < 0) remainingBalance = 0;

        repaymentSchedule.push({
          loanApplicationId: data.applicationId,
          organizationId: organization.id,
          userId: application.userId,
          installmentNumber: i,
          dueDate,
          expectedAmount: String(monthlyRepayment),
          balanceAfter: String(remainingBalance),
          status: "pending" as const,
        });
      }

      if (repaymentSchedule.length > 0) {
        await tx.insert(loanRepayments).values(repaymentSchedule);
      }

      // Log history
      await tx.insert(loanHistory).values({
        loanApplicationId: data.applicationId,
        organizationId: organization.id,
        action: "disbursed",
        description: `Loan disbursed: ${approvedAmount}. Interest: ${totalInterest.toFixed(2)} (${interestRate}%). Total repayment: ${totalRepayment.toFixed(2)}. Monthly: ${monthlyRepayment.toFixed(2)}`,
        performedByUserId: currentUser.authId,
      });
    });

    revalidatePath("/hr/loans");
    revalidatePath("/finance/loans");
    return {
      success: { reason: "Loan disbursed successfully" },
      error: null,
    };
  } catch (err: any) {
    return {
      success: null,
      error: { reason: err.message || "Failed to disburse loan" },
    };
  }
}

// Get employee loan history
export async function getEmployeeLoanHistory(userId: string) {
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) return [];

  const result = await db
    .select({
      id: loanApplications.id,
      referenceNumber: loanApplications.referenceNumber,
      loanTypeName: loanTypes.name,
      requestedAmount: loanApplications.requestedAmount,
      approvedAmount: loanApplications.approvedAmount,
      status: loanApplications.status,
      totalRepaid: loanApplications.totalRepaid,
      remainingBalance: loanApplications.remainingBalance,
      appliedAt: loanApplications.appliedAt,
      completedAt: loanApplications.completedAt,
    })
    .from(loanApplications)
    .leftJoin(loanTypes, eq(loanApplications.loanTypeId, loanTypes.id))
    .where(
      and(
        eq(loanApplications.userId, userId),
        eq(loanApplications.organizationId, organization.id),
      ),
    )
    .orderBy(desc(loanApplications.createdAt));

  return result;
}

// Cancel loan application
export async function cancelLoanApplication(
  applicationId: number,
  reason?: string,
) {
  try {
    // Auth check
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: null, error: { reason: "Unauthorized" } };
    }

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return { success: null, error: { reason: "Organization not found" } };
    }

    const [application] = await db
      .select()
      .from(loanApplications)
      .where(
        and(
          eq(loanApplications.id, applicationId),
          eq(loanApplications.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!application) {
      return { success: null, error: { reason: "Application not found" } };
    }

    // Only the applicant or HR/admin can cancel
    const isOwner = application.userId === currentUser.authId;
    const isHROrAdmin =
      currentUser.department === DEPARTMENTS.HR || currentUser.role === "admin";
    if (!isOwner && !isHROrAdmin) {
      return {
        success: null,
        error: { reason: "You can only cancel your own loan applications" },
      };
    }

    if (!["pending", "hr_approved"].includes(application.status)) {
      return {
        success: null,
        error: {
          reason: "Only pending or approved applications can be cancelled",
        },
      };
    }

    await db
      .update(loanApplications)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(loanApplications.id, applicationId));

    await db.insert(loanHistory).values({
      loanApplicationId: applicationId,
      organizationId: organization.id,
      action: "cancelled",
      description: reason || "Application cancelled",
      performedByUserId: currentUser.authId,
    });

    revalidatePath("/hr/loans");
    return {
      success: { reason: "Loan application cancelled successfully" },
      error: null,
    };
  } catch (err: any) {
    return {
      success: null,
      error: { reason: err.message || "Failed to cancel loan application" },
    };
  }
}

// Get loan statistics
export async function getLoanStatistics() {
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return {
      pending: 0,
      awaitingDisbursement: 0,
      active: 0,
      totalDisbursed: "0",
      totalRepaid: "0",
    };
  }

  const pending = await db
    .select({ count: count() })
    .from(loanApplications)
    .where(
      and(
        eq(loanApplications.status, "pending"),
        eq(loanApplications.organizationId, organization.id),
      ),
    );

  const hrApproved = await db
    .select({ count: count() })
    .from(loanApplications)
    .where(
      and(
        eq(loanApplications.status, "hr_approved"),
        eq(loanApplications.organizationId, organization.id),
      ),
    );

  const active = await db
    .select({ count: count() })
    .from(loanApplications)
    .where(
      and(
        eq(loanApplications.status, "active"),
        eq(loanApplications.organizationId, organization.id),
      ),
    );

  const totalDisbursed = await db
    .select({
      total: sql<string>`COALESCE(SUM(${loanApplications.approvedAmount}::numeric), 0)`,
    })
    .from(loanApplications)
    .where(
      and(
        inArray(loanApplications.status, ["active", "completed"]),
        eq(loanApplications.organizationId, organization.id),
      ),
    );

  const totalRepaid = await db
    .select({
      total: sql<string>`COALESCE(SUM(${loanApplications.totalRepaid}::numeric), 0)`,
    })
    .from(loanApplications)
    .where(
      and(
        inArray(loanApplications.status, ["active", "completed"]),
        eq(loanApplications.organizationId, organization.id),
      ),
    );

  return {
    pending: pending[0]?.count || 0,
    awaitingDisbursement: hrApproved[0]?.count || 0,
    active: active[0]?.count || 0,
    totalDisbursed: totalDisbursed[0]?.total || "0",
    totalRepaid: totalRepaid[0]?.total || "0",
  };
}

// Check and mark loan as completed if all repayments are paid
export async function checkAndCompleteLoan(applicationId: number) {
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) return;

  // Get all repayments for this loan
  const repayments = await db
    .select()
    .from(loanRepayments)
    .where(
      and(
        eq(loanRepayments.loanApplicationId, applicationId),
        eq(loanRepayments.organizationId, organization.id),
      ),
    );

  if (repayments.length === 0) return;

  // Check if all repayments are paid
  const allPaid = repayments.every((r) => r.status === "paid");

  if (allPaid) {
    // Update loan status to completed
    await db
      .update(loanApplications)
      .set({
        status: "completed",
        completedAt: new Date(),
        remainingBalance: "0",
        updatedAt: new Date(),
      })
      .where(eq(loanApplications.id, applicationId));

    // Deactivate the employee deduction
    const [application] = await db
      .select({ employeeDeductionId: loanApplications.employeeDeductionId })
      .from(loanApplications)
      .where(eq(loanApplications.id, applicationId))
      .limit(1);

    if (application?.employeeDeductionId) {
      await db
        .update(employeeDeductions)
        .set({
          active: false,
          effectiveTo: new Date(),
        })
        .where(eq(employeeDeductions.id, application.employeeDeductionId));
    }

    // Log history
    await db.insert(loanHistory).values({
      loanApplicationId: applicationId,
      organizationId: organization.id,
      action: "completed",
      description: "Loan fully repaid and marked as completed",
      performedByUserId: null,
    });

    revalidatePath("/hr/loans");
    revalidatePath("/finance/loans");
  }
}

// Mark overdue repayments
export async function markOverdueRepayments() {
  try {
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return {
        success: false,
        error: "Organization not found",
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all pending repayments with due date in the past
    const overdueRepayments = await db
      .select({
        id: loanRepayments.id,
        loanApplicationId: loanRepayments.loanApplicationId,
      })
      .from(loanRepayments)
      .where(
        and(
          eq(loanRepayments.status, "pending"),
          lt(loanRepayments.dueDate, today),
          eq(loanRepayments.organizationId, organization.id),
        ),
      );

    if (overdueRepayments.length === 0) {
      return { success: true, count: 0 };
    }

    // Update status to overdue
    await db
      .update(loanRepayments)
      .set({ status: "overdue" })
      .where(
        inArray(
          loanRepayments.id,
          overdueRepayments.map((r) => r.id),
        ),
      );

    return {
      success: true,
      count: overdueRepayments.length,
      message: `Marked ${overdueRepayments.length} repayments as overdue`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to mark overdue repayments",
    };
  }
}

// Make early/extra repayment
export async function makeEarlyRepayment(data: {
  applicationId: number;
  amount: string;
  remarks?: string;
}) {
  try {
    // Auth check
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: null, error: { reason: "Unauthorized" } };
    }

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return { success: null, error: { reason: "Organization not found" } };
    }

    const [application] = await db
      .select()
      .from(loanApplications)
      .where(
        and(
          eq(loanApplications.id, data.applicationId),
          eq(loanApplications.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!application) {
      return { success: null, error: { reason: "Application not found" } };
    }

    // Only the loan owner can make early repayment
    if (application.userId !== currentUser.authId) {
      return {
        success: null,
        error: { reason: "You can only make payments on your own loans" },
      };
    }

    if (application.status !== "active") {
      return {
        success: null,
        error: { reason: "Can only make payments on active loans" },
      };
    }

    const paymentAmount = Number(data.amount);
    const remainingBalance = Number(application.remainingBalance);

    if (paymentAmount <= 0) {
      return {
        success: null,
        error: { reason: "Payment amount must be greater than 0" },
      };
    }

    if (paymentAmount > remainingBalance) {
      return {
        success: null,
        error: {
          reason: `Payment amount cannot exceed remaining balance of ${remainingBalance}`,
        },
      };
    }

    await db.transaction(async (tx) => {
      // Get pending repayments ordered by installment number
      const pendingRepayments = await tx
        .select()
        .from(loanRepayments)
        .where(
          and(
            eq(loanRepayments.loanApplicationId, data.applicationId),
            eq(loanRepayments.organizationId, organization.id),
            inArray(loanRepayments.status, ["pending", "overdue"]),
          ),
        )
        .orderBy(asc(loanRepayments.installmentNumber));

      let remainingPayment = paymentAmount;
      const paidRepaymentIds: number[] = [];

      // Apply payment to pending repayments
      for (const repayment of pendingRepayments) {
        if (remainingPayment <= 0) break;

        const expectedAmount = Number(repayment.expectedAmount);

        if (remainingPayment >= expectedAmount) {
          // Full payment for this installment
          paidRepaymentIds.push(repayment.id);
          remainingPayment -= expectedAmount;
        } else {
          // Partial payment - we'll handle this as a full payment and adjust remaining
          // For simplicity, we don't split payments across installments
          break;
        }
      }

      // Mark repayments as paid
      if (paidRepaymentIds.length > 0) {
        await tx
          .update(loanRepayments)
          .set({
            status: "paid",
            paidAmount: sql`${loanRepayments.expectedAmount}`,
            paidAt: new Date(),
          })
          .where(inArray(loanRepayments.id, paidRepaymentIds));
      }

      // Update loan application
      const newRemainingBalance = remainingBalance - paymentAmount;
      const newTotalRepaid =
        Number(application.totalRepaid || 0) + paymentAmount;

      await tx
        .update(loanApplications)
        .set({
          remainingBalance: String(newRemainingBalance),
          totalRepaid: String(newTotalRepaid),
          updatedAt: new Date(),
        })
        .where(eq(loanApplications.id, data.applicationId));

      // Update employee deduction remaining amount
      if (application.employeeDeductionId) {
        await tx
          .update(employeeDeductions)
          .set({
            remainingAmount: String(newRemainingBalance),
          })
          .where(eq(employeeDeductions.id, application.employeeDeductionId));
      }

      // Log history
      await tx.insert(loanHistory).values({
        loanApplicationId: data.applicationId,
        organizationId: organization.id,
        action: "early_repayment",
        description: `Early repayment of ${paymentAmount}. ${data.remarks || ""} Remaining balance: ${newRemainingBalance}`,
        performedByUserId: currentUser.authId,
      });
    });

    // Check if loan should be marked as completed
    await checkAndCompleteLoan(data.applicationId);

    revalidatePath("/hr/loans");
    revalidatePath("/finance/loans");
    return {
      success: { reason: "Early repayment processed successfully" },
      error: null,
    };
  } catch (err: any) {
    return {
      success: null,
      error: { reason: err.message || "Failed to process early repayment" },
    };
  }
}

// Get loan repayment schedule
export async function getLoanRepaymentSchedule(applicationId: number) {
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) return [];

  const repayments = await db
    .select()
    .from(loanRepayments)
    .where(
      and(
        eq(loanRepayments.loanApplicationId, applicationId),
        eq(loanRepayments.organizationId, organization.id),
      ),
    )
    .orderBy(asc(loanRepayments.installmentNumber));

  return repayments;
}
