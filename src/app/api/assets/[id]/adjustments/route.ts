import { db } from "@/db";
import { assetValueAdjustments, assets } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { requireAssetAccess } from "@/actions/auth/dal";

// GET: Get value adjustments for an asset
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

    const adjustments = await db
      .select()
      .from(assetValueAdjustments)
      .where(
        and(
          eq(assetValueAdjustments.assetId, assetId),
          eq(assetValueAdjustments.organizationId, organization.id),
        ),
      )
      .orderBy(desc(assetValueAdjustments.adjustmentDate));

    return NextResponse.json({ adjustments });
  } catch (error) {
    console.error("Error fetching adjustments:", error);
    return NextResponse.json(
      { error: "Failed to fetch adjustments" },
      { status: 500 },
    );
  }
}

// POST: Create a new value adjustment
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

    const { adjustmentType, adjustmentAmount, reason, notes, adjustmentDate } =
      body;

    if (!adjustmentType || adjustmentAmount === undefined || !reason) {
      return NextResponse.json(
        { error: "Adjustment type, amount, and reason are required" },
        { status: 400 },
      );
    }

    // Get current asset value
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

    const previousValue = Number(
      asset.currentValue || asset.purchasePrice || 0,
    );
    let newValue: number;
    let accumulatedDepreciation = Number(asset.accumulatedDepreciation || 0);

    // Calculate new value based on adjustment type
    switch (adjustmentType) {
      case "Depreciation":
      case "Impairment":
        newValue = previousValue - Number(adjustmentAmount);
        accumulatedDepreciation += Number(adjustmentAmount);
        break;
      case "Appreciation":
      case "Revaluation":
        newValue = previousValue + Number(adjustmentAmount);
        // Appreciation can reduce accumulated depreciation
        if (adjustmentType === "Appreciation") {
          accumulatedDepreciation = Math.max(
            0,
            accumulatedDepreciation - Number(adjustmentAmount),
          );
        }
        break;
      default:
        return NextResponse.json(
          { error: "Invalid adjustment type" },
          { status: 400 },
        );
    }

    // Ensure value doesn't go negative
    newValue = Math.max(0, newValue);

    // Create adjustment record
    const [adjustment] = await db
      .insert(assetValueAdjustments)
      .values({
        organizationId: organization.id,
        assetId,
        adjustmentType,
        adjustmentDate: adjustmentDate ? new Date(adjustmentDate) : new Date(),
        previousValue: previousValue.toString(),
        adjustmentAmount: adjustmentAmount.toString(),
        newValue: newValue.toString(),
        reason,
        notes: notes || null,
        adjustedBy: userId || null,
      })
      .returning();

    // Update asset current value and accumulated depreciation
    await db
      .update(assets)
      .set({
        currentValue: newValue.toString(),
        accumulatedDepreciation: accumulatedDepreciation.toString(),
        updatedAt: new Date(),
      })
      .where(eq(assets.id, assetId));

    return NextResponse.json(
      {
        adjustment,
        asset: {
          currentValue: newValue,
          accumulatedDepreciation,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating adjustment:", error);
    return NextResponse.json(
      { error: "Failed to create adjustment" },
      { status: 500 },
    );
  }
}
