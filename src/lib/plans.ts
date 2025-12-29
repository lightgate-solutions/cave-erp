export type PlanId = "free" | "pro" | "proAI" | "premium" | "premiumAI";

export interface PlanFeature {
  name: string;
  included: boolean;
  description?: string;
}

export interface PlanConfig {
  id: PlanId;
  name: string;
  displayName: string;
  description: string;
  pricing: {
    perMemberMonthly: number; // In NGN (Naira)
    perMemberMonthlyKobo: number; // In kobo (for Paystack)
    displayPrice: string;
  };
  limits: {
    maxOrganizations: number;
    maxMembersPerOrg: number | null;
    maxProject: number | null;
    maxStorage: number | null; // in MB
  };
  features: PlanFeature[];
  featureFlags: {
    advancedReports: boolean;
    apiAccess: boolean;
    unlimitedStorage: boolean;
    prioritySupport: boolean;
    customIntegrations: boolean;
    advancedHr: boolean;
    projectManagement: boolean;
    dedicatedSupport: boolean;
  };
  ui: {
    badge?: string;
    highlighted: boolean;
    ctaText: string;
    ctaDisabled: boolean;
  };
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "free",
    displayName: "Free",
    description: "For individuals and small teams just getting started.",
    pricing: {
      perMemberMonthly: 0,
      perMemberMonthlyKobo: 0,
      displayPrice: "₦0",
    },
    limits: {
      maxOrganizations: 1,
      maxMembersPerOrg: 3,
      maxProject: 3,
      maxStorage: 500,
    },
    features: [
      { name: "1 Organization", included: true },
      { name: "3 Members", included: true },
      { name: "Basic Finance Module", included: true },
      { name: "Basic HR Management", included: true },
      { name: "Task/Performance Management", included: true },
      { name: "Projects Management", included: true },
      { name: "Up to 3 Projects", included: true },
      { name: "Documents Management (500MB Included)", included: true },
      { name: "Email Support", included: true },
      { name: "Notifications Enabled", included: false },
      { name: "AI Integration ", included: false },
      { name: "Custom Integrations", included: false },
      { name: "Unlimited Projects", included: false },
      { name: "SMS Notification", included: false },
      { name: "Internal Mailing System", included: false },
      { name: "Assets Management", included: false },
      { name: "Paystack Integration", included: false },
      { name: "Dedicated Support", included: false },
    ],
    featureFlags: {
      advancedReports: false,
      apiAccess: false,
      unlimitedStorage: false,
      prioritySupport: false,
      customIntegrations: false,
      advancedHr: false,
      projectManagement: false,
      dedicatedSupport: false,
    },
    ui: {
      highlighted: true,
      ctaText: "Current Plan",
      ctaDisabled: true,
    },
  },

  pro: {
    id: "pro",
    name: "pro",
    displayName: "Pro",
    description: "For growing teams that need more power and support.",
    pricing: {
      perMemberMonthly: 9_000,
      perMemberMonthlyKobo: 900_000,
      displayPrice: "₦9,000",
    },
    limits: {
      maxOrganizations: 3,
      maxMembersPerOrg: null,
      maxProject: 10,
      maxStorage: 10000, //10GB * 1000
    },
    features: [
      { name: "Up to 3 Organizations", included: true },
      { name: "Unlimited Members", included: true },
      { name: "Complete Finance Module", included: true },
      { name: "Advanced HR Management", included: true },
      { name: "Task/Performance Management", included: true },
      { name: "Projects Management", included: true },
      { name: "Up to 10 Projects", included: true },
      { name: "Documents Management (10GB Included)", included: true },
      { name: "Notifications Enabled (Mail Only)", included: true },
      { name: "Email Support", included: true },
      { name: "AI Integration ", included: false },
      { name: "Custom Integrations", included: false },
      { name: "Unlimited Projects", included: false },
      { name: "SMS Notification", included: false },
      { name: "Procurement Module", included: false },
      { name: "Internal Mailing System", included: false },
      { name: "Assets Management", included: false },
      { name: "Paystack Integration", included: false },
      { name: "Dedicated Support", included: false },
    ],
    featureFlags: {
      advancedReports: true,
      apiAccess: false,
      unlimitedStorage: false,
      prioritySupport: true,
      customIntegrations: false,
      advancedHr: true,
      projectManagement: true,
      dedicatedSupport: false,
    },
    ui: {
      badge: "Most Popular",
      highlighted: false,
      ctaText: "Upgrade to Pro",
      ctaDisabled: false,
    },
  },

  proAI: {
    id: "proAI",
    name: "proAI",
    displayName: "Pro - AI Included",
    description: "For growing teams that need more power and support.",
    pricing: {
      perMemberMonthly: 18_000,
      perMemberMonthlyKobo: 1_800_000, // 18,000 * 100
      displayPrice: "₦18,000",
    },
    limits: {
      maxOrganizations: 3,
      maxMembersPerOrg: null, // No limit
      maxProject: 10,
      maxStorage: 10000, //10GB * 1000
    },
    features: [
      { name: "Up to 3 Organizations", included: true },
      { name: "Unlimited Members", included: true },
      { name: "Complete Finance Module", included: true },
      { name: "Advanced HR Management", included: true },
      { name: "Task/Performance Management", included: true },
      { name: "Projects Management", included: true },
      { name: "Up to 10 Projects", included: true },
      { name: "Documents Management (10GB Included)", included: true },
      { name: "Notifications Enabled (Mail Only)", included: true },
      { name: "Email Support", included: true },
      { name: "AI Integration ", included: true },
      { name: "Custom Integrations", included: false },
      { name: "Unlimited Projects", included: false },
      { name: "SMS Notification", included: false },
      { name: "Procurement Module", included: false },
      { name: "Internal Mailing System", included: false },
      { name: "Assets Management", included: false },
      { name: "Paystack Integration", included: false },
      { name: "Dedicated Support", included: false },
    ],
    featureFlags: {
      advancedReports: true,
      apiAccess: false,
      unlimitedStorage: false,
      prioritySupport: true,
      customIntegrations: false,
      advancedHr: true,
      projectManagement: true,
      dedicatedSupport: false,
    },
    ui: {
      highlighted: false,
      ctaText: "Upgrade to Pro",
      ctaDisabled: false,
    },
  },

  premium: {
    id: "premium",
    name: "premium",
    displayName: "Premium",
    description: "For large organizations with custom needs.",
    pricing: {
      perMemberMonthly: 45_000,
      perMemberMonthlyKobo: 4_500_000, // 45,000 * 100
      displayPrice: "₦45,000",
    },
    limits: {
      maxOrganizations: Infinity,
      maxMembersPerOrg: null, // No limit
      maxProject: null,
      maxStorage: 100000, //100GB * 1000
    },
    features: [
      { name: "Unlimited Organizations", included: true },
      { name: "Unlimited Members", included: true },
      { name: "Complete Finance Module", included: true },
      { name: "Advanced HR Management", included: true },
      { name: "Task/Performance Management", included: true },
      { name: "Projects Management", included: true },
      { name: "Unlimited Projects", included: true },
      { name: "Documents Management (200GB Included)", included: true },
      { name: "Full Notifications Enabled", included: true },
      { name: "Priority Email Support", included: true },
      { name: "Custom Integrations", included: true },
      { name: "SMS Notification", included: true },
      { name: "Internal Mailing System", included: true },
      { name: "Assets Management", included: true },
      { name: "Procurement Module", included: true },
      { name: "Paystack Integration", included: true },
      { name: "Dedicated Support", included: true },
      { name: "AI Integration ", included: false },
    ],
    featureFlags: {
      advancedReports: true,
      apiAccess: true,
      unlimitedStorage: true,
      prioritySupport: true,
      customIntegrations: true,
      advancedHr: true,
      projectManagement: true,
      dedicatedSupport: true,
    },
    ui: {
      badge: "Best Value",
      highlighted: false,
      ctaText: "Upgrade to Premium",
      ctaDisabled: false,
    },
  },

  premiumAI: {
    id: "premiumAI",
    name: "premiumAI",
    displayName: "Premium - AI Included",
    description: "For large organizations with custom needs.",
    pricing: {
      perMemberMonthly: 60_000,
      perMemberMonthlyKobo: 6_000_000, // 6,000 * 100
      displayPrice: "₦60,000",
    },
    limits: {
      maxOrganizations: Infinity,
      maxMembersPerOrg: null, // No limit
      maxProject: null,
      maxStorage: 100000, //100GB * 1000
    },
    features: [
      { name: "Unlimited Organizations", included: true },
      { name: "Unlimited Members", included: true },
      { name: "Complete Finance Module", included: true },
      { name: "Advanced HR Management", included: true },
      { name: "Task/Performance Management", included: true },
      { name: "Projects Management", included: true },
      { name: "Unlimited Projects", included: true },
      { name: "Documents Management (200GB Included)", included: true },
      { name: "Full Notifications Enabled", included: true },
      { name: "Priority Email Support", included: true },
      { name: "Custom Integrations", included: true },
      { name: "SMS Notification", included: true },
      { name: "Internal Mailing System", included: true },
      { name: "Assets Management", included: true },
      { name: "Procurement Module", included: true },
      { name: "Paystack Integration", included: true },
      { name: "Dedicated Support", included: true },
      { name: "AI Integration ", included: true },
    ],
    featureFlags: {
      advancedReports: true,
      apiAccess: true,
      unlimitedStorage: true,
      prioritySupport: true,
      customIntegrations: true,
      advancedHr: true,
      projectManagement: true,
      dedicatedSupport: true,
    },
    ui: {
      highlighted: false,
      ctaText: "Upgrade to Premium",
      ctaDisabled: false,
    },
  },
};

export function getPlan(planId: PlanId): PlanConfig {
  return PLANS[planId];
}

export function getAllPlans(): PlanConfig[] {
  return Object.values(PLANS);
}

export function getPlanPrice(planId: PlanId): number {
  return PLANS[planId].pricing.perMemberMonthly;
}

export function getPlanPriceKobo(planId: PlanId): number {
  return PLANS[planId].pricing.perMemberMonthlyKobo;
}

export function getPlanDisplayName(planId: PlanId): string {
  return PLANS[planId].displayName;
}

export function getPlanLimits(planId: PlanId) {
  return PLANS[planId].limits;
}

export function hasFeature(
  planId: PlanId,
  feature: keyof PlanConfig["featureFlags"],
): boolean {
  return PLANS[planId].featureFlags[feature];
}

export function getNextPlan(currentPlan: PlanId): PlanId | null {
  const upgradePath: Record<PlanId, PlanId | null> = {
    free: "pro",
    pro: "proAI",
    proAI: "premium",
    premium: "premiumAI",
    premiumAI: null, // Already at highest tier
  };
  return upgradePath[currentPlan];
}

export function isHigherTier(planA: PlanId, planB: PlanId): boolean {
  const tierOrder: Record<PlanId, number> = {
    free: 0,
    pro: 1,
    proAI: 2,
    premium: 3,
    premiumAI: 4,
  };
  return tierOrder[planA] > tierOrder[planB];
}

export function formatPriceForDb(planId: PlanId): string {
  return PLANS[planId].pricing.perMemberMonthly.toFixed(2);
}
