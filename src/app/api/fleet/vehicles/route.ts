import { db } from "@/db";
import {
  vehicles,
  driverAssignments,
  drivers,
  employees,
  type vehicleStatusEnum,
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

async function requireFleetAccess() {
  const h = await headers();
  const [organization, session] = await Promise.all([
    auth.api.getFullOrganization({ headers: h }),
    auth.api.getSession({ headers: h }),
  ]);

  if (!organization) {
    throw new Error("Unauthorized");
  }
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  if (session.user.role !== "admin") {
    const [emp] = await db
      .select({ department: employees.department })
      .from(employees)
      .where(
        and(
          eq(employees.authId, session.user.id),
          eq(employees.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (
      !emp ||
      (emp.department !== "hr" &&
        emp.department !== "finance" &&
        emp.department !== "admin")
    ) {
      throw new Error(
        "Forbidden: Fleet access requires HR, Finance, or Admin department",
      );
    }
  }

  return { organization, session };
}

// GET: List all vehicles with pagination, search, filters
export async function GET(request: NextRequest) {
  try {
    const { organization } = await requireFleetAccess();

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const rawLimit = Number(searchParams.get("limit") || "10");
    const limit = Math.min(Math.max(1, rawLimit), 100);
    const offset = (page - 1) * limit;
    const q = searchParams.get("q") || "";
    const status = searchParams.get("status") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortDirection =
      searchParams.get("sortDirection") === "asc" ? "asc" : "desc";

    // Build where clause
    let where: ReturnType<typeof and> | ReturnType<typeof eq> = eq(
      vehicles.organizationId,
      organization.id,
    );

    if (q) {
      where = and(
        where,
        or(
          ilike(vehicles.make, `%${q}%`),
          ilike(vehicles.model, `%${q}%`),
          ilike(vehicles.licensePlate, `%${q}%`),
          ilike(vehicles.vin, `%${q}%`),
        ),
      );
    }

    if (status) {
      where = and(
        where,
        eq(
          vehicles.status,
          status as (typeof vehicleStatusEnum.enumValues)[number],
        ),
      );
    }

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(vehicles)
      .where(where);
    const total = totalResult[0].count;

    // Map sortBy to actual column names
    const columnMap: Record<string, AnyColumn> = {
      make: vehicles.make,
      model: vehicles.model,
      year: vehicles.year,
      licensePlate: vehicles.licensePlate,
      status: vehicles.status,
      currentMileage: vehicles.currentMileage,
      createdAt: vehicles.createdAt,
      updatedAt: vehicles.updatedAt,
    };

    const orderColumn = columnMap[sortBy] || vehicles.createdAt;
    const order =
      sortDirection === "asc" ? asc(orderColumn) : desc(orderColumn);

    // Get vehicles with current driver assignment
    const rows = await db
      .select({
        vehicle: vehicles,
        currentDriver: {
          driverId: drivers.id,
          driverName: drivers.name,
        },
      })
      .from(vehicles)
      .leftJoin(
        driverAssignments,
        and(
          eq(driverAssignments.vehicleId, vehicles.id),
          isNull(driverAssignments.endDate), // current assignment
        ),
      )
      .leftJoin(drivers, eq(drivers.id, driverAssignments.driverId))
      .where(where)
      .orderBy(order)
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      vehicles: rows.map((row) => ({
        ...row.vehicle,
        currentDriver: row.currentDriver?.driverId ? row.currentDriver : null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    if (error instanceof Error) {
      const status =
        error.message === "Unauthorized"
          ? 401
          : error.message.startsWith("Forbidden")
            ? 403
            : 500;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json(
      { error: "Failed to fetch vehicles" },
      { status: 500 },
    );
  }
}

// POST: Create new vehicle
export async function POST(request: NextRequest) {
  try {
    const { organization, session } = await requireFleetAccess();
    const userId = session.user.id;

    const body = await request.json();
    const {
      make,
      model,
      year,
      vin,
      licensePlate,
      color,
      currentMileage,
      fuelType,
      status,
      purchaseDate,
      purchasePrice,
      currentValue,
      depreciationRate,
      insurancePolicyNumber,
      insuranceProvider,
      insuranceExpiryDate,
      insurancePremiumAmount,
      registrationNumber,
      registrationExpiryDate,
      notes,
    } = body;

    // Validation
    if (!make || !model || !year || !licensePlate || !fuelType) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: make, model, year, licensePlate, fuelType",
        },
        { status: 400 },
      );
    }

    const [created] = await db
      .insert(vehicles)
      .values({
        organizationId: organization.id,
        make,
        model,
        year: Number(year),
        vin: vin || null,
        licensePlate,
        color: color || null,
        currentMileage: currentMileage ? currentMileage.toString() : "0",
        fuelType,
        status: status || "Active",
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchasePrice: purchasePrice ? purchasePrice.toString() : null,
        currentValue: currentValue ? currentValue.toString() : null,
        depreciationRate: depreciationRate ? depreciationRate.toString() : null,
        insurancePolicyNumber: insurancePolicyNumber || null,
        insuranceProvider: insuranceProvider || null,
        insuranceExpiryDate: insuranceExpiryDate
          ? new Date(insuranceExpiryDate)
          : null,
        insurancePremiumAmount: insurancePremiumAmount
          ? insurancePremiumAmount.toString()
          : null,
        registrationNumber: registrationNumber || null,
        registrationExpiryDate: registrationExpiryDate
          ? new Date(registrationExpiryDate)
          : null,
        notes: notes || null,
        createdBy: userId || null,
      })
      .returning();

    return NextResponse.json({ vehicle: created }, { status: 201 });
  } catch (error) {
    console.error("Error creating vehicle:", error);
    if (error instanceof Error) {
      const status =
        error.message === "Unauthorized"
          ? 401
          : error.message.startsWith("Forbidden")
            ? 403
            : 500;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json(
      { error: "Failed to create vehicle" },
      { status: 500 },
    );
  }
}
