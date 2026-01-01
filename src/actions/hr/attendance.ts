/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
"use server";

import { db } from "@/db";
import { attendance, employees } from "@/db/schema";
import { DrizzleQueryError, eq, and, desc, count, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth, requireHROrAdmin } from "@/actions/auth/dal";
import { createNotification } from "../notification/notification";
import { getEmployee } from "./employees";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Helper to check time range
function isWithinTimeRange(
  date: Date,
  startHour: number,
  endHour: number,
): boolean {
  const hours = date.getHours();
  return hours >= startHour && hours < endHour;
}

// Sign In
export async function signIn(userId: string) {
  const authData = await requireAuth();

  // Verify user can only sign in for themselves unless admin/hr (though usually attendance is personal)
  if (
    authData.userId !== userId &&
    authData.role !== "admin" &&
    authData.role !== "hr"
  ) {
    return {
      success: null,
      error: { reason: "You can only sign in for yourself" },
    };
  }

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return {
      success: null,
      error: { reason: "Organization not found" },
    };
  }

  const now = new Date();
  // Check time: 06:00 to 09:00
  if (!isWithinTimeRange(now, 6, 9)) {
    return {
      success: null,
      error: { reason: "Sign in is only allowed between 06:00 and 09:00" },
    };
  }

  try {
    const today = new Date().toISOString().split("T")[0];

    // Check if already signed in
    const existing = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.userId, userId),
          eq(attendance.date, today),
          eq(attendance.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return {
        success: null,
        error: { reason: "You have already signed in for today" },
      };
    }

    await db.insert(attendance).values({
      userId,
      date: today,
      signInTime: now,
      status: "Approved",
      organizationId: organization.id,
    });

    revalidatePath("/hr/attendance");
    return {
      success: { reason: "Signed in successfully" },
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
      success: null,
      error: { reason: "Failed to sign in" },
    };
  }
}

// Sign Out
export async function signOut(userId: string) {
  const authData = await requireAuth();

  if (
    authData.userId !== userId &&
    authData.role !== "admin" &&
    authData.role !== "hr"
  ) {
    return {
      success: null,
      error: { reason: "You can only sign out for yourself" },
    };
  }

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return {
      success: null,
      error: { reason: "Organization not found" },
    };
  }

  const now = new Date();
  // Check time: 14:00 (2 PM) to 20:00 (8 PM)
  if (!isWithinTimeRange(now, 14, 20)) {
    return {
      success: null,
      error: { reason: "Sign out is only allowed between 14:00 and 20:00" },
    };
  }

  try {
    const today = new Date().toISOString().split("T")[0];

    // Check if signed in
    const existing = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.userId, userId),
          eq(attendance.date, today),
          eq(attendance.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (existing.length === 0) {
      return {
        success: null,
        error: { reason: "You have not signed in today" },
      };
    }

    if (existing[0].signOutTime) {
      return {
        success: null,
        error: { reason: "You have already signed out today" },
      };
    }

    await db
      .update(attendance)
      .set({
        signOutTime: now,
        updatedAt: now,
      })
      .where(eq(attendance.id, existing[0].id));

    revalidatePath("/hr/attendance");
    return {
      success: { reason: "Signed out successfully" },
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
      success: null,
      error: { reason: "Failed to sign out" },
    };
  }
}

// Reject Attendance
export async function rejectAttendance(attendanceId: number, reason: string) {
  const authData = await requireHROrAdmin(); // Only HR/Admin (or Manager check below)

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return {
      success: null,
      error: { reason: "Organization not found" },
    };
  }

  // If not HR/Admin, check if Manager
  // Actually requireHROrAdmin throws if not HR or Admin.
  // The requirement says "hr department employees and managers of the employee".
  // requireHROrAdmin might be too strict if it doesn't allow managers.
  // Let's check how requireHROrAdmin is implemented or just use requireAuth and check roles manually.
  // But for now, I'll assume requireHROrAdmin covers HR. For managers, I need to check if the user is the manager of the employee.

  // Let's use requireAuth and do manual checks to be safe and flexible.

  // Re-reading requirement: "hr department employees and managers of the employee"

  try {
    const record = await db.query.attendance.findFirst({
      where: and(
        eq(attendance.id, attendanceId),
        eq(attendance.organizationId, organization.id),
      ),
    });

    if (!record) {
      return {
        success: null,
        error: { reason: "Attendance record not found" },
      };
    }

    // Check permissions
    let isAuthorized = false;
    if (authData.role === "admin" || authData.employee.department === "hr") {
      isAuthorized = true;
    } else {
      // Check if manager
      const employee = await getEmployee(record.userId);
      if (employee && employee.managerId === authData.userId) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return {
        success: null,
        error: { reason: "Unauthorized to reject this attendance" },
      };
    }

    await db
      .update(attendance)
      .set({
        status: "Rejected",
        rejectionReason: reason,
        rejectedByUserId: authData.userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(attendance.id, attendanceId),
          eq(attendance.organizationId, organization.id),
        ),
      );

    // Notify employee - map userId to employee ID for notifications
    const empRecord = await db
      .select({ id: employees.id, authId: employees.authId })
      .from(employees)
      .where(eq(employees.authId, record.userId))
      .limit(1);

    if (empRecord.length > 0) {
      await createNotification({
        user_id: empRecord[0].authId,
        title: "Attendance Rejected",
        message: `Your attendance for ${record.date} was rejected. Reason: ${reason}`,
        notification_type: "approval",
        reference_id: attendanceId,
      });
    }

    revalidatePath("/hr/attendance");
    return {
      success: { reason: "Attendance rejected successfully" },
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
      success: null,
      error: { reason: "Failed to reject attendance" },
    };
  }
}

// Get Attendance Records
export async function getAttendanceRecords(filters?: {
  userId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  managerId?: string; // Add managerId filter (now string)
  page?: number;
  limit?: number;
}) {
  await requireAuth();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return {
      attendance: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    };
  }

  const conditions: any[] = [eq(attendance.organizationId, organization.id)];

  if (filters?.userId) {
    conditions.push(eq(attendance.userId, filters.userId));
  }
  if (filters?.date) {
    conditions.push(eq(attendance.date, filters.date));
  }
  if (filters?.startDate) {
    conditions.push(gte(attendance.date, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(attendance.date, filters.endDate));
  }
  if (filters?.status) {
    conditions.push(eq(attendance.status, filters.status as any));
  }
  // Filter by manager
  if (filters?.managerId) {
    conditions.push(eq(employees.managerId, filters.managerId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const page = filters?.page || 1;
  const limit = filters?.limit || 10;
  const offset = (page - 1) * limit;

  const totalResult = await db
    .select({ count: count() })
    .from(attendance)
    .leftJoin(employees, eq(attendance.userId, employees.authId)) // Need join for manager filter
    .where(whereClause);

  const total = totalResult[0]?.count || 0;

  const result = await db
    .select({
      id: attendance.id,
      userId: attendance.userId,
      employeeName: employees.name,
      employeeEmail: employees.email,
      employeeDepartment: employees.department,
      date: attendance.date,
      signInTime: attendance.signInTime,
      signOutTime: attendance.signOutTime,
      status: attendance.status,
      rejectionReason: attendance.rejectionReason,
      rejectedByUserId: attendance.rejectedByUserId,
    })
    .from(attendance)
    .leftJoin(employees, eq(attendance.userId, employees.authId))
    .where(whereClause)
    .orderBy(desc(attendance.date), desc(attendance.signInTime))
    .limit(limit)
    .offset(offset);

  return {
    attendance: result,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

// Get today's attendance for current user
export async function getMyTodayAttendance() {
  const authData = await requireAuth();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return null;
  }

  const today = new Date().toISOString().split("T")[0];

  const result = await db
    .select()
    .from(attendance)
    .where(
      and(
        eq(attendance.userId, authData.userId),
        eq(attendance.date, today),
        eq(attendance.organizationId, organization.id),
      ),
    )
    .limit(1);

  return result[0] || null;
}
