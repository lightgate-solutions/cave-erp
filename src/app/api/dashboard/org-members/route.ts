import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { member } from "@/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const h = await headers();
    const session = await auth.api.getSession({ headers: h });
    const authUserId = session?.user?.id;

    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const organization = await auth.api.getFullOrganization({
      headers: h,
    });
    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 403 },
      );
    }

    // Count active members in the current organization
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(member)
      .where(
        and(
          eq(member.organizationId, organization.id),
          isNull(member.deletedAt),
        ),
      );

    return NextResponse.json(
      { total: result[0]?.count ?? 0 },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Error fetching org members:", error);
    return NextResponse.json(
      { error: "Failed to fetch org members", total: 0 },
      { status: 500 },
    );
  }
}
