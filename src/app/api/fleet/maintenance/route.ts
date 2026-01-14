import { db } from "@/db";
import {
  fleetMaintenance,
  vehicles,
  type maintenanceTypeEnum,
} from "@/db/schema";
import { and, asc, desc, eq, sql, gte, lte, type AnyColumn } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET: List all maintenance records with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;
    const vehicleId = searchParams.get("vehicleId");
    const maintenanceType = searchParams.get("maintenanceType");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const sortBy = searchParams.get("sortBy") || "maintenanceDate";
    const sortDirection =
      searchParams.get("sortDirection") === "asc" ? "asc" : "desc";

    // Build where clause
    let where: ReturnType<typeof and> | ReturnType<typeof eq> = eq(
      fleetMaintenance.organizationId,
      organization.id,
    );

    if (vehicleId) {
      where = and(where, eq(fleetMaintenance.vehicleId, Number(vehicleId)));
    }

    if (maintenanceType) {
      where = and(
        where,
        eq(
          fleetMaintenance.maintenanceType,
          maintenanceType as (typeof maintenanceTypeEnum.enumValues)[number],
        ),
      );
    }

    if (from && to) {
      where = and(
        where,
        gte(fleetMaintenance.maintenanceDate, new Date(from)),
        lte(fleetMaintenance.maintenanceDate, new Date(to)),
      );
    }

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(fleetMaintenance)
      .where(where);
    const total = totalResult[0].count;

    // Map sortBy to actual column names
    const columnMap: Record<string, AnyColumn> = {
      maintenanceDate: fleetMaintenance.maintenanceDate,
      maintenanceType: fleetMaintenance.maintenanceType,
      cost: fleetMaintenance.cost,
      createdAt: fleetMaintenance.createdAt,
    };

    const orderColumn = columnMap[sortBy] || fleetMaintenance.maintenanceDate;
    const order =
      sortDirection === "asc" ? asc(orderColumn) : desc(orderColumn);

    // Get maintenance records with vehicle info
    const rows = await db
      .select({
        maintenance: fleetMaintenance,
        vehicle: {
          id: vehicles.id,
          make: vehicles.make,
          model: vehicles.model,
          year: vehicles.year,
          licensePlate: vehicles.licensePlate,
        },
      })
      .from(fleetMaintenance)
      .innerJoin(vehicles, eq(vehicles.id, fleetMaintenance.vehicleId))
      .where(where)
      .orderBy(order)
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      maintenance: rows.map((row) => ({
        ...row.maintenance,
        vehicle: row.vehicle,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching maintenance records:", error);
    return NextResponse.json(
      { error: "Failed to fetch maintenance records" },
      { status: 500 },
    );
  }
}

// POST: Create new maintenance record
export async function POST(request: NextRequest) {
  try {
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;

    const body = await request.json();
    const {
      vehicleId,
      maintenanceType,
      maintenanceDate,
      description,
      cost,
      mileageAtService,
      performedBy,
      nextServiceDue,
      notes,
    } = body;

    // Validation
    if (
      !vehicleId ||
      !maintenanceType ||
      !maintenanceDate ||
      !description ||
      !cost
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: vehicleId, maintenanceType, maintenanceDate, description, cost",
        },
        { status: 400 },
      );
    }

    // Verify vehicle belongs to organization
    const [vehicle] = await db
      .select()
      .from(vehicles)
      .where(
        and(
          eq(vehicles.id, Number(vehicleId)),
          eq(vehicles.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    const [created] = await db
      .insert(fleetMaintenance)
      .values({
        organizationId: organization.id,
        vehicleId: Number(vehicleId),
        maintenanceType,
        maintenanceDate: new Date(maintenanceDate),
        description,
        cost: cost.toString(),
        mileageAtService: mileageAtService ? mileageAtService.toString() : null,
        performedBy: performedBy || null,
        nextServiceDue: nextServiceDue || null,
        notes: notes || null,
        createdBy: userId || null,
      })
      .returning();

    return NextResponse.json({ maintenance: created }, { status: 201 });
  } catch (error) {
    console.error("Error creating maintenance record:", error);
    return NextResponse.json(
      { error: "Failed to create maintenance record" },
      { status: 500 },
    );
  }
}
