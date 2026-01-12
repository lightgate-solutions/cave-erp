/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

import { db } from "@/db";
import { employees, projects, projectAccess } from "@/db/schema";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { subscriptions } from "@/db/schema/subscriptions";
import { organization as organizationSchema } from "@/db/schema/auth";
import { getPlanLimits } from "@/lib/plans";
import { count } from "drizzle-orm";
import {
  getProjectVisibilityFilter,
  requireCanCreateProject,
  getProjectsPermissions,
} from "@/actions/projects/permissions";
import { addTeamMembers } from "@/actions/projects/access";
import { requireAuth } from "@/actions/auth/dal";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;
    const q = searchParams.get("q") || "";
    const status = searchParams.get("status") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortDirection =
      searchParams.get("sortDirection") === "asc" ? "asc" : "desc";

    const h = await headers();
    let organization = null;
    try {
      organization = await auth.api.getFullOrganization({
        headers: h,
      });
    } catch (_e) {
      // Ignore
    }

    if (!organization) {
      const session = await auth.api.getSession({ headers: h });

      const activeOrgId = session?.session?.activeOrganizationId;

      if (activeOrgId) {
        const org = await db.query.organization.findFirst({
          where: eq(organizationSchema.id, activeOrgId),
        });

        if (org) {
          organization = org;
        }
      }
    }

    if (!organization) {
      return NextResponse.json(
        { projects: [], total: 0, page, limit, totalPages: 0 },
        { status: 200 },
      );
    }

    let where:
      | ReturnType<typeof or>
      | ReturnType<typeof eq>
      | ReturnType<typeof and>
      | undefined;

    where = eq(projects.organizationId, organization.id);

    // Apply visibility filtering based on user's access
    try {
      const visibilityFilter = await getProjectVisibilityFilter();
      if (visibilityFilter) {
        where = and(where, visibilityFilter);
      }
    } catch (_error) {
      // If not authenticated or error, return empty results
      return NextResponse.json(
        { projects: [], total: 0, page, limit, totalPages: 0 },
        { status: 200 },
      );
    }

    if (q) {
      where = and(
        where,
        or(
          ilike(projects.name, `%${q}%`),
          ilike(projects.code, `%${q}%`),
          ilike(projects.location, `%${q}%`),
        ),
      );
    }
    if (status) {
      where = and(
        where,
        eq(projects.status, status as "pending" | "in-progress" | "completed"),
      );
    }
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      where = and(where, gte(projects.createdAt, fromDate));
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      where = and(where, lte(projects.createdAt, toDate));
    }

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(where);
    const total = totalResult[0].count;

    const columnMap: Record<string, any> = {
      id: projects.id,
      name: projects.name,
      code: projects.code,
      description: projects.description,
      location: projects.location,
      status: projects.status,
      budgetPlanned: projects.budgetPlanned,
      budgetActual: projects.budgetActual,
      supervisorId: projects.supervisorId,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    };

    const orderColumn = columnMap[sortBy] || projects.createdAt;
    const order =
      sortDirection === "asc" ? asc(orderColumn) : desc(orderColumn);

    const rows = await db
      .select({
        id: projects.id,
        name: projects.name,
        code: projects.code,
        description: projects.description,
        location: projects.location,
        status: projects.status,
        budgetPlanned: projects.budgetPlanned,
        budgetActual: projects.budgetActual,
        supervisorId: projects.supervisorId,
        createdBy: projects.createdBy,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        supervisorName: employees.name,
      })
      .from(projects)
      .leftJoin(employees, eq(employees.authId, projects.supervisorId))
      .where(where)
      .orderBy(order)
      .limit(limit)
      .offset(offset);

    // Get permissions for all fetched projects
    const projectIds = rows.map((p) => p.id);
    const permissionsMap = await getProjectsPermissions(projectIds);

    // Get current user's info to determine their roles for each project
    const session = await auth.api.getSession({ headers: h });
    const currentUserId = session?.user?.id;
    const currentUserRole = session?.user?.role?.toLowerCase().trim() || "user";

    // Get employee info for role check
    let currentEmployee = null;
    if (currentUserId && organization?.id) {
      currentEmployee = await db.query.employees.findFirst({
        where: and(
          eq(employees.authId, currentUserId),
          eq(employees.organizationId, organization.id),
        ),
      });
    }

    const isAdmin =
      currentUserRole === "admin" ||
      currentEmployee?.role === "admin" ||
      currentEmployee?.department === "admin";

    // Get all project access records for the current user in one query
    const userAccessRecords =
      currentUserId && projectIds.length > 0
        ? await db.query.projectAccess.findMany({
            where: and(
              eq(projectAccess.userId, currentUserId),
              inArray(projectAccess.projectId, projectIds),
            ),
          })
        : [];

    const accessMap = new Map(
      userAccessRecords.map((access) => [access.projectId, access.accessLevel]),
    );

    // Add permission and user roles to each project
    const projectsWithPermissionsAndRoles = rows.map((project) => {
      const userRoles: string[] = [];

      if (isAdmin) {
        userRoles.push("admin");
      }

      if (project.createdBy === currentUserId) {
        userRoles.push("creator");
      }

      if (project.supervisorId === currentUserId) {
        userRoles.push("supervisor");
      }

      if (accessMap.has(project.id)) {
        userRoles.push("team_member");
      }

      return {
        ...project,
        permission: permissionsMap.get(project.id) || null,
        userRoles,
      };
    });

    return NextResponse.json({
      projects: projectsWithPermissionsAndRoles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user can create projects (admin or manager)
    await requireCanCreateProject();

    const body = await request.json();
    const {
      name,
      description,
      location,
      supervisorId,
      budgetPlanned,
      budgetActual,
      status,
      teamMembers, // Array of {userId, accessLevel}
    } = body ?? {};

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    // Supervisor is now required
    if (!supervisorId) {
      return NextResponse.json(
        { error: "supervisorId is required" },
        { status: 400 },
      );
    }

    const h = await headers();
    let organization = null;
    try {
      organization = await auth.api.getFullOrganization({
        headers: h,
      });
    } catch (_e) {
      // Ignore error
    }

    if (!organization) {
      const session = await auth.api.getSession({ headers: h });
      const activeOrgId = session?.session?.activeOrganizationId;

      if (activeOrgId) {
        const org = await db.query.organization.findFirst({
          where: eq(organizationSchema.id, activeOrgId),
        });

        if (org) {
          organization = org;
        }
      }
    }

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    const ownerId = organization.ownerId;
    if (!ownerId) {
      return NextResponse.json(
        { error: "Organization owner not found" },
        { status: 400 },
      );
    }

    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, ownerId),
    });

    const planId = subscription?.plan ?? "free";
    const limits = getPlanLimits(planId);

    if (limits.maxProject !== null) {
      const [currentCount] = await db
        .select({ count: count() })
        .from(projects)
        .where(eq(projects.organizationId, organization.id));

      if (currentCount.count >= limits.maxProject) {
        return NextResponse.json(
          {
            error: `Project limit reached for ${planId} plan. Please upgrade to create more projects.`,
          },
          { status: 403 },
        );
      }
    }

    // Get current user ID for createdBy field
    const { userId } = await requireAuth();

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
        return NextResponse.json(
          { error: "Supervisor not found" },
          { status: 400 },
        );
      }

      supervisorAuthId = supervisor.authId;
    }

    const [agg] = await db
      .select({ maxId: sql<number>`max(${projects.id})` })
      .from(projects);
    const nextId = (agg?.maxId ?? 0) + 1;
    const generatedCode = `${nextId}BM`;

    // Create project and add team members in a transaction
    const result = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(projects)
        .values({
          name,
          code: generatedCode,
          description,
          location,
          supervisorId: supervisorAuthId,
          createdBy: userId, // Set the creator
          budgetPlanned: Number(budgetPlanned) || 0,
          budgetActual: Number(budgetActual) || 0,
          status: status || "pending",
          organizationId: organization.id,
        })
        .returning();

      // Add team members if provided
      if (teamMembers && Array.isArray(teamMembers) && teamMembers.length > 0) {
        await addTeamMembers(
          created.id,
          teamMembers,
          userId,
          organization.id,
          created,
          tx,
        );
      }

      return created;
    });

    return NextResponse.json({ project: result }, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);

    // Check if it's a permission error
    if (error instanceof Error && error.message.includes("Access denied")) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 },
    );
  }
}
