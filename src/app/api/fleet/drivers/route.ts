import { db } from "@/db";
import {
  drivers,
  employees,
  driverAssignments,
  vehicles,
  type driverStatusEnum,
} from "@/db/schema";
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  or,
  sql,
  isNull,
  type AnyColumn,
} from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET: List all drivers with pagination, search, filters
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
    const q = searchParams.get("q") || "";
    const status = searchParams.get("status") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortDirection =
      searchParams.get("sortDirection") === "asc" ? "asc" : "desc";

    // Build where clause
    let where: ReturnType<typeof and> | ReturnType<typeof eq> = eq(
      drivers.organizationId,
      organization.id,
    );

    if (q) {
      where = and(
        where,
        or(
          ilike(drivers.name, `%${q}%`),
          ilike(drivers.email, `%${q}%`),
          ilike(drivers.licenseNumber, `%${q}%`),
        ),
      );
    }

    if (status) {
      where = and(
        where,
        eq(
          drivers.status,
          status as (typeof driverStatusEnum.enumValues)[number],
        ),
      );
    }

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(drivers)
      .where(where);
    const total = totalResult[0].count;

    // Map sortBy to actual column names
    const columnMap: Record<string, AnyColumn> = {
      name: drivers.name,
      email: drivers.email,
      licenseNumber: drivers.licenseNumber,
      status: drivers.status,
      createdAt: drivers.createdAt,
      updatedAt: drivers.updatedAt,
    };

    const orderColumn = columnMap[sortBy] || drivers.createdAt;
    const order =
      sortDirection === "asc" ? asc(orderColumn) : desc(orderColumn);

    // Get drivers with current vehicle assignment and employee info
    const rows = await db
      .select({
        driver: drivers,
        employee: {
          id: employees.id,
          name: employees.name,
          staffNumber: employees.staffNumber,
        },
        currentVehicle: {
          vehicleId: vehicles.id,
          vehicleName: sql<string>`CONCAT(${vehicles.year}, ' ', ${vehicles.make}, ' ', ${vehicles.model})`,
          licensePlate: vehicles.licensePlate,
        },
      })
      .from(drivers)
      .leftJoin(employees, eq(employees.id, drivers.employeeId))
      .leftJoin(
        driverAssignments,
        and(
          eq(driverAssignments.driverId, drivers.id),
          isNull(driverAssignments.endDate), // current assignment
        ),
      )
      .leftJoin(vehicles, eq(vehicles.id, driverAssignments.vehicleId))
      .where(where)
      .orderBy(order)
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      drivers: rows.map((row) => ({
        ...row.driver,
        employee: row.employee?.id ? row.employee : null,
        currentVehicle: row.currentVehicle?.vehicleId
          ? row.currentVehicle
          : null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return NextResponse.json(
      { error: "Failed to fetch drivers" },
      { status: 500 },
    );
  }
}

// POST: Create new driver
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
      name,
      email,
      phone,
      licenseNumber,
      licenseExpiryDate,
      licenseClass,
      dateOfBirth,
      employeeId,
      hireDate,
      status,
      notes,
    } = body;

    // Validation
    if (!name || !licenseNumber) {
      return NextResponse.json(
        { error: "Missing required fields: name, licenseNumber" },
        { status: 400 },
      );
    }

    // If employeeId provided, verify it belongs to this organization
    if (employeeId) {
      const [employee] = await db
        .select()
        .from(employees)
        .where(
          and(
            eq(employees.id, Number(employeeId)),
            eq(employees.organizationId, organization.id),
          ),
        )
        .limit(1);

      if (!employee) {
        return NextResponse.json(
          { error: "Invalid employee ID" },
          { status: 400 },
        );
      }
    }

    const [created] = await db
      .insert(drivers)
      .values({
        organizationId: organization.id,
        name,
        email: email || null,
        phone: phone || null,
        licenseNumber,
        licenseExpiryDate: licenseExpiryDate
          ? new Date(licenseExpiryDate)
          : null,
        licenseClass: licenseClass || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        employeeId: employeeId ? Number(employeeId) : null,
        hireDate: hireDate ? new Date(hireDate) : null,
        status: status || "Active",
        notes: notes || null,
        createdBy: userId || null,
      })
      .returning();

    return NextResponse.json({ driver: created }, { status: 201 });
  } catch (error) {
    console.error("Error creating driver:", error);
    return NextResponse.json(
      { error: "Failed to create driver" },
      { status: 500 },
    );
  }
}
