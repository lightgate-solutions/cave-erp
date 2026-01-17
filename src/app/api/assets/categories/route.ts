import { db } from "@/db";
import { assetCategories } from "@/db/schema";
import { and, eq, desc, sql } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { requireAssetAccess } from "@/actions/auth/dal";

// GET: List all asset categories
export async function GET() {
  try {
    await requireAssetAccess();
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await db
      .select({
        id: assetCategories.id,
        name: assetCategories.name,
        description: assetCategories.description,
        codePrefix: assetCategories.codePrefix,
        depreciationMethod: assetCategories.depreciationMethod,
        defaultUsefulLifeYears: assetCategories.defaultUsefulLifeYears,
        defaultResidualValuePercent:
          assetCategories.defaultResidualValuePercent,
        isActive: assetCategories.isActive,
        createdAt: assetCategories.createdAt,
        assetCount: sql<number>`(SELECT COUNT(*) FROM assets WHERE assets.category_id = ${assetCategories.id} AND assets.status != 'Disposed')`,
      })
      .from(assetCategories)
      .where(eq(assetCategories.organizationId, organization.id))
      .orderBy(desc(assetCategories.createdAt));

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}

// POST: Create new category
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
      codePrefix,
      defaultUsefulLifeYears,
      defaultResidualValuePercent,
    } = body;

    // Validation
    if (!name || !codePrefix) {
      return NextResponse.json(
        { error: "Missing required fields: name, codePrefix" },
        { status: 400 },
      );
    }

    // Check for duplicate code prefix
    const [existing] = await db
      .select()
      .from(assetCategories)
      .where(
        and(
          eq(assetCategories.organizationId, organization.id),
          eq(assetCategories.codePrefix, codePrefix.toUpperCase()),
        ),
      )
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "A category with this code prefix already exists" },
        { status: 400 },
      );
    }

    const [created] = await db
      .insert(assetCategories)
      .values({
        organizationId: organization.id,
        name,
        description: description || null,
        codePrefix: codePrefix.toUpperCase(),
        defaultUsefulLifeYears: defaultUsefulLifeYears || null,
        defaultResidualValuePercent: defaultResidualValuePercent
          ? String(defaultResidualValuePercent)
          : null,
        createdBy: userId || null,
      })
      .returning();

    return NextResponse.json({ category: created }, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 },
    );
  }
}
