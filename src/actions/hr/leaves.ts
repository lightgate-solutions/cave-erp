/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
// biome-ignore-all lint/style/noNonNullAssertion: <>

"use server";

import { db } from "@/db";
import {
  leaveApplications,
  leaveBalances,
  leaveTypes,
  employees,
  annualLeaveSettings,
} from "@/db/schema";
import {
  DrizzleQueryError,
  eq,
  and,
  or,
  gte,
  lte,
  desc,
  asc,
  ilike,
  count,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { revalidatePath } from "next/cache";
import { requireAuth, requireHROrAdmin } from "@/actions/auth/dal";
import { createNotification } from "../notification/notification";
import { getEmployee } from "./employees";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Calculate total days between two dates (excluding weekends)
function calculateWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Not Sunday (0) or Saturday (6)
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

// Get all leave applications
export async function getAllLeaveApplications(filters?: {
  userId?: string;
  status?: string;
  leaveType?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  await requireAuth();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return {
      leaves: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    };
  }

  const approver = alias(employees, "approver");

  const conditions: any[] = [
    eq(leaveApplications.organizationId, organization.id),
  ];

  if (filters?.userId) {
    conditions.push(eq(leaveApplications.userId, filters.userId));
  }
  if (filters?.status) {
    conditions.push(eq(leaveApplications.status, filters.status as any));
  }
  if (filters?.leaveType) {
    conditions.push(eq(leaveApplications.leaveType, filters.leaveType as any));
  }
  if (filters?.startDate) {
    conditions.push(gte(leaveApplications.startDate, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(leaveApplications.endDate, filters.endDate));
  }

  // Search by employee name or email
  if (filters?.search) {
    conditions.push(
      or(
        ilike(employees.name, `%${filters.search}%`),
        ilike(employees.email, `%${filters.search}%`),
      )!,
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const page = filters?.page || 1;
  const limit = filters?.limit || 10;
  const offset = (page - 1) * limit;

  // Get total count
  const totalResult = await db
    .select({ count: count() })
    .from(leaveApplications)
    .leftJoin(employees, eq(leaveApplications.userId, employees.authId))
    .where(whereClause);

  const total = totalResult[0]?.count || 0;

  // Get paginated results
  const result = await db
    .select({
      id: leaveApplications.id,
      userId: leaveApplications.userId,
      employeeName: employees.name,
      employeeEmail: employees.email,
      leaveType: leaveApplications.leaveType,
      startDate: leaveApplications.startDate,
      endDate: leaveApplications.endDate,
      totalDays: leaveApplications.totalDays,
      reason: leaveApplications.reason,
      status: leaveApplications.status,
      approvedByUserId: leaveApplications.approvedByUserId,
      approverName: approver.name,
      approvedAt: leaveApplications.approvedAt,
      rejectionReason: leaveApplications.rejectionReason,
      appliedAt: leaveApplications.appliedAt,
      createdAt: leaveApplications.createdAt,
    })
    .from(leaveApplications)
    .leftJoin(employees, eq(leaveApplications.userId, employees.authId))
    .leftJoin(approver, eq(leaveApplications.approvedByUserId, approver.id))
    .where(whereClause)
    .orderBy(desc(leaveApplications.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    leaves: result,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// Get leave application by ID
export async function getLeaveApplication(leaveId: number) {
  await requireAuth();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return null;
  }

  const approver = alias(employees, "approver");

  const result = await db
    .select({
      id: leaveApplications.id,
      userId: leaveApplications.userId,
      employeeName: employees.name,
      employeeEmail: employees.email,
      employeeDepartment: employees.department,
      leaveType: leaveApplications.leaveType,
      startDate: leaveApplications.startDate,
      endDate: leaveApplications.endDate,
      totalDays: leaveApplications.totalDays,
      reason: leaveApplications.reason,
      status: leaveApplications.status,
      approvedByUserId: leaveApplications.approvedByUserId,
      approverName: approver.name,
      approvedAt: leaveApplications.approvedAt,
      rejectionReason: leaveApplications.rejectionReason,
      appliedAt: leaveApplications.appliedAt,
      createdAt: leaveApplications.createdAt,
    })
    .from(leaveApplications)
    .leftJoin(employees, eq(leaveApplications.userId, employees.authId))
    .leftJoin(approver, eq(leaveApplications.approvedByUserId, approver.id))
    .where(
      and(
        eq(leaveApplications.id, leaveId),
        eq(leaveApplications.organizationId, organization.id),
      ),
    )
    .limit(1);

  return result[0];
}

// Apply for leave
export async function applyForLeave(data: {
  userId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
}) {
  const authData = await requireAuth();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return {
      success: null,
      error: { reason: "Organization not found" },
    };
  }

  // Verify user can only apply for their own leave
  if (
    authData.userId !== data.userId &&
    authData.role !== "admin" &&
    authData.role !== "hr"
  ) {
    return {
      success: null,
      error: { reason: "You can only apply for your own leave" },
    };
  }

  // When applying on behalf of another user, verify they belong to the same organization
  if (authData.userId !== data.userId) {
    const targetEmployee = await db
      .select({ authId: employees.authId })
      .from(employees)
      .where(
        and(
          eq(employees.authId, data.userId),
          eq(employees.organizationId, organization.id),
        ),
      )
      .limit(1)
      .then((r) => r[0]);

    if (!targetEmployee) {
      return {
        success: null,
        error: { reason: "User not found in your organization" },
      };
    }
  }

  try {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (start > end) {
      return {
        success: null,
        error: { reason: "Start date must be before end date" },
      };
    }

    if (start < new Date()) {
      return {
        success: null,
        error: { reason: "Start date cannot be in the past" },
      };
    }

    const totalDays = calculateWorkingDays(start, end);

    // Check for overlapping leave applications
    const overlappingLeaves = await db
      .select()
      .from(leaveApplications)
      .where(
        and(
          eq(leaveApplications.userId, data.userId),
          eq(leaveApplications.organizationId, organization.id),
          or(
            eq(leaveApplications.status, "Pending"),
            eq(leaveApplications.status, "Approved"),
          ),
          or(
            and(
              gte(leaveApplications.startDate, data.startDate),
              lte(leaveApplications.startDate, data.endDate),
            ),
            and(
              gte(leaveApplications.endDate, data.startDate),
              lte(leaveApplications.endDate, data.endDate),
            ),
            and(
              lte(leaveApplications.startDate, data.startDate),
              gte(leaveApplications.endDate, data.endDate),
            ),
          ),
        ),
      );

    if (overlappingLeaves.length > 0) {
      return {
        success: null,
        error: {
          reason: "You have an overlapping leave application for this period",
        },
      };
    }

    // Check leave balance only for Annual leave
    if (data.leaveType === "Annual") {
      const currentYear = new Date().getFullYear();
      // Ensure balance exists (initialize if needed)
      await initializeEmployeeBalance(data.userId, currentYear);

      const balance = await db
        .select()
        .from(leaveBalances)
        .where(
          and(
            eq(leaveBalances.userId, data.userId),
            eq(leaveBalances.leaveType, "Annual"),
            eq(leaveBalances.year, currentYear),
          ),
        )
        .limit(1);

      if (balance.length > 0 && balance[0].remainingDays < totalDays) {
        return {
          success: null,
          error: {
            reason: `Insufficient leave balance. Available: ${balance[0].remainingDays} days, Requested: ${totalDays} days`,
          },
        };
      }
    }

    const [createdLeave] = await db
      .insert(leaveApplications)
      .values({
        userId: data.userId,
        leaveType: data.leaveType as any,
        startDate: data.startDate,
        endDate: data.endDate,
        totalDays,
        reason: data.reason,
        status: "Pending",
        organizationId: organization.id,
      })
      .returning();

    // Get employee details for notification
    const employee = await getEmployee(data.userId);
    if (employee) {
      // Notify manager if employee has a manager
      if (employee.managerId) {
        const manager = await getEmployee(employee.managerId);
        if (manager) {
          const startDate = new Date(data.startDate).toLocaleDateString(
            "en-US",
            {
              month: "short",
              day: "numeric",
            },
          );
          const endDate = new Date(data.endDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });

          await createNotification({
            user_id: manager.authId,
            title: "Leave Application Submitted",
            message: `${employee.name} applied for ${data.leaveType} leave • ${startDate} - ${endDate} (${totalDays} days)`,
            notification_type: "approval",
            reference_id: createdLeave.id,
          });
        }
      }
    }

    revalidatePath("/hr/leaves");
    return {
      success: { reason: "Leave application submitted successfully" },
      error: null,
    };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error" },
      };
    }

    return {
      error: {
        reason:
          "Couldn't submit leave application. Check inputs and try again!",
      },
      success: null,
    };
  }
}

// Update leave application
export async function updateLeaveApplication(
  leaveId: number,
  updates: Partial<{
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: string;
    rejectionReason: string;
  }>,
  approverId?: number,
) {
  await requireAuth();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return {
      success: null,
      error: { reason: "Organization not found" },
    };
  }

  try {
    const processedUpdates: any = { ...updates, updatedAt: new Date() };

    if (updates.status === "Approved" && approverId) {
      processedUpdates.approvedByUserId = approverId;
      processedUpdates.approvedAt = new Date();
    }

    if (
      (updates.status === "Rejected" || updates.status === "To be reviewed") &&
      updates.rejectionReason
    ) {
      processedUpdates.rejectionReason = updates.rejectionReason;
    }

    // If dates are updated, recalculate total days
    if (updates.startDate || updates.endDate) {
      const existing = await getLeaveApplication(leaveId);
      if (existing) {
        const start = new Date(updates.startDate || existing.startDate);
        const end = new Date(updates.endDate || existing.endDate);
        processedUpdates.totalDays = calculateWorkingDays(start, end);
      }
    }

    await db
      .update(leaveApplications)
      .set(processedUpdates)
      .where(
        and(
          eq(leaveApplications.id, leaveId),
          eq(leaveApplications.organizationId, organization.id),
        ),
      );

    // Get leave details for notifications
    const leave = await getLeaveApplication(leaveId);
    if (leave) {
      // Notify employee when status changes to Approved or Rejected
      if (updates.status === "Approved" || updates.status === "Rejected") {
        const approver = approverId
          ? await db
              .select()
              .from(employees)
              .where(
                and(
                  eq(employees.id, approverId),
                  eq(employees.organizationId, organization.id),
                ),
              )
              .limit(1)
              .then((res) => res[0])
          : null;
        const approverName = approver?.name || "Manager";
        const employee = await getEmployee(leave.userId);

        const startDate = new Date(leave.startDate).toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "numeric",
          },
        );
        const endDate = new Date(leave.endDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        if (updates.status === "Approved" && employee) {
          await createNotification({
            user_id: employee.authId,
            title: "Leave Approved",
            message: `${approverName} approved your ${leave.leaveType} leave • ${startDate} - ${endDate} (${leave.totalDays} days)`,
            notification_type: "approval",
            reference_id: leaveId,
          });
        } else if (updates.status === "Rejected" && employee) {
          const reasonPreview = updates.rejectionReason
            ? ` • ${updates.rejectionReason.substring(0, 80)}${updates.rejectionReason.length > 80 ? "..." : ""}`
            : "";

          await createNotification({
            user_id: employee.authId,
            title: "Leave Rejected",
            message: `${approverName} rejected your ${leave.leaveType} leave request${reasonPreview}`,
            notification_type: "approval",
            reference_id: leaveId,
          });
        }
      }

      // If approved, update leave balance only for Annual leave
      if (updates.status === "Approved" && leave.leaveType === "Annual") {
        const currentYear = new Date().getFullYear();
        // Recalculate balance using global allocation
        await initializeEmployeeBalance(leave.userId, currentYear);
      }
    }

    revalidatePath("/hr/leaves");
    return {
      success: { reason: "Leave application updated successfully" },
      error: null,
    };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error" },
      };
    }

    return {
      error: {
        reason:
          "Couldn't update leave application. Check inputs and try again!",
      },
      success: null,
    };
  }
}

// Delete leave application
export async function deleteLeaveApplication(leaveId: number) {
  await requireAuth();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return {
      success: null,
      error: { reason: "Organization not found" },
    };
  }

  try {
    // Get leave details before deletion for notifications
    const leave = await getLeaveApplication(leaveId);

    await db
      .delete(leaveApplications)
      .where(
        and(
          eq(leaveApplications.id, leaveId),
          eq(leaveApplications.organizationId, organization.id),
        ),
      );

    // Notify approver if leave was pending and had an approver
    if (leave && leave.status === "Pending" && leave.approvedByUserId) {
      const employee = await getEmployee(leave.userId);
      const manager = await getEmployee(leave.approvedByUserId);
      if (employee && manager) {
        const startDate = new Date(leave.startDate).toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "numeric",
          },
        );
        const endDate = new Date(leave.endDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        await createNotification({
          user_id: manager.authId,
          title: "Leave Application Cancelled",
          message: `${employee.name} cancelled their ${leave.leaveType} leave request • ${startDate} - ${endDate}`,
          notification_type: "message",
          reference_id: leaveId,
        });
      }
    }

    revalidatePath("/hr/leaves");
    return {
      success: { reason: "Leave application deleted successfully" },
      error: null,
    };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error" },
      };
    }

    return {
      error: {
        reason: "Couldn't delete leave application. Please try again!",
      },
      success: null,
    };
  }
}

// Get leave balance for an employee
export async function getLeaveBalance(userId: string, year?: number) {
  await requireAuth();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return [];
  }

  const currentYear = year || new Date().getFullYear();
  return await db
    .select()
    .from(leaveBalances)
    .where(
      and(
        eq(leaveBalances.userId, userId),
        eq(leaveBalances.year, currentYear),
        eq(leaveBalances.organizationId, organization.id),
      ),
    );
}

// Update leave balance (only if balance exists)
export async function updateLeaveBalance(
  userId: string,
  leaveType: string,
  usedDays: number,
  year: number,
  organizationId?: string,
) {
  const organization =
    organizationId ||
    (await auth.api
      .getFullOrganization({
        headers: await headers(),
      })
      .then((org) => org?.id));

  if (!organization) {
    return;
  }

  const balance = await db
    .select()
    .from(leaveBalances)
    .where(
      and(
        eq(leaveBalances.userId, userId),
        eq(leaveBalances.leaveType, leaveType as any),
        eq(leaveBalances.year, year),
        eq(leaveBalances.organizationId, organization),
      ),
    )
    .limit(1);

  if (balance.length > 0 && balance[0].totalDays > 0) {
    // Only update if balance exists and has totalDays set
    const newUsedDays = balance[0].usedDays + usedDays;
    const newRemainingDays = balance[0].totalDays - newUsedDays;

    await db
      .update(leaveBalances)
      .set({
        usedDays: newUsedDays,
        remainingDays: newRemainingDays,
        updatedAt: new Date(),
      })
      .where(eq(leaveBalances.id, balance[0].id));
  }
  // If balance doesn't exist, don't create it here - it should be set by admin first
}

// Get annual leave allocation for a year
export async function getAnnualLeaveAllocation(year: number) {
  await requireAuth();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return 30; // Default to 30 if not set
  }

  const setting = await db
    .select()
    .from(annualLeaveSettings)
    .where(
      and(
        eq(annualLeaveSettings.year, year),
        eq(annualLeaveSettings.organizationId, organization.id),
      ),
    )
    .limit(1);

  return setting[0]?.allocatedDays || 30; // Default to 30 if not set
}

// Set annual leave allocation for a year
export async function setAnnualLeaveAllocation(data: {
  allocatedDays: number;
  year: number;
  description?: string;
}) {
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

  try {
    const existing = await db
      .select()
      .from(annualLeaveSettings)
      .where(
        and(
          eq(annualLeaveSettings.year, data.year),
          eq(annualLeaveSettings.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(annualLeaveSettings)
        .set({
          allocatedDays: data.allocatedDays,
          description: data.description || null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(annualLeaveSettings.id, existing[0].id),
            eq(annualLeaveSettings.organizationId, organization.id),
          ),
        );
    } else {
      await db.insert(annualLeaveSettings).values({
        allocatedDays: data.allocatedDays,
        year: data.year,
        description: data.description || null,
        organizationId: organization.id,
      });
    }

    // Recalculate all employee balances for this year
    await recalculateAllEmployeeBalances(data.year, organization.id);

    revalidatePath("/hr/leaves/annual-balances");
    return {
      success: { reason: "Annual leave allocation updated successfully" },
      error: null,
    };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error" },
      };
    }

    return {
      error: {
        reason: "Couldn't update annual leave allocation. Please try again!",
      },
      success: null,
    };
  }
}

// Get all annual leave settings
export async function getAllAnnualLeaveSettings() {
  await requireAuth();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return [];
  }

  return await db
    .select()
    .from(annualLeaveSettings)
    .where(eq(annualLeaveSettings.organizationId, organization.id))
    .orderBy(desc(annualLeaveSettings.year));
}

// Delete annual leave setting
export async function deleteAnnualLeaveSetting(settingId: number) {
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

  try {
    await db
      .delete(annualLeaveSettings)
      .where(
        and(
          eq(annualLeaveSettings.id, settingId),
          eq(annualLeaveSettings.organizationId, organization.id),
        ),
      );

    revalidatePath("/hr/leaves/annual-balances");
    return {
      success: { reason: "Annual leave setting deleted successfully" },
      error: null,
    };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error" },
      };
    }

    return {
      error: {
        reason: "Couldn't delete annual leave setting. Please try again!",
      },
      success: null,
    };
  }
}

// Recalculate used days from approved leaves
async function recalculateUsedDays(
  userId: string,
  year: number,
  organizationId?: string,
) {
  const organization =
    organizationId ||
    (await auth.api
      .getFullOrganization({
        headers: await headers(),
      })
      .then((org) => org?.id));

  if (!organization) {
    return 0;
  }

  // Get all approved annual leaves for this employee in this year
  const approvedLeaves = await db
    .select({
      totalDays: leaveApplications.totalDays,
    })
    .from(leaveApplications)
    .where(
      and(
        eq(leaveApplications.userId, userId),
        eq(leaveApplications.leaveType, "Annual"),
        eq(leaveApplications.status, "Approved"),
        eq(leaveApplications.organizationId, organization),
        gte(leaveApplications.startDate, `${year}-01-01`),
        lte(leaveApplications.startDate, `${year}-12-31`),
      ),
    );

  // Sum up all approved leave days
  const totalUsedDays = approvedLeaves.reduce(
    (sum, leave) => sum + (leave.totalDays || 0),
    0,
  );

  return totalUsedDays;
}

// Recalculate balances for all employees for a year
async function recalculateAllEmployeeBalances(
  year: number,
  organizationId?: string,
) {
  const organization =
    organizationId ||
    (await auth.api
      .getFullOrganization({
        headers: await headers(),
      })
      .then((org) => org?.id));

  if (!organization) {
    return;
  }

  const allocatedDays = await getAnnualLeaveAllocation(year);
  const allEmployees = await db
    .select({ id: employees.authId })
    .from(employees)
    .where(eq(employees.organizationId, organization));

  for (const employee of allEmployees) {
    const usedDays = await recalculateUsedDays(employee.id, year, organization);
    const remainingDays = allocatedDays - usedDays;

    const balance = await db
      .select()
      .from(leaveBalances)
      .where(
        and(
          eq(leaveBalances.userId, employee.id),
          eq(leaveBalances.leaveType, "Annual"),
          eq(leaveBalances.year, year),
          eq(leaveBalances.organizationId, organization),
        ),
      )
      .limit(1);

    if (balance.length > 0) {
      await db
        .update(leaveBalances)
        .set({
          totalDays: allocatedDays,
          usedDays,
          remainingDays,
          updatedAt: new Date(),
        })
        .where(eq(leaveBalances.id, balance[0].id));
    } else {
      await db.insert(leaveBalances).values({
        userId: employee.id,
        leaveType: "Annual",
        totalDays: allocatedDays,
        usedDays,
        remainingDays,
        year,
        organizationId: organization,
      });
    }
  }
}

// Initialize or update employee balance (uses global allocation)
export async function initializeEmployeeBalance(
  userId: string,
  year: number,
  organizationId?: string,
) {
  const organization =
    organizationId ||
    (await auth.api
      .getFullOrganization({
        headers: await headers(),
      })
      .then((org) => org?.id));

  if (!organization) {
    return;
  }

  const allocatedDays = await getAnnualLeaveAllocation(year);
  const usedDays = await recalculateUsedDays(userId, year, organization);
  const remainingDays = allocatedDays - usedDays;

  const balance = await db
    .select()
    .from(leaveBalances)
    .where(
      and(
        eq(leaveBalances.userId, userId),
        eq(leaveBalances.leaveType, "Annual"),
        eq(leaveBalances.year, year),
        eq(leaveBalances.organizationId, organization),
      ),
    )
    .limit(1);

  if (balance.length > 0) {
    await db
      .update(leaveBalances)
      .set({
        totalDays: allocatedDays,
        usedDays,
        remainingDays,
        updatedAt: new Date(),
      })
      .where(eq(leaveBalances.id, balance[0].id));
  } else {
    await db.insert(leaveBalances).values({
      userId,
      leaveType: "Annual",
      totalDays: allocatedDays,
      usedDays,
      remainingDays,
      year,
      organizationId: organization,
    });
  }
}

// Get leave types
export async function getLeaveTypes() {
  await requireAuth();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return [];
  }

  return await db
    .select()
    .from(leaveTypes)
    .where(
      and(
        eq(leaveTypes.isActive, true),
        eq(leaveTypes.organizationId, organization.id),
      ),
    )
    .orderBy(asc(leaveTypes.name));
}

// Create leave type
export async function createLeaveType(data: {
  name: string;
  description?: string;
  maxDays?: number;
  requiresApproval?: boolean;
}) {
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

  try {
    await db.insert(leaveTypes).values({
      name: data.name,
      description: data.description || null,
      maxDays: data.maxDays || null,
      requiresApproval: data.requiresApproval ?? true,
      isActive: true,
      organizationId: organization.id,
    });

    revalidatePath("/hr/leaves");
    return {
      success: { reason: "Leave type created successfully" },
      error: null,
    };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error" },
      };
    }

    return {
      error: {
        reason: "Couldn't create leave type. Please try again!",
      },
      success: null,
    };
  }
}

// Update leave type
export async function updateLeaveType(
  leaveTypeId: number,
  updates: Partial<{
    name: string;
    description: string;
    maxDays: number;
    requiresApproval: boolean;
    isActive: boolean;
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

  try {
    const processedUpdates: any = { ...updates, updatedAt: new Date() };

    await db
      .update(leaveTypes)
      .set(processedUpdates)
      .where(
        and(
          eq(leaveTypes.id, leaveTypeId),
          eq(leaveTypes.organizationId, organization.id),
        ),
      );

    revalidatePath("/hr/leaves");
    return {
      success: { reason: "Leave type updated successfully" },
      error: null,
    };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error" },
      };
    }

    return {
      error: {
        reason: "Couldn't update leave type. Please try again!",
      },
      success: null,
    };
  }
}

// Delete leave type
export async function deleteLeaveType(leaveTypeId: number) {
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

  try {
    await db
      .delete(leaveTypes)
      .where(
        and(
          eq(leaveTypes.id, leaveTypeId),
          eq(leaveTypes.organizationId, organization.id),
        ),
      );

    revalidatePath("/hr/leaves");
    return {
      success: { reason: "Leave type deleted successfully" },
      error: null,
    };
  } catch (err) {
    if (err instanceof DrizzleQueryError) {
      return {
        success: null,
        error: { reason: err.cause?.message || "Database error" },
      };
    }

    return {
      error: {
        reason: "Couldn't delete leave type. Please try again!",
      },
      success: null,
    };
  }
}
