import { db } from "@/db";
import { userPreferences } from "@/db/schema/user-preferences";
import { getUser } from "@/actions/auth/dal";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    return NextResponse.json(
      { success: false, message: "Organization not found" },
      { status: 401 },
    );
  }

  try {
    const prefs = await db
      .select()
      .from(userPreferences)
      .where(
        and(
          eq(userPreferences.userId, user.id),
          eq(userPreferences.organizationId, organization.id),
        ),
      )
      .limit(1);

    return NextResponse.json({ success: true, data: prefs[0] || null });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch preferences" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });
    if (!organization) {
      return NextResponse.json(
        { success: false, message: "Organization not found" },
        { status: 401 },
      );
    }

    const body = await req.json();

    const existingPref = await db
      .select()
      .from(userPreferences)
      .where(
        and(
          eq(userPreferences.userId, user.id),
          eq(userPreferences.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (existingPref.length > 0) {
      await db
        .update(userPreferences)
        .set({
          ...body,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(userPreferences.userId, user.id),
            eq(userPreferences.organizationId, organization.id),
          ),
        );
    } else {
      await db.insert(userPreferences).values({
        userId: user.id,
        organizationId: organization.id,
        ...body,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Preferences updated successfully",
    });
  } catch (error) {
    console.error("Error saving preferences:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update preferences" },
      { status: 500 },
    );
  }
}
