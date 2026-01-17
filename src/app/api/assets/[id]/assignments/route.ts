import { db } from "@/db";
import {
  assetAssignments,
  assetAssignmentHistory,
  assets,
  user,
} from "@/db/schema";
import { and, eq, isNull, desc } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { requireAssetAccess } from "@/actions/auth/dal";

// GET: Get current and past assignments for an asset
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

    // Get current assignment
    const [currentAssignment] = await db
      .select({
        id: assetAssignments.id,
        targetType: assetAssignments.targetType,
        employeeId: assetAssignments.employeeId,
        department: assetAssignments.department,
        projectId: assetAssignments.projectId,
        assignedDate: assetAssignments.assignedDate,
        expectedReturnDate: assetAssignments.expectedReturnDate,
        notes: assetAssignments.notes,
        employeeName: user.name,
      })
      .from(assetAssignments)
      .leftJoin(user, eq(assetAssignments.employeeId, user.id))
      .where(
        and(
          eq(assetAssignments.assetId, assetId),
          eq(assetAssignments.organizationId, organization.id),
          isNull(assetAssignments.actualReturnDate),
        ),
      )
      .limit(1);

    // Get assignment history
    const history = await db
      .select({
        id: assetAssignmentHistory.id,
        transferDate: assetAssignmentHistory.transferDate,
        fromTargetType: assetAssignmentHistory.fromTargetType,
        fromEmployeeId: assetAssignmentHistory.fromEmployeeId,
        fromDepartment: assetAssignmentHistory.fromDepartment,
        fromProjectId: assetAssignmentHistory.fromProjectId,
        toTargetType: assetAssignmentHistory.toTargetType,
        toEmployeeId: assetAssignmentHistory.toEmployeeId,
        toDepartment: assetAssignmentHistory.toDepartment,
        toProjectId: assetAssignmentHistory.toProjectId,
        reason: assetAssignmentHistory.reason,
        notes: assetAssignmentHistory.notes,
      })
      .from(assetAssignmentHistory)
      .where(
        and(
          eq(assetAssignmentHistory.assetId, assetId),
          eq(assetAssignmentHistory.organizationId, organization.id),
        ),
      )
      .orderBy(desc(assetAssignmentHistory.transferDate));

    return NextResponse.json({
      currentAssignment: currentAssignment || null,
      history,
    });
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 },
    );
  }
}

// POST: Create new assignment or transfer
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

    const {
      targetType,
      employeeId,
      department,
      projectId,
      assignedDate,
      expectedReturnDate,
      notes,
      reason,
    } = body;

    // Validation
    if (!targetType) {
      return NextResponse.json(
        { error: "Target type is required" },
        { status: 400 },
      );
    }

    if (targetType === "Employee" && !employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required for employee assignment" },
        { status: 400 },
      );
    }

    if (targetType === "Department" && !department) {
      return NextResponse.json(
        { error: "Department is required for department assignment" },
        { status: 400 },
      );
    }

    if (targetType === "Project" && !projectId) {
      return NextResponse.json(
        { error: "Project ID is required for project assignment" },
        { status: 400 },
      );
    }

    // Verify asset exists and belongs to organization
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

    // Get current assignment if any
    const [currentAssignment] = await db
      .select()
      .from(assetAssignments)
      .where(
        and(
          eq(assetAssignments.assetId, assetId),
          eq(assetAssignments.organizationId, organization.id),
          isNull(assetAssignments.actualReturnDate),
        ),
      )
      .limit(1);

    // Start transaction
    // If there's a current assignment, close it and create history
    if (currentAssignment) {
      // Close current assignment
      await db
        .update(assetAssignments)
        .set({
          actualReturnDate: new Date(assignedDate || new Date()),
          updatedAt: new Date(),
        })
        .where(eq(assetAssignments.id, currentAssignment.id));

      // Create history record
      await db.insert(assetAssignmentHistory).values({
        organizationId: organization.id,
        assetId,
        transferDate: new Date(assignedDate || new Date()),
        fromTargetType: currentAssignment.targetType,
        fromEmployeeId: currentAssignment.employeeId,
        fromDepartment: currentAssignment.department,
        fromProjectId: currentAssignment.projectId,
        toTargetType: targetType,
        toEmployeeId: targetType === "Employee" ? employeeId : null,
        toDepartment: targetType === "Department" ? department : null,
        toProjectId: targetType === "Project" ? projectId : null,
        reason: reason || "Asset transferred",
        notes: notes || null,
        transferredBy: userId || null,
      });
    }

    // Create new assignment
    const [newAssignment] = await db
      .insert(assetAssignments)
      .values({
        organizationId: organization.id,
        assetId,
        targetType,
        employeeId: targetType === "Employee" ? employeeId : null,
        department: targetType === "Department" ? department : null,
        projectId: targetType === "Project" ? projectId : null,
        assignedDate: new Date(assignedDate || new Date()),
        expectedReturnDate: expectedReturnDate
          ? new Date(expectedReturnDate)
          : null,
        notes: notes || null,
        assignedBy: userId || null,
      })
      .returning();

    return NextResponse.json({ assignment: newAssignment }, { status: 201 });
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { error: "Failed to create assignment" },
      { status: 500 },
    );
  }
}

// DELETE: Return asset (close current assignment)
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

    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;

    const { id } = await params;
    const assetId = Number(id);

    const body = await request.json().catch(() => ({}));
    const { reason, notes } = body;

    // Get current assignment
    const [currentAssignment] = await db
      .select()
      .from(assetAssignments)
      .where(
        and(
          eq(assetAssignments.assetId, assetId),
          eq(assetAssignments.organizationId, organization.id),
          isNull(assetAssignments.actualReturnDate),
        ),
      )
      .limit(1);

    if (!currentAssignment) {
      return NextResponse.json(
        { error: "No active assignment found" },
        { status: 404 },
      );
    }

    // Close assignment
    await db
      .update(assetAssignments)
      .set({
        actualReturnDate: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(assetAssignments.id, currentAssignment.id));

    // Create history record for return
    await db.insert(assetAssignmentHistory).values({
      organizationId: organization.id,
      assetId,
      transferDate: new Date(),
      fromTargetType: currentAssignment.targetType,
      fromEmployeeId: currentAssignment.employeeId,
      fromDepartment: currentAssignment.department,
      fromProjectId: currentAssignment.projectId,
      toTargetType: null,
      toEmployeeId: null,
      toDepartment: null,
      toProjectId: null,
      reason: reason || "Asset returned",
      notes: notes || null,
      transferredBy: userId || null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error returning asset:", error);
    return NextResponse.json(
      { error: "Failed to return asset" },
      { status: 500 },
    );
  }
}
