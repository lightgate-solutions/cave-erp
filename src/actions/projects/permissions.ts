"use server";

import { cache } from "react";
import { db } from "@/db";
import { projects, projectAccess } from "@/db/schema/projects";
import { and, eq, or, sql } from "drizzle-orm";
import { requireAuth } from "@/actions/auth/dal";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export type ProjectPermission = "view" | "edit" | "manage";

/**
 * Get user's permission level for a specific project
 * Returns null if user has no access
 *
 * Permission hierarchy:
 * - Admin: Always "manage"
 * - Creator: "manage"
 * - Supervisor: "manage"
 * - Team member with "write" access: "edit"
 * - Team member with "read" access: "view"
 */
export const getProjectPermission = cache(
  async (projectId: number): Promise<ProjectPermission | null> => {
    const { userId, role, employee } = await requireAuth();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) throw new Error("Organization not found");

    // Admin override - always has full access
    const normalizedRole = role?.toLowerCase().trim() || "user";
    if (normalizedRole === "admin" || employee.role === "admin") {
      return "manage";
    }

    // Get project details
    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, projectId),
        eq(projects.organizationId, organization.id),
      ),
    });

    if (!project) return null;

    // Creator or supervisor has full manage access
    if (project.createdBy === userId || project.supervisorId === userId) {
      return "manage";
    }

    // Check explicit team member access
    const access = await db.query.projectAccess.findFirst({
      where: and(
        eq(projectAccess.projectId, projectId),
        eq(projectAccess.userId, userId),
        eq(projectAccess.organizationId, organization.id),
      ),
    });

    if (!access) return null;

    // Map access levels to permissions
    // "write" -> "edit", "read" -> "view"
    return access.accessLevel === "write" ? "edit" : "view";
  },
);

/**
 * Require a specific permission level for a project
 * Throws error if user doesn't have sufficient permission
 */
export const requireProjectPermission = cache(
  async (
    projectId: number,
    requiredLevel: ProjectPermission,
  ): Promise<void> => {
    const permission = await getProjectPermission(projectId);

    if (!permission) {
      throw new Error("Access denied: You don't have access to this project");
    }

    // Permission hierarchy: view < edit < manage
    const levels: Record<ProjectPermission, number> = {
      view: 1,
      edit: 2,
      manage: 3,
    };

    if (levels[permission] < levels[requiredLevel]) {
      throw new Error(
        `Access denied: ${requiredLevel} permission required, but you only have ${permission} permission`,
      );
    }
  },
);

/**
 * Check if user can create projects (admin or manager)
 */
export const canCreateProject = cache(async (): Promise<boolean> => {
  const { role, employee } = await requireAuth();

  const normalizedRole = role?.toLowerCase().trim() || "user";

  // Admins can always create projects
  if (normalizedRole === "admin" || employee.role === "admin") {
    return true;
  }

  // Managers can create projects
  return employee.isManager === true;
});

/**
 * Require permission to create projects
 * Throws error if user cannot create projects
 */
export const requireCanCreateProject = cache(async (): Promise<void> => {
  const canCreate = await canCreateProject();

  if (!canCreate) {
    throw new Error(
      "Access denied: Only admins and managers can create projects",
    );
  }
});

/**
 * Check if user has manage access to a project
 * Useful for conditional UI rendering
 */
export const hasManageAccess = cache(
  async (projectId: number): Promise<boolean> => {
    try {
      const permission = await getProjectPermission(projectId);
      return permission === "manage";
    } catch {
      return false;
    }
  },
);

/**
 * Get visibility filter for projects list
 * Returns SQL condition that filters projects based on user's access
 *
 * For admins: Returns null (no filtering needed)
 * For others: Returns condition checking creator, supervisor, or explicit access
 */
export const getProjectVisibilityFilter = cache(async () => {
  const { userId, role, employee } = await requireAuth();

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) throw new Error("Organization not found");

  // Admin sees all projects in organization
  const normalizedRole = role?.toLowerCase().trim() || "user";
  if (normalizedRole === "admin" || employee.role === "admin") {
    return null; // No additional filtering needed
  }

  // For non-admins, filter by:
  // 1. Projects they created
  // 2. Projects they supervise
  // 3. Projects they have explicit access to
  return or(
    eq(projects.createdBy, userId),
    eq(projects.supervisorId, userId),
    sql`EXISTS (
      SELECT 1 FROM ${projectAccess}
      WHERE ${projectAccess.projectId} = ${projects.id}
        AND ${projectAccess.userId} = ${userId}
        AND ${projectAccess.organizationId} = ${organization.id}
    )`,
  );
});

/**
 * Check if user can view a specific project
 */
export const canViewProject = cache(
  async (projectId: number): Promise<boolean> => {
    try {
      const permission = await getProjectPermission(projectId);
      return permission !== null;
    } catch {
      return false;
    }
  },
);

/**
 * Check if user can edit a specific project's content (milestones/expenses)
 */
export const canEditProjectContent = cache(
  async (projectId: number): Promise<boolean> => {
    try {
      const permission = await getProjectPermission(projectId);
      return permission === "edit" || permission === "manage";
    } catch {
      return false;
    }
  },
);

/**
 * Get permissions for multiple projects in bulk
 * More efficient than calling getProjectPermission for each project
 * Returns a map of projectId -> permission
 */
export const getProjectsPermissions = cache(
  async (projectIds: number[]): Promise<Map<number, ProjectPermission>> => {
    if (projectIds.length === 0) {
      return new Map();
    }

    const { userId, role, employee } = await requireAuth();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) throw new Error("Organization not found");

    const permissionsMap = new Map<number, ProjectPermission>();

    // Admin override - always has full access to all projects
    const normalizedRole = role?.toLowerCase().trim() || "user";
    if (normalizedRole === "admin" || employee.role === "admin") {
      for (const projectId of projectIds) {
        permissionsMap.set(projectId, "manage");
      }
      return permissionsMap;
    }

    // Fetch all projects and access records in one query
    const projectsData = await db.query.projects.findMany({
      where: and(
        sql`${projects.id} IN (${sql.join(
          projectIds.map((id) => sql`${id}`),
          sql`, `,
        )})`,
        eq(projects.organizationId, organization.id),
      ),
      with: {
        projectAccess: {
          where: eq(projectAccess.userId, userId),
        },
      },
    });

    // Process each project to determine permission
    for (const project of projectsData) {
      let permission: ProjectPermission | null = null;

      // Creator or supervisor has full manage access
      if (project.createdBy === userId || project.supervisorId === userId) {
        permission = "manage";
      } else {
        // Check explicit team member access
        const access = project.projectAccess[0]; // Will be one or none due to unique constraint
        if (access) {
          permission = access.accessLevel === "write" ? "edit" : "view";
        }
      }

      if (permission) {
        permissionsMap.set(project.id, permission);
      }
    }

    return permissionsMap;
  },
);
