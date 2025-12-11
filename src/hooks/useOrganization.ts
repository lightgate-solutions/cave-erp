"use client";

import { useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { getOrganizationSubscriptionContext } from "@/actions/organizations";
import { getPlan, hasFeature, type PlanId, type PlanConfig } from "@/lib/plans";
import type { subscriptions } from "@/db/schema";

type Subscription = typeof subscriptions.$inferSelect;

interface OrganizationMember {
  id: string;
  userId: string;
  role: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null | undefined;
  };
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  createdAt: Date;
  metadata: Record<string, unknown> | null;
  members: OrganizationMember[];
  ownerId?: string;
}

interface BetterAuthUser {
  id: string;
  name: string;
  email: string;
  organizationsCount?: number;
  role?: string;
}

interface OrganizationWithSubscription extends Organization {
  ownerId: string;
  membersCount: number;
  ownerSubscription: Subscription | null;
  ownerPlan: PlanId;
  ownerPlanDetails: PlanConfig;
}

interface UserWithSubscription {
  id: string;
  name: string;
  email: string;
  role: string | null;
  subscription: Subscription | null;
  plan: PlanId;
  planDetails: PlanConfig;
  isOrgOwner: boolean;
  memberRole: string | null;
}

export interface UseOrganizationReturn {
  organization: OrganizationWithSubscription | null;
  user: UserWithSubscription | null;
  isLoading: boolean;
  error: string | null;
  canCreateOrganization: boolean;
  hasFeature: (featureKey: keyof PlanConfig["featureFlags"]) => boolean;
  refetch: () => Promise<void>;
}

export function useOrganization(): UseOrganizationReturn {
  const queryClient = useQueryClient();

  const {
    data: sessionData,
    isPending: sessionPending,
    error: sessionError,
  } = authClient.useSession();

  const {
    data: activeOrgData,
    isPending: orgPending,
    error: orgError,
  } = authClient.useActiveOrganization();

  const userId = sessionData?.user?.id;
  const orgId = activeOrgData?.id;

  const {
    data: subscriptionData,
    isPending: subscriptionPending,
    error: subscriptionQueryError,
    refetch: refetchSubscriptions,
  } = useQuery({
    queryKey: ["organization-subscription-context", userId, orgId],
    queryFn: async () => {
      if (!userId || !orgId) {
        return null;
      }
      const result = await getOrganizationSubscriptionContext(userId, orgId);
      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to fetch subscription context");
      }
      return result.data;
    },
    enabled: !!userId && !!orgId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  const isLoading = sessionPending || orgPending || subscriptionPending;

  const error = useMemo(() => {
    if (sessionError) return sessionError.message || "Session error";
    if (orgError) return orgError.message || "Organization error";
    if (subscriptionQueryError)
      return subscriptionQueryError.message || "Subscription error";
    return null;
  }, [sessionError, orgError, subscriptionQueryError]);

  const sessionUser = sessionData?.user as BetterAuthUser | undefined;

  const userPlan = subscriptionData?.userPlan || ("free" as PlanId);
  const ownerPlan = subscriptionData?.orgOwnerPlan || ("free" as PlanId);

  const userPlanDetails = useMemo(() => getPlan(userPlan), [userPlan]);
  const ownerPlanDetails = useMemo(() => getPlan(ownerPlan), [ownerPlan]);

  const ownerId = (activeOrgData as { ownerId?: string })?.ownerId || null;

  const isOrgOwner = useMemo(
    () => ownerId !== null && sessionUser?.id === ownerId,
    [ownerId, sessionUser?.id],
  );

  const memberRole = useMemo(() => {
    if (!activeOrgData?.members || !sessionUser?.id) return null;
    const membership = activeOrgData.members.find(
      (m) => m.userId === sessionUser.id,
    );
    return membership?.role || null;
  }, [activeOrgData?.members, sessionUser?.id]);

  const user: UserWithSubscription | null = useMemo(() => {
    if (!sessionUser) return null;

    return {
      id: sessionUser.id,
      name: sessionUser.name,
      email: sessionUser.email,
      role: sessionUser.role || null,
      subscription: subscriptionData?.userSubscription || null,
      plan: userPlan,
      planDetails: userPlanDetails,
      isOrgOwner,
      memberRole,
    };
  }, [
    sessionUser,
    subscriptionData?.userSubscription,
    userPlan,
    userPlanDetails,
    isOrgOwner,
    memberRole,
  ]);

  const organization: OrganizationWithSubscription | null = useMemo(() => {
    if (!activeOrgData || !ownerId) return null;

    return {
      id: activeOrgData.id,
      name: activeOrgData.name,
      slug: activeOrgData.slug,
      logo: activeOrgData.logo || null,
      createdAt: activeOrgData.createdAt,
      metadata: activeOrgData.metadata,
      members: activeOrgData.members || [],
      ownerId,
      membersCount: activeOrgData.members?.length || 0,
      ownerSubscription: subscriptionData?.orgOwnerSubscription || null,
      ownerPlan,
      ownerPlanDetails,
    };
  }, [
    activeOrgData,
    ownerId,
    subscriptionData?.orgOwnerSubscription,
    ownerPlan,
    ownerPlanDetails,
  ]);

  const canCreate = useMemo(() => {
    const currentCount = sessionUser?.organizationsCount || 0;
    const limit = userPlanDetails.limits.maxOrganizations;
    return currentCount < limit;
  }, [
    sessionUser?.organizationsCount,
    userPlanDetails.limits.maxOrganizations,
  ]);

  const hasFeatureCheck = useCallback(
    (featureKey: keyof PlanConfig["featureFlags"]): boolean => {
      if (!organization) return false;
      return hasFeature(organization.ownerPlan, featureKey);
    },
    [organization],
  );

  const refetch = useCallback(async () => {
    await refetchSubscriptions();
    queryClient.invalidateQueries({
      queryKey: ["organization-subscription-context"],
    });
  }, [refetchSubscriptions, queryClient]);

  if (isLoading) {
    return {
      organization: null,
      user: null,
      isLoading: true,
      error: null,
      canCreateOrganization: false,
      hasFeature: () => false,
      refetch: async () => {},
    };
  }

  if (!sessionUser) {
    return {
      organization: null,
      user: null,
      isLoading: false,
      error: error || "Not authenticated",
      canCreateOrganization: false,
      hasFeature: () => false,
      refetch,
    };
  }

  return {
    organization,
    user,
    isLoading: false,
    error,
    canCreateOrganization: canCreate,
    hasFeature: hasFeatureCheck,
    refetch,
  };
}
