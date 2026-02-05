import { describe, it, expect } from "vitest";
import { calculateInvoiceAmounts } from "../invoicing-utils";

describe("invoicing-utils", () => {
  describe("calculateInvoiceAmounts", () => {
    it("should calculate subtotal from line items", () => {
      const lineItems = [
        { description: "Service A", quantity: 2, unitPrice: 5000 },
        { description: "Service B", quantity: 1, unitPrice: 10000 },
      ];
      const result = calculateInvoiceAmounts(lineItems);

      expect(result.subtotal).toBe(20000);
      expect(result.taxAmount).toBe(0);
      expect(result.total).toBe(20000);
    });

    it("should calculate with VAT", () => {
      const lineItems = [
        { description: "Consulting", quantity: 1, unitPrice: 100000 },
      ];
      const taxes = [{ taxName: "VAT", taxPercentage: 7.5 }];
      const result = calculateInvoiceAmounts(lineItems, taxes);

      expect(result.subtotal).toBe(100000);
      expect(result.taxAmount).toBe(7500);
      expect(result.total).toBe(107500);
    });

    it("should handle multiple taxes", () => {
      const lineItems = [
        { description: "Product", quantity: 10, unitPrice: 1000 },
      ];
      const taxes = [
        { taxName: "VAT", taxPercentage: 7.5 },
        { taxName: "WHT", taxPercentage: 2.5 },
      ];
      const result = calculateInvoiceAmounts(lineItems, taxes);

      expect(result.subtotal).toBe(10000);
      expect(result.taxAmount).toBe(1000);
      expect(result.total).toBe(11000);
    });

    it("should handle empty line items", () => {
      const result = calculateInvoiceAmounts([]);
      expect(result.subtotal).toBe(0);
      expect(result.total).toBe(0);
    });

    it("should round to 2 decimal places", () => {
      const lineItems = [
        { description: "Item", quantity: 3, unitPrice: 33.33 },
      ];
      const taxes = [{ taxName: "Tax", taxPercentage: 7.5 }];
      const result = calculateInvoiceAmounts(lineItems, taxes);
      expect(result.subtotal).toBe(99.99);
    });

    it("should handle zero quantity", () => {
      const lineItems = [
        { description: "Free Item", quantity: 0, unitPrice: 1000 },
      ];
      const result = calculateInvoiceAmounts(lineItems);
      expect(result.total).toBe(0);
    });
  });
});
