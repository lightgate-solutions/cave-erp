import { NextResponse } from "next/server";
import { db } from "@/db";
import { employees, leaveApplications, attendance } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { and, eq, gte, lte, sql, count, desc } from "drizzle-orm";

export async function GET() {
  try {
    const h = await headers();
    const session = await auth.api.getSession({ headers: h });
    const organization = await auth.api.getFullOrganization({ headers: h });

    if (!session?.user || !organization) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = organization.id;
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Parallelize all independent database queries (async-parallel)
    const [
      totalEmployees,
      newHires,
      pendingLeaves,
      activeLeaves,
      pendingAttendance,
      departmentDistribution,
      employmentTypeDistribution,
      recentLeaves,
      upcomingBirthdays,
    ] = await Promise.all([
      // Total active employees
      db
        .select({ count: count() })
        .from(employees)
        .where(
          and(
            eq(employees.organizationId, organizationId),
            eq(employees.status, "active"),
          ),
        ),

      // New hires this month
      db
        .select({ count: count() })
        .from(employees)
        .where(
          and(
            eq(employees.organizationId, organizationId),
            gte(employees.createdAt, firstDayOfMonth),
            lte(employees.createdAt, lastDayOfMonth),
          ),
        ),

      // Pending leave applications
      db
        .select({ count: count() })
        .from(leaveApplications)
        .where(
          and(
            eq(leaveApplications.organizationId, organizationId),
            eq(leaveApplications.status, "Pending"),
          ),
        ),

      // Active leave applications (approved and ongoing)
      db
        .select({ count: count() })
        .from(leaveApplications)
        .where(
          and(
            eq(leaveApplications.organizationId, organizationId),
            eq(leaveApplications.status, "Approved"),
            lte(leaveApplications.startDate, now.toDateString()),
            gte(leaveApplications.endDate, now.toDateString()),
          ),
        ),

      // Pending attendance approvals (waiting for review)
      db
        .select({ count: count() })
        .from(attendance)
        .where(
          and(
            eq(attendance.organizationId, organizationId),
            sql`${attendance.status} IS NULL`,
          ),
        ),

      // Department distribution
      db
        .select({
          department: employees.department,
          count: count(),
        })
        .from(employees)
        .where(
          and(
            eq(employees.organizationId, organizationId),
            eq(employees.status, "active"),
          ),
        )
        .groupBy(employees.department),

      // Employment type distribution
      db
        .select({
          department: employees.employmentType,
          count: count(),
        })
        .from(employees)
        .where(
          and(
            eq(employees.organizationId, organizationId),
            eq(employees.status, "active"),
            sql`${employees.employmentType} IS NOT NULL`,
          ),
        )
        .groupBy(employees.employmentType),

      // Recent leave applications (last 5)
      db
        .select({
          id: leaveApplications.id,
          employeeName: employees.name,
          leaveType: leaveApplications.leaveType,
          startDate: leaveApplications.startDate,
          endDate: leaveApplications.endDate,
          status: leaveApplications.status,
          createdAt: leaveApplications.createdAt,
        })
        .from(leaveApplications)
        .leftJoin(employees, eq(leaveApplications.userId, employees.authId))
        .where(eq(leaveApplications.organizationId, organizationId))
        .orderBy(desc(leaveApplications.createdAt))
        .limit(5),

      // Upcoming birthdays (next 30 days)
      db
        .select({
          id: employees.id,
          name: employees.name,
          dateOfBirth: employees.dateOfBirth,
          department: employees.department,
        })
        .from(employees)
        .where(
          and(
            eq(employees.organizationId, organizationId),
            eq(employees.status, "active"),
            sql`${employees.dateOfBirth} IS NOT NULL`,
          ),
        )
        .then((emps) => {
          return emps
            .map((emp) => {
              if (!emp.dateOfBirth) return null;
              const birthDate = new Date(emp.dateOfBirth);
              const nextBirthday = new Date(
                now.getFullYear(),
                birthDate.getMonth(),
                birthDate.getDate(),
              );

              if (nextBirthday < now) {
                nextBirthday.setFullYear(now.getFullYear() + 1);
              }

              const daysUntil = Math.ceil(
                (nextBirthday.getTime() - now.getTime()) /
                  (1000 * 60 * 60 * 24),
              );

              if (daysUntil <= 30) {
                return { ...emp, daysUntil, nextBirthday };
              }
              return null;
            })
            .filter(Boolean)
            .sort((a, b) => (a?.daysUntil || 0) - (b?.daysUntil || 0))
            .slice(0, 5);
        }),
    ]);

    return NextResponse.json({
      stats: {
        totalEmployees: totalEmployees[0]?.count || 0,
        newHires: newHires[0]?.count || 0,
        pendingLeaves: pendingLeaves[0]?.count || 0,
        activeLeaves: activeLeaves[0]?.count || 0,
        pendingAttendance: pendingAttendance[0]?.count || 0,
      },
      departmentDistribution,
      employmentTypeDistribution,
      recentLeaves,
      upcomingBirthdays,
    });
  } catch (error) {
    console.error("Error fetching HR dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 },
    );
  }
}
