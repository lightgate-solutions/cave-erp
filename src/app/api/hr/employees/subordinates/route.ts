import { db } from "@/db";
import { employees } from "@/db/schema";
import { and, eq, ilike, or } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const h = await headers();
    const organization = await auth.api.getFullOrganization({ headers: h });
    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 401 },
      );
    }

    const { searchParams } = request.nextUrl;
    // Note: API query parameter is still "employeeId" for backward compatibility
    const userIdParam = searchParams.get("employeeId");
    const userId = userIdParam ? Number(userIdParam) : 0;
    const q = searchParams.get("q") || "";
    if (!userId) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 },
      );
    }
    const [res] = await db
      .select({ id: employees.id, authId: employees.authId })
      .from(employees)
      .where(
        and(
          eq(employees.id, userId),
          eq(employees.organizationId, organization.id),
        ),
      )
      .limit(1);
    const employeeId = res?.id;
    const employeeAuthId = res?.authId;
    console.log(employeeId);
    if (!employeeId || !employeeAuthId) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }
    let where: ReturnType<typeof and> | undefined = and(
      eq(employees.managerId, employeeAuthId),
      eq(employees.organizationId, organization.id),
    );
    if (q) {
      where = and(
        where,
        or(ilike(employees.name, `%${q}%`), ilike(employees.email, `%${q}%`)),
      );
    }
    const rows = await db
      .select({
        id: employees.id,
        name: employees.name,
        email: employees.email,
        department: employees.department,
      })
      .from(employees)
      .where(where)
      .limit(10);
    return NextResponse.json({ subordinates: rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch subordinates" },
      { status: 500 },
    );
  }
}
