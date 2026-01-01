import { db } from "@/db";
import { employees } from "@/db/schema/hr";
import { tasks } from "@/db/schema/tasks/tasks";
import { auth } from "@/lib/auth";
import { and, eq, ne, sql } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const h = Object.fromEntries(request.headers);
    const session = await auth.api.getSession({ headers: h });
    const authUserId = session?.user?.id;
    const role = session?.user?.role;
    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organization = await auth.api.getFullOrganization({ headers: h });
    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 401 },
      );
    }

    // Resolve employee to determine scope (employee vs manager)
    const me = await db
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
      .limit(1)
      .then((r) => r[0]);

    // Build where clause based on role
    const scopeWhere =
      role === "admin"
        ? eq(tasks.organizationId, organization.id)
        : me?.isManager
          ? and(
              eq(tasks.organizationId, organization.id),
              eq(tasks.assignedBy, me.authId),
            )
          : and(
              eq(tasks.organizationId, organization.id),
              eq(tasks.assignedTo, me?.authId ?? ""),
            );

    // active: not Completed
    const activeWhere = and(scopeWhere, ne(tasks.status, "Completed"));
    const pendingWhere = and(scopeWhere, eq(tasks.status, "Todo"));
    const inProgressWhere = and(scopeWhere, eq(tasks.status, "In Progress"));

    const activeRow = await db
      .select({ c: sql<number>`count(*)` })
      .from(tasks)
      .where(activeWhere)
      .limit(1)
      .then((r) => r[0]);
    const pendingRow = await db
      .select({ c: sql<number>`count(*)` })
      .from(tasks)
      .where(pendingWhere)
      .limit(1)
      .then((r) => r[0]);
    const inProgressRow = await db
      .select({ c: sql<number>`count(*)` })
      .from(tasks)
      .where(inProgressWhere)
      .limit(1)
      .then((r) => r[0]);

    const active = Number(activeRow?.c ?? 0);
    const pending = Number(pendingRow?.c ?? 0);
    const inProgress = Number(inProgressRow?.c ?? 0);

    return NextResponse.json(
      { active, pending, inProgress },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Error fetching task stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
