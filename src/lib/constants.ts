import { getPlanPrice } from "@/lib/plans";

export const PRO_PLAN_PRICES = {
  PRO_PER_MEMBER_MONTHLY: getPlanPrice("pro"),
  PREMIUM_PER_MEMBER_MONTHLY: getPlanPrice("premium"),
};
