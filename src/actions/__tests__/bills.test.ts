import { describe, it, expect, vi } from "vitest";
import {
    mockRequirePayablesViewAccess,
    mockRequirePayablesWriteAccess,
    mockRequirePayablesApprovalAccess,
    mockGetFullOrganization,
    mockDbChain,
    mockTransaction,
    mockQueryFindFirst,
    mockQueryFindMany,
    mockCreateJournal,
    mockEnsureDefaultGLAccounts,
    mockCalculateBillAmounts,
    mockGenerateDuplicateCheckHash,
    mockCalculateDuplicateSimilarity,
    mockUpdatePOBilledAmount,
    mockSendBillReceivedConfirmationEmail,
    mockCalculateStringSimilarity,
    DEFAULT_USER_ID,
    DEFAULT_ORG_ID,
} from "./helpers/setup";

// Import the functions under test
import {
    generateBillNumber,
    checkForDuplicateBill,
    createBill,
    updateBill,
    deleteBill,
    getBill,
    getAllBills,
    updateBillStatus,
    approveBill,
    getBillGLPostingStatus,
    postBillToGL,
    matchBillToPO,
    sendBillReceivedConfirmation,
} from "@/actions/payables/bills";

// ─── Helpers ────────────────────────────────────────────────────────────────

const defaultOrg = {
    id: DEFAULT_ORG_ID,
    name: "Test Org",
    slug: "testorg",
};

const defaultAccess = { userId: DEFAULT_USER_ID };

function setupPayablesMocks() {
    mockRequirePayablesViewAccess.mockResolvedValue(defaultAccess);
    mockRequirePayablesWriteAccess.mockResolvedValue(defaultAccess);
    mockRequirePayablesApprovalAccess.mockResolvedValue(defaultAccess);
    mockGetFullOrganization.mockResolvedValue(defaultOrg);
}

function resolveChain(value: unknown) {
    mockDbChain.then.mockImplementation(((resolve: (v: unknown) => unknown) =>
        Promise.resolve(resolve(value))) as (...a: unknown[]) => unknown);
}

const sampleBillInput = {
    vendorInvoiceNumber: "VINV-001",
    vendorId: 1,
    billDate: "2026-02-01",
    dueDate: "2026-03-01",
    receivedDate: "2026-02-01",
    currencyId: 1,
    lineItems: [{ description: "Item A", quantity: 2, unitPrice: 1000 }],
    taxes: [{ taxName: "VAT", taxPercentage: 7.5, taxType: "VAT" as const, isWithholdingTax: false }],
};

/** Rich bill returned by getBill (via db.query) */
const richBill = {
    id: 1,
    billNumber: "BILL-2026-0001",
    vendorInvoiceNumber: "VINV-001",
    vendorId: 1,
    poId: null,
    status: "Draft",
    total: "2150.00",
    amountDue: "2150.00",
    dueDate: "2026-03-01",
    organizationId: DEFAULT_ORG_ID,
    vendor: { name: "Vendor Co", email: "vendor@test.com" },
    lineItems: [
        {
            id: 10,
            description: "Item A",
            quantity: "2",
            unitPrice: "1000.00",
            amount: "2000.00",
        },
    ],
    taxes: [],
    payments: [],
    documents: [],
    activityLog: [],
};

// ─── generateBillNumber ─────────────────────────────────────────────────────

describe("generateBillNumber", () => {
    it("should return first bill number when none exist", async () => {
        mockGetFullOrganization.mockResolvedValue(defaultOrg);
        resolveChain([]);

        const result = await generateBillNumber();
        const year = new Date().getFullYear();
        expect(result).toBe(`BILL-${year}-0001`);
    });

    it("should increment existing bill number", async () => {
        mockGetFullOrganization.mockResolvedValue(defaultOrg);
        const year = new Date().getFullYear();
        resolveChain([{ billNumber: `BILL-${year}-0005` }]);

        const result = await generateBillNumber();
        expect(result).toBe(`BILL-${year}-0006`);
    });

    it("should return null when org not found", async () => {
        mockGetFullOrganization.mockResolvedValue(null);
        const result = await generateBillNumber();
        expect(result).toBeNull();
    });

    it("should return null on error", async () => {
        mockGetFullOrganization.mockRejectedValue(new Error("fail"));
        const result = await generateBillNumber();
        expect(result).toBeNull();
    });
});

// ─── checkForDuplicateBill ──────────────────────────────────────────────────

describe("checkForDuplicateBill", () => {
    it("should detect exact duplicate by hash", async () => {
        setupPayablesMocks();
        // checkForDuplicateBill uses db.select().from(payablesBills) — chain mock
        resolveChain([
            {
                id: 5,
                billNumber: "BILL-2026-0003",
                vendorInvoiceNumber: "VINV-001",
                total: "2150.00",
                billDate: "2026-02-01",
                status: "Draft",
            },
        ]);

        const result = await checkForDuplicateBill(1, "VINV-001", 2150, "2026-02-01");

        expect(result.isDuplicate).toBe(true);
        expect(result.confidence).toBe("high");
    });

    it("should detect medium confidence duplicate by similar amount and date", async () => {
        setupPayablesMocks();
        // First chain call = exact match (returns empty = no exact match)
        // Second chain call = similar match (returns result)
        let chainCallCount = 0;
        mockDbChain.then.mockImplementation(((resolve: (v: unknown) => unknown) => {
            chainCallCount++;
            if (chainCallCount === 1) {
                // Exact match query returns nothing
                return Promise.resolve(resolve([]));
            }
            // Similar match query returns a similar bill
            return Promise.resolve(resolve([{
                id: 7,
                billNumber: "BILL-2026-0010",
                vendorInvoiceNumber: "VINV-099",
                vendorId: 1,
                total: "2160.00",
                billDate: "2026-02-05",
                status: "Approved",
            }]));
        }) as (...a: unknown[]) => unknown);

        mockCalculateDuplicateSimilarity.mockReturnValue({ similarity: 0.85 });

        const result = await checkForDuplicateBill(1, "VINV-NEW", 2150, "2026-02-01");

        expect(result.isDuplicate).toBe(true);
        expect(result.confidence).toBe("medium");
        expect(result.matches[0].similarity).toBe(0.85);
        expect(result.matches[0].reason).toContain("Similar amount");
    });

    it("should return no duplicate when none found", async () => {
        setupPayablesMocks();
        // Both exact and similar matches return empty via chain mock (default [])
        const result = await checkForDuplicateBill(1, "VINV-UNIQUE", 9999, "2026-06-01");

        expect(result.isDuplicate).toBe(false);
        expect(result.matches).toHaveLength(0);
    });

    it("should return null-like on error", async () => {
        setupPayablesMocks();
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await checkForDuplicateBill(1, "VINV-001", 2150, "2026-02-01");

        expect(result).toEqual({
            isDuplicate: false,
            confidence: "low",
            matches: [],
        });
    });
});

// ─── createBill ─────────────────────────────────────────────────────────────

describe("createBill", () => {
    it("should create bill successfully", async () => {
        setupPayablesMocks();
        mockCalculateBillAmounts.mockReturnValue({
            subtotal: 2000, taxAmount: 150, total: 2150,
        });
        // createBill uses the chain for: vendor lookup, then generateBillNumber
        // Both go through db.select().from() — chain mock
        let chainCallCount = 0;
        mockDbChain.then.mockImplementation(((resolve: (v: unknown) => unknown) => {
            chainCallCount++;
            if (chainCallCount === 1) {
                // Vendor lookup
                return Promise.resolve(resolve([{ id: 1, name: "Vendor Co" }]));
            }
            // generateBillNumber → no existing bills
            return Promise.resolve(resolve([]));
        }) as (...a: unknown[]) => unknown);
        // Transaction mock
        mockTransaction.mockImplementation(async (cb: (tx: unknown) => unknown) => {
            const tx = {
                insert: vi.fn().mockReturnValue({
                    values: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([{
                            id: 1, billNumber: "BILL-2026-0001",
                            vendorInvoiceNumber: "VINV-001", total: "2150.00",
                        }]),
                    }),
                }),
            };
            return cb(tx);
        });
        // GL posting after create: AP account + Expense account lookups
        mockQueryFindFirst
            .mockResolvedValueOnce({ id: 10, code: "2000" })   // AP account
            .mockResolvedValueOnce({ id: 20, code: "6000" });  // Expense account

        const result = await createBill(sampleBillInput);

        expect(result.error).toBeNull();
        expect(result.success).toBeTruthy();
        // Verify GL posting side-effects
        expect(mockEnsureDefaultGLAccounts).toHaveBeenCalledWith(DEFAULT_ORG_ID);
        expect(mockCreateJournal).toHaveBeenCalled();
    });

    it("should return error when org not found", async () => {
        mockRequirePayablesWriteAccess.mockResolvedValue(defaultAccess);
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await createBill(sampleBillInput);

        expect(result).toEqual({
            success: null,
            error: { reason: "Organization not found" },
        });
    });

    it("should return error when vendor not found", async () => {
        setupPayablesMocks();
        resolveChain([]);

        const result = await createBill(sampleBillInput);

        expect(result).toEqual({
            success: null,
            error: { reason: "Vendor not found" },
        });
    });

    it("should return error on generic failure", async () => {
        mockRequirePayablesWriteAccess.mockRejectedValue(new Error("fail"));

        const result = await createBill(sampleBillInput);

        expect(result).toEqual({
            success: null,
            error: { reason: "Failed to create bill" },
        });
    });
});

// ─── updateBill ─────────────────────────────────────────────────────────────

describe("updateBill", () => {
    it("should update bill successfully", async () => {
        setupPayablesMocks();
        resolveChain([{ id: 1, status: "Draft" }]);
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

        const result = await updateBill(1, { notes: "Updated" });

        expect(result.error).toBeNull();
        expect(result.success).toBeTruthy();
    });

    it("should return error when org not found", async () => {
        mockRequirePayablesWriteAccess.mockResolvedValue(defaultAccess);
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await updateBill(1, {});

        expect(result).toEqual({
            success: null,
            error: { reason: "Organization not found" },
        });
    });

    it("should return error when bill not found", async () => {
        setupPayablesMocks();
        resolveChain([]);

        const result = await updateBill(999, {});

        expect(result).toEqual({
            success: null,
            error: { reason: "Bill not found" },
        });
    });

    it("should return error when bill is not a draft", async () => {
        setupPayablesMocks();
        resolveChain([{ id: 1, status: "Approved" }]);

        const result = await updateBill(1, {});

        expect(result).toEqual({
            success: null,
            error: { reason: "Only draft bills can be edited" },
        });
    });

    it("should return error on generic failure", async () => {
        mockRequirePayablesWriteAccess.mockRejectedValue(new Error("fail"));

        const result = await updateBill(1, {});

        expect(result).toEqual({
            success: null,
            error: { reason: "Failed to update bill" },
        });
    });
});

// ─── deleteBill ─────────────────────────────────────────────────────────────

describe("deleteBill", () => {
    it("should delete a draft bill successfully", async () => {
        setupPayablesMocks();
        resolveChain([{ id: 1, status: "Draft", poId: null, vendorId: 1 }]);

        const result = await deleteBill(1);

        expect(result).toEqual({
            success: { reason: "Bill deleted successfully" },
            error: null,
        });
    });

    it("should update PO billed amount when bill has poId", async () => {
        setupPayablesMocks();
        resolveChain([{ id: 1, status: "Draft", poId: 5, vendorId: 1 }]);

        await deleteBill(1);

        expect(mockUpdatePOBilledAmount).toHaveBeenCalledWith(5);
    });

    it("should return error when org not found", async () => {
        mockRequirePayablesWriteAccess.mockResolvedValue(defaultAccess);
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await deleteBill(1);

        expect(result).toEqual({
            success: null,
            error: { reason: "Organization not found" },
        });
    });

    it("should return error when bill not found", async () => {
        setupPayablesMocks();
        resolveChain([]);

        const result = await deleteBill(999);

        expect(result).toEqual({
            success: null,
            error: { reason: "Bill not found" },
        });
    });

    it("should return error when bill is not a draft", async () => {
        setupPayablesMocks();
        resolveChain([{ id: 1, status: "Approved", poId: null, vendorId: 1 }]);

        const result = await deleteBill(1);

        expect(result).toEqual({
            success: null,
            error: {
                reason: "Only draft bills can be deleted. Cancel this bill instead.",
            },
        });
    });

    it("should return error on generic failure", async () => {
        mockRequirePayablesWriteAccess.mockRejectedValue(new Error("fail"));

        const result = await deleteBill(1);

        expect(result).toEqual({
            success: null,
            error: { reason: "Failed to delete bill" },
        });
    });
});

// ─── getBill ────────────────────────────────────────────────────────────────

describe("getBill", () => {
    it("should return bill on success", async () => {
        setupPayablesMocks();
        mockQueryFindFirst.mockResolvedValueOnce(richBill);

        const result = await getBill(1);

        expect(result).toEqual({ ...richBill, purchaseOrder: null });
    });

    it("should return null when org not found", async () => {
        mockRequirePayablesViewAccess.mockResolvedValue(defaultAccess);
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await getBill(1);

        expect(result).toBeNull();
    });

    it("should return null on error", async () => {
        mockRequirePayablesViewAccess.mockRejectedValue(new Error("fail"));

        const result = await getBill(1);

        expect(result).toBeNull();
    });
});

// ─── getAllBills ─────────────────────────────────────────────────────────────

describe("getAllBills", () => {
    it("should return bills on success", async () => {
        setupPayablesMocks();
        const billList = [{ id: 1 }, { id: 2 }];
        resolveChain(billList);

        const result = await getAllBills();

        expect(result).toEqual(billList);
    });

    it("should return empty array when org not found", async () => {
        mockRequirePayablesViewAccess.mockResolvedValue(defaultAccess);
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await getAllBills();

        expect(result).toEqual([]);
    });

    it("should return empty on error", async () => {
        mockRequirePayablesViewAccess.mockRejectedValue(new Error("fail"));

        const result = await getAllBills();

        expect(result).toEqual([]);
    });
});

// ─── updateBillStatus ───────────────────────────────────────────────────────

describe("updateBillStatus", () => {
    it("should update status successfully", async () => {
        setupPayablesMocks();
        resolveChain([{
            id: 1,
            status: "Draft",
            billNumber: "BILL-2026-0001",
            total: "2150.00",
            poId: null,
            vendorId: 1,
        }]);

        const result = await updateBillStatus(1, "Cancelled");

        expect(result).toEqual({
            success: { reason: "Bill status updated successfully" },
            error: null,
        });
    });

    it("should return error when org not found", async () => {
        mockRequirePayablesWriteAccess.mockResolvedValue(defaultAccess);
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await updateBillStatus(1, "Approved");

        expect(result).toEqual({
            success: null,
            error: { reason: "Organization not found" },
        });
    });

    it("should return error when bill not found", async () => {
        setupPayablesMocks();
        resolveChain([]);

        const result = await updateBillStatus(999, "Approved");

        expect(result).toEqual({
            success: null,
            error: { reason: "Bill not found" },
        });
    });

    it("should return error on generic failure", async () => {
        mockRequirePayablesWriteAccess.mockRejectedValue(new Error("fail"));

        const result = await updateBillStatus(1, "Approved");

        expect(result).toEqual({
            success: null,
            error: { reason: "Failed to update bill status" },
        });
    });
});

// ─── approveBill ────────────────────────────────────────────────────────────

describe("approveBill", () => {
    it("should approve bill successfully", async () => {
        setupPayablesMocks();
        resolveChain([{
            id: 1,
            status: "Pending",
            billNumber: "BILL-2026-0001",
            total: "2150.00",
            poId: null,
            vendorId: 1,
        }]);
        // GL accounts for auto-posting: existingJournal check -> AP -> Expense -> vendor
        mockQueryFindFirst
            .mockResolvedValueOnce(null)                       // no existing journal
            .mockResolvedValueOnce({ id: 10, code: "2000" })   // AP account
            .mockResolvedValueOnce({ id: 20, code: "6000" });  // Expense account

        const result = await approveBill(1);

        expect(result).toEqual({
            success: { reason: "Bill approved successfully" },
            error: null,
        });
    });

    it("should return error when org not found", async () => {
        mockRequirePayablesApprovalAccess.mockResolvedValue(defaultAccess);
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await approveBill(1);

        expect(result).toEqual({
            success: null,
            error: { reason: "Organization not found" },
        });
    });

    it("should return error when bill not found", async () => {
        setupPayablesMocks();
        resolveChain([]);

        const result = await approveBill(999);

        expect(result).toEqual({
            success: null,
            error: { reason: "Bill not found" },
        });
    });

    it("should return error when bill already approved", async () => {
        setupPayablesMocks();
        resolveChain([{ id: 1, status: "Approved" }]);

        const result = await approveBill(1);

        expect(result).toEqual({
            success: null,
            error: { reason: "Only pending or draft bills can be approved" },
        });
    });

    it("should return error when bill is cancelled", async () => {
        setupPayablesMocks();
        resolveChain([{ id: 1, status: "Cancelled" }]);

        const result = await approveBill(1);

        expect(result).toEqual({
            success: null,
            error: { reason: "Only pending or draft bills can be approved" },
        });
    });

    it("should return error on generic failure", async () => {
        mockRequirePayablesApprovalAccess.mockRejectedValue(new Error("fail"));

        const result = await approveBill(1);

        expect(result).toEqual({
            success: null,
            error: { reason: "Failed to approve bill" },
        });
    });
});

// ─── getBillGLPostingStatus ─────────────────────────────────────────────────

describe("getBillGLPostingStatus", () => {
    it("should return posted status when journal exists", async () => {
        setupPayablesMocks();
        mockQueryFindFirst.mockResolvedValueOnce({
            postingDate: "2026-02-01",
            journalNumber: "JRN-0001",
        });

        const result = await getBillGLPostingStatus(1);

        expect(result).toEqual({
            posted: true,
            postedAt: "2026-02-01",
            journalNumber: "JRN-0001",
        });
    });

    it("should return not posted when no journal", async () => {
        setupPayablesMocks();
        mockQueryFindFirst.mockResolvedValueOnce(null);

        const result = await getBillGLPostingStatus(1);

        expect(result).toEqual({ posted: false });
    });

    it("should return null when org not found", async () => {
        mockRequirePayablesViewAccess.mockResolvedValue(defaultAccess);
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await getBillGLPostingStatus(1);

        expect(result).toBeNull();
    });

    it("should return null on error", async () => {
        mockRequirePayablesViewAccess.mockRejectedValue(new Error("fail"));

        const result = await getBillGLPostingStatus(1);

        expect(result).toBeNull();
    });
});

// ─── postBillToGL ───────────────────────────────────────────────────────────

describe("postBillToGL", () => {
    it("should post bill to GL successfully", async () => {
        setupPayablesMocks();
        // postBillToGL uses db.select().from(payablesBills) for bill lookup
        // AND db.select().from(vendors) for vendor lookup — both use chain
        let chainCallCount = 0;
        mockDbChain.then.mockImplementation(((resolve: (v: unknown) => unknown) => {
            chainCallCount++;
            if (chainCallCount === 1) {
                // Bill lookup
                return Promise.resolve(resolve([{ ...richBill, status: "Approved" }]));
            }
            // Vendor lookup
            return Promise.resolve(resolve([{ name: "Vendor Co" }]));
        }) as (...a: unknown[]) => unknown);
        // existing GL journal: none, then AP account, then Expense account
        mockQueryFindFirst
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ id: 10, code: "2000" })
            .mockResolvedValueOnce({ id: 20, code: "6000" });

        const result = await postBillToGL(1);

        expect(result).toEqual({ success: true });
        expect(mockCreateJournal).toHaveBeenCalled();
    });

    it("should return already posted when journal exists", async () => {
        setupPayablesMocks();
        resolveChain([{ ...richBill, status: "Approved" }]);
        // existing journal found
        mockQueryFindFirst.mockResolvedValueOnce({ id: 99 });

        const result = await postBillToGL(1);

        expect(result).toEqual({ success: true, alreadyPosted: true });
    });

    it("should return error for draft bills", async () => {
        setupPayablesMocks();
        resolveChain([{ ...richBill, status: "Draft" }]);

        const result = await postBillToGL(1);

        expect(result).toEqual({
            success: false,
            error: "Only approved, partially paid, or paid bills can be posted to the GL.",
        });
    });

    it("should return error when org not found", async () => {
        mockRequirePayablesWriteAccess.mockResolvedValue(defaultAccess);
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await postBillToGL(1);

        expect(result).toEqual({
            success: false,
            error: "Organization not found",
        });
    });

    it("should return error when GL accounts missing", async () => {
        setupPayablesMocks();
        resolveChain([{ ...richBill, status: "Approved" }]);
        mockQueryFindFirst
            .mockResolvedValueOnce(null)  // no existing journal
            .mockResolvedValueOnce(null)  // no AP account
            .mockResolvedValueOnce(null); // no Expense account

        const result = await postBillToGL(1);

        expect(result).toEqual({
            success: false,
            error: "GL accounts 2000 or 6000 not found.",
        });
    });

    it("should return error on generic failure", async () => {
        mockRequirePayablesWriteAccess.mockRejectedValue(new Error("explode"));

        const result = await postBillToGL(1);

        expect(result).toEqual({
            success: false,
            error: "explode",
        });
    });
});

// ─── matchBillToPO ──────────────────────────────────────────────────────────

describe("matchBillToPO", () => {
    it("should match bill to PO successfully", async () => {
        setupPayablesMocks();
        // PO query then Bill query (both use db.query.*.findFirst)
        mockQueryFindFirst
            .mockResolvedValueOnce({
                id: 5,
                poNumber: "PO-001",
                lineItems: [{
                    id: 100,
                    description: "Item A",
                }],
            })
            .mockResolvedValueOnce({
                id: 1,
                lineItems: [{
                    id: 10,
                    description: "Item A",
                    quantity: "2",
                }],
            });
        mockCalculateStringSimilarity.mockReturnValue(0.95);

        const result = await matchBillToPO(1, 5);

        expect(result).toEqual({
            success: { reason: "Bill matched to PO successfully" },
            error: null,
        });
        expect(mockUpdatePOBilledAmount).toHaveBeenCalledWith(5);
        // Verify transaction was called with line item updates
        const txCb = mockTransaction.mock.calls[0][0];
        const txMock = {
            update: vi.fn().mockReturnValue({
                set: vi.fn().mockReturnValue({
                    where: vi.fn().mockResolvedValue(undefined),
                }),
            }),
            insert: vi.fn().mockReturnValue({
                values: vi.fn().mockResolvedValue(undefined),
            }),
        };
        await txCb(txMock);
        // update is called 3 times: bill PO ref, bill line item, PO line item billedQuantity
        expect(txMock.update).toHaveBeenCalledTimes(3);
    });

    it("should return error when PO not found", async () => {
        setupPayablesMocks();
        mockQueryFindFirst.mockResolvedValueOnce(null);

        const result = await matchBillToPO(1, 999);

        expect(result).toEqual({
            success: null,
            error: { reason: "Purchase order not found" },
        });
    });

    it("should return error when bill not found", async () => {
        setupPayablesMocks();
        mockQueryFindFirst
            .mockResolvedValueOnce({ id: 5, poNumber: "PO-001", lineItems: [] })
            .mockResolvedValueOnce(null); // bill not found

        const result = await matchBillToPO(999, 5);

        expect(result).toEqual({
            success: null,
            error: { reason: "Bill not found" },
        });
    });

    it("should return error when org not found", async () => {
        mockRequirePayablesWriteAccess.mockResolvedValue(defaultAccess);
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await matchBillToPO(1, 5);

        expect(result).toEqual({
            success: null,
            error: { reason: "Organization not found" },
        });
    });

    it("should return error on generic failure", async () => {
        mockRequirePayablesWriteAccess.mockRejectedValue(new Error("fail"));

        const result = await matchBillToPO(1, 5);

        expect(result).toEqual({
            success: null,
            error: { reason: "Failed to match bill to PO" },
        });
    });
});

// ─── sendBillReceivedConfirmation ───────────────────────────────────────────

describe("sendBillReceivedConfirmation", () => {
    it("should send confirmation email successfully", async () => {
        setupPayablesMocks();
        mockQueryFindFirst.mockResolvedValueOnce(richBill);

        const result = await sendBillReceivedConfirmation(1);

        expect(result).toEqual({
            success: { reason: "Confirmation email sent successfully" },
            error: null,
        });
        expect(mockSendBillReceivedConfirmationEmail).toHaveBeenCalled();
    });

    it("should return error when org not found", async () => {
        mockRequirePayablesWriteAccess.mockResolvedValue(defaultAccess);
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await sendBillReceivedConfirmation(1);

        expect(result).toEqual({
            success: null,
            error: { reason: "Organization not found" },
        });
    });

    it("should return error when bill not found", async () => {
        setupPayablesMocks();
        mockQueryFindFirst.mockResolvedValueOnce(null);

        const result = await sendBillReceivedConfirmation(1);

        expect(result).toEqual({
            success: null,
            error: { reason: "Bill not found" },
        });
    });

    it("should return error on generic failure", async () => {
        mockRequirePayablesWriteAccess.mockRejectedValue(new Error("fail"));

        const result = await sendBillReceivedConfirmation(1);

        expect(result).toEqual({
            success: null,
            error: { reason: "Failed to send confirmation email" },
        });
    });
});
