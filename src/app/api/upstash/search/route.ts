/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

import { upstashIndex } from "@/lib/upstash-client";
import { getUser, getSessionRole } from "@/actions/auth/dal";
import { db } from "@/db";
import { document, documentAccess } from "@/db/schema";
import { eq, or, and, inArray, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const h = await headers();
  const organization = await auth.api.getFullOrganization({
    headers: h,
  });
  if (!organization) {
    return NextResponse.json(
      { error: "Organization not found" },
      { status: 404 },
    );
  }

  const { query } = (await req.json()) as { query: string };

  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return new Response(JSON.stringify([]));
  }

  const results = await upstashIndex.search({
    query: query.trim(),
    limit: 100,
  });

  if (!results || results.length === 0) {
    return new Response(JSON.stringify([]));
  }

  // Extract document IDs from search results
  const documentIds = results
    .map((r: any) => Number(r.metadata?.documentId))
    .filter((id: number) => !Number.isNaN(id) && id > 0);

  if (documentIds.length === 0) {
    return new Response(JSON.stringify([]));
  }

  // Check if user is admin
  const role = await getSessionRole();
  const isAdmin = role?.toLowerCase().trim() === "admin";

  // Base conditions: document must be active, in current org, and in the search results
  const baseConditions = and(
    inArray(document.id, documentIds),
    eq(document.status, "active"),
    eq(document.organizationId, organization.id),
  );

  let accessibleDocs: { id: number }[];

  if (isAdmin) {
    // Admins can see all active documents in their organization
    accessibleDocs = await db
      .selectDistinct({ id: document.id })
      .from(document)
      .where(baseConditions);
  } else {
    // Build visibility conditions for non-admin users
    const visibilityConditions = [
      // Public documents
      eq(document.public, true),
      // User uploaded the document
      eq(document.uploadedBy, user.authId),
      // User has explicit access via documentAccess
      eq(documentAccess.userId, user.authId),
    ];

    // Only add department-based conditions if user has a department
    if (user.department) {
      visibilityConditions.push(
        // Departmental documents in user's department
        sql`${document.departmental} = true AND ${document.department} = ${user.department}` as any,
        // User's department has access via documentAccess (department-level grant)
        sql`${documentAccess.department} = ${user.department} AND ${documentAccess.userId} IS NULL` as any,
      );
    }

    accessibleDocs = await db
      .selectDistinct({ id: document.id })
      .from(document)
      .leftJoin(
        documentAccess,
        and(
          eq(documentAccess.documentId, document.id),
          eq(documentAccess.organizationId, organization.id),
        ),
      )
      .where(and(baseConditions, or(...visibilityConditions)));
  }

  const accessibleDocIds = new Set(accessibleDocs.map((d) => d.id.toString()));

  // Filter search results to only include accessible documents
  const filteredResults = results.filter((r: any) =>
    accessibleDocIds.has(r.metadata?.documentId),
  );

  return new Response(JSON.stringify(filteredResults));
}
