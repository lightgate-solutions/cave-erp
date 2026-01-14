import { db } from "@/db";
import {
  fleetIncidents,
  vehicles,
  drivers,
  type incidentTypeEnum,
  type incidentSeverityEnum,
  type incidentResolutionStatusEnum,
} from "@/db/schema";
import { and, asc, desc, eq, sql, gte, lte, type AnyColumn } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET: List all incidents with pagination and filters
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
    const driverId = searchParams.get("driverId");
    const incidentType = searchParams.get("incidentType");
    const severity = searchParams.get("severity");
    const resolutionStatus = searchParams.get("resolutionStatus");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const sortBy = searchParams.get("sortBy") || "incidentDate";
    const sortDirection =
      searchParams.get("sortDirection") === "asc" ? "asc" : "desc";

    // Build where clause
    let where: ReturnType<typeof and> | ReturnType<typeof eq> = eq(
      fleetIncidents.organizationId,
      organization.id,
    );

    if (vehicleId) {
      where = and(where, eq(fleetIncidents.vehicleId, Number(vehicleId)));
    }

    if (driverId) {
      where = and(where, eq(fleetIncidents.driverId, Number(driverId)));
    }

    if (incidentType) {
      where = and(
        where,
        eq(
          fleetIncidents.incidentType,
          incidentType as (typeof incidentTypeEnum.enumValues)[number],
        ),
      );
    }

    if (severity) {
      where = and(
        where,
        eq(
          fleetIncidents.severity,
          severity as (typeof incidentSeverityEnum.enumValues)[number],
        ),
      );
    }

    if (resolutionStatus) {
      where = and(
        where,
        eq(
          fleetIncidents.resolutionStatus,
          resolutionStatus as (typeof incidentResolutionStatusEnum.enumValues)[number],
        ),
      );
    }

    if (from && to) {
      where = and(
        where,
        gte(fleetIncidents.incidentDate, new Date(from)),
        lte(fleetIncidents.incidentDate, new Date(to)),
      );
    }

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(fleetIncidents)
      .where(where);
    const total = totalResult[0].count;

    // Map sortBy to actual column names
    const columnMap: Record<string, AnyColumn> = {
      incidentDate: fleetIncidents.incidentDate,
      incidentType: fleetIncidents.incidentType,
      severity: fleetIncidents.severity,
      resolutionStatus: fleetIncidents.resolutionStatus,
      createdAt: fleetIncidents.createdAt,
    };

    const orderColumn = columnMap[sortBy] || fleetIncidents.incidentDate;
    const order =
      sortDirection === "asc" ? asc(orderColumn) : desc(orderColumn);

    // Get incidents with vehicle and driver info
    const rows = await db
      .select({
        incident: fleetIncidents,
        vehicle: {
          id: vehicles.id,
          make: vehicles.make,
          model: vehicles.model,
          year: vehicles.year,
          licensePlate: vehicles.licensePlate,
        },
        driver: {
          id: drivers.id,
          name: drivers.name,
          licenseNumber: drivers.licenseNumber,
        },
      })
      .from(fleetIncidents)
      .innerJoin(vehicles, eq(vehicles.id, fleetIncidents.vehicleId))
      .leftJoin(drivers, eq(drivers.id, fleetIncidents.driverId))
      .where(where)
      .orderBy(order)
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      incidents: rows.map((row) => ({
        ...row.incident,
        vehicle: row.vehicle,
        driver: row.driver?.id ? row.driver : null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching incidents:", error);
    return NextResponse.json(
      { error: "Failed to fetch incidents" },
      { status: 500 },
    );
  }
}

// POST: Create new incident
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
      driverId,
      incidentType,
      severity,
      incidentDate,
      location,
      description,
      estimatedCost,
      resolutionStatus,
      resolutionNotes,
      resolvedAt,
    } = body;

    // Validation
    if (
      !vehicleId ||
      !incidentType ||
      !severity ||
      !incidentDate ||
      !description
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: vehicleId, incidentType, severity, incidentDate, description",
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

    // If driverId provided, verify it belongs to organization
    if (driverId) {
      const [driver] = await db
        .select()
        .from(drivers)
        .where(
          and(
            eq(drivers.id, Number(driverId)),
            eq(drivers.organizationId, organization.id),
          ),
        )
        .limit(1);

      if (!driver) {
        return NextResponse.json(
          { error: "Driver not found" },
          { status: 404 },
        );
      }
    }

    const [created] = await db
      .insert(fleetIncidents)
      .values({
        organizationId: organization.id,
        vehicleId: Number(vehicleId),
        driverId: driverId ? Number(driverId) : null,
        incidentType,
        severity,
        incidentDate: new Date(incidentDate),
        location: location || null,
        description,
        estimatedCost: estimatedCost ? estimatedCost.toString() : null,
        resolutionStatus: resolutionStatus || "Reported",
        resolutionNotes: resolutionNotes || null,
        resolvedAt: resolvedAt ? new Date(resolvedAt) : null,
        reportedBy: userId || null,
      })
      .returning();

    return NextResponse.json({ incident: created }, { status: 201 });
  } catch (error) {
    console.error("Error creating incident:", error);
    return NextResponse.json(
      { error: "Failed to create incident" },
      { status: 500 },
    );
  }
}
