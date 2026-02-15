import { describe, it, expect, vi } from "vitest";
import {
    mockRequireInvoicingViewAccess,
    mockRequireInvoicingWriteAccess,
    mockGetFullOrganization,
    mockDbChain,
    mockTransaction,
    mockQueryFindFirst,
    mockQueryFindMany,
    mockGenerateInvoicePdf,
    mockR2Send,
    mockSendInvoiceEmail,
    mockCreateJournal,
    mockEnsureDefaultGLAccounts,
    mockCalculateInvoiceAmounts,
    mockOrgApi,
    DEFAULT_USER_ID,
    DEFAULT_ORG_ID,
} from "./helpers/setup";

// Import the functions under test
import {
    generateInvoiceNumber,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    getInvoice,
    getAllInvoices,
    updateInvoiceStatus,
    sendInvoice,
    getInvoiceGLPostingStatus,
    postInvoiceToGL,
    remindInvoice,
} from "@/actions/invoicing/invoices";

// ─── Helpers ────────────────────────────────────────────────────────────────

const defaultOrg = {
    id: DEFAULT_ORG_ID,
    name: "Test Org",
    slug: "testorg",
};

const defaultEmployee = {
    userId: DEFAULT_USER_ID,
};

function setupInvoicingMocks() {
    mockRequireInvoicingViewAccess.mockResolvedValue({
        employee: defaultEmployee,
    });
    mockRequireInvoicingWriteAccess.mockResolvedValue({
        employee: defaultEmployee,
    });
    mockGetFullOrganization.mockResolvedValue(defaultOrg);
}

const sampleInvoiceInput = {
    clientId: 1,
    currencyId: 1,
    invoiceDate: "2026-02-01",
    dueDate: "2026-03-01",
    lineItems: [
        { description: "Service", quantity: 2, unitPrice: 500 },
    ],
    taxes: [{ taxName: "VAT", taxPercentage: 7.5 }],
};

/** Rich invoice as returned by getInvoice (via db.query) */
const richInvoice = {
    id: 1,
    invoiceNumber: "TES-2026-0001",
    clientId: 1,
    bankAccountId: null,
    status: "Sent",
    total: "1075.00",
    amountDue: "1075.00",
    emailSentCount: 0,
    reminderCount: 0,
    sentAt: null,
    invoiceDate: "2026-02-01",
    dueDate: "2026-03-01",
    organizationId: DEFAULT_ORG_ID,
    client: { name: "Acme", email: "acme@test.com" },
    currency: { currencySymbol: "₦" },
    lineItems: [{ description: "Service", amount: "1000.00", sortOrder: 0 }],
    taxes: [],
    payments: [],
    documents: [],
    activityLog: [],
    createdByUser: null,
    updatedByUser: null,
};

// ─── generateInvoiceNumber ──────────────────────────────────────────────────

describe("generateInvoiceNumber", () => {
    it("should return first invoice number when none exist", async () => {
        mockGetFullOrganization.mockResolvedValue(defaultOrg);
        // db chain resolves to [] (no existing invoices)
        mockDbChain.then.mockImplementation(((resolve: (v: unknown) => unknown) =>
            Promise.resolve(resolve([]))) as (...a: unknown[]) => unknown);

        const result = await generateInvoiceNumber(DEFAULT_ORG_ID);

        const year = new Date().getFullYear();
        expect(result).toBe(`TES-${year}-0001`);
    });

    it("should increment existing invoice number", async () => {
        mockGetFullOrganization.mockResolvedValue(defaultOrg);
        const year = new Date().getFullYear();
        mockDbChain.then.mockImplementation(((resolve: (v: unknown) => unknown) =>
            Promise.resolve(resolve([
                { invoiceNumber: `TES-${year}-0005` },
            ]))) as (...a: unknown[]) => unknown);

        const result = await generateInvoiceNumber(DEFAULT_ORG_ID);

        expect(result).toBe(`TES-${year}-0006`);
    });

    it("should return null when organization not found", async () => {
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await generateInvoiceNumber();

        expect(result).toBeNull();
    });

    it("should return null on error", async () => {
        mockGetFullOrganization.mockRejectedValue(new Error("fail"));

        const result = await generateInvoiceNumber();

        expect(result).toBeNull();
    });
});

// ─── createInvoice ──────────────────────────────────────────────────────────

describe("createInvoice", () => {
    it("should create invoice successfully", async () => {
        setupInvoicingMocks();
        mockCalculateInvoiceAmounts.mockReturnValue({
            subtotal: 1000, taxAmount: 75, total: 1075,
        });
        // generateInvoiceNumber: chain resolves to [] (first invoice)
        mockDbChain.then.mockImplementation(((resolve: (v: unknown) => unknown) =>
            Promise.resolve(resolve([]))) as (...a: unknown[]) => unknown);
        // Transaction returning new invoice
        mockTransaction.mockImplementation(async (cb: (tx: unknown) => unknown) => {
            const tx = {
                insert: vi.fn().mockReturnValue({
                    values: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([{ id: 1, invoiceNumber: "TES-2026-0001" }]),
                    }),
                }),
            };
            return cb(tx);
        });

        const result = await createInvoice(sampleInvoiceInput);

        expect(result.error).toBeNull();
        expect(result.success).toBeTruthy();
    });

    it("should return error when org not found", async () => {
        mockRequireInvoicingWriteAccess.mockResolvedValue({
            employee: defaultEmployee,
        });
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await createInvoice(sampleInvoiceInput);

        expect(result).toEqual({
            success: null,
            error: { reason: "Organization not found" },
        });
    });

    it("should return error on generic failure", async () => {
        mockRequireInvoicingWriteAccess.mockRejectedValue(new Error("auth fail"));

        const result = await createInvoice(sampleInvoiceInput);

        expect(result).toEqual({
            success: null,
            error: { reason: "Failed to create invoice" },
        });
    });
});

// ─── updateInvoice ──────────────────────────────────────────────────────────

describe("updateInvoice", () => {
    it("should update invoice successfully", async () => {
        setupInvoicingMocks();
        // Chain resolves to a draft invoice
        mockDbChain.then.mockImplementation(((resolve: (v: unknown) => unknown) =>
            Promise.resolve(resolve([{ id: 1, status: "Draft" }]))) as (...a: unknown[]) => unknown);
        // Transaction mock
        mockTransaction.mockImplementation(async (cb: (tx: unknown) => unknown) => {
            const tx = {
                update: vi.fn().mockReturnValue({
                    set: vi.fn().mockReturnValue({
                        where: vi.fn().mockReturnValue({
                            returning: vi.fn().mockResolvedValue([{ id: 1 }]),
                        }),
                    }),
                }),
                delete: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue(undefined),
                }),
                insert: vi.fn().mockReturnValue({
                    values: vi.fn().mockResolvedValue(undefined),
                }),
            };
            return cb(tx);
        });

        const result = await updateInvoice(1, { notes: "Updated" });

        expect(result.error).toBeNull();
        expect(result.success).toBeTruthy();
    });

    it("should return error when org not found", async () => {
        mockRequireInvoicingWriteAccess.mockResolvedValue({
            employee: defaultEmployee,
        });
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await updateInvoice(1, {});

        expect(result).toEqual({
            success: null,
            error: { reason: "Organization not found" },
        });
    });

    it("should return error when invoice not found", async () => {
        setupInvoicingMocks();
        mockDbChain.then.mockImplementation(((resolve: (v: unknown) => unknown) =>
            Promise.resolve(resolve([]))) as (...a: unknown[]) => unknown);

        const result = await updateInvoice(999, {});

        expect(result).toEqual({
            success: null,
            error: { reason: "Invoice not found" },
        });
    });

    it("should return error when invoice is not a draft", async () => {
        setupInvoicingMocks();
        mockDbChain.then.mockImplementation(((resolve: (v: unknown) => unknown) =>
            Promise.resolve(resolve([{ id: 1, status: "Sent" }]))) as (...a: unknown[]) => unknown);

        const result = await updateInvoice(1, {});

        expect(result).toEqual({
            success: null,
            error: { reason: "Only draft invoices can be edited" },
        });
    });

    it("should return error on generic failure", async () => {
        mockRequireInvoicingWriteAccess.mockRejectedValue(new Error("fail"));

        const result = await updateInvoice(1, {});

        expect(result).toEqual({
            success: null,
            error: { reason: "Failed to update invoice" },
        });
    });
});

// ─── deleteInvoice ──────────────────────────────────────────────────────────

describe("deleteInvoice", () => {
    it("should delete a draft invoice successfully", async () => {
        setupInvoicingMocks();
        mockDbChain.then.mockImplementation(((resolve: (v: unknown) => unknown) =>
            Promise.resolve(resolve([{ id: 1, status: "Draft" }]))) as (...a: unknown[]) => unknown);

        const result = await deleteInvoice(1);

        expect(result).toEqual({
            success: { reason: "Invoice deleted successfully" },
            error: null,
        });
    });

    it("should return error when org not found", async () => {
        mockRequireInvoicingWriteAccess.mockResolvedValue({
            employee: defaultEmployee,
        });
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await deleteInvoice(1);

        expect(result).toEqual({
            success: null,
            error: { reason: "Organization not found" },
        });
    });

    it("should return error when invoice not found", async () => {
        setupInvoicingMocks();
        mockDbChain.then.mockImplementation(((resolve: (v: unknown) => unknown) =>
            Promise.resolve(resolve([]))) as (...a: unknown[]) => unknown);

        const result = await deleteInvoice(999);

        expect(result).toEqual({
            success: null,
            error: { reason: "Invoice not found" },
        });
    });

    it("should return error when invoice is not a draft", async () => {
        setupInvoicingMocks();
        mockDbChain.then.mockImplementation(((resolve: (v: unknown) => unknown) =>
            Promise.resolve(resolve([{ id: 1, status: "Sent" }]))) as (...a: unknown[]) => unknown);

        const result = await deleteInvoice(1);

        expect(result).toEqual({
            success: null,
            error: { reason: "Only draft invoices can be deleted" },
        });
    });

    it("should return error on generic failure", async () => {
        mockRequireInvoicingWriteAccess.mockRejectedValue(new Error("fail"));

        const result = await deleteInvoice(1);

        expect(result).toEqual({
            success: null,
            error: { reason: "Failed to delete invoice" },
        });
    });
});

// ─── getInvoice ─────────────────────────────────────────────────────────────

describe("getInvoice", () => {
    it("should return invoice on success", async () => {
        setupInvoicingMocks();
        mockQueryFindFirst.mockResolvedValue(richInvoice);

        const result = await getInvoice(1);

        expect(result).toEqual(richInvoice);
    });

    it("should return null when org not found", async () => {
        mockRequireInvoicingViewAccess.mockResolvedValue({
            employee: defaultEmployee,
        });
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await getInvoice(1);

        expect(result).toBeNull();
    });

    it("should return null on error", async () => {
        mockRequireInvoicingViewAccess.mockRejectedValue(new Error("fail"));

        const result = await getInvoice(1);

        expect(result).toBeNull();
    });
});

// ─── getAllInvoices ──────────────────────────────────────────────────────────

describe("getAllInvoices", () => {
    it("should return invoices on success", async () => {
        setupInvoicingMocks();
        const invoiceList = [{ id: 1 }, { id: 2 }];
        mockDbChain.then.mockImplementation(((resolve: (v: unknown) => unknown) =>
            Promise.resolve(resolve(invoiceList))) as (...a: unknown[]) => unknown);

        const result = await getAllInvoices();

        expect(result).toEqual(invoiceList);
    });

    it("should return empty array when org not found", async () => {
        mockRequireInvoicingViewAccess.mockResolvedValue({
            employee: defaultEmployee,
        });
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await getAllInvoices();

        expect(result).toEqual([]);
    });

    it("should return empty on error", async () => {
        mockRequireInvoicingViewAccess.mockRejectedValue(new Error("fail"));

        const result = await getAllInvoices();

        expect(result).toEqual([]);
    });
});

// ─── updateInvoiceStatus ────────────────────────────────────────────────────

describe("updateInvoiceStatus", () => {
    it("should update status successfully", async () => {
        setupInvoicingMocks();
        // Select chain returns row with invoice + clientName
        mockDbChain.then.mockImplementation(((resolve: (v: unknown) => unknown) =>
            Promise.resolve(resolve([{
                invoice: {
                    id: 1,
                    status: "Draft",
                    invoiceNumber: "TES-2026-0001",
                    total: "1075.00",
                    sentAt: null,
                },
                clientName: "Acme",
            }]))) as (...a: unknown[]) => unknown);

        const result = await updateInvoiceStatus(1, "Cancelled");

        expect(result).toEqual({
            success: { reason: "Status updated successfully" },
            error: null,
        });
    });

    it("should post to GL when changing to Sent", async () => {
        setupInvoicingMocks();
        mockDbChain.then.mockImplementation(((resolve: (v: unknown) => unknown) =>
            Promise.resolve(resolve([{
                invoice: {
                    id: 1,
                    status: "Draft",
                    invoiceNumber: "TES-2026-0001",
                    total: "1075.00",
                    sentAt: null,
                },
                clientName: "Acme",
            }]))) as (...a: unknown[]) => unknown);
        mockQueryFindFirst
            .mockResolvedValueOnce({ id: 10, code: "1200" })  // AR account
            .mockResolvedValueOnce({ id: 20, code: "4000" }); // Revenue account

        const result = await updateInvoiceStatus(1, "Sent");

        expect(result.success).toBeTruthy();
        expect(mockEnsureDefaultGLAccounts).toHaveBeenCalled();
        expect(mockCreateJournal).toHaveBeenCalled();
    });

    it("should return error when org not found", async () => {
        mockRequireInvoicingWriteAccess.mockResolvedValue({
            employee: defaultEmployee,
        });
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await updateInvoiceStatus(1, "Sent");

        expect(result).toEqual({
            success: null,
            error: { reason: "Organization not found" },
        });
    });

    it("should return error when invoice not found", async () => {
        setupInvoicingMocks();
        mockDbChain.then.mockImplementation(((resolve: (v: unknown) => unknown) =>
            Promise.resolve(resolve([]))) as (...a: unknown[]) => unknown);

        const result = await updateInvoiceStatus(999, "Sent");

        expect(result).toEqual({
            success: null,
            error: { reason: "Invoice not found" },
        });
    });

    it("should return error on generic failure", async () => {
        mockRequireInvoicingWriteAccess.mockRejectedValue(new Error("fail"));

        const result = await updateInvoiceStatus(1, "Sent");

        expect(result).toEqual({
            success: null,
            error: { reason: "Failed to update invoice status" },
        });
    });
});

// ─── sendInvoice ────────────────────────────────────────────────────────────

describe("sendInvoice", () => {
    it("should send invoice successfully", async () => {
        setupInvoicingMocks();
        // getInvoice call (uses db.query.receivablesInvoices.findFirst)
        mockQueryFindFirst.mockResolvedValueOnce(richInvoice);
        // GL accounts
        mockQueryFindFirst
            .mockResolvedValueOnce({ id: 10, code: "1200" })
            .mockResolvedValueOnce({ id: 20, code: "4000" });

        const result = await sendInvoice(1);

        expect(result).toEqual({
            success: { reason: "Invoice sent successfully" },
            error: null,
        });
        expect(mockGenerateInvoicePdf).toHaveBeenCalled();
        expect(mockR2Send).toHaveBeenCalled();
        expect(mockSendInvoiceEmail).toHaveBeenCalled();
    });

    it("should return error when org not found", async () => {
        mockRequireInvoicingWriteAccess.mockResolvedValue({
            employee: defaultEmployee,
        });
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await sendInvoice(1);

        expect(result).toEqual({
            success: null,
            error: { reason: "Organization not found" },
        });
    });

    it("should return error when invoice not found", async () => {
        setupInvoicingMocks();
        mockQueryFindFirst.mockResolvedValue(null);

        const result = await sendInvoice(1);

        expect(result).toEqual({
            success: null,
            error: { reason: "Invoice not found" },
        });
    });

    it("should return error for cancelled invoices", async () => {
        setupInvoicingMocks();
        mockQueryFindFirst.mockResolvedValue({
            ...richInvoice,
            status: "Cancelled",
        });

        const result = await sendInvoice(1);

        expect(result).toEqual({
            success: null,
            error: { reason: "Cannot send cancelled or paid invoices" },
        });
    });

    it("should return error on generic failure", async () => {
        mockRequireInvoicingWriteAccess.mockRejectedValue(new Error("fail"));

        const result = await sendInvoice(1);

        expect(result).toEqual({
            success: null,
            error: { reason: "Failed to send invoice" },
        });
    });
});

// ─── getInvoiceGLPostingStatus ──────────────────────────────────────────────

describe("getInvoiceGLPostingStatus", () => {
    it("should return posted status when journal exists", async () => {
        setupInvoicingMocks();
        mockQueryFindFirst.mockResolvedValue({
            postingDate: "2026-02-01",
            journalNumber: "JRN-0001",
        });

        const result = await getInvoiceGLPostingStatus(1);

        expect(result).toEqual({
            posted: true,
            postedAt: "2026-02-01",
            journalNumber: "JRN-0001",
        });
    });

    it("should return not posted when no journal", async () => {
        setupInvoicingMocks();
        mockQueryFindFirst.mockResolvedValue(null);

        const result = await getInvoiceGLPostingStatus(1);

        expect(result).toEqual({ posted: false });
    });

    it("should return null when org not found", async () => {
        mockRequireInvoicingViewAccess.mockResolvedValue({
            employee: defaultEmployee,
        });
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await getInvoiceGLPostingStatus(1);

        expect(result).toBeNull();
    });

    it("should return null on error", async () => {
        mockRequireInvoicingViewAccess.mockRejectedValue(new Error("fail"));

        const result = await getInvoiceGLPostingStatus(1);

        expect(result).toBeNull();
    });
});

// ─── postInvoiceToGL ────────────────────────────────────────────────────────

describe("postInvoiceToGL", () => {
    it("should post invoice to GL successfully", async () => {
        setupInvoicingMocks();
        // getInvoice: returns sent invoice
        mockQueryFindFirst
            .mockResolvedValueOnce({ ...richInvoice, status: "Sent" })
            // existing GL journal: none
            .mockResolvedValueOnce(null)
            // AR account
            .mockResolvedValueOnce({ id: 10, code: "1200" })
            // Revenue account
            .mockResolvedValueOnce({ id: 20, code: "4000" });

        const result = await postInvoiceToGL(1);

        expect(result).toEqual({ success: true });
        expect(mockCreateJournal).toHaveBeenCalled();
    });

    it("should return already posted when journal exists", async () => {
        setupInvoicingMocks();
        mockQueryFindFirst
            .mockResolvedValueOnce({ ...richInvoice, status: "Sent" })
            .mockResolvedValueOnce({ id: 99 }); // existing journal

        const result = await postInvoiceToGL(1);

        expect(result).toEqual({ success: true, alreadyPosted: true });
    });

    it("should return error for draft invoices", async () => {
        setupInvoicingMocks();
        mockQueryFindFirst.mockResolvedValue({
            ...richInvoice,
            status: "Draft",
        });

        const result = await postInvoiceToGL(1);

        expect(result).toEqual({
            success: false,
            error: "Only sent, partially paid, or paid invoices can be posted to the GL.",
        });
    });

    it("should return error when org not found", async () => {
        mockRequireInvoicingWriteAccess.mockResolvedValue({
            employee: defaultEmployee,
        });
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await postInvoiceToGL(1);

        expect(result).toEqual({
            success: false,
            error: "Organization not found",
        });
    });

    it("should return error when GL accounts missing", async () => {
        setupInvoicingMocks();
        mockQueryFindFirst
            .mockResolvedValueOnce({ ...richInvoice, status: "Sent" })
            .mockResolvedValueOnce(null) // no existing journal
            .mockResolvedValueOnce(null) // no AR account
            .mockResolvedValueOnce(null); // no Revenue account

        const result = await postInvoiceToGL(1);

        expect(result).toEqual({
            success: false,
            error: "GL accounts 1200 or 4000 not found.",
        });
    });

    it("should return error on generic failure", async () => {
        mockRequireInvoicingWriteAccess.mockRejectedValue(new Error("explode"));

        const result = await postInvoiceToGL(1);

        expect(result).toEqual({
            success: false,
            error: "explode",
        });
    });
});

// ─── remindInvoice ──────────────────────────────────────────────────────────

describe("remindInvoice", () => {
    it("should send reminder successfully", async () => {
        setupInvoicingMocks();
        mockQueryFindFirst.mockResolvedValue(richInvoice);

        const result = await remindInvoice(1);

        expect(result).toEqual({
            success: { reason: "Reminder sent successfully" },
            error: null,
        });
        expect(mockGenerateInvoicePdf).toHaveBeenCalled();
        expect(mockSendInvoiceEmail).toHaveBeenCalled();
    });

    it("should return error when org not found", async () => {
        mockRequireInvoicingWriteAccess.mockResolvedValue({
            employee: defaultEmployee,
        });
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await remindInvoice(1);

        expect(result).toEqual({
            success: null,
            error: { reason: "Organization not found" },
        });
    });

    it("should return error when invoice not found", async () => {
        setupInvoicingMocks();
        mockQueryFindFirst.mockResolvedValue(null);

        const result = await remindInvoice(1);

        expect(result).toEqual({
            success: null,
            error: { reason: "Invoice not found" },
        });
    });

    it("should return error for draft invoices", async () => {
        setupInvoicingMocks();
        mockQueryFindFirst.mockResolvedValue({
            ...richInvoice,
            status: "Draft",
        });

        const result = await remindInvoice(1);

        expect(result).toEqual({
            success: null,
            error: {
                reason: "Can only remind for Sent, Overdue or Partial invoices",
            },
        });
    });

    it("should return error on generic failure", async () => {
        mockRequireInvoicingWriteAccess.mockRejectedValue(new Error("fail"));

        const result = await remindInvoice(1);

        expect(result).toEqual({
            success: null,
            error: { reason: "Failed to send reminder" },
        });
    });
});
