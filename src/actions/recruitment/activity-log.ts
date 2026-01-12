"use server";

import { db } from "@/db";
import { recruitmentActivityLog, employees } from "@/db/schema";
import { requireHROrAdmin } from "../auth/dal";
import { and, desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Get activity log for a candidate
 */
export async function getCandidateActivityLog(
  candidateId: number,
  limit = 10,
  offset = 0,
) {
  try {
    await requireHROrAdmin();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const activities = await db
      .select({
        id: recruitmentActivityLog.id,
        activityType: recruitmentActivityLog.activityType,
        description: recruitmentActivityLog.description,
        metadata: recruitmentActivityLog.metadata,
        createdAt: recruitmentActivityLog.createdAt,
        performedBy: recruitmentActivityLog.performedBy,
        performedByName: employees.name,
        performedByEmail: employees.email,
      })
      .from(recruitmentActivityLog)
      .leftJoin(
        employees,
        eq(employees.authId, recruitmentActivityLog.performedBy),
      )
      .where(
        and(
          eq(recruitmentActivityLog.candidateId, candidateId),
          eq(recruitmentActivityLog.organizationId, organization.id),
        ),
      )
      .orderBy(desc(recruitmentActivityLog.createdAt))
      .limit(limit)
      .offset(offset);

    return activities;
  } catch (error) {
    console.error("Error fetching candidate activity log:", error);
    return [];
  }
}

/**
 * Get all recruitment activities (for admin dashboard)
 */
export async function getAllRecruitmentActivities(limit = 50) {
  try {
    await requireHROrAdmin();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const activities = await db
      .select({
        id: recruitmentActivityLog.id,
        candidateId: recruitmentActivityLog.candidateId,
        activityType: recruitmentActivityLog.activityType,
        description: recruitmentActivityLog.description,
        metadata: recruitmentActivityLog.metadata,
        createdAt: recruitmentActivityLog.createdAt,
        performedBy: recruitmentActivityLog.performedBy,
        performedByName: employees.name,
        performedByEmail: employees.email,
      })
      .from(recruitmentActivityLog)
      .leftJoin(
        employees,
        eq(employees.authId, recruitmentActivityLog.performedBy),
      )
      .where(eq(recruitmentActivityLog.organizationId, organization.id))
      .orderBy(desc(recruitmentActivityLog.createdAt))
      .limit(limit);

    return activities;
  } catch (error) {
    console.error("Error fetching recruitment activities:", error);
    return [];
  }
}
