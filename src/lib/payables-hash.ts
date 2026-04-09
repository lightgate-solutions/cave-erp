import "server-only";
import { createHash } from "node:crypto";

/**
 * Generate a hash for duplicate detection (vendor ID, invoice number, amount).
 * Lives in a server-only module so client bundles never import Node crypto.
 */
export function generateDuplicateCheckHash(
  vendorId: number,
  vendorInvoiceNumber: string,
  amount: number,
): string {
  const data = `${vendorId}-${vendorInvoiceNumber.toLowerCase().trim()}-${amount.toFixed(2)}`;
  return createHash("sha256").update(data).digest("hex");
}
