import { db } from "@/db";
import { assets, assetMaintenanceSchedules } from "@/db/schema";
import { and, eq, sql, lte, gte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { requireAssetAccess } from "@/actions/auth/dal";

// GET: Get asset statistics for dashboard
export async function GET() {
  try {
    await requireAssetAccess();
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get total asset count and value (excluding disposed assets)
    const [totals] = await db
      .select({
        totalAssets: sql<number>`count(*)`,
        totalValue: sql<number>`coalesce(sum(${assets.currentValue}::numeric), 0)`,
      })
      .from(assets)
      .where(
        and(
          eq(assets.organizationId, organization.id),
          sql`${assets.status} != 'Disposed'`,
        ),
      );

    // Get status breakdown (include all statuses for the chart)
    const statusBreakdown = await db
      .select({
        status: assets.status,
        count: sql<number>`count(*)`,
      })
      .from(assets)
      .where(eq(assets.organizationId, organization.id))
      .groupBy(assets.status);

    // Get assets with warranties expiring within 30 days (excluding disposed)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const [expiringWarrantiesResult] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(assets)
      .where(
        and(
          eq(assets.organizationId, organization.id),
          sql`${assets.status} != 'Disposed'`,
          lte(assets.warrantyEndDate, thirtyDaysFromNow),
          gte(assets.warrantyEndDate, new Date()),
        ),
      );

    // Get maintenance due count
    const today = new Date();
    const [maintenanceDueResult] = await db
      .select({
        count: sql<number>`count(distinct ${assetMaintenanceSchedules.assetId})`,
      })
      .from(assetMaintenanceSchedules)
      .innerJoin(assets, eq(assetMaintenanceSchedules.assetId, assets.id))
      .where(
        and(
          eq(assetMaintenanceSchedules.organizationId, organization.id),
          eq(assetMaintenanceSchedules.isActive, true),
          lte(assetMaintenanceSchedules.nextDueDate, today),
          sql`${assets.status} != 'Disposed'`,
        ),
      );

    // Get category breakdown with values (excluding disposed)
    const categoryBreakdown = await db
      .select({
        categoryId: assets.categoryId,
        count: sql<number>`count(*)`,
        totalValue: sql<number>`coalesce(sum(${assets.currentValue}::numeric), 0)`,
      })
      .from(assets)
      .where(
        and(
          eq(assets.organizationId, organization.id),
          sql`${assets.status} != 'Disposed'`,
        ),
      )
      .groupBy(assets.categoryId);

    // Get location breakdown (excluding disposed)
    const locationBreakdown = await db
      .select({
        locationId: assets.locationId,
        count: sql<number>`count(*)`,
      })
      .from(assets)
      .where(
        and(
          eq(assets.organizationId, organization.id),
          sql`${assets.status} != 'Disposed'`,
        ),
      )
      .groupBy(assets.locationId);

    return NextResponse.json({
      totalAssets: totals.totalAssets || 0,
      totalValue: totals.totalValue || 0,
      statusBreakdown,
      expiringWarranties: expiringWarrantiesResult?.count || 0,
      maintenanceDue: maintenanceDueResult?.count || 0,
      categoryBreakdown,
      locationBreakdown,
    });
  } catch (error) {
    console.error("Error fetching asset stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch asset stats" },
      { status: 500 },
    );
  }
}
