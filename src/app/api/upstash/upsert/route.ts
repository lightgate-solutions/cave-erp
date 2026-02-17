import { upstashIndex } from "@/lib/upstash-client";
import { v4 } from "uuid";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, content, metadata } = body;

  if (!content || !metadata) {
    return NextResponse.json(
      { error: "Missing required fields: content, metadata" },
      { status: 400 },
    );
  }

  await upstashIndex.upsert([
    {
      id: id ?? v4(),
      content,
      metadata,
    },
  ]);

  return NextResponse.json({ success: true });
}
