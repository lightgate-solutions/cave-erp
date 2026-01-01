import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { employees } from "@/db/schema/hr";
import { tasks } from "@/db/schema/tasks/tasks";
import { eq, and, sql, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const h = await headers();
    const session = await auth.api.getSession({ headers: h });
    const authUserId = session?.user?.id;

    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get organization context
    const organization = await auth.api.getFullOrganization({
      headers: h,
    });
    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 403 },
      );
    }

    // Get manager employee info
    const employeeResult = await db
      .select({
        id: employees.id,
        authId: employees.authId,
        isManager: employees.isManager,
      })
      .from(employees)
      .where(
        and(
          eq(employees.authId, authUserId),
          eq(employees.organizationId, organization.id),
        ),
      )
      .limit(1);

    const employee = employeeResult[0];
    if (!employee || !employee.isManager || !employee.authId) {
      return NextResponse.json(
        { error: "Forbidden - Manager access required" },
        { status: 403 },
      );
    }

    // Get subordinates (team members) in the same organization
    const subordinates = await db
      .select({
        id: employees.id,
        authId: employees.authId,
        name: employees.name,
        email: employees.email,
        department: employees.department,
        role: employees.role,
      })
      .from(employees)
      .where(
        and(
          eq(employees.managerId, employee.authId),
          eq(employees.isManager, false),
          eq(employees.organizationId, organization.id),
        ),
      );

    // Get task counts for each team member
    const teamMemberIds = subordinates
      .map((s) => s.authId)
      .filter((id): id is string => id !== null);

    if (teamMemberIds.length === 0) {
      return NextResponse.json({ teamMembers: [] });
    }

    // Get completed tasks for each team member in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // Get task stats for each team member (filtered by organization)
    const taskStats = await db
      .select({
        userId: tasks.assignedTo,
        tasksCompleted: sql<number>`COUNT(*) FILTER (WHERE ${tasks.status} = 'Completed' AND ${tasks.createdAt} >= ${thirtyDaysAgo})`,
        totalCompleted: sql<number>`COUNT(*) FILTER (WHERE ${tasks.status} = 'Completed')`,
      })
      .from(tasks)
      .where(
        and(
          inArray(tasks.assignedTo, teamMemberIds),
          eq(tasks.assignedBy, employee.authId),
          eq(tasks.organizationId, organization.id),
        ),
      )
      .groupBy(tasks.assignedTo);

    // Calculate performance for each team member
    const taskMap = new Map<
      string,
      { tasksCompleted: number; totalCompleted: number }
    >();

    for (const row of taskStats) {
      if (row.userId) {
        taskMap.set(row.userId, {
          tasksCompleted: Number(row.tasksCompleted || 0),
          totalCompleted: Number(row.totalCompleted || 0),
        });
      }
    }

    // Get total tasks assigned to each member to calculate performance (filtered by organization)
    const totalTasksByMember = await db
      .select({
        userId: tasks.assignedTo,
        totalTasks: sql<number>`COUNT(*)`,
      })
      .from(tasks)
      .where(
        and(
          inArray(tasks.assignedTo, teamMemberIds),
          eq(tasks.assignedBy, employee.authId),
          eq(tasks.organizationId, organization.id),
        ),
      )
      .groupBy(tasks.assignedTo);

    const totalTasksMap = new Map<string, number>();
    for (const row of totalTasksByMember) {
      if (row.userId) {
        totalTasksMap.set(row.userId, Number(row.totalTasks || 0));
      }
    }

    // Format team members with performance
    const teamMembers = subordinates.map((member) => {
      const stats = taskMap.get(member.authId || "") || {
        tasksCompleted: 0,
        totalCompleted: 0,
      };
      const totalTasks = totalTasksMap.get(member.authId || "") || 0;

      // Calculate performance as percentage based on completion rate
      // Use a weighted calculation: (completed in 30 days / total tasks assigned) * 100
      // If no tasks assigned, performance is 0%
      const performance =
        totalTasks > 0
          ? Math.min(Math.round((stats.tasksCompleted / totalTasks) * 100), 100)
          : 0;

      return {
        id: member.id,
        name: member.name || "Unknown",
        role: member.role || member.department || "Team Member",
        tasksCompleted: stats.tasksCompleted,
        performance: `${Math.min(performance, 100)}%`,
      };
    });

    // Sort by tasks completed (descending)
    teamMembers.sort((a, b) => b.tasksCompleted - a.tasksCompleted);

    return NextResponse.json({ teamMembers });
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: "Failed to fetch team members", teamMembers: [] },
      { status: 500 },
    );
  }
}
