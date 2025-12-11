import { db } from "@/db";
import { organization, subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  type PLANS,
  type PlanId,
  getPlanLimits,
  hasFeature,
} from "@/lib/plans";

export type Plan = PlanId;

export async function getUserPlan(userId: string): Promise<Plan> {
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
    columns: { plan: true },
  });
  return (sub?.plan as Plan) || "free";
}

export async function getOrgOwnerPlan(orgId: string): Promise<Plan> {
  const org = await db.query.organization.findFirst({
    where: eq(organization.id, orgId),
    columns: { ownerId: true },
  });

  if (!org?.ownerId) {
    return "free";
  }

  const ownerSub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, org.ownerId),
    columns: { plan: true },
  });

  return (ownerSub?.plan as Plan) || "free";
}

export async function canCreateOrganization(
  userId: string,
): Promise<{ canCreate: boolean; currentCount: number; limit: number }> {
  const userPlan = await getUserPlan(userId);

  const orgs = await db.query.organization.findMany({
    where: eq(organization.ownerId, userId),
    columns: { id: true },
  });

  const currentCount = orgs.length;
  const limit = getPlanLimits(userPlan).maxOrganizations;
  const canCreate = currentCount < limit;

  return { canCreate, currentCount, limit };
}

export async function hasFeatureInOrg(
  orgId: string,
  featureKey: keyof (typeof PLANS)["free"]["featureFlags"],
): Promise<boolean> {
  const ownerPlan = await getOrgOwnerPlan(orgId);
  return hasFeature(ownerPlan, featureKey);
}

export {
  getPlanDisplayName,
  getPlan,
  getAllPlans,
  getPlanPrice,
} from "@/lib/plans";
