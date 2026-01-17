import { db } from "@/db";
import { assetCategories } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { requireAssetAccess } from "@/actions/auth/dal";

// GET: Get single category
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
    const categoryId = Number(id);

    const [category] = await db
      .select()
      .from(assetCategories)
      .where(
        and(
          eq(assetCategories.id, categoryId),
          eq(assetCategories.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 },
    );
  }
}

// PATCH: Update category
export async function PATCH(
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

    const { id } = await params;
    const categoryId = Number(id);
    const body = await request.json();

    // If updating code prefix, check for duplicates
    if (body.codePrefix) {
      const [existing] = await db
        .select()
        .from(assetCategories)
        .where(
          and(
            eq(assetCategories.organizationId, organization.id),
            eq(assetCategories.codePrefix, body.codePrefix.toUpperCase()),
          ),
        )
        .limit(1);

      if (existing && existing.id !== categoryId) {
        return NextResponse.json(
          { error: "A category with this code prefix already exists" },
          { status: 400 },
        );
      }
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.codePrefix !== undefined)
      updateData.codePrefix = body.codePrefix.toUpperCase();
    if (body.defaultUsefulLifeYears !== undefined)
      updateData.defaultUsefulLifeYears = body.defaultUsefulLifeYears;
    if (body.defaultResidualValuePercent !== undefined)
      updateData.defaultResidualValuePercent = String(
        body.defaultResidualValuePercent,
      );
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const [updated] = await db
      .update(assetCategories)
      .set(updateData)
      .where(
        and(
          eq(assetCategories.id, categoryId),
          eq(assetCategories.organizationId, organization.id),
        ),
      )
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ category: updated });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 },
    );
  }
}

// DELETE: Delete category
export async function DELETE(
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
    const categoryId = Number(id);

    try {
      const [deleted] = await db
        .delete(assetCategories)
        .where(
          and(
            eq(assetCategories.id, categoryId),
            eq(assetCategories.organizationId, organization.id),
          ),
        )
        .returning();

      if (!deleted) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({ success: true });
    } catch (dbError) {
      // Handle foreign key constraint error
      if (
        dbError instanceof Error &&
        dbError.message.includes("foreign key constraint")
      ) {
        return NextResponse.json(
          {
            error:
              "Cannot delete category with existing assets. Please reassign or delete assets first.",
          },
          { status: 400 },
        );
      }
      throw dbError;
    }
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 },
    );
  }
}
