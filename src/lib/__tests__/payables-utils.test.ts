import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  calculateBillAmounts,
  generateDuplicateCheckHash,
  calculateDuplicateSimilarity,
  calculateAgingBucket,
  calculateDaysOverdue,
  calculateStringSimilarity,
  formatPaymentMethod,
  formatVendorStatus,
  formatBillStatus,
  formatPOStatus,
} from "../payables-utils";

describe("payables-utils", () => {
  describe("calculateBillAmounts", () => {
    it("should calculate subtotal from line items", () => {
      const lineItems = [
        { description: "Item 1", quantity: 2, unitPrice: 100 },
        { description: "Item 2", quantity: 3, unitPrice: 50 },
      ];
      const result = calculateBillAmounts(lineItems, []);

      expect(result.subtotal).toBe(350); // (2*100) + (3*50)
      expect(result.taxAmount).toBe(0);
      expect(result.total).toBe(350);
    });

    it("should calculate tax amount correctly", () => {
      const lineItems = [
        { description: "Item 1", quantity: 1, unitPrice: 1000 },
      ];
      const taxes = [{ taxName: "VAT", taxPercentage: 7.5 }];
      const result = calculateBillAmounts(lineItems, taxes);

      expect(result.subtotal).toBe(1000);
      expect(result.taxAmount).toBe(75); // 7.5% of 1000
      expect(result.total).toBe(1075);
    });

    it("should handle multiple taxes", () => {
      const lineItems = [
        { description: "Item 1", quantity: 1, unitPrice: 1000 },
      ];
      const taxes = [
        { taxName: "VAT", taxPercentage: 7.5 },
        { taxName: "WHT", taxPercentage: 5 },
      ];
      const result = calculateBillAmounts(lineItems, taxes);

      expect(result.subtotal).toBe(1000);
      expect(result.taxAmount).toBe(125); // 7.5% + 5% = 12.5% of 1000
      expect(result.total).toBe(1125);
    });

    it("should handle empty line items", () => {
      const result = calculateBillAmounts([], []);
      expect(result.subtotal).toBe(0);
      expect(result.total).toBe(0);
    });

    it("should round to 2 decimal places", () => {
      const lineItems = [
        { description: "Item", quantity: 3, unitPrice: 33.33 },
      ];
      const result = calculateBillAmounts(lineItems, []);
      expect(result.subtotal).toBe(99.99);
    });
  });

  describe("generateDuplicateCheckHash", () => {
    it("should generate consistent hash for same inputs", () => {
      const hash1 = generateDuplicateCheckHash(1, "INV-001", 1000);
      const hash2 = generateDuplicateCheckHash(1, "INV-001", 1000);
      expect(hash1).toBe(hash2);
    });

    it("should generate different hash for different vendor", () => {
      const hash1 = generateDuplicateCheckHash(1, "INV-001", 1000);
      const hash2 = generateDuplicateCheckHash(2, "INV-001", 1000);
      expect(hash1).not.toBe(hash2);
    });

    it("should normalize invoice number (lowercase, trim)", () => {
      const hash1 = generateDuplicateCheckHash(1, "INV-001", 1000);
      const hash2 = generateDuplicateCheckHash(1, "  inv-001  ", 1000);
      expect(hash1).toBe(hash2);
    });

    it("should return 64-character hex string (SHA-256)", () => {
      const hash = generateDuplicateCheckHash(1, "INV-001", 1000);
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });
  });

  describe("calculateDuplicateSimilarity", () => {
    it("should return 0 for different vendors", () => {
      const bill1 = {
        vendorId: 1,
        vendorInvoiceNumber: "INV-001",
        total: "1000",
        billDate: "2024-03-01",
      };
      const bill2 = {
        vendorId: 2,
        vendorInvoiceNumber: "INV-001",
        total: "1000",
        billDate: "2024-03-01",
      };

      const result = calculateDuplicateSimilarity(bill1, bill2);
      expect(result.similarity).toBe(0);
      expect(result.reasons).toContain("Different vendors");
    });

    it("should return high score for exact match", () => {
      const bill1 = {
        vendorId: 1,
        vendorInvoiceNumber: "INV-001",
        total: "1000",
        billDate: "2024-03-01",
      };
      const bill2 = {
        vendorId: 1,
        vendorInvoiceNumber: "INV-001",
        total: "1000",
        billDate: "2024-03-15",
      };

      const result = calculateDuplicateSimilarity(bill1, bill2);
      expect(result.similarity).toBeGreaterThan(0.9);
    });

    it("should detect partial invoice number match", () => {
      const bill1 = {
        vendorId: 1,
        vendorInvoiceNumber: "INV-001",
        total: "1000",
        billDate: "2024-03-01",
      };
      const bill2 = {
        vendorId: 1,
        vendorInvoiceNumber: "INV-001-A",
        total: "1000",
        billDate: "2024-03-01",
      };

      const result = calculateDuplicateSimilarity(bill1, bill2);
      expect(result.reasons.some((r) => r.includes("Partial invoice"))).toBe(
        true,
      );
    });

    it("should detect similar amounts within 1% tolerance", () => {
      const bill1 = {
        vendorId: 1,
        vendorInvoiceNumber: "INV-001",
        total: "1000",
        billDate: "2024-03-01",
      };
      const bill2 = {
        vendorId: 1,
        vendorInvoiceNumber: "INV-002",
        total: "1005",
        billDate: "2024-03-01",
      };

      const result = calculateDuplicateSimilarity(bill1, bill2);
      expect(result.reasons.some((r) => r.includes("Similar amounts"))).toBe(
        true,
      );
    });
  });

  describe("calculateAgingBucket", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-03-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return Current for future due dates", () => {
      expect(calculateAgingBucket("2024-03-20")).toBe("Current");
    });

    it("should return 1-30 for bills 1-30 days overdue", () => {
      expect(calculateAgingBucket("2024-03-10")).toBe("1-30");
      expect(calculateAgingBucket("2024-02-15")).toBe("1-30");
    });

    it("should return 31-60 for bills 31-60 days overdue", () => {
      expect(calculateAgingBucket("2024-02-01")).toBe("31-60");
    });

    it("should return 61-90 for bills 61-90 days overdue", () => {
      expect(calculateAgingBucket("2024-01-01")).toBe("61-90");
    });

    it("should return 90+ for bills over 90 days overdue", () => {
      expect(calculateAgingBucket("2023-12-01")).toBe("90+");
    });
  });

  describe("calculateDaysOverdue", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2024-03-15T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return 0 for future due dates", () => {
      expect(calculateDaysOverdue("2024-03-20")).toBe(0);
    });

    it("should return correct days overdue", () => {
      expect(calculateDaysOverdue("2024-03-10")).toBe(5);
      expect(calculateDaysOverdue("2024-03-01")).toBe(14);
    });
  });

  describe("calculateStringSimilarity", () => {
    it("should return 1 for identical strings", () => {
      expect(calculateStringSimilarity("hello", "hello")).toBe(1);
    });

    it("should return 1 for case-insensitive match", () => {
      expect(calculateStringSimilarity("Hello", "HELLO")).toBe(1);
    });

    it("should return 0 for empty strings", () => {
      expect(calculateStringSimilarity("hello", "")).toBe(0);
      expect(calculateStringSimilarity("", "hello")).toBe(0);
    });

    it("should return high similarity for similar strings", () => {
      const similarity = calculateStringSimilarity(
        "Office Supplies",
        "Office Supply",
      );
      expect(similarity).toBeGreaterThanOrEqual(0.8);
    });

    it("should return low similarity for different strings", () => {
      const similarity = calculateStringSimilarity("Laptop", "Printer");
      expect(similarity).toBeLessThan(0.5);
    });
  });

  describe("formatPaymentMethod", () => {
    it("should format known payment methods", () => {
      expect(formatPaymentMethod("Wire")).toBe("Wire Transfer");
      expect(formatPaymentMethod("Check")).toBe("Check");
      expect(formatPaymentMethod("Cash")).toBe("Cash");
    });

    it("should return original for unknown methods", () => {
      expect(formatPaymentMethod("Crypto")).toBe("Crypto");
    });
  });

  describe("formatVendorStatus", () => {
    it("should return correct label and color for Active", () => {
      const result = formatVendorStatus("Active");
      expect(result.label).toBe("Active");
      expect(result.color).toBe("green");
    });

    it("should return correct label and color for Suspended", () => {
      const result = formatVendorStatus("Suspended");
      expect(result.label).toBe("Suspended");
      expect(result.color).toBe("red");
    });

    it("should handle unknown status", () => {
      const result = formatVendorStatus("Unknown");
      expect(result.label).toBe("Unknown");
      expect(result.color).toBe("gray");
    });
  });

  describe("formatBillStatus", () => {
    it("should return correct colors for each status", () => {
      expect(formatBillStatus("Paid").color).toBe("green");
      expect(formatBillStatus("Overdue").color).toBe("red");
      expect(formatBillStatus("Pending").color).toBe("yellow");
      expect(formatBillStatus("Partially Paid").color).toBe("orange");
    });
  });

  describe("formatPOStatus", () => {
    it("should return correct colors for each status", () => {
      expect(formatPOStatus("Received").color).toBe("green");
      expect(formatPOStatus("Cancelled").color).toBe("red");
      expect(formatPOStatus("Pending Approval").color).toBe("yellow");
    });
  });
});
