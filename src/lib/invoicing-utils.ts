import type { LineItem } from "@/types/invoicing";

export interface InvoiceTaxInput {
  taxName: string;
  taxPercentage: number;
}

/**
 * Calculate invoice amounts from line items and taxes
 */
export function calculateInvoiceAmounts(
  lineItems: LineItem[],
  taxes: InvoiceTaxInput[] = [],
) {
  // Calculate subtotal from all line items
  const subtotal = lineItems.reduce((sum, item) => {
    return sum + item.quantity * item.unitPrice;
  }, 0);

  // Calculate total tax amount (sum of all taxes applied to subtotal)
  const taxAmount = taxes.reduce((sum, tax) => {
    return sum + (subtotal * tax.taxPercentage) / 100;
  }, 0);

  // Total is subtotal plus tax
  const total = subtotal + taxAmount;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
}
