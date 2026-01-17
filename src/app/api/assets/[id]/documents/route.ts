/** biome-ignore-all lint/style/noNonNullAssertion: <> */

import { db } from "@/db";
import { assetDocuments, assets } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { requireAssetAccess } from "@/actions/auth/dal";
import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { r2Client as s3Client } from "@/lib/r2Client";

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME!;

// GET: Get all documents for an asset
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

    const documents = await db
      .select()
      .from(assetDocuments)
      .where(
        and(
          eq(assetDocuments.assetId, assetId),
          eq(assetDocuments.organizationId, organization.id),
        ),
      )
      .orderBy(desc(assetDocuments.createdAt));

    // Generate signed URLs for each document
    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        try {
          const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: doc.filePath,
          });
          const url = await getSignedUrl(s3Client, command, {
            expiresIn: 3600,
          });
          return { ...doc, url };
        } catch {
          return { ...doc, url: null };
        }
      }),
    );

    return NextResponse.json({ documents: documentsWithUrls });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 },
    );
  }
}

// POST: Upload a new document
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

    // Verify asset exists
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

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const documentType = formData.get("documentType") as string;
    const documentName = formData.get("documentName") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!documentType) {
      return NextResponse.json(
        { error: "Document type is required" },
        { status: 400 },
      );
    }

    // Generate unique file path
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `assets/${organization.id}/${assetId}/${timestamp}-${sanitizedFileName}`;

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: filePath,
        Body: buffer,
        ContentType: file.type,
      }),
    );

    // Save document record
    const [document] = await db
      .insert(assetDocuments)
      .values({
        organizationId: organization.id,
        assetId,
        documentType: documentType as
          | "Receipt"
          | "Invoice"
          | "Warranty"
          | "Photos"
          | "Manual"
          | "Maintenance Record"
          | "Inspection Report"
          | "Disposal Certificate"
          | "Other",
        documentName: documentName || file.name,
        originalFileName: file.name,
        filePath,
        fileSize: file.size.toString(),
        mimeType: file.type,
        uploadedBy: userId || null,
      })
      .returning();

    // Generate signed URL for the new document
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath,
    });
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return NextResponse.json(
      { document: { ...document, url } },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error uploading document:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 },
    );
  }
}

// DELETE: Delete a document
export async function DELETE(
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
    const assetId = Number(id);

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 },
      );
    }

    // Get document to find file path
    const [document] = await db
      .select()
      .from(assetDocuments)
      .where(
        and(
          eq(assetDocuments.id, Number(documentId)),
          eq(assetDocuments.assetId, assetId),
          eq(assetDocuments.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    // Delete from R2
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: document.filePath,
        }),
      );
    } catch (error) {
      console.error("Error deleting from R2:", error);
      // Continue to delete database record even if R2 deletion fails
    }

    // Delete database record
    await db
      .delete(assetDocuments)
      .where(eq(assetDocuments.id, Number(documentId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 },
    );
  }
}
