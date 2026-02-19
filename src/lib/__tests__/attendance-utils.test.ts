import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isWithinSignInWindow,
  getPopupDismissalKey,
  getSnoozeKey,
  getTimeWindowMessage,
  shouldShowPopup,
} from "../attendance-utils";

describe("attendance-utils", () => {
  const defaultSettings = {
    signInStartHour: 6,
    signInEndHour: 9,
    signOutStartHour: 17,
    signOutEndHour: 20,
  };

  describe("isWithinSignInWindow", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return true when within sign-in window", () => {
      vi.setSystemTime(new Date("2024-03-15T07:30:00Z"));
      expect(isWithinSignInWindow(defaultSettings)).toBe(true);
    });

    it("should return false before sign-in window", () => {
      vi.setSystemTime(new Date("2024-03-15T05:30:00Z"));
      expect(isWithinSignInWindow(defaultSettings)).toBe(false);
    });

    it("should return false after sign-in window", () => {
      vi.setSystemTime(new Date("2024-03-15T10:00:00Z"));
      expect(isWithinSignInWindow(defaultSettings)).toBe(false);
    });

    it("should return true at exact start time", () => {
      vi.setSystemTime(new Date("2024-03-15T06:00:00Z"));
      expect(isWithinSignInWindow(defaultSettings)).toBe(true);
    });

    it("should return false at exact end time", () => {
      vi.setSystemTime(new Date("2024-03-15T09:00:00Z"));
      expect(isWithinSignInWindow(defaultSettings)).toBe(false);
    });
  });

  describe("getPopupDismissalKey", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should generate date-based key", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00Z"));
      const key = getPopupDismissalKey();
      expect(key).toBe("attendance-popup-dismissed-2024-03-15");
    });

    it("should generate different keys for different days", () => {
      vi.setSystemTime(new Date("2024-03-15T12:00:00Z"));
      const key1 = getPopupDismissalKey();

      vi.setSystemTime(new Date("2024-03-16T12:00:00Z"));
      const key2 = getPopupDismissalKey();

      expect(key1).not.toBe(key2);
    });
  });

  describe("getSnoozeKey", () => {
    it("should return constant key", () => {
      expect(getSnoozeKey()).toBe("attendance-popup-snooze-until");
    });
  });

  describe("getTimeWindowMessage", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should show opens at before window", () => {
      vi.setSystemTime(new Date("2024-03-15T05:30:00Z"));
      const message = getTimeWindowMessage(defaultSettings);
      expect(message).toBe("Sign-in opens at 06:00");
    });

    it("should show available now during window", () => {
      vi.setSystemTime(new Date("2024-03-15T07:30:00Z"));
      const message = getTimeWindowMessage(defaultSettings);
      expect(message).toBe("Sign-in available now");
    });

    it("should show closed after window", () => {
      vi.setSystemTime(new Date("2024-03-15T10:00:00Z"));
      const message = getTimeWindowMessage(defaultSettings);
      expect(message).toContain("closed");
    });
  });

  describe("shouldShowPopup", () => {
    it("should return false when already signed in", () => {
      expect(shouldShowPopup(true)).toBe(false);
    });
  });
});
