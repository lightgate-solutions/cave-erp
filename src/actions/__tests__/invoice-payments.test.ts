import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    mockRequireInvoicingViewAccess,
    mockRequireInvoicingWriteAccess,
    mockGetFullOrganization,
    queueDbResult,
    mockQueryFindFirst,
    mockEnsureDefaultGLAccounts,
    mockCreateJournal,
    DEFAULT_USER_ID,
    DEFAULT_ORG_ID,
} from "./helpers/setup";

vi.mock("@/actions/finance/gl/journals", async () => {
    const { mockCreateJournal } = await import("./helpers/setup");
    return { createJournal: (...args: unknown[]) => mockCreateJournal(...args) };
});

vi.mock("@/actions/finance/gl/accounts", async () => {
    const { mockEnsureDefaultGLAccounts } = await import("./helpers/setup");
    return { ensureDefaultGLAccounts: (...args: unknown[]) => mockEnsureDefaultGLAccounts(...args) };
});

import {
    recordPayment,
    updatePayment,
    deletePayment,
    getInvoicePayments,
    getAllPayments,
    getInvoicePaymentStats,
} from "@/actions/invoicing/payments";

const INVOICE_ID = 1;
const PAYMENT_ID = 42;
const DEFAULT_ORG = { id: DEFAULT_ORG_ID, name: "Test Org" };
const DEFAULT_EMPLOYEE = { userId: DEFAULT_USER_ID };

const DEFAULT_INVOICE = {
    id: INVOICE_ID,
    invoiceNumber: "INV-001",
    clientId: 10,
    total: "1000.00",
    amountPaid: "0.00",
    amountDue: "1000.00",
    status: "Sent",
    paidAt: null,
    dueDate: "2099-12-31",
    organizationId: DEFAULT_ORG_ID,
    updatedBy: null,
};

const DEFAULT_INVOICE_ROW = {
    invoice: DEFAULT_INVOICE,
    currency: { currencySymbol: "$" },
    client: { name: "ACME" },
};

function setupMocks() {
    mockGetFullOrganization.mockResolvedValue(DEFAULT_ORG);
    mockRequireInvoicingWriteAccess.mockResolvedValue({ employee: DEFAULT_EMPLOYEE });
    mockRequireInvoicingViewAccess.mockResolvedValue({ employee: DEFAULT_EMPLOYEE });
    mockEnsureDefaultGLAccounts.mockResolvedValue(undefined);
    mockCreateJournal.mockResolvedValue({ success: true });
    // GL account lookups default to null → skip GL posting
    mockQueryFindFirst.mockResolvedValue(null);
}

// ─── recordPayment ────────────────────────────────────────────────────────────
describe("recordPayment", () => {
    beforeEach(setupMocks);

    it("returns error when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        const result = await recordPayment(INVOICE_ID, {
            amount: 500, paymentDate: "2026-02-01", paymentMethod: "Bank Transfer",
        });
        expect(result.success).toBeNull();
        expect(result.error?.reason).toBe("Organization not found");
    });

    it("returns error when payment amount is zero", async () => {
        queueDbResult([DEFAULT_INVOICE_ROW]);  // tx: select invoice
        const result = await recordPayment(INVOICE_ID, {
            amount: 0, paymentDate: "2026-02-01", paymentMethod: "Cash",
        });
        expect(result.success).toBeNull();
        expect(result.error?.reason).toMatch(/greater than zero/i);
    });

    it("returns error when payment amount exceeds amount due", async () => {
        queueDbResult([DEFAULT_INVOICE_ROW]);
        const result = await recordPayment(INVOICE_ID, {
            amount: 9999, paymentDate: "2026-02-01", paymentMethod: "Cash",
        });
        expect(result.success).toBeNull();
        expect(result.error?.reason).toMatch(/cannot exceed amount due/i);
    });

    it("records payment successfully (full payment)", async () => {
        const paymentRecord = {
            id: PAYMENT_ID, invoiceId: INVOICE_ID, amount: "1000.00",
            paymentDate: "2026-02-01", paymentMethod: "Bank Transfer",
            organizationId: DEFAULT_ORG_ID,
        };
        // tx: 1) select invoice, 2) insert payment, 3) update invoice, 4) insert activity log
        queueDbResult([DEFAULT_INVOICE_ROW]);          // select invoice (limit 1)
        queueDbResult([paymentRecord]);                // insert payment (returning)
        queueDbResult(undefined);                      // update invoice
        queueDbResult(undefined);                      // insert activity ("Payment Recorded")
        queueDbResult(undefined);                      // insert activity ("Status Changed" – Paid)
        // GL: no accounts found
        mockQueryFindFirst.mockResolvedValueOnce(null);

        const result = await recordPayment(INVOICE_ID, {
            amount: 1000, paymentDate: "2026-02-01", paymentMethod: "Bank Transfer",
        });
        expect(result.error).toBeNull();
        expect(result.success?.data).toBeDefined();
        expect(result.success?.data.amount).toBe("1000.00");
    });

    it("records partial payment successfully", async () => {
        const paymentRecord = {
            id: PAYMENT_ID, invoiceId: INVOICE_ID, amount: "400.00",
            paymentDate: "2026-02-01", paymentMethod: "Cash",
            organizationId: DEFAULT_ORG_ID,
        };
        queueDbResult([DEFAULT_INVOICE_ROW]);   // select invoice
        queueDbResult([paymentRecord]);          // insert payment
        queueDbResult(undefined);               // update invoice
        queueDbResult(undefined);               // insert activity (status → Partially Paid)
        queueDbResult(undefined);               // insert activity ("Status Changed")

        const result = await recordPayment(INVOICE_ID, {
            amount: 400, paymentDate: "2026-02-01", paymentMethod: "Cash",
        });
        expect(result.error).toBeNull();
        expect(result.success?.data.amount).toBe("400.00");
    });

    it("posts to GL when cash and AR accounts are found", async () => {
        const paymentRecord = {
            id: PAYMENT_ID, invoiceId: INVOICE_ID, amount: "1000.00",
            paymentDate: "2026-02-01", paymentMethod: "Bank Transfer",
            organizationId: DEFAULT_ORG_ID,
        };
        queueDbResult([DEFAULT_INVOICE_ROW]);
        queueDbResult([paymentRecord]);
        queueDbResult(undefined);
        queueDbResult(undefined);
        queueDbResult(undefined);  // status change activity
        // GL: both accounts found
        mockQueryFindFirst
            .mockResolvedValueOnce({ id: 1, code: "1000" })  // cash
            .mockResolvedValueOnce({ id: 2, code: "1200" }); // AR

        await recordPayment(INVOICE_ID, {
            amount: 1000, paymentDate: "2026-02-01", paymentMethod: "Bank Transfer",
        });
        expect(mockCreateJournal).toHaveBeenCalled();
    });
});

// ─── updatePayment ────────────────────────────────────────────────────────────
describe("updatePayment", () => {
    beforeEach(setupMocks);

    it("returns error when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        const result = await updatePayment(PAYMENT_ID, { amount: 500 });
        expect(result.success).toBeNull();
        expect(result.error?.reason).toBe("Organization not found");
    });

    it("returns error when payment is not found", async () => {
        queueDbResult([]);  // tx: select payment → not found
        const result = await updatePayment(PAYMENT_ID, { amount: 500 });
        expect(result.success).toBeNull();
        expect(result.error?.reason).toMatch(/payment not found/i);
    });

    it("updates payment and recalculates invoice amounts", async () => {
        const existingPayment = {
            id: PAYMENT_ID, invoiceId: INVOICE_ID, amount: "400.00",
            organizationId: DEFAULT_ORG_ID,
        };
        const updatedPayment = { ...existingPayment, amount: "600.00" };

        // tx sequence: select payment, select invoice, update payment, select paymentsSum, update invoice, insert activity
        queueDbResult([existingPayment]);          // select payment (limit 1)
        queueDbResult([DEFAULT_INVOICE]);          // select invoice (limit 1)
        queueDbResult([updatedPayment]);           // update payment (returning)
        queueDbResult([{ totalPaid: "600.00" }]); // select paymentsSum
        queueDbResult(undefined);                  // update invoice
        queueDbResult(undefined);                  // insert activity

        const result = await updatePayment(PAYMENT_ID, { amount: 600 });
        expect(result.error).toBeNull();
        expect(result.success?.data.amount).toBe("600.00");
    });
});

// ─── deletePayment ────────────────────────────────────────────────────────────
describe("deletePayment", () => {
    beforeEach(setupMocks);

    it("returns error when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        const result = await deletePayment(PAYMENT_ID);
        expect(result.success).toBeNull();
        expect(result.error?.reason).toBe("Organization not found");
    });

    it("returns error when payment is not found", async () => {
        queueDbResult([]);  // tx: select payment → empty
        const result = await deletePayment(PAYMENT_ID);
        expect(result.success).toBeNull();
        expect(result.error?.reason).toMatch(/payment not found/i);
    });

    it("deletes payment and reverts invoice to Sent", async () => {
        const payment = {
            id: PAYMENT_ID, invoiceId: INVOICE_ID, amount: "1000.00",
            paymentDate: "2026-01-01", paymentMethod: "Cash",
            organizationId: DEFAULT_ORG_ID,
        };
        // tx sequence: select payment, select invoice, delete, select paymentsSum, update invoice, insert activity
        queueDbResult([payment]);                  // select payment
        queueDbResult([DEFAULT_INVOICE]);          // select invoice
        queueDbResult(undefined);                  // delete payment
        queueDbResult([{ totalPaid: "0" }]);       // paymentsSum → 0
        queueDbResult(undefined);                  // update invoice
        queueDbResult(undefined);                  // insert activity

        const result = await deletePayment(PAYMENT_ID);
        expect(result.error).toBeNull();
        expect(result.success?.reason).toMatch(/deleted/i);
    });
});

// ─── getInvoicePayments ───────────────────────────────────────────────────────
describe("getInvoicePayments", () => {
    beforeEach(setupMocks);

    it("returns empty array when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        expect(await getInvoicePayments(INVOICE_ID)).toEqual([]);
    });

    it("returns payments for the given invoice", async () => {
        queueDbResult([{ id: PAYMENT_ID, invoiceId: INVOICE_ID, amount: "500.00" }]);
        const result = await getInvoicePayments(INVOICE_ID);
        expect(result).toHaveLength(1);
    });
});

// ─── getAllPayments ───────────────────────────────────────────────────────────
describe("getAllPayments", () => {
    beforeEach(setupMocks);

    it("returns empty array when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        expect(await getAllPayments()).toEqual([]);
    });

    it("returns payment rows with joined invoice and client", async () => {
        const rows = [{
            payment: { id: PAYMENT_ID, invoiceId: INVOICE_ID, amount: "500.00" },
            invoice: { id: INVOICE_ID, invoiceNumber: "INV-001", clientId: 10 },
            client: { id: 10, name: "ACME" },
            currency: { currencyCode: "USD", currencySymbol: "$" },
        }];
        queueDbResult(rows);
        const result = await getAllPayments();
        expect(result).toHaveLength(1);
    });

    it("filters by clientId after the join", async () => {
        const rows = [
            { payment: { id: 1 }, invoice: { clientId: 5 }, client: {}, currency: {} },
            { payment: { id: 2 }, invoice: { clientId: 99 }, client: {}, currency: {} },
        ];
        queueDbResult(rows);
        const result = await getAllPayments({ clientId: 5 });
        expect(result).toHaveLength(1);
    });
});

// ─── getInvoicePaymentStats ───────────────────────────────────────────────────
describe("getInvoicePaymentStats", () => {
    beforeEach(setupMocks);

    it("returns null when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        expect(await getInvoicePaymentStats(INVOICE_ID)).toBeNull();
    });

    it("returns payment statistics", async () => {
        queueDbResult([{
            paymentCount: 2,
            totalPaid: "1500.00",
            lastPaymentDate: "2026-02-15",
        }]);
        const result = await getInvoicePaymentStats(INVOICE_ID);
        expect(result?.paymentCount).toBe(2);
        expect(result?.totalPaid).toBe("1500.00");
        expect(result?.lastPaymentDate).toBe("2026-02-15");
    });
});
