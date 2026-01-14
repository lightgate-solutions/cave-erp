import { db } from "@/db";
import { driverAssignments, drivers, vehicles } from "@/db/schema";
import { and, asc, desc, eq, sql, isNull, type AnyColumn } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET: List all assignments with pagination and filters
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
    const activeOnly = searchParams.get("activeOnly") === "true";
    const sortBy = searchParams.get("sortBy") || "startDate";
    const sortDirection =
      searchParams.get("sortDirection") === "asc" ? "asc" : "desc";

    // Build where clause
    let where: ReturnType<typeof and> | ReturnType<typeof eq> = eq(
      driverAssignments.organizationId,
      organization.id,
    );

    if (vehicleId) {
      where = and(where, eq(driverAssignments.vehicleId, Number(vehicleId)));
    }

    if (driverId) {
      where = and(where, eq(driverAssignments.driverId, Number(driverId)));
    }

    if (activeOnly) {
      where = and(where, isNull(driverAssignments.endDate));
    }

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(driverAssignments)
      .where(where);
    const total = totalResult[0].count;

    // Map sortBy to actual column names
    const columnMap: Record<string, AnyColumn> = {
      startDate: driverAssignments.startDate,
      endDate: driverAssignments.endDate,
      createdAt: driverAssignments.createdAt,
    };

    const orderColumn = columnMap[sortBy] || driverAssignments.startDate;
    const order =
      sortDirection === "asc" ? asc(orderColumn) : desc(orderColumn);

    // Get assignments with driver and vehicle info
    const rows = await db
      .select({
        assignment: driverAssignments,
        driver: {
          id: drivers.id,
          name: drivers.name,
          licenseNumber: drivers.licenseNumber,
        },
        vehicle: {
          id: vehicles.id,
          make: vehicles.make,
          model: vehicles.model,
          year: vehicles.year,
          licensePlate: vehicles.licensePlate,
        },
      })
      .from(driverAssignments)
      .innerJoin(drivers, eq(drivers.id, driverAssignments.driverId))
      .innerJoin(vehicles, eq(vehicles.id, driverAssignments.vehicleId))
      .where(where)
      .orderBy(order)
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      assignments: rows.map((row) => ({
        ...row.assignment,
        driver: row.driver,
        vehicle: row.vehicle,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 },
    );
  }
}

// POST: Create new assignment
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
    const { driverId, vehicleId, startDate, notes } = body;

    // Validation
    if (!driverId || !vehicleId || !startDate) {
      return NextResponse.json(
        {
          error: "Missing required fields: driverId, vehicleId, startDate",
        },
        { status: 400 },
      );
    }

    // Verify driver belongs to organization
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
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
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

    // Check if vehicle already has an active assignment
    const [existingAssignment] = await db
      .select()
      .from(driverAssignments)
      .where(
        and(
          eq(driverAssignments.vehicleId, Number(vehicleId)),
          eq(driverAssignments.organizationId, organization.id),
          isNull(driverAssignments.endDate),
        ),
      )
      .limit(1);

    if (existingAssignment) {
      return NextResponse.json(
        {
          error:
            "Vehicle already has an active assignment. Please end the current assignment first.",
        },
        { status: 400 },
      );
    }

    const [created] = await db
      .insert(driverAssignments)
      .values({
        organizationId: organization.id,
        driverId: Number(driverId),
        vehicleId: Number(vehicleId),
        startDate: new Date(startDate),
        endDate: null, // New assignment is always active
        notes: notes || null,
        assignedBy: userId || null,
      })
      .returning();

    return NextResponse.json({ assignment: created }, { status: 201 });
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { error: "Failed to create assignment" },
      { status: 500 },
    );
  }
}
