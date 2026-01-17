import { db } from "@/db";
import { assetLocations } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { requireAssetAccess } from "@/actions/auth/dal";

// GET: List all asset locations
export async function GET() {
  try {
    await requireAssetAccess();
    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const locations = await db
      .select({
        id: assetLocations.id,
        name: assetLocations.name,
        address: assetLocations.address,
        type: assetLocations.type,
        description: assetLocations.description,
        isActive: assetLocations.isActive,
        createdAt: assetLocations.createdAt,
        assetCount: sql<number>`(SELECT COUNT(*) FROM assets WHERE assets.location_id = ${assetLocations.id} AND assets.status != 'Disposed')`,
      })
      .from(assetLocations)
      .where(eq(assetLocations.organizationId, organization.id))
      .orderBy(desc(assetLocations.createdAt));

    return NextResponse.json({ locations });
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Failed to fetch locations" },
      { status: 500 },
    );
  }
}

// POST: Create new location
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
    const { name, address, type, description } = body;

    // Validation
    if (!name) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 },
      );
    }

    const [created] = await db
      .insert(assetLocations)
      .values({
        organizationId: organization.id,
        name,
        address: address || null,
        type: type || null,
        description: description || null,
        createdBy: userId || null,
      })
      .returning();

    return NextResponse.json({ location: created }, { status: 201 });
  } catch (error) {
    console.error("Error creating location:", error);
    return NextResponse.json(
      { error: "Failed to create location" },
      { status: 500 },
    );
  }
}
