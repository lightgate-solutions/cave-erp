"use server";

import {
  canCreateOrganization,
  getUserPlan,
  getOrgOwnerPlan,
} from "@/lib/plan-utils";
import { db } from "@/db";
import { subscriptions, organization } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { PlanId } from "@/lib/plans";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function validateOrganizationCreation() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !session.user.id) {
    return { canCreate: false, error: "User not authenticated" };
  }

  try {
    const { canCreate, currentCount, limit } = await canCreateOrganization(
      session.user.id,
    );
    const userPlan = await getUserPlan(session.user.id);

    if (!canCreate) {
      const planNames = {
        free: "Free",
        pro: "Pro",
        proAI: "Pro AI",
        premium: "Premium",
        premiumAI: "Premium AI",
      };
      const nextPlan = userPlan === "free" ? "Pro" : "Premium";

      return {
        canCreate: false,
        error: `${planNames[userPlan]} plan allows ${limit === Infinity ? "unlimited" : limit} organization${limit > 1 ? "s" : ""}. You currently have ${currentCount}. Please upgrade to ${nextPlan} to create more organizations.`,
      };
    }

    return { canCreate: true, error: null };
  } catch (error) {
    console.error("Error validating organization creation:", error);
    return {
      canCreate: false,
      error: "Failed to validate organization creation",
    };
  }
}

export async function getOrganizationSubscriptionContext(
  userId: string,
  orgId: string,
) {
  try {
    const userSubscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    });

    const org = await db.query.organization.findFirst({
      where: eq(organization.id, orgId),
      columns: { ownerId: true },
    });

    let orgOwnerSubscription = null;
    if (org?.ownerId) {
      orgOwnerSubscription = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.userId, org.ownerId),
      });
    }

    const userPlan = await getUserPlan(userId);
    const orgOwnerPlan = await getOrgOwnerPlan(orgId);

    return {
      success: true,
      data: {
        userSubscription: userSubscription || null,
        userPlan: userPlan as PlanId,
        orgOwnerSubscription: orgOwnerSubscription || null,
        orgOwnerPlan: orgOwnerPlan as PlanId,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error fetching organization subscription context:", error);
    return {
      success: false,
      data: null,
      error: "Failed to fetch subscription context",
    };
  }
}
