import { NextResponse } from "next/server";
import { db } from "@/db";
import { leaveApplications } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { and, eq, gte, sql, count } from "drizzle-orm";

export async function GET() {
  try {
    const h = await headers();
    const session = await auth.api.getSession({ headers: h });
    const organization = await auth.api.getFullOrganization({ headers: h });

    if (!session?.user || !organization) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organizationId = organization.id;
    const now = new Date();

    // Get data for the last 6 months
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    // Leave applications by month
    const leaveTrends = await db
      .select({
        month: sql<string>`TO_CHAR(${leaveApplications.createdAt}, 'Mon')`,
        year: sql<number>`EXTRACT(YEAR FROM ${leaveApplications.createdAt})`,
        monthNum: sql<number>`EXTRACT(MONTH FROM ${leaveApplications.createdAt})`,
        approved: count(
          sql`CASE WHEN ${leaveApplications.status} = 'Approved' THEN 1 END`,
        ),
        pending: count(
          sql`CASE WHEN ${leaveApplications.status} = 'Pending' THEN 1 END`,
        ),
        rejected: count(
          sql`CASE WHEN ${leaveApplications.status} = 'Rejected' THEN 1 END`,
        ),
        total: count(),
      })
      .from(leaveApplications)
      .where(
        and(
          eq(leaveApplications.organizationId, organizationId),
          gte(leaveApplications.createdAt, sixMonthsAgo),
        ),
      )
      .groupBy(
        sql`TO_CHAR(${leaveApplications.createdAt}, 'Mon')`,
        sql`EXTRACT(YEAR FROM ${leaveApplications.createdAt})`,
        sql`EXTRACT(MONTH FROM ${leaveApplications.createdAt})`,
      )
      .orderBy(
        sql`EXTRACT(YEAR FROM ${leaveApplications.createdAt})`,
        sql`EXTRACT(MONTH FROM ${leaveApplications.createdAt})`,
      );

    return NextResponse.json({ leaveTrends });
  } catch (error) {
    console.error("Error fetching leave trends:", error);
    return NextResponse.json(
      { error: "Failed to fetch leave trends" },
      { status: 500 },
    );
  }
}
