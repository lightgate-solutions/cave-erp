/**
 * Payables module types
 */

export type VendorStatus = "Active" | "Inactive" | "Suspended" | "Archived";
export type VendorCategory = "Services" | "Goods" | "Utilities" | "Custom";
export type PaymentMethod = "Bank Transfer" | "Wire" | "Check" | "Cash";

export type POStatus =
  | "Draft"
  | "Pending Approval"
  | "Approved"
  | "Sent"
  | "Partially Received"
  | "Received"
  | "Closed"
  | "Cancelled";

export type BillStatus =
  | "Draft"
  | "Pending"
  | "Approved"
  | "Paid"
  | "Overdue"
  | "Cancelled"
  | "Partially Paid";

export type BillTaxType = "VAT" | "WHT" | "Sales Tax" | "GST" | "Custom";

export type BillDocumentType =
  | "Vendor Invoice"
  | "Payment Receipt"
  | "Tax Document"
  | "Delivery Note"
  | "Other";

export type BillActivityType =
  | "Bill Created"
  | "Bill Approved"
  | "Status Changed"
  | "Payment Recorded"
  | "Payment Deleted"
  | "Email Sent"
  | "Bill Updated"
  | "Bill Cancelled"
  | "Note Added"
  | "PO Matched";

/**
 * Line item structure for forms
 */
export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount?: number;
  sortOrder?: number;
  poLineItemId?: number; // Link to PO line item
  poUnitPrice?: number; // Original PO unit price (read-only)
  poAmount?: number; // Original PO amount (read-only)
}

/**
 * Tax structure for forms
 */
export interface TaxItem {
  taxType: BillTaxType;
  taxName: string;
  taxPercentage: number;
  taxAmount?: number;
  isWithholdingTax?: boolean;
  whtCertificateNumber?: string;
}

/**
 * Vendor contact structure
 */
export interface VendorContact {
  name: string;
  email: string;
  phone?: string;
  role?: string;
  isPrimary: boolean;
}

/**
 * Vendor bank account structure
 */
export interface VendorBankAccount {
  accountName: string;
  bankName: string;
  accountNumber: string;
  routingNumber?: string;
  swiftCode?: string;
  iban?: string;
  currency: string;
  isDefault: boolean;
  isActive: boolean;
}
