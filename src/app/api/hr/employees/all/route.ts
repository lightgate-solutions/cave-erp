import { db } from "@/db";
import { employees } from "@/db/schema";
import { and, ilike, eq } from "drizzle-orm";
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
    const q = searchParams.get("q") || "";
    const limit = Number(searchParams.get("limit") || "50");

    const where = q
      ? and(
          ilike(employees.name, `%${q}%`),
          eq(employees.organizationId, organization.id),
        )
      : eq(employees.organizationId, organization.id);

    const rows = await db
      .select({
        id: employees.id,
        name: employees.name,
        email: employees.email,
      })
      .from(employees)
      .where(where)
      .limit(limit);

    return NextResponse.json({ employees: rows });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 },
    );
  }
}
