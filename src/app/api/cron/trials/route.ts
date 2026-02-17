/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

import { NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptions } from "@/db/schema/subscriptions";
import { and, eq, lt, inArray } from "drizzle-orm";

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    console.error("CRON_SECRET environment variable is not set");
    return new Response("Internal Server Error", { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  try {
    const now = new Date();

    const expiredTrials = await db.query.subscriptions.findMany({
      where: and(
        eq(subscriptions.status, "trialing"),
        lt(subscriptions.trialEnd, now),
      ),
    });

    if (expiredTrials.length === 0) {
      return NextResponse.json({
        message: "No expired trials to process.",
      });
    }

    const trialIds = expiredTrials.map((t) => t.id);
    await db
      .update(subscriptions)
      .set({ status: "inactive" })
      .where(inArray(subscriptions.id, trialIds));

    return NextResponse.json({
      success: true,
      message: `Processed ${expiredTrials.length} expired trials.`,
      processed: trialIds,
    });
  } catch (error: any) {
    console.error("Cron job for trial expiration failed:", error);
    return new Response(`Error: ${error.message}`, {
      status: 500,
    });
  }
}
