import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { and, eq, inArray } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid request" },
        { status: 400 },
      );
    }

    // Update only notifications that belong to the authenticated user
    await db
      .update(notifications)
      .set({ is_read: true })
      .where(
        and(
          inArray(notifications.id, ids),
          eq(notifications.user_id, session.user.id),
        ),
      );

    return NextResponse.json({ success: true, message: "Marked as read" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Failed to mark notifications as read" },
      { status: 500 },
    );
  }
}
