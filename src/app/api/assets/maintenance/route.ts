import { db } from "@/db";
import { assetMaintenanceSchedules, assets } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { requireAssetAccess } from "@/actions/auth/dal";

// GET: Get maintenance overview (schedules, upcoming, overdue)
export async function GET() {
  try {
    await requireAssetAccess();
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Get all active schedules with asset info
    const schedules = await db
      .select({
        id: assetMaintenanceSchedules.id,
        assetId: assetMaintenanceSchedules.assetId,
        assetName: assets.name,
        assetCode: assets.assetCode,
        name: assetMaintenanceSchedules.name,
        description: assetMaintenanceSchedules.description,
        intervalValue: assetMaintenanceSchedules.intervalValue,
        intervalUnit: assetMaintenanceSchedules.intervalUnit,
        lastPerformedDate: assetMaintenanceSchedules.lastPerformedDate,
        nextDueDate: assetMaintenanceSchedules.nextDueDate,
        isActive: assetMaintenanceSchedules.isActive,
      })
      .from(assetMaintenanceSchedules)
      .innerJoin(assets, eq(assetMaintenanceSchedules.assetId, assets.id))
      .where(
        and(
          eq(assetMaintenanceSchedules.organizationId, organization.id),
          eq(assetMaintenanceSchedules.isActive, true),
        ),
      )
      .orderBy(desc(assetMaintenanceSchedules.nextDueDate));

    // Filter overdue items (nextDueDate < now)
    const overdue = schedules
      .filter((s) => s.nextDueDate && new Date(s.nextDueDate) < now)
      .map((s) => ({
        id: s.id,
        assetName: s.assetName,
        assetCode: s.assetCode,
        scheduleName: s.name,
        nextDueDate: s.nextDueDate,
      }));

    // Filter upcoming items (nextDueDate between now and 30 days from now)
    const upcoming = schedules
      .filter(
        (s) =>
          s.nextDueDate &&
          new Date(s.nextDueDate) >= now &&
          new Date(s.nextDueDate) <= thirtyDaysFromNow,
      )
      .map((s) => ({
        id: s.id,
        assetName: s.assetName,
        assetCode: s.assetCode,
        scheduleName: s.name,
        nextDueDate: s.nextDueDate,
      }));

    return NextResponse.json({
      schedules,
      upcoming,
      overdue,
    });
  } catch (error) {
    console.error("Error fetching maintenance overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch maintenance data" },
      { status: 500 },
    );
  }
}
