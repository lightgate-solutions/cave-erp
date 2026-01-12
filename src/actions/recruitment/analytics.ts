"use server";

import { db } from "@/db";
import {
  recruitmentMetrics,
  jobPostings,
  candidates,
  interviews,
  offers,
} from "@/db/schema";
import { requireHROrAdmin } from "../auth/dal";
import { and, eq, count, gte, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Get overall recruitment metrics
 */
export async function getOverallMetrics() {
  try {
    await requireHROrAdmin();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return null;
    }

    // Get totals
    const [totalJobs] = await db
      .select({ count: count() })
      .from(jobPostings)
      .where(eq(jobPostings.organizationId, organization.id));

    const [totalCandidates] = await db
      .select({ count: count() })
      .from(candidates)
      .innerJoin(jobPostings, eq(candidates.jobPostingId, jobPostings.id))
      .where(eq(jobPostings.organizationId, organization.id));

    const [totalInterviews] = await db
      .select({ count: count() })
      .from(interviews)
      .where(eq(interviews.organizationId, organization.id));

    const [totalOffers] = await db
      .select({ count: count() })
      .from(offers)
      .where(eq(offers.organizationId, organization.id));

    // Get candidates by status
    const candidatesByStatus = await db
      .select({
        status: candidates.status,
        count: count(),
      })
      .from(candidates)
      .innerJoin(jobPostings, eq(candidates.jobPostingId, jobPostings.id))
      .where(eq(jobPostings.organizationId, organization.id))
      .groupBy(candidates.status);

    // Get offers by status
    const offersByStatus = await db
      .select({
        status: offers.status,
        count: count(),
      })
      .from(offers)
      .where(eq(offers.organizationId, organization.id))
      .groupBy(offers.status);

    // Calculate time to hire (average days from applied to hired)
    const hiredCandidates = await db
      .select({
        appliedAt: candidates.appliedAt,
        hiredAt: candidates.hiredAt,
      })
      .from(candidates)
      .innerJoin(jobPostings, eq(candidates.jobPostingId, jobPostings.id))
      .where(
        and(
          eq(jobPostings.organizationId, organization.id),
          eq(candidates.status, "Hired"),
        ),
      );

    const avgTimeToHire =
      hiredCandidates.length > 0
        ? hiredCandidates.reduce((sum, candidate) => {
            // Only calculate if hiredAt exists, otherwise skip this candidate
            if (!candidate.hiredAt) return sum;
            const days =
              (new Date(candidate.hiredAt).getTime() -
                new Date(candidate.appliedAt).getTime()) /
              (1000 * 60 * 60 * 24);
            return sum + days;
          }, 0) / hiredCandidates.filter((c) => c.hiredAt).length
        : 0;

    return {
      totalJobs: totalJobs?.count ?? 0,
      totalCandidates: totalCandidates?.count ?? 0,
      totalInterviews: totalInterviews?.count ?? 0,
      totalOffers: totalOffers?.count ?? 0,
      candidatesByStatus: candidatesByStatus ?? [],
      offersByStatus: offersByStatus ?? [],
      avgTimeToHire: Math.round(avgTimeToHire),
      hiredCount: hiredCandidates.length,
    };
  } catch (error) {
    console.error("Error fetching overall metrics:", error);
    return null;
  }
}

/**
 * Get metrics for a specific job posting
 */
export async function getJobMetrics(jobPostingId: number) {
  try {
    await requireHROrAdmin();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return null;
    }

    const [metrics] = await db
      .select()
      .from(recruitmentMetrics)
      .where(
        and(
          eq(recruitmentMetrics.jobPostingId, jobPostingId),
          eq(recruitmentMetrics.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!metrics) {
      return null;
    }

    // Calculate conversion rates
    const conversionRates = {
      appliedToScreened:
        metrics.totalApplications > 0
          ? ((metrics.screened / metrics.totalApplications) * 100).toFixed(1)
          : "0",
      screenedToInterview:
        metrics.screened > 0
          ? ((metrics.interviewed / metrics.screened) * 100).toFixed(1)
          : "0",
      interviewToOffer:
        metrics.interviewed > 0
          ? ((metrics.offered / metrics.interviewed) * 100).toFixed(1)
          : "0",
      offerToHired:
        metrics.offered > 0
          ? ((metrics.hired / metrics.offered) * 100).toFixed(1)
          : "0",
      overallConversion:
        metrics.totalApplications > 0
          ? ((metrics.hired / metrics.totalApplications) * 100).toFixed(1)
          : "0",
    };

    return {
      ...metrics,
      conversionRates,
    };
  } catch (error) {
    console.error("Error fetching job metrics:", error);
    return null;
  }
}

/**
 * Get top performing jobs (by hired candidates)
 */
export async function getTopJobs(limit = 5) {
  try {
    await requireHROrAdmin();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return [];
    }

    const topJobs = await db
      .select({
        id: jobPostings.id,
        title: jobPostings.title,
        department: jobPostings.department,
        totalApplicants: recruitmentMetrics.totalApplications,
        hired: recruitmentMetrics.hired,
        rejected: recruitmentMetrics.rejected,
      })
      .from(jobPostings)
      .innerJoin(
        recruitmentMetrics,
        eq(jobPostings.id, recruitmentMetrics.jobPostingId),
      )
      .where(eq(jobPostings.organizationId, organization.id))
      .orderBy(desc(recruitmentMetrics.hired))
      .limit(limit);

    return topJobs;
  } catch (error) {
    console.error("Error fetching top jobs:", error);
    return [];
  }
}

/**
 * Get recent activity summary
 */
export async function getRecentActivity() {
  try {
    await requireHROrAdmin();

    const organization = await auth.api.getFullOrganization({
      headers: await headers(),
    });

    if (!organization) {
      return {
        recentApplications: 0,
        recentInterviews: 0,
        recentOffers: 0,
        recentHires: 0,
      };
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentApplications] = await db
      .select({ count: count() })
      .from(candidates)
      .innerJoin(jobPostings, eq(candidates.jobPostingId, jobPostings.id))
      .where(
        and(
          eq(jobPostings.organizationId, organization.id),
          gte(candidates.appliedAt, thirtyDaysAgo),
        ),
      );

    const [recentInterviews] = await db
      .select({ count: count() })
      .from(interviews)
      .where(
        and(
          eq(interviews.organizationId, organization.id),
          gte(interviews.createdAt, thirtyDaysAgo),
        ),
      );

    const [recentOffers] = await db
      .select({ count: count() })
      .from(offers)
      .where(
        and(
          eq(offers.organizationId, organization.id),
          gte(offers.createdAt, thirtyDaysAgo),
        ),
      );

    const [recentHires] = await db
      .select({ count: count() })
      .from(candidates)
      .innerJoin(jobPostings, eq(candidates.jobPostingId, jobPostings.id))
      .where(
        and(
          eq(jobPostings.organizationId, organization.id),
          eq(candidates.status, "Hired"),
          gte(candidates.hiredAt, thirtyDaysAgo),
        ),
      );

    return {
      recentApplications: recentApplications.count,
      recentInterviews: recentInterviews.count,
      recentOffers: recentOffers.count,
      recentHires: recentHires.count,
    };
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return {
      recentApplications: 0,
      recentInterviews: 0,
      recentOffers: 0,
      recentHires: 0,
    };
  }
}
