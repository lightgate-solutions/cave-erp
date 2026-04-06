import { HrStatsCards } from "@/components/hr/dashboard/hr-stats-cards";
import { RecentActivities } from "@/components/hr/dashboard/recent-activities";
import { UpcomingBirthdays } from "@/components/hr/dashboard/upcoming-birthdays";
import { QuickActions } from "@/components/hr/dashboard/quick-actions";
import { HrDashboardTabs } from "@/components/hr/dashboard/hr-dashboard-tabs";
import { DepartmentDistributionChart } from "@/components/hr/dashboard/department-distribution-chart";
import { LeaveTrendsChart } from "@/components/hr/dashboard/leave-trends-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp } from "lucide-react";
import { db } from "@/db";
import { employees, leaveApplications, attendance } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { and, eq, gte, lte, sql, count, desc } from "drizzle-orm";

interface HrDashboardProps {
  isManager?: boolean;
}

export default async function HrDashboard({
  isManager = false,
}: HrDashboardProps) {
  // Fetch data server-side (server-side-performance)
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  const organization = await auth.api.getFullOrganization({ headers: h });

  if (!session?.user || !organization) {
    return (
      <div className="flex flex-1 flex-col gap-8 p-6 md:p-8 lg:p-10">
        <p>Unauthorized. Please log in.</p>
      </div>
    );
  }

  const organizationId = organization.id;
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(now.getMonth() - 6);

  // Parallelize all data fetching (async-parallel)
  const [
    totalEmployees,
    newHires,
    pendingLeaves,
    activeLeaves,
    pendingAttendance,
    departmentDistribution,
    employmentTypeDistribution,
    recentLeaves,
    upcomingBirthdaysRaw,
    leaveTrends,
    teamMembers,
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

    // Active leave applications
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

    // Pending attendance
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

    // Recent leave applications
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

    // Upcoming birthdays
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
      ),

    // Leave trends
    db
      .select({
        month: sql<string>`TO_CHAR(${leaveApplications.createdAt}, 'Mon')`,
        year: sql<number>`EXTRACT(YEAR FROM ${leaveApplications.createdAt})`,
        monthNum: sql<number>`EXTRACT(MONTH FROM ${leaveApplications.createdAt})`,
        approved: count(
          sql`CASE WHEN ${leaveApplications.status} = 'Approved' THEN 1 END`,
        ),
        pending: count(
          sql`CASE WHEN ${leaveApplications.status} = 'Pending' THEN 1 END`,
        ),
        rejected: count(
          sql`CASE WHEN ${leaveApplications.status} = 'Rejected' THEN 1 END`,
        ),
        total: count(),
      })
      .from(leaveApplications)
      .where(
        and(
          eq(leaveApplications.organizationId, organizationId),
          gte(leaveApplications.createdAt, sixMonthsAgo),
        ),
      )
      .groupBy(
        sql`TO_CHAR(${leaveApplications.createdAt}, 'Mon')`,
        sql`EXTRACT(YEAR FROM ${leaveApplications.createdAt})`,
        sql`EXTRACT(MONTH FROM ${leaveApplications.createdAt})`,
      )
      .orderBy(
        sql`EXTRACT(YEAR FROM ${leaveApplications.createdAt})`,
        sql`EXTRACT(MONTH FROM ${leaveApplications.createdAt})`,
      ),

    // Team members (if manager)
    isManager
      ? fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/hr/employees/subordinates`,
          { headers: h },
        )
          .then((res) => (res.ok ? res.json() : { subordinates: [] }))
          .then((data) => data.subordinates || [])
          .catch(() => [])
      : Promise.resolve([]),
  ]);

  // Process birthdays
  const upcomingBirthdays = upcomingBirthdaysRaw
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
        (nextBirthday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysUntil <= 30) {
        return { ...emp, daysUntil, nextBirthday };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => (a?.daysUntil || 0) - (b?.daysUntil || 0))
    .slice(0, 5);

  const stats = {
    totalEmployees: totalEmployees[0]?.count || 0,
    newHires: newHires[0]?.count || 0,
    pendingLeaves: pendingLeaves[0]?.count || 0,
    activeLeaves: activeLeaves[0]?.count || 0,
    pendingAttendance: pendingAttendance[0]?.count || 0,
  };

  return (
    <div className="flex flex-1 flex-col gap-8 p-6 md:p-8 lg:p-10">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-bold tracking-tight">HR Dashboard</h1>
          {isManager && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Manager View
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1.5">
          Comprehensive overview of human resources, employee metrics, and
          organizational health.
        </p>
      </div>

      {/* Key Metrics */}
      <HrStatsCards stats={stats} isLoading={false} />

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DepartmentDistributionChart
          data={departmentDistribution}
          isLoading={false}
        />
        <LeaveTrendsChart data={leaveTrends} isLoading={false} />
      </div>

      {/* Analytics Tabs - Client Component */}
      <HrDashboardTabs
        departmentData={departmentDistribution}
        employmentTypeData={employmentTypeDistribution}
      />

      {/* Manager Section */}
      {isManager && teamMembers && teamMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5" />
              My Team Members
            </CardTitle>
            <CardDescription>
              Direct reports and their performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {teamMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Users className="size-12 mb-2 opacity-50" />
                <p className="text-sm">No team members found</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {teamMembers.map((member: any) => (
                  <Card key={member.id} className="border-border/40">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">
                            {member.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.role || "Employee"}
                          </p>
                          {member.department && (
                            <Badge variant="secondary" className="mt-2 text-xs">
                              {member.department}
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                            <TrendingUp className="size-3" />
                            {member.tasksCompleted || 0}
                          </div>
                          <p className="text-xs text-muted-foreground">tasks</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Activities and Events */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentActivities activities={recentLeaves} isLoading={false} />
        <UpcomingBirthdays
          birthdays={upcomingBirthdays as any}
          isLoading={false}
        />
      </div>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
}
