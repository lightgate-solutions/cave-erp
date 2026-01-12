import { db } from "@/db";
import { expenses, projects } from "@/db/schema";
import { and, eq, ilike, or, inArray } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { organization as organizationSchema } from "@/db/schema/auth";
import { getProjectVisibilityFilter } from "@/actions/projects/permissions";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get("q") || "";
    const status = searchParams.get("status") || "";

    const h = await headers();
    let organization = null;
    try {
      organization = await auth.api.getFullOrganization({
        headers: h,
      });
    } catch (_e) {}

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
        { total: 0, actual: 0, expenses: 0 },
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
    } catch (error) {
      // If not authenticated or error, return zero stats
      return NextResponse.json(
        { total: 0, actual: 0, expenses: 0 },
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
    if (status && status !== "all") {
      where = and(
        where,
        eq(projects.status, status as "pending" | "in-progress" | "completed"),
      );
    }

    const rows = await db.select().from(projects).where(where);
    const total = rows.length;
    const actual = rows.reduce((acc, p) => acc + (p.budgetActual ?? 0), 0);

    let expensesTotal = 0;
    if (rows.length > 0) {
      const ids = rows.map((p) => p.id);
      const exps = await db
        .select()
        .from(expenses)
        .where(inArray(expenses.projectId, ids));
      expensesTotal = exps.reduce((acc, e) => acc + (e.amount ?? 0), 0);
    }

    return NextResponse.json(
      { total, actual, expenses: expensesTotal },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Error fetching project stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
