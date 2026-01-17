import { db } from "@/db";
import {
  assetMaintenanceSchedules,
  assetMaintenance,
  assets,
} from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { requireAssetAccess } from "@/actions/auth/dal";

// GET: Get maintenance schedules and records for an asset
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAssetAccess();
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const assetId = Number(id);

    // Get maintenance schedules for this asset
    const schedules = await db
      .select()
      .from(assetMaintenanceSchedules)
      .where(
        and(
          eq(assetMaintenanceSchedules.assetId, assetId),
          eq(assetMaintenanceSchedules.organizationId, organization.id),
        ),
      )
      .orderBy(desc(assetMaintenanceSchedules.createdAt));

    // Get maintenance records for this asset
    const records = await db
      .select()
      .from(assetMaintenance)
      .where(
        and(
          eq(assetMaintenance.assetId, assetId),
          eq(assetMaintenance.organizationId, organization.id),
        ),
      )
      .orderBy(desc(assetMaintenance.scheduledDate));

    return NextResponse.json({
      schedules,
      records,
    });
  } catch (error) {
    console.error("Error fetching asset maintenance:", error);
    return NextResponse.json(
      { error: "Failed to fetch maintenance data" },
      { status: 500 },
    );
  }
}

// POST: Create maintenance schedule or record
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAssetAccess();
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;

    const { id } = await params;
    const assetId = Number(id);
    const body = await request.json();

    const { type } = body; // 'schedule' or 'record'

    // Verify asset exists and belongs to organization
    const [asset] = await db
      .select()
      .from(assets)
      .where(
        and(eq(assets.id, assetId), eq(assets.organizationId, organization.id)),
      )
      .limit(1);

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    if (type === "schedule") {
      const { name, description, intervalValue, intervalUnit, startDate } =
        body;

      if (!name || !intervalValue || !intervalUnit) {
        return NextResponse.json(
          { error: "Name, interval value, and interval unit are required" },
          { status: 400 },
        );
      }

      // Calculate next due date based on start date and interval
      const nextDueDate = calculateNextDueDate(
        startDate ? new Date(startDate) : new Date(),
        intervalValue,
        intervalUnit,
      );

      const [schedule] = await db
        .insert(assetMaintenanceSchedules)
        .values({
          organizationId: organization.id,
          assetId,
          name,
          description: description || null,
          intervalValue,
          intervalUnit,
          nextDueDate,
          isActive: true,
        })
        .returning();

      return NextResponse.json({ schedule }, { status: 201 });
    }

    if (type === "record") {
      const {
        scheduleId,
        title,
        description,
        scheduledDate,
        completedDate,
        status,
        cost,
        notes,
      } = body;

      if (!title) {
        return NextResponse.json(
          { error: "Title is required" },
          { status: 400 },
        );
      }

      const [record] = await db
        .insert(assetMaintenance)
        .values({
          organizationId: organization.id,
          assetId,
          scheduleId: scheduleId || null,
          title,
          description: description || null,
          scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
          completedDate: completedDate ? new Date(completedDate) : null,
          status: status || "Scheduled",
          cost: cost || null,
          notes: notes || null,
          performedBy: userId || null,
        })
        .returning();

      // If completed and linked to a schedule, update the schedule's last performed and next due dates
      if (completedDate && scheduleId) {
        const [schedule] = await db
          .select()
          .from(assetMaintenanceSchedules)
          .where(eq(assetMaintenanceSchedules.id, scheduleId))
          .limit(1);

        if (schedule) {
          const newNextDueDate = calculateNextDueDate(
            new Date(completedDate),
            schedule.intervalValue,
            schedule.intervalUnit,
          );

          await db
            .update(assetMaintenanceSchedules)
            .set({
              lastPerformedDate: new Date(completedDate),
              nextDueDate: newNextDueDate,
              updatedAt: new Date(),
            })
            .where(eq(assetMaintenanceSchedules.id, scheduleId));
        }
      }

      return NextResponse.json({ record }, { status: 201 });
    }

    return NextResponse.json(
      { error: "Invalid type. Must be 'schedule' or 'record'" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error creating maintenance:", error);
    return NextResponse.json(
      { error: "Failed to create maintenance" },
      { status: 500 },
    );
  }
}

function calculateNextDueDate(
  fromDate: Date,
  intervalValue: number,
  intervalUnit: string,
): Date {
  const nextDate = new Date(fromDate);

  switch (intervalUnit) {
    case "Days":
      nextDate.setDate(nextDate.getDate() + intervalValue);
      break;
    case "Weeks":
      nextDate.setDate(nextDate.getDate() + intervalValue * 7);
      break;
    case "Months":
      nextDate.setMonth(nextDate.getMonth() + intervalValue);
      break;
    case "Years":
      nextDate.setFullYear(nextDate.getFullYear() + intervalValue);
      break;
  }

  return nextDate;
}
