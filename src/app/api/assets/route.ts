import { db } from "@/db";
import {
  assets,
  assetCategories,
  assetLocations,
  assetAssignments,
  user,
} from "@/db/schema";
import {
  and,
  asc,
  desc,
  eq,
  ne,
  ilike,
  or,
  sql,
  isNull,
  like,
  type AnyColumn,
} from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { requireAssetAccess } from "@/actions/auth/dal";

// GET: List all assets with pagination, search, filters
export async function GET(request: NextRequest) {
  try {
    await requireAssetAccess();
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;
    const q = searchParams.get("q") || "";
    const status = searchParams.get("status") || "";
    const categoryId = searchParams.get("categoryId");
    const locationId = searchParams.get("locationId");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortDirection =
      searchParams.get("sortDirection") === "asc" ? "asc" : "desc";

    // Build where clause
    let where: ReturnType<typeof and> | ReturnType<typeof eq> = eq(
      assets.organizationId,
      organization.id,
    );

    if (q) {
      where = and(
        where,
        or(
          ilike(assets.name, `%${q}%`),
          ilike(assets.assetCode, `%${q}%`),
          ilike(assets.serialNumber, `%${q}%`),
          ilike(assets.manufacturer, `%${q}%`),
          ilike(assets.model, `%${q}%`),
        ),
      );
    }

    if (status) {
      where = and(
        where,
        eq(assets.status, status as (typeof assets.status.enumValues)[number]),
      );
    } else {
      where = and(where, ne(assets.status, "Disposed"));
    }

    if (categoryId) {
      where = and(where, eq(assets.categoryId, Number(categoryId)));
    }

    if (locationId) {
      where = and(where, eq(assets.locationId, Number(locationId)));
    }

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(assets)
      .where(where);
    const total = totalResult[0].count;

    // Map sortBy to actual column names
    const columnMap: Record<string, AnyColumn> = {
      name: assets.name,
      assetCode: assets.assetCode,
      status: assets.status,
      currentValue: assets.currentValue,
      purchaseDate: assets.purchaseDate,
      createdAt: assets.createdAt,
      updatedAt: assets.updatedAt,
    };

    const orderColumn = columnMap[sortBy] || assets.createdAt;
    const order =
      sortDirection === "asc" ? asc(orderColumn) : desc(orderColumn);

    // Get assets with category and location
    const rows = await db
      .select({
        asset: assets,
        category: {
          id: assetCategories.id,
          name: assetCategories.name,
          codePrefix: assetCategories.codePrefix,
        },
        location: {
          id: assetLocations.id,
          name: assetLocations.name,
        },
      })
      .from(assets)
      .leftJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
      .leftJoin(assetLocations, eq(assets.locationId, assetLocations.id))
      .where(where)
      .orderBy(order)
      .limit(limit)
      .offset(offset);

    // Get current assignments for fetched assets
    const assetIds = rows.map((r) => r.asset.id);
    const assignments =
      assetIds.length > 0
        ? await db
            .select({
              assetId: assetAssignments.assetId,
              targetType: assetAssignments.targetType,
              employeeId: assetAssignments.employeeId,
              department: assetAssignments.department,
              projectId: assetAssignments.projectId,
              employeeName: user.name,
            })
            .from(assetAssignments)
            .leftJoin(user, eq(assetAssignments.employeeId, user.id))
            .where(
              and(
                sql`${assetAssignments.assetId} IN (${sql.join(assetIds, sql`, `)})`,
                isNull(assetAssignments.actualReturnDate),
              ),
            )
        : [];

    const assignmentMap = new Map(assignments.map((a) => [a.assetId, a]));

    return NextResponse.json({
      assets: rows.map((row) => ({
        ...row.asset,
        category: row.category?.id ? row.category : null,
        location: row.location?.id ? row.location : null,
        currentAssignment: assignmentMap.get(row.asset.id) || null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching assets:", error);
    return NextResponse.json(
      { error: "Failed to fetch assets" },
      { status: 500 },
    );
  }
}

// Helper function to generate asset code
async function generateAssetCode(
  organizationId: string,
  categoryId: number,
): Promise<string> {
  // Get the category
  const [category] = await db
    .select()
    .from(assetCategories)
    .where(
      and(
        eq(assetCategories.id, categoryId),
        eq(assetCategories.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!category) {
    throw new Error("Category not found");
  }

  const year = new Date().getFullYear();
  const prefix = `${year}-${category.codePrefix}-`;

  // Get the last asset code for this year and category
  const [lastAsset] = await db
    .select({ assetCode: assets.assetCode })
    .from(assets)
    .where(
      and(
        eq(assets.organizationId, organizationId),
        like(assets.assetCode, `${prefix}%`),
      ),
    )
    .orderBy(desc(assets.assetCode))
    .limit(1);

  let sequence = 1;
  if (lastAsset) {
    const lastSequence = Number.parseInt(lastAsset.assetCode.split("-")[2], 10);
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(4, "0")}`;
}

// POST: Create new asset
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      name,
      description,
      categoryId,
      locationId,
      purchaseDate,
      purchasePrice,
      vendor,
      poNumber,
      currentValue,
      usefulLifeYears,
      residualValue,
      depreciationStartDate,
      warrantyStartDate,
      warrantyEndDate,
      warrantyProvider,
      warrantyTerms,
      serialNumber,
      model,
      manufacturer,
      barcode,
      requiresMaintenance,
      notes,
    } = body;

    // Validation
    if (!name || !categoryId) {
      return NextResponse.json(
        { error: "Missing required fields: name, categoryId" },
        { status: 400 },
      );
    }

    // Generate asset code
    const assetCode = await generateAssetCode(organization.id, categoryId);

    // Set current value to purchase price if not provided
    const finalCurrentValue = currentValue ?? purchasePrice ?? null;

    const [created] = await db
      .insert(assets)
      .values({
        organizationId: organization.id,
        assetCode,
        name,
        description: description || null,
        categoryId,
        locationId: locationId || null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchasePrice: purchasePrice ? String(purchasePrice) : null,
        vendor: vendor || null,
        poNumber: poNumber || null,
        currentValue: finalCurrentValue ? String(finalCurrentValue) : null,
        usefulLifeYears: usefulLifeYears || null,
        residualValue: residualValue ? String(residualValue) : null,
        depreciationStartDate: depreciationStartDate
          ? new Date(depreciationStartDate)
          : null,
        warrantyStartDate: warrantyStartDate
          ? new Date(warrantyStartDate)
          : null,
        warrantyEndDate: warrantyEndDate ? new Date(warrantyEndDate) : null,
        warrantyProvider: warrantyProvider || null,
        warrantyTerms: warrantyTerms || null,
        serialNumber: serialNumber || null,
        model: model || null,
        manufacturer: manufacturer || null,
        barcode: barcode || null,
        requiresMaintenance: requiresMaintenance || false,
        notes: notes || null,
        createdBy: userId || null,
      })
      .returning();

    return NextResponse.json({ asset: created }, { status: 201 });
  } catch (error) {
    console.error("Error creating asset:", error);
    return NextResponse.json(
      { error: "Failed to create asset" },
      { status: 500 },
    );
  }
}
