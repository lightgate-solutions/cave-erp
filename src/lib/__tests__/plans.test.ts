import { describe, it, expect } from "vitest";
import {
  getPlan,
  getPlanPrice,
  getPlanPriceKobo,
  getPlanDisplayName,
  getPlanLimits,
  hasFeature,
  getNextPlan,
  isHigherTier,
  formatPriceForDb,
} from "../plans";

describe("plans-utils", () => {
  describe("getPlan", () => {
    it("should return the correct plan config", () => {
      const plan = getPlan("pro");
      expect(plan.id).toBe("pro");
      expect(plan.displayName).toBe("Pro");
    });
  });

  describe("getPlanPrice", () => {
    it("should return 0 for free plan", () => {
      expect(getPlanPrice("free")).toBe(0);
    });

    it("should return correct price for paid plans", () => {
      expect(getPlanPrice("pro")).toBe(9000);
      expect(getPlanPrice("premium")).toBe(45000);
    });
  });

  describe("getPlanPriceKobo", () => {
    it("should return correct kobo amount for Paystack", () => {
      expect(getPlanPriceKobo("pro")).toBe(900000);
      expect(getPlanPriceKobo("premium")).toBe(4500000);
    });
  });

  describe("getPlanLimits", () => {
    it("should return correct limits for free plan", () => {
      const limits = getPlanLimits("free");
      expect(limits.maxOrganizations).toBe(1);
      expect(limits.maxMembersPerOrg).toBe(3);
    });

    it("should return unlimited (Infinity or null) where applicable", () => {
      const premiumLimits = getPlanLimits("premium");
      expect(premiumLimits.maxOrganizations).toBe(Infinity);
      expect(premiumLimits.maxMembersPerOrg).toBe(null);
    });
  });

  describe("hasFeature", () => {
    it("should return false for advanced features on free plan", () => {
      expect(hasFeature("free", "advancedReports")).toBe(false);
      expect(hasFeature("free", "apiAccess")).toBe(false);
    });

    it("should return true for features on pro/premium plans", () => {
      expect(hasFeature("pro", "advancedReports")).toBe(true);
      expect(hasFeature("premium", "apiAccess")).toBe(true);
    });
  });

  describe("getNextPlan", () => {
    it("should return pro as next step from free", () => {
      expect(getNextPlan("free")).toBe("pro");
    });

    it("should return proAI as next step from pro", () => {
      expect(getNextPlan("pro")).toBe("proAI");
    });

    it("should return null for the highest tier", () => {
      expect(getNextPlan("premiumAI")).toBe(null);
    });
  });

  describe("isHigherTier", () => {
    it("should return true if plan A is higher than plan B", () => {
      expect(isHigherTier("pro", "free")).toBe(true);
      expect(isHigherTier("premium", "pro")).toBe(true);
      expect(isHigherTier("premiumAI", "premium")).toBe(true);
    });

    it("should return false if plan A is lower than or equal to plan B", () => {
      expect(isHigherTier("free", "pro")).toBe(false);
      expect(isHigherTier("pro", "pro")).toBe(false);
    });
  });

  describe("formatPriceForDb", () => {
    it("should format price with 2 decimal places", () => {
      expect(formatPriceForDb("pro")).toBe("9000.00");
      expect(formatPriceForDb("free")).toBe("0.00");
    });
  });
});
