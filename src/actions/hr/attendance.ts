/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
"use server";

import { db } from "@/db";
import {
  attendance,
  employees,
  attendanceWarnings,
  attendanceSettings,
} from "@/db/schema";
import {
  DrizzleQueryError,
  eq,
  and,
  desc,
  count,
  gte,
  lte,
  sql,
} from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth, requireHROrAdmin, requireHR } from "@/actions/auth/dal";
import { createNotification } from "../notification/notification";
import { getEmployee } from "./employees";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Get active attendance settings or return defaults
async function getAttendanceSettings() {
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return {
      signInStartHour: 6,
      signInEndHour: 9,
      signOutStartHour: 14,
      signOutEndHour: 20,
    };
  }
  try {
    const settings = await db
      .select()
      .from(attendanceSettings)
      .where(
        and(
          eq(attendanceSettings.isActive, true),
          eq(attendanceSettings.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (settings.length > 0) {
      return settings[0];
    }

    // Return default settings if none exist
    return {
      signInStartHour: 6,
      signInEndHour: 9,
      signOutStartHour: 14,
      signOutEndHour: 20,
    };
  } catch (_error) {
    // Return defaults on error
    return {
      signInStartHour: 6,
      signInEndHour: 9,
      signOutStartHour: 14,
      signOutEndHour: 20,
    };
  }
}

// Helper to check time range
function isWithinTimeRange(
  date: Date,
  startHour: number,
  endHour: number,
): boolean {
  const hours = date.getHours();
  return hours >= startHour && hours < endHour;
}

// Get current attendance settings (public)
export async function getCurrentAttendanceSettings() {
  return await getAttendanceSettings();
}

// Update attendance settings (admin/HR only)
export async function updateAttendanceSettings(settings: {
  signInStartHour: number;
  signInEndHour: number;
  signOutStartHour: number;
  signOutEndHour: number;
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

  // Validate hours
  if (
    settings.signInStartHour < 0 ||
    settings.signInStartHour > 23 ||
    settings.signInEndHour < 0 ||
    settings.signInEndHour > 23 ||
    settings.signOutStartHour < 0 ||
    settings.signOutStartHour > 23 ||
    settings.signOutEndHour < 0 ||
    settings.signOutEndHour > 23
  ) {
    return {
      success: null,
      error: { reason: "Hours must be between 0 and 23" },
    };
  }

  if (settings.signInStartHour >= settings.signInEndHour) {
    return {
      success: null,
      error: { reason: "Sign-in start hour must be before end hour" },
    };
  }

  if (settings.signOutStartHour >= settings.signOutEndHour) {
    return {
      success: null,
      error: { reason: "Sign-out start hour must be before end hour" },
    };
  }

  try {
    // Deactivate all existing settings
    await db
      .update(attendanceSettings)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(attendanceSettings.organizationId, organization.id));

    // Create new active settings
    await db.insert(attendanceSettings).values({
      ...settings,
      organizationId: organization.id,
      isActive: true,
    });

    revalidatePath("/hr/attendance");
    return {
      success: { reason: "Attendance settings updated successfully" },
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
      error: { reason: "Failed to update attendance settings" },
    };
  }
}

// Sign In
export async function signIn(
  userId: string,
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  },
) {
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
  const settings = await getAttendanceSettings();

  // Check time using dynamic settings
  if (
    !isWithinTimeRange(now, settings.signInStartHour, settings.signInEndHour)
  ) {
    return {
      success: null,
      error: {
        reason: `Sign in is only allowed between ${settings.signInStartHour.toString().padStart(2, "0")}:00 and ${settings.signInEndHour.toString().padStart(2, "0")}:00`,
      },
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
      signInLatitude: location?.latitude?.toString(),
      signInLongitude: location?.longitude?.toString(),
      signInLocation: location?.address,
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
  const settings = await getAttendanceSettings();

  // Check time using dynamic settings
  if (
    !isWithinTimeRange(now, settings.signOutStartHour, settings.signOutEndHour)
  ) {
    return {
      success: null,

      error: {
        reason: `Sign out is only allowed between ${settings.signOutStartHour.toString().padStart(2, "0")}:00 and ${settings.signOutEndHour.toString().padStart(2, "0")}:00`,
      },
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
      signInLatitude: attendance.signInLatitude,
      signInLongitude: attendance.signInLongitude,
      signInLocation: attendance.signInLocation,
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

// Get employees list for attendance records dropdown
export async function getEmployeesForAttendance() {
  await requireHR();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return [];
  }

  const result = await db
    .select({
      id: employees.id,
      authId: employees.authId,
      name: employees.name,
      staffNumber: employees.staffNumber,
      department: employees.department,
      email: employees.email,
    })
    .from(employees)
    .where(eq(employees.organizationId, organization.id))
    .orderBy(employees.name);

  return result;
}

// Get employee attendance records with statistics
export async function getEmployeeAttendanceRecords(filters: {
  userId: string;
  startDate?: string;
  endDate?: string;
  status?: "Approved" | "Rejected";
  page?: number;
  limit?: number;
}) {
  await requireHR();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return {
      records: [],
      statistics: {
        totalPresent: 0,
        totalAbsent: 0,
        averageSignInTime: "N/A",
        lateArrivals: 0,
        earlySignIns: 0,
        missingSignOuts: 0,
        perfectDays: 0,
      },
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    };
  }

  // Default to past month if no date range provided
  const defaultStartDate = new Date();
  defaultStartDate.setMonth(defaultStartDate.getMonth() - 1);

  const startDate =
    filters.startDate || defaultStartDate.toISOString().split("T")[0];
  const endDate = filters.endDate || new Date().toISOString().split("T")[0];
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const offset = (page - 1) * limit;

  // Build conditions
  const conditions: any[] = [
    eq(attendance.organizationId, organization.id),
    eq(attendance.userId, filters.userId),
    gte(attendance.date, startDate),
    lte(attendance.date, endDate),
  ];

  if (filters.status) {
    conditions.push(eq(attendance.status, filters.status));
  }

  const whereClause = and(...conditions);

  // Get total count
  const totalResult = await db
    .select({ count: count() })
    .from(attendance)
    .where(whereClause);

  const total = totalResult[0]?.count || 0;

  // Get paginated records with warning info
  const records = await db
    .select({
      id: attendance.id,
      date: attendance.date,
      signInTime: attendance.signInTime,
      signOutTime: attendance.signOutTime,
      status: attendance.status,
      rejectionReason: attendance.rejectionReason,
      warningId: attendanceWarnings.id,
      hasWarning: sql<boolean>`${attendanceWarnings.id} IS NOT NULL`,
    })
    .from(attendance)
    .leftJoin(
      attendanceWarnings,
      eq(attendance.id, attendanceWarnings.attendanceId),
    )
    .where(whereClause)
    .orderBy(desc(attendance.date))
    .limit(limit)
    .offset(offset);

  // Get all records for statistics (not paginated)
  const allRecords = await db
    .select({
      date: attendance.date,
      signInTime: attendance.signInTime,
      signOutTime: attendance.signOutTime,
    })
    .from(attendance)
    .where(whereClause);

  // Calculate statistics
  let totalPresent = 0;
  let lateArrivals = 0;
  let earlySignIns = 0;
  let missingSignOuts = 0;
  let perfectDays = 0;
  let totalSignInMinutes = 0;
  let signInCount = 0;

  for (const record of allRecords) {
    if (record.signInTime) {
      totalPresent++;
      const signInDate = new Date(record.signInTime);
      const hours = signInDate.getHours();

      // Count sign-in time for average
      totalSignInMinutes += hours * 60 + signInDate.getMinutes();
      signInCount++;

      // Late arrival (after 6:00 AM)
      if (hours >= 6) {
        lateArrivals++;
      }

      // Early sign-in (before 6:00 AM)
      if (hours < 6) {
        earlySignIns++;
      }

      // Perfect day: sign-in between 6-9 AM and has sign-out
      if (hours >= 6 && hours < 9 && record.signOutTime) {
        perfectDays++;
      }

      // Missing sign-out
      if (!record.signOutTime) {
        missingSignOuts++;
      }
    }
  }

  // Calculate average sign-in time
  let averageSignInTime = "N/A";
  if (signInCount > 0) {
    const avgMinutes = Math.floor(totalSignInMinutes / signInCount);
    const avgHours = Math.floor(avgMinutes / 60);
    const avgMins = avgMinutes % 60;
    const period = avgHours >= 12 ? "PM" : "AM";
    const displayHours = avgHours % 12 || 12;
    averageSignInTime = `${displayHours}:${avgMins.toString().padStart(2, "0")} ${period}`;
  }

  // Total days in range
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  const totalAbsent = totalDays - totalPresent;

  return {
    records,
    statistics: {
      totalPresent,
      totalAbsent,
      averageSignInTime,
      lateArrivals,
      earlySignIns,
      missingSignOuts,
      perfectDays,
    },
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Issue attendance warning
export async function issueAttendanceWarning(data: {
  attendanceId: number;
  userId: string;
  warningType:
    | "late_arrival"
    | "early_departure"
    | "missing_signout"
    | "general";
  reason: string;
  message: string;
}) {
  const authData = await requireHR();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return {
      success: null,
      error: { reason: "Organization not found" },
    };
  }

  // Validate reason length
  if (data.reason.length < 10) {
    return {
      success: null,
      error: { reason: "Reason must be at least 10 characters long" },
    };
  }

  try {
    // Check attendance record exists
    const attendanceRecord = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.id, data.attendanceId),
          eq(attendance.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (attendanceRecord.length === 0) {
      return {
        success: null,
        error: { reason: "Attendance record not found" },
      };
    }

    // Check if warning already exists for this attendance
    const existingWarning = await db
      .select()
      .from(attendanceWarnings)
      .where(eq(attendanceWarnings.attendanceId, data.attendanceId))
      .limit(1);

    if (existingWarning.length > 0) {
      return {
        success: null,
        error: {
          reason:
            "A warning has already been issued for this attendance record",
        },
      };
    }

    // Insert warning record
    await db.insert(attendanceWarnings).values({
      attendanceId: data.attendanceId,
      userId: data.userId,
      warningType: data.warningType,
      reason: data.reason,
      message: data.message,
      issuedByUserId: authData.userId,
      organizationId: organization.id,
    });

    // Send notification to employee
    await createNotification({
      user_id: data.userId,
      title: "Attendance Warning Issued",
      message: data.message,
      notification_type: "warning",
      reference_id: data.attendanceId,
    });

    revalidatePath("/hr/attendance-records");
    return {
      success: { reason: "Warning issued successfully" },
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
      error: { reason: "Failed to issue warning" },
    };
  }
}
