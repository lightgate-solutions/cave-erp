"use server";

import { cache } from "react";
import { db } from "@/db";
import { projects, projectAccess } from "@/db/schema/projects";
import { user } from "@/db/schema/auth";
import { employees } from "@/db/schema/hr";
import { and, eq, inArray } from "drizzle-orm";
import { requireAuth } from "@/actions/auth/dal";
import { requireProjectPermission } from "./permissions";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createNotification } from "@/actions/notification/notification";

export type TeamMember = {
  id: number;
  userId: string;
  name: string | null;
  email: string;
  accessLevel: "read" | "write";
  grantedBy: string | null;
  createdAt: Date;
};

/**
 * Get all team members for a project
 */
export const getProjectTeamMembers = cache(
  async (projectId: number): Promise<TeamMember[]> => {
    // Require at least view permission to see team members
    await requireProjectPermission(projectId, "view");

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) throw new Error("Organization not found");

    const teamMembers = await db
      .select({
        id: projectAccess.id,
        userId: projectAccess.userId,
        name: user.name,
        email: user.email,
        accessLevel: projectAccess.accessLevel,
        grantedBy: projectAccess.grantedBy,
        createdAt: projectAccess.createdAt,
      })
      .from(projectAccess)
      .innerJoin(user, eq(projectAccess.userId, user.id))
      .where(
        and(
          eq(projectAccess.projectId, projectId),
          eq(projectAccess.organizationId, organization.id),
        ),
      )
      .orderBy(projectAccess.createdAt);

    return teamMembers;
  },
);

/**
 * Add a team member to a project
 */
export async function addTeamMember(
  projectId: number,
  userId: string,
  accessLevel: "read" | "write",
): Promise<{ success: boolean; error?: string }> {
  try {
    // Require manage permission to add team members
    await requireProjectPermission(projectId, "manage");

    const { userId: currentUserId } = await requireAuth();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) throw new Error("Organization not found");

    // Get project details for notification
    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, projectId),
        eq(projects.organizationId, organization.id),
      ),
    });

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    // Check if user already has access
    const existingAccess = await db.query.projectAccess.findFirst({
      where: and(
        eq(projectAccess.projectId, projectId),
        eq(projectAccess.userId, userId),
        eq(projectAccess.organizationId, organization.id),
      ),
    });

    if (existingAccess) {
      // Update existing access level instead of failing
      await db
        .update(projectAccess)
        .set({
          accessLevel,
          updatedAt: new Date(),
        })
        .where(eq(projectAccess.id, existingAccess.id));

      // Send notification about permission update
      await createNotification({
        user_id: userId,
        title: "Project Access Updated",
        message: `Your access to project "${project.name}" (${project.code}) has been updated to ${accessLevel} permission`,
        notification_type: "message",
        reference_id: projectId,
        organization_id: organization.id,
      });

      return { success: true };
    }

    // Insert new access record
    await db.insert(projectAccess).values({
      projectId,
      userId,
      accessLevel,
      grantedBy: currentUserId,
      organizationId: organization.id,
    });

    // Send notification to the added user
    await createNotification({
      user_id: userId,
      title: "Added to Project",
      message: `You've been added to project "${project.name}" (${project.code}) with ${accessLevel} permission`,
      notification_type: "message",
      reference_id: projectId,
      organization_id: organization.id,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to add team member",
    };
  }
}

/**
 * Update a team member's permission level
 */
export async function updateTeamMemberPermission(
  projectId: number,
  userId: string,
  accessLevel: "read" | "write",
): Promise<{ success: boolean; error?: string }> {
  try {
    // Require manage permission
    await requireProjectPermission(projectId, "manage");

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) throw new Error("Organization not found");

    // Get project details for notification
    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, projectId),
        eq(projects.organizationId, organization.id),
      ),
    });

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    // Update access level
    await db
      .update(projectAccess)
      .set({
        accessLevel,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projectAccess.projectId, projectId),
          eq(projectAccess.userId, userId),
          eq(projectAccess.organizationId, organization.id),
        ),
      );

    // Send notification
    await createNotification({
      user_id: userId,
      title: "Project Permission Updated",
      message: `Your permission for project "${project.name}" (${project.code}) has been updated to ${accessLevel}`,
      notification_type: "message",
      reference_id: projectId,
      organization_id: organization.id,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update team member permission",
    };
  }
}

/**
 * Remove a team member from a project
 */
export async function removeTeamMember(
  projectId: number,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Require manage permission
    await requireProjectPermission(projectId, "manage");

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) throw new Error("Organization not found");

    // Get project details
    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, projectId),
        eq(projects.organizationId, organization.id),
      ),
    });

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    // Prevent removing creator or supervisor from explicit access
    // (They have implicit access anyway)
    if (project.createdBy === userId || project.supervisorId === userId) {
      return {
        success: false,
        error: "Cannot remove project creator or supervisor from team access",
      };
    }

    // Delete access record
    await db
      .delete(projectAccess)
      .where(
        and(
          eq(projectAccess.projectId, projectId),
          eq(projectAccess.userId, userId),
          eq(projectAccess.organizationId, organization.id),
        ),
      );

    // Send notification
    await createNotification({
      user_id: userId,
      title: "Removed from Project",
      message: `You've been removed from project "${project.name}" (${project.code})`,
      notification_type: "message",
      reference_id: projectId,
      organization_id: organization.id,
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to remove team member",
    };
  }
}

/**
 * Update project supervisor
 */
export async function updateProjectSupervisor(
  projectId: number,
  supervisorId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Require manage permission
    await requireProjectPermission(projectId, "manage");

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) throw new Error("Organization not found");

    // Convert supervisorId from employee ID to auth ID if needed
    let supervisorAuthId = supervisorId;
    const supervisorIdNum = Number(supervisorId);
    if (!Number.isNaN(supervisorIdNum)) {
      // It's a numeric employee ID, convert to auth ID
      const supervisor = await db.query.employees.findFirst({
        where: and(
          eq(employees.id, supervisorIdNum),
          eq(employees.organizationId, organization.id),
        ),
      });

      if (!supervisor) {
        return { success: false, error: "Supervisor not found" };
      }

      supervisorAuthId = supervisor.authId;
    }

    // Get current project details
    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, projectId),
        eq(projects.organizationId, organization.id),
      ),
    });

    if (!project) {
      return { success: false, error: "Project not found" };
    }

    const oldSupervisorId = project.supervisorId;

    // Update supervisor
    await db
      .update(projects)
      .set({
        supervisorId: supervisorAuthId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projects.id, projectId),
          eq(projects.organizationId, organization.id),
        ),
      );

    // Send notification to new supervisor
    await createNotification({
      user_id: supervisorAuthId,
      title: "Assigned as Project Supervisor",
      message: `You've been assigned as supervisor for project "${project.name}" (${project.code})`,
      notification_type: "message",
      reference_id: projectId,
      organization_id: organization.id,
    });

    // Notify old supervisor if there was one and it's different
    if (oldSupervisorId && oldSupervisorId !== supervisorId) {
      await createNotification({
        user_id: oldSupervisorId,
        title: "Project Supervisor Changed",
        message: `You're no longer the supervisor for project "${project.name}" (${project.code})`,
        notification_type: "message",
        reference_id: projectId,
        organization_id: organization.id,
      });
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update project supervisor",
    };
  }
}

/**
 * Batch add team members during project creation
 * This is called from the API route, not directly from client
 */
export async function addTeamMembers(
  projectId: number,
  teamMembers: Array<{ userId: string; accessLevel: "read" | "write" }>,
  grantedBy: string,
  organizationId: string,
  projectDetails?: { name: string; code: string },
  // biome-ignore lint/suspicious/noExplicitAny: Transaction type is complex
  tx?: any,
): Promise<void> {
  if (!teamMembers || teamMembers.length === 0) return;

  const database = tx || db;

  let project: { name: string; code: string } | undefined | null =
    projectDetails;

  if (!project) {
    // Get project details for notifications
    project = await database.query.projects.findFirst({
      where: eq(projects.id, projectId),
    });
  }

  if (!project) throw new Error("Project not found");

  // Check if userIds are employee IDs (numbers) and convert to authIds if needed
  const employeeIds = teamMembers
    .map((m) => {
      const num = Number(m.userId);
      return Number.isNaN(num) ? null : num;
    })
    .filter((id): id is number => id !== null);

  // If we have numeric IDs, look up the corresponding authIds
  const userIdMap: Map<string, string> = new Map();
  if (employeeIds.length > 0) {
    const employeeRecords = await database
      .select({
        id: employees.id,
        authId: employees.authId,
      })
      .from(employees)
      .where(
        and(
          inArray(employees.id, employeeIds),
          eq(employees.organizationId, organizationId),
        ),
      );

    // Create a map of employee ID -> authId
    for (const emp of employeeRecords) {
      userIdMap.set(String(emp.id), emp.authId);
    }
  }

  // Convert employee IDs to authIds or use as-is if already authIds
  const accessRecords = teamMembers.map((member) => {
    const authId = userIdMap.get(member.userId) || member.userId;
    return {
      projectId,
      userId: authId,
      accessLevel: member.accessLevel,
      grantedBy,
      organizationId,
    };
  });

  await database.insert(projectAccess).values(accessRecords);

  // Send notifications to all added team members
  await Promise.all(
    teamMembers.map((member) => {
      const authId = userIdMap.get(member.userId) || member.userId;
      return createNotification({
        user_id: authId,
        title: "Added to Project",
        message: `You've been added to project "${project?.name}" (${project?.code}) with ${member.accessLevel} permission`,
        notification_type: "message",
        reference_id: projectId,
        organization_id: organizationId,
      });
    }),
  );
}
