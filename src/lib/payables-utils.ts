import crypto from "node:crypto";

/**
 * Line item structure for calculations
 */
export interface PayablesLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  sortOrder?: number;
}

/**
 * Tax structure for calculations
 */
export interface PayablesTax {
  taxName: string;
  taxPercentage: number;
  taxType?: string;
}

/**
 * Calculate bill/PO amounts from line items and taxes
 */
export function calculateBillAmounts(
  lineItems: PayablesLineItem[],
  taxes: PayablesTax[],
): {
  subtotal: number;
  taxAmount: number;
  total: number;
} {
  // Calculate subtotal from line items
  const subtotal = lineItems.reduce((sum, item) => {
    return sum + item.quantity * item.unitPrice;
  }, 0);

  // Calculate total tax amount
  const taxAmount = taxes.reduce((sum, tax) => {
    return sum + (subtotal * tax.taxPercentage) / 100;
  }, 0);

  // Calculate total
  const total = subtotal + taxAmount;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
}

/**
 * Generate a hash for duplicate detection
 * Uses vendor ID, invoice number, and amount
 */
export function generateDuplicateCheckHash(
  vendorId: number,
  vendorInvoiceNumber: string,
  amount: number,
): string {
  const data = `${vendorId}-${vendorInvoiceNumber.toLowerCase().trim()}-${amount.toFixed(2)}`;
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Calculate similarity score between two bills for duplicate detection
 * Returns a score between 0 and 1 (1 = identical)
 */
export function calculateDuplicateSimilarity(
  bill1: {
    vendorId: number;
    vendorInvoiceNumber: string;
    total: string | number;
    billDate: string;
  },
  bill2: {
    vendorId: number;
    vendorInvoiceNumber: string;
    total: string | number;
    billDate: string;
  },
): {
  similarity: number;
  reasons: string[];
} {
  const reasons: string[] = [];
  let score = 0;

  // Same vendor (required for comparison)
  if (bill1.vendorId !== bill2.vendorId) {
    return { similarity: 0, reasons: ["Different vendors"] };
  }
  score += 0.3;

  // Invoice number similarity
  const invoice1 = bill1.vendorInvoiceNumber.toLowerCase().trim();
  const invoice2 = bill2.vendorInvoiceNumber.toLowerCase().trim();

  if (invoice1 === invoice2) {
    score += 0.4;
    reasons.push("Exact invoice number match");
  } else if (invoice1.includes(invoice2) || invoice2.includes(invoice1)) {
    score += 0.2;
    reasons.push("Partial invoice number match");
  }

  // Amount similarity (within 1% tolerance)
  const amount1 = Number(bill1.total);
  const amount2 = Number(bill2.total);
  const amountDiff = Math.abs(amount1 - amount2);
  const amountTolerance = Math.max(amount1, amount2) * 0.01;

  if (amountDiff <= amountTolerance) {
    score += 0.2;
    reasons.push(
      `Similar amounts (${amount1.toFixed(2)} vs ${amount2.toFixed(2)})`,
    );
  }

  // Date proximity (within 30 days)
  const date1 = new Date(bill1.billDate);
  const date2 = new Date(bill2.billDate);
  const daysDiff = Math.abs(
    (date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysDiff <= 30) {
    score += 0.1;
    reasons.push(`Bills within ${Math.round(daysDiff)} days of each other`);
  }

  return {
    similarity: Math.min(score, 1),
    reasons,
  };
}

/**
 * Calculate aging bucket for a bill based on due date
 */
export function calculateAgingBucket(
  dueDate: string,
): "Current" | "1-30" | "31-60" | "61-90" | "90+" {
  const today = new Date();
  const due = new Date(dueDate);
  const daysOverdue = Math.floor(
    (today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysOverdue < 0) {
    return "Current";
  }
  if (daysOverdue <= 30) {
    return "1-30";
  }
  if (daysOverdue <= 60) {
    return "31-60";
  }
  if (daysOverdue <= 90) {
    return "61-90";
  }
  return "90+";
}

/**
 * Calculate days overdue for a bill
 */
export function calculateDaysOverdue(dueDate: string): number {
  const today = new Date();
  const due = new Date(dueDate);
  const daysOverdue = Math.floor(
    (today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24),
  );
  return Math.max(0, daysOverdue);
}

/**
 * Calculate cash flow forecast for upcoming bills
 */
export function forecastCashFlow(
  bills: Array<{
    dueDate: string;
    amountDue: string | number;
    status: string;
  }>,
  forecastMonths: number = 3,
): Array<{
  month: string;
  year: number;
  totalDue: number;
  billCount: number;
}> {
  const forecast: Record<
    string,
    { month: string; year: number; totalDue: number; billCount: number }
  > = {};

  const today = new Date();
  const endDate = new Date(today);
  endDate.setMonth(endDate.getMonth() + forecastMonths);

  for (const bill of bills) {
    // Only include pending/approved/overdue bills
    if (
      !["Pending", "Approved", "Overdue", "Partially Paid"].includes(
        bill.status,
      )
    ) {
      continue;
    }

    const dueDate = new Date(bill.dueDate);

    // Only include bills within forecast window
    if (dueDate <= endDate) {
      const key = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, "0")}`;

      if (!forecast[key]) {
        forecast[key] = {
          month: new Intl.DateTimeFormat("en-US", { month: "short" }).format(
            dueDate,
          ),
          year: dueDate.getFullYear(),
          totalDue: 0,
          billCount: 0,
        };
      }

      forecast[key].totalDue += Number(bill.amountDue);
      forecast[key].billCount += 1;
    }
  }

  // Convert to array and sort by date
  return Object.entries(forecast)
    .map(([_key, value]) => ({
      ...value,
      totalDue: Number(value.totalDue.toFixed(2)),
    }))
    .sort((a, b) => {
      const dateA = new Date(a.year, parseInt(a.month) - 1);
      const dateB = new Date(b.year, parseInt(b.month) - 1);
      return dateA.getTime() - dateB.getTime();
    });
}

/**
 * Calculate string similarity for PO-to-Bill line item matching
 * Uses Levenshtein distance
 */
export function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  // Calculate Levenshtein distance
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        );
      }
    }
  }

  const distance = matrix[s2.length][s1.length];
  const maxLength = Math.max(s1.length, s2.length);
  const similarity = 1 - distance / maxLength;

  return Number(similarity.toFixed(3));
}

/**
 * Format payment method for display
 */
export function formatPaymentMethod(method: string): string {
  const methodMap: Record<string, string> = {
    "Bank Transfer": "Bank Transfer",
    Wire: "Wire Transfer",
    Check: "Check",
    Cash: "Cash",
  };

  return methodMap[method] || method;
}

/**
 * Format vendor status for display
 */
export function formatVendorStatus(status: string): {
  label: string;
  color: string;
} {
  const statusMap: Record<string, { label: string; color: string }> = {
    Active: { label: "Active", color: "green" },
    Inactive: { label: "Inactive", color: "gray" },
    Suspended: { label: "Suspended", color: "red" },
    Archived: { label: "Archived", color: "gray" },
  };

  return statusMap[status] || { label: status, color: "gray" };
}

/**
 * Format bill status for display
 */
export function formatBillStatus(status: string): {
  label: string;
  color: string;
} {
  const statusMap: Record<string, { label: string; color: string }> = {
    Draft: { label: "Draft", color: "gray" },
    Pending: { label: "Pending", color: "yellow" },
    Approved: { label: "Approved", color: "blue" },
    Paid: { label: "Paid", color: "green" },
    Overdue: { label: "Overdue", color: "red" },
    Cancelled: { label: "Cancelled", color: "gray" },
    "Partially Paid": { label: "Partially Paid", color: "orange" },
  };

  return statusMap[status] || { label: status, color: "gray" };
}

/**
 * Format PO status for display
 */
export function formatPOStatus(status: string): {
  label: string;
  color: string;
} {
  const statusMap: Record<string, { label: string; color: string }> = {
    Draft: { label: "Draft", color: "gray" },
    "Pending Approval": { label: "Pending Approval", color: "yellow" },
    Approved: { label: "Approved", color: "blue" },
    Sent: { label: "Sent", color: "blue" },
    "Partially Received": { label: "Partially Received", color: "orange" },
    Received: { label: "Received", color: "green" },
    Closed: { label: "Closed", color: "gray" },
    Cancelled: { label: "Cancelled", color: "red" },
  };

  return statusMap[status] || { label: status, color: "gray" };
}
