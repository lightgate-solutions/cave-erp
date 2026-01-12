"use server";

import { db } from "@/db";
import { offers, recruitmentActivityLog, candidates } from "@/db/schema";
import { requireHROrAdmin } from "../auth/dal";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export type OfferStatus =
  | "Draft"
  | "Pending Approval"
  | "Approved"
  | "Sent"
  | "Accepted"
  | "Rejected"
  | "Expired";

export interface CreateOfferInput {
  candidateId: number;
  jobPostingId: number;
  position: string;
  department: "admin" | "hr" | "finance" | "operations";
  salary: number;
  startDate: string; // Date string in format YYYY-MM-DD
  employmentType: "Full-time" | "Part-time" | "Contract" | "Intern";
  benefits?: string;
  joiningBonus?: number;
  validUntil: string; // Date string in format YYYY-MM-DD
}

export interface UpdateOfferInput extends Partial<CreateOfferInput> {
  status?: OfferStatus;
  acceptedAt?: Date;
  rejectedAt?: Date;
  candidateResponse?: string;
}

/**
 * Create a new offer for a candidate
 */
export async function createOffer(data: CreateOfferInput) {
  try {
    const { employee } = await requireHROrAdmin();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    const [offer] = await db.transaction(async (tx) => {
      // Generate offer code
      const year = new Date().getFullYear();
      const existingOffers = await tx
        .select({ id: offers.id })
        .from(offers)
        .where(eq(offers.organizationId, organization.id));
      const offerNumber = String(existingOffers.length + 1).padStart(4, "0");
      const offerCode = `OFFER-${year}-${offerNumber}`;

      // Create offer
      const [newOffer] = await tx
        .insert(offers)
        .values({
          candidateId: data.candidateId,
          jobPostingId: data.jobPostingId,
          offerCode,
          position: data.position,
          department: data.department,
          employmentType: data.employmentType,
          salary: data.salary,
          startDate: data.startDate,
          joiningBonus: data.joiningBonus || 0,
          benefits: data.benefits,
          validUntil: data.validUntil,
          preparedBy: employee.userId,
          organizationId: organization.id,
          status: "Draft",
        })
        .returning();

      // Update candidate status to Offer if not already
      const [candidate] = await tx
        .select()
        .from(candidates)
        .where(
          and(
            eq(candidates.id, data.candidateId),
            eq(candidates.organizationId, organization.id),
          ),
        )
        .limit(1);

      if (candidate && candidate.status !== "Offer") {
        await tx
          .update(candidates)
          .set({ status: "Offer" })
          .where(
            and(
              eq(candidates.id, data.candidateId),
              eq(candidates.organizationId, organization.id),
            ),
          );
      }

      // Log activity
      await tx.insert(recruitmentActivityLog).values({
        candidateId: data.candidateId,
        activityType: "Offer Generated",
        description: `Offer created for ${data.position} with salary $${data.salary.toLocaleString()}`,
        performedBy: employee.userId,
        metadata: {
          offerId: newOffer.id,
          salary: data.salary,
          startDate: data.startDate,
        },
        organizationId: organization.id,
      });

      return [newOffer];
    });

    revalidatePath("/recruitment/pipeline");
    revalidatePath(`/recruitment/candidates/${data.candidateId}`);
    revalidatePath("/recruitment/offers");

    return {
      success: { data: offer },
      error: null,
    };
  } catch (error) {
    console.error("Error creating offer:", error);
    return {
      success: null,
      error: { reason: "Failed to create offer" },
    };
  }
}

/**
 * Update an existing offer
 */
export async function updateOffer(id: number, data: UpdateOfferInput) {
  try {
    const { employee } = await requireHROrAdmin();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    // Get existing offer
    const [existing] = await db
      .select()
      .from(offers)
      .where(and(eq(offers.id, id), eq(offers.organizationId, organization.id)))
      .limit(1);

    if (!existing) {
      return {
        success: null,
        error: { reason: "Offer not found" },
      };
    }

    const [updated] = await db.transaction(async (tx) => {
      // Build update object with only defined fields
      const updateData: Record<string, unknown> = {};

      if (data.position !== undefined) updateData.position = data.position;
      if (data.department !== undefined)
        updateData.department = data.department;
      if (data.employmentType !== undefined)
        updateData.employmentType = data.employmentType;
      if (data.salary !== undefined) updateData.salary = data.salary;
      if (data.startDate !== undefined) updateData.startDate = data.startDate;
      if (data.joiningBonus !== undefined)
        updateData.joiningBonus = data.joiningBonus;
      if (data.benefits !== undefined) updateData.benefits = data.benefits;
      if (data.validUntil !== undefined)
        updateData.validUntil = data.validUntil;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.acceptedAt !== undefined)
        updateData.acceptedAt = data.acceptedAt;
      if (data.rejectedAt !== undefined)
        updateData.rejectedAt = data.rejectedAt;
      if (data.candidateResponse !== undefined)
        updateData.candidateResponse = data.candidateResponse;

      const [updatedOffer] = await tx
        .update(offers)
        .set(updateData)
        .where(
          and(eq(offers.id, id), eq(offers.organizationId, organization.id)),
        )
        .returning();

      // Update candidate status if offer status changed
      if (data.status) {
        let activityType:
          | "Offer Accepted"
          | "Offer Rejected"
          | "Offer Sent"
          | "Status Changed" = "Status Changed";

        if (data.status === "Accepted") {
          await tx
            .update(candidates)
            .set({ status: "Hired", hiredAt: new Date() })
            .where(
              and(
                eq(candidates.id, existing.candidateId),
                eq(candidates.organizationId, organization.id),
              ),
            );
          activityType = "Offer Accepted";
        } else if (data.status === "Rejected") {
          await tx
            .update(candidates)
            .set({ status: "Rejected", rejectionReason: "Offer declined" })
            .where(
              and(
                eq(candidates.id, existing.candidateId),
                eq(candidates.organizationId, organization.id),
              ),
            );
          activityType = "Offer Rejected";
        } else if (data.status === "Sent") {
          activityType = "Offer Sent";
        }

        // Log activity
        await tx.insert(recruitmentActivityLog).values({
          candidateId: existing.candidateId,
          activityType,
          description: `Offer status changed to ${data.status}`,
          performedBy: employee.userId,
          metadata: {
            offerId: id,
            oldStatus: existing.status,
            newStatus: data.status,
          },
          organizationId: organization.id,
        });
      }

      return [updatedOffer];
    });

    revalidatePath("/recruitment/pipeline");
    revalidatePath(`/recruitment/candidates/${existing.candidateId}`);
    revalidatePath("/recruitment/offers");

    return {
      success: { data: updated },
      error: null,
    };
  } catch (error) {
    console.error("Error updating offer:", error);
    return {
      success: null,
      error: { reason: "Failed to update offer" },
    };
  }
}

/**
 * Get offer by ID
 */
export async function getOffer(id: number) {
  try {
    await requireHROrAdmin();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return null;
    }

    const [offer] = await db
      .select({
        id: offers.id,
        candidateId: offers.candidateId,
        candidateName: candidates.name,
        candidateEmail: candidates.email,
        jobPostingId: offers.jobPostingId,
        offerCode: offers.offerCode,
        position: offers.position,
        department: offers.department,
        salary: offers.salary,
        startDate: offers.startDate,
        employmentType: offers.employmentType,
        benefits: offers.benefits,
        joiningBonus: offers.joiningBonus,
        status: offers.status,
        sentAt: offers.sentAt,
        acceptedAt: offers.acceptedAt,
        rejectedAt: offers.rejectedAt,
        validUntil: offers.validUntil,
        candidateResponse: offers.candidateResponse,
        preparedBy: offers.preparedBy,
        approvedBy: offers.approvedBy,
        approvedAt: offers.approvedAt,
        offerLetterPath: offers.offerLetterPath,
        createdAt: offers.createdAt,
        updatedAt: offers.updatedAt,
      })
      .from(offers)
      .innerJoin(candidates, eq(offers.candidateId, candidates.id))
      .where(and(eq(offers.id, id), eq(offers.organizationId, organization.id)))
      .limit(1);

    return offer || null;
  } catch (error) {
    console.error("Error fetching offer:", error);
    return null;
  }
}

/**
 * Get all offers for a candidate
 */
export async function getCandidateOffers(candidateId: number) {
  try {
    await requireHROrAdmin();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const allOffers = await db
      .select()
      .from(offers)
      .where(
        and(
          eq(offers.candidateId, candidateId),
          eq(offers.organizationId, organization.id),
        ),
      )
      .orderBy(desc(offers.createdAt));

    return allOffers;
  } catch (error) {
    console.error("Error fetching candidate offers:", error);
    return [];
  }
}

/**
 * Get all offers
 */
export async function getAllOffers(filters?: {
  status?: OfferStatus;
  candidateId?: number;
}) {
  try {
    await requireHROrAdmin();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const conditions = [eq(offers.organizationId, organization.id)];

    if (filters?.status) {
      conditions.push(eq(offers.status, filters.status));
    }

    if (filters?.candidateId) {
      conditions.push(eq(offers.candidateId, filters.candidateId));
    }

    const allOffers = await db
      .select({
        id: offers.id,
        candidateId: offers.candidateId,
        candidateName: candidates.name,
        offerCode: offers.offerCode,
        position: offers.position,
        department: offers.department,
        salary: offers.salary,
        startDate: offers.startDate,
        employmentType: offers.employmentType,
        status: offers.status,
        sentAt: offers.sentAt,
        acceptedAt: offers.acceptedAt,
        rejectedAt: offers.rejectedAt,
        validUntil: offers.validUntil,
        createdAt: offers.createdAt,
      })
      .from(offers)
      .innerJoin(candidates, eq(offers.candidateId, candidates.id))
      .where(and(...conditions))
      .orderBy(desc(offers.createdAt));

    return allOffers;
  } catch (error) {
    console.error("Error fetching offers:", error);
    return [];
  }
}

/**
 * Send offer to candidate (mark as sent)
 */
export async function sendOffer(id: number) {
  try {
    const { employee } = await requireHROrAdmin();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        success: null,
        error: { reason: "Organization not found" },
      };
    }

    const [updated] = await db
      .update(offers)
      .set({
        status: "Sent",
        sentAt: new Date(),
      })
      .where(and(eq(offers.id, id), eq(offers.organizationId, organization.id)))
      .returning();

    if (!updated) {
      return {
        success: null,
        error: { reason: "Offer not found" },
      };
    }

    // Log activity
    await db.insert(recruitmentActivityLog).values({
      candidateId: updated.candidateId,
      activityType: "Offer Sent",
      description: "Offer sent to candidate",
      performedBy: employee.userId,
      metadata: {
        offerId: id,
      },
      organizationId: organization.id,
    });

    revalidatePath("/recruitment/offers");
    revalidatePath(`/recruitment/candidates/${updated.candidateId}`);

    return {
      success: { data: updated },
      error: null,
    };
  } catch (error) {
    console.error("Error sending offer:", error);
    return {
      success: null,
      error: { reason: "Failed to send offer" },
    };
  }
}

/**
 * Mark offer as accepted
 */
export async function acceptOffer(id: number) {
  return updateOffer(id, {
    status: "Accepted",
    acceptedAt: new Date(),
  });
}

/**
 * Mark offer as rejected
 */
export async function rejectOffer(id: number, reason?: string) {
  return updateOffer(id, {
    status: "Rejected",
    rejectedAt: new Date(),
    candidateResponse: reason,
  });
}
