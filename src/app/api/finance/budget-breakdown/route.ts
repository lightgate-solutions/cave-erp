import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { companyExpenses } from "@/db/schema/finance";
import { sql, isNotNull, eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const h = await headers();
    const session = await auth.api.getSession({ headers: h });
    const authUserId = session?.user?.id;
    const role = session?.user?.role;
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) return null;

    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const normalizedRole = role?.toLowerCase().trim() || "";
    if (normalizedRole !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const budgetData = await db
      .select({
        department: companyExpenses.category,
        budget: sql<number>`COALESCE(SUM(CAST(${companyExpenses.amount} AS NUMERIC)), 0)`,
      })
      .from(companyExpenses)
      .where(
        and(
          isNotNull(companyExpenses.category),
          eq(companyExpenses.organizationId, organization.id),
        ),
      )
      .groupBy(companyExpenses.category)
      .orderBy(
        sql`COALESCE(SUM(CAST(${companyExpenses.amount} AS NUMERIC)), 0) DESC`,
      );

    const formattedData = budgetData.map((item) => ({
      department: item.department || "Uncategorized",
      budget: Number(item.budget || 0),
    }));

    return NextResponse.json({ breakdown: formattedData });
  } catch (error) {
    console.error("Error fetching budget breakdown:", error);
    return NextResponse.json(
      {
        breakdown: [],
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 },
    );
  }
}
