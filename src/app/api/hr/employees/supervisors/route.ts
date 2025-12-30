import { db } from "@/db";
import { employees } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  try {
    const h = await headers();
    const organization = await auth.api.getFullOrganization({ headers: h });
    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 401 },
      );
    }

    const rows = await db
      .select({
        id: employees.id,
        name: employees.name,
        email: employees.email,
      })
      .from(employees)
      .where(
        and(
          eq(employees.isManager, true),
          eq(employees.organizationId, organization.id),
        ),
      );
    return NextResponse.json({ supervisors: rows });
  } catch (error) {
    console.error("Error fetching supervisors:", error);
    return NextResponse.json(
      { error: "Failed to fetch supervisors" },
      { status: 500 },
    );
  }
}
