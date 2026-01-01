import { getLeaveBalance } from "@/actions/hr/leaves";
import { getEmployee } from "@/actions/hr/employees";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { employees } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const h = await headers();
    const session = await auth.api.getSession({ headers: h });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get organization for multi-tenant isolation
    const organization = await auth.api.getFullOrganization({ headers: h });
    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    // Note: API query parameter is still "employeeId" for backward compatibility
    const employeeIdParam = searchParams.get("employeeId");
    const employeeId = employeeIdParam ? Number(employeeIdParam) : undefined;
    const yearParam = searchParams.get("year");
    const year = yearParam ? Number(yearParam) : undefined;

    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 },
      );
    }

    // Look up employee to get authId
    const [employeeRecord] = await db
      .select({
        authId: employees.authId,
        organizationId: employees.organizationId,
      })
      .from(employees)
      .where(
        and(
          eq(employees.id, employeeId),
          eq(employees.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!employeeRecord?.authId) {
      return NextResponse.json(
        { error: "Employee not found or access denied" },
        { status: 404 },
      );
    }

    // Verify employee belongs to the user's organization
    const employee = await getEmployee(employeeRecord.authId);
    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found or access denied" },
        { status: 404 },
      );
    }

    // getEmployee already filters by organizationId, but we double-check
    // to ensure the employee belongs to the authenticated user's organization
    if (employee.organizationId !== organization.id) {
      return NextResponse.json(
        { error: "Access denied: Employee not in your organization" },
        { status: 403 },
      );
    }

    // Get leave balance - this function also has organizationId filtering
    const balances = await getLeaveBalance(employeeRecord.authId, year);

    return NextResponse.json({ balances });
  } catch (error) {
    console.error("Error fetching leave balances:", error);
    return NextResponse.json(
      { error: "Failed to fetch leave balances" },
      { status: 500 },
    );
  }
}

// POST method removed - annual leave balances are now managed through
// the global annual leave settings API at /api/hr/leaves/annual-settings
// Individual employee balances are automatically calculated from approved leaves
