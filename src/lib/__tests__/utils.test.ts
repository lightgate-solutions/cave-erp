import { describe, it, expect } from "vitest";
import { cn, formatCurrency } from "../utils";

describe("utils", () => {
  describe("cn - className utility", () => {
    it("should merge class names", () => {
      expect(cn("foo", "bar")).toBe("foo bar");
    });

    it("should handle conditional classes", () => {
      expect(cn("base", true && "active")).toBe("base active");
      expect(cn("base", false && "active")).toBe("base");
    });

    it("should handle undefined and null", () => {
      expect(cn("base", undefined, null, "end")).toBe("base end");
    });

    it("should merge tailwind classes correctly", () => {
      // tailwind-merge should handle conflicting classes
      expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    });

    it("should handle array of classes", () => {
      expect(cn(["foo", "bar"])).toBe("foo bar");
    });

    it("should handle object syntax", () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
    });
  });

  describe("formatCurrency", () => {
    it("should format positive numbers as NGN currency", () => {
      const result = formatCurrency(1000);
      expect(result).toContain("1,000");
      expect(result).toContain("NGN");
    });

    it("should format with 2 decimal places", () => {
      const result = formatCurrency(1000.5);
      expect(result).toContain("1,000.50");
    });

    it("should handle zero", () => {
      const result = formatCurrency(0);
      expect(result).toContain("0.00");
    });

    it("should handle large numbers", () => {
      const result = formatCurrency(1000000);
      expect(result).toContain("1,000,000");
    });

    it("should handle decimal numbers", () => {
      const result = formatCurrency(99.99);
      expect(result).toContain("99.99");
    });

    it("should handle negative numbers", () => {
      const result = formatCurrency(-500);
      expect(result).toContain("500");
    });
  });
});
