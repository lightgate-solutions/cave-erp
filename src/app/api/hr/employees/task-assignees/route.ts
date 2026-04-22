import { db } from "@/db";
import { employees } from "@/db/schema";
import { and, eq, ilike, or } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/actions/auth/dal";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/** List organization employees available for task assignment (managers and admins). */
export async function GET(request: NextRequest) {
  try {
    const authData = await requireAuth();
    const e = authData.employee;
    const isSessionAdmin = authData.role === "admin";
    const canList = !!e?.isManager || e?.role === "admin" || isSessionAdmin;

    if (!canList) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 401 },
      );
    }

    const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";

    const rows = await db
      .select({
        authId: employees.authId,
        name: employees.name,
        email: employees.email,
        department: employees.department,
      })
      .from(employees)
      .where(
        q
          ? and(
              eq(employees.organizationId, organization.id),
              or(
                ilike(employees.name, `%${q}%`),
                ilike(employees.email, `%${q}%`),
              ),
            )
          : eq(employees.organizationId, organization.id),
      )
      .limit(200);

    return NextResponse.json({ employees: rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 },
    );
  }
}
