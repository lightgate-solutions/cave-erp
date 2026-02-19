import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import {
  calculateAnniversaryDay,
  isBillingAnniversary,
  calculateNextPeriodEnd,
  wasInvoicedToday,
  calculatePlanChangeProration,
  calculateDaysOverdue,
} from "../billing-utils";

dayjs.extend(utc);

describe("billing-utils", () => {
  describe("calculateAnniversaryDay", () => {
    it("should return the day of the month for dates before 28th", () => {
      expect(calculateAnniversaryDay(new Date("2024-03-15"))).toBe(15);
      expect(calculateAnniversaryDay(new Date("2024-01-01"))).toBe(1);
      expect(calculateAnniversaryDay(new Date("2024-06-27"))).toBe(27);
    });

    it("should cap the day at 28 for dates after 28th", () => {
      expect(calculateAnniversaryDay(new Date("2024-03-29"))).toBe(28);
      expect(calculateAnniversaryDay(new Date("2024-01-30"))).toBe(28);
      expect(calculateAnniversaryDay(new Date("2024-05-31"))).toBe(28);
    });

    it("should return 28 for the 28th", () => {
      expect(calculateAnniversaryDay(new Date("2024-02-28"))).toBe(28);
    });
  });

  describe("isBillingAnniversary", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return true when today matches anniversary day", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00Z"));
      expect(isBillingAnniversary(15)).toBe(true);
    });

    it("should return false when today does not match anniversary day", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00Z"));
      expect(isBillingAnniversary(10)).toBe(false);
      expect(isBillingAnniversary(20)).toBe(false);
    });
  });

  describe("calculateNextPeriodEnd", () => {
    it("should calculate next period end correctly", () => {
      const start = new Date("2024-01-15T00:00:00Z");
      const result = calculateNextPeriodEnd(start, 15);
      expect(dayjs.utc(result).format("YYYY-MM-DD")).toBe("2024-02-15");
    });

    it("should handle months with fewer days", () => {
      const start = new Date("2024-01-30T00:00:00Z");
      const result = calculateNextPeriodEnd(start, 30);
      // February doesn't have 30 days, should cap at 29 (leap year)
      expect(dayjs.utc(result).date()).toBeLessThanOrEqual(29);
    });

    it("should use calculated anniversary day when null is passed", () => {
      const start = new Date("2024-01-10T00:00:00Z");
      const result = calculateNextPeriodEnd(start, null);
      expect(dayjs.utc(result).format("YYYY-MM-DD")).toBe("2024-02-10");
    });
  });

  describe("wasInvoicedToday", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return true if invoiced today", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00Z"));
      expect(wasInvoicedToday(new Date("2024-03-15T08:00:00Z"))).toBe(true);
    });

    it("should return false if invoiced on a different day", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00Z"));
      expect(wasInvoicedToday(new Date("2024-03-14T12:00:00Z"))).toBe(false);
    });

    it("should return false if never invoiced", () => {
      expect(wasInvoicedToday(null)).toBe(false);
    });
  });

  describe("calculatePlanChangeProration", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should calculate proration for upgrade", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00Z"));

      const result = calculatePlanChangeProration(
        9000, // old price per member
        18000, // new price per member
        5, // member count
        new Date("2024-03-01T00:00:00Z"),
        new Date("2024-04-01T00:00:00Z"),
      );

      expect(result.remainingDays).toBeGreaterThan(0);
      expect(result.charge).toBeGreaterThan(result.credit);
      expect(result.netAmount).toBeGreaterThan(0);
    });

    it("should calculate proration for downgrade", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00Z"));

      const result = calculatePlanChangeProration(
        18000, // old price per member
        9000, // new price per member
        5,
        new Date("2024-03-01T00:00:00Z"),
        new Date("2024-04-01T00:00:00Z"),
      );

      expect(result.credit).toBeGreaterThan(result.charge);
      expect(result.netAmount).toBeLessThan(0);
    });

    it("should return zeros when no remaining days", () => {
      vi.setSystemTime(new Date("2024-04-02T12:00:00Z"));

      const result = calculatePlanChangeProration(
        9000,
        18000,
        5,
        new Date("2024-03-01T00:00:00Z"),
        new Date("2024-04-01T00:00:00Z"),
      );

      expect(result.credit).toBe(0);
      expect(result.charge).toBe(0);
      expect(result.netAmount).toBe(0);
      expect(result.remainingDays).toBe(0);
    });
  });

  describe("calculateDaysOverdue", () => {
    it("should return 0 for future due dates", () => {
      const now = new Date("2024-03-10T00:00:00Z");
      const future = new Date("2024-03-15T00:00:00Z");
      expect(calculateDaysOverdue(future, now)).toBe(0);
    });

    it("should return 0 for today's due date", () => {
      const today = new Date("2024-03-10T00:00:00Z");
      expect(calculateDaysOverdue(today, today)).toBe(0);
    });

    it("should return correct days for past due dates", () => {
      const pastDate = new Date("2024-03-01T00:00:00Z");
      const currentDate = new Date("2024-03-10T00:00:00Z");
      expect(calculateDaysOverdue(pastDate, currentDate)).toBe(9);
    });

    it("should handle string dates", () => {
      const result = calculateDaysOverdue("2024-03-01", new Date("2024-03-05T00:00:00Z"));
      expect(result).toBe(4);
    });
  });
});
