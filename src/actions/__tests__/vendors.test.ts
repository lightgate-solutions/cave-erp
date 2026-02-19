import { describe, it, expect, vi } from "vitest";
import {
    mockRequirePayablesViewAccess,
    mockRequirePayablesWriteAccess,
    mockGetFullOrganization,
    mockDbChain,
    mockTransaction,
    mockQueryFindFirst,
    mockRevalidatePath,
    queueDbResult,
    DEFAULT_USER_ID,
    DEFAULT_ORG_ID,
} from "./helpers/setup";

import {
    generateVendorCode,
    createVendor,
    updateVendor,
    deleteVendor,
    getVendor,
    getAllVendors,
    getVendorBills,
    getVendorStats,
} from "@/actions/payables/vendors";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const defaultOrg = {
    id: DEFAULT_ORG_ID,
    name: "Test Org",
    slug: "testorg",
};

const defaultAccess = { userId: DEFAULT_USER_ID };

function setupPayablesMocks() {
    mockRequirePayablesViewAccess.mockResolvedValue(defaultAccess);
    mockRequirePayablesWriteAccess.mockResolvedValue(defaultAccess);
    mockGetFullOrganization.mockResolvedValue(defaultOrg);
}

const sampleVendorInput = {
    name: "Acme Corp",
    email: "acme@example.com",
    category: "Goods" as const,
};

const sampleVendor = {
    id: 1,
    vendorCode: `VEN-${new Date().getFullYear()}-0001`,
    name: "Acme Corp",
    email: "acme@example.com",
    category: "Goods",
    status: "Active",
    organizationId: DEFAULT_ORG_ID,
    contacts: [],
    bankAccounts: [],
};

// ─── generateVendorCode ───────────────────────────────────────────────────────

describe("generateVendorCode", () => {
    const year = new Date().getFullYear();

    it("should return first code when no vendors exist", async () => {
        mockGetFullOrganization.mockResolvedValue(defaultOrg);
        queueDbResult([]); // latest vendor query returns empty

        const result = await generateVendorCode();

        expect(result).toBe(`VEN-${year}-0001`);
    });

    it("should increment existing vendor code", async () => {
        mockGetFullOrganization.mockResolvedValue(defaultOrg);
        queueDbResult([{ vendorCode: `VEN-${year}-0005`, createdAt: new Date() }]);

        const result = await generateVendorCode();

        expect(result).toBe(`VEN-${year}-0006`);
    });

    it("should return null when org not found", async () => {
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await generateVendorCode();

        expect(result).toBeNull();
    });

    it("should return null on error", async () => {
        mockGetFullOrganization.mockRejectedValue(new Error("fail"));

        const result = await generateVendorCode();

        expect(result).toBeNull();
    });
});

// ─── createVendor ─────────────────────────────────────────────────────────────

describe("createVendor", () => {
    it("should create vendor successfully", async () => {
        setupPayablesMocks();

        // generateVendorCode → latest vendor query
        queueDbResult([]);

        // Transaction: insert vendor returns new vendor
        mockTransaction.mockImplementation(async (cb: (tx: unknown) => unknown) => {
            const tx = {
                insert: vi.fn().mockReturnValue({
                    values: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([sampleVendor]),
                    }),
                }),
            };
            return cb(tx);
        });

        const result = await createVendor(sampleVendorInput);

        expect(result.error).toBeNull();
        expect(result.success).toBeTruthy();
        expect(result.success?.data).toMatchObject({ name: "Acme Corp" });
        expect(mockRevalidatePath).toHaveBeenCalledWith("/payables/vendors");
    });

    it("should create vendor with contacts and bank accounts", async () => {
        setupPayablesMocks();
        queueDbResult([]); // generateVendorCode

        mockTransaction.mockImplementation(async (cb: (tx: unknown) => unknown) => {
            const tx = {
                insert: vi.fn().mockReturnValue({
                    values: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([sampleVendor]),
                    }),
                }),
            };
            return cb(tx);
        });

        const result = await createVendor({
            ...sampleVendorInput,
            contacts: [{ name: "Jane Doe", email: "jane@acme.com", isPrimary: true }],
            bankAccounts: [{
                accountName: "Acme Checking",
                bankName: "First Bank",
                accountNumber: "1234567890",
                currency: "USD",
                isDefault: true,
                isActive: true,
            }],
        });

        expect(result.error).toBeNull();
        expect(result.success).toBeTruthy();
    });

    it("should return error when org not found", async () => {
        mockRequirePayablesWriteAccess.mockResolvedValue(defaultAccess);
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await createVendor(sampleVendorInput);

        expect(result).toEqual({
            success: null,
            error: { reason: "Organization not found" },
        });
    });

    it("should return error when vendor code generation fails", async () => {
        setupPayablesMocks();
        // generateVendorCode → org not found internally
        mockGetFullOrganization
            .mockResolvedValueOnce(defaultOrg)  // first call (createVendor itself)
            .mockResolvedValueOnce(null);       // second call (generateVendorCode)

        const result = await createVendor(sampleVendorInput);

        expect(result).toEqual({
            success: null,
            error: { reason: "Failed to generate vendor code" },
        });
    });

    it("should return error on generic failure", async () => {
        mockRequirePayablesWriteAccess.mockRejectedValue(new Error("fail"));

        const result = await createVendor(sampleVendorInput);

        expect(result).toEqual({
            success: null,
            error: { reason: "Failed to create vendor" },
        });
    });
});

// ─── updateVendor ─────────────────────────────────────────────────────────────

describe("updateVendor", () => {
    it("should update vendor successfully", async () => {
        setupPayablesMocks();
        // existing vendor check
        queueDbResult([sampleVendor]);
        // update returns updated vendor
        queueDbResult([{ ...sampleVendor, name: "Acme Corp Updated" }]);

        const result = await updateVendor(1, { name: "Acme Corp Updated" });

        expect(result.error).toBeNull();
        expect(result.success).toBeTruthy();
        expect(result.success?.data).toMatchObject({ name: "Acme Corp Updated" });
        expect(mockRevalidatePath).toHaveBeenCalledWith("/payables/vendors");
        expect(mockRevalidatePath).toHaveBeenCalledWith("/payables/vendors/1");
    });

    it("should return error when org not found", async () => {
        mockRequirePayablesWriteAccess.mockResolvedValue(defaultAccess);
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await updateVendor(1, { name: "Updated" });

        expect(result).toEqual({
            success: null,
            error: { reason: "Organization not found" },
        });
    });

    it("should return error when vendor not found", async () => {
        setupPayablesMocks();
        queueDbResult([]); // no existing vendor

        const result = await updateVendor(999, { name: "Ghost" });

        expect(result).toEqual({
            success: null,
            error: { reason: "Vendor not found" },
        });
    });

    it("should return error on generic failure", async () => {
        mockRequirePayablesWriteAccess.mockRejectedValue(new Error("fail"));

        const result = await updateVendor(1, {});

        expect(result).toEqual({
            success: null,
            error: { reason: "Failed to update vendor" },
        });
    });
});

// ─── deleteVendor ─────────────────────────────────────────────────────────────

describe("deleteVendor", () => {
    it("should hard delete vendor when no bills exist", async () => {
        setupPayablesMocks();
        // bill count query
        queueDbResult([{ count: 0 }]);
        // hard delete
        queueDbResult([]);

        const result = await deleteVendor(1);

        expect(result).toEqual({
            success: { reason: "Vendor deleted successfully" },
            error: null,
        });
        expect(mockRevalidatePath).toHaveBeenCalledWith("/payables/vendors");
    });

    it("should soft delete (mark inactive) when vendor has bills", async () => {
        setupPayablesMocks();
        // bill count query — vendor has bills
        queueDbResult([{ count: 3 }]);
        // soft delete (update status to Inactive)
        queueDbResult([]);

        const result = await deleteVendor(1);

        expect(result).toEqual({
            success: { reason: "Vendor has bills. Marked as inactive instead." },
            error: null,
        });
        expect(mockRevalidatePath).toHaveBeenCalledWith("/payables/vendors");
    });

    it("should return error when org not found", async () => {
        mockRequirePayablesWriteAccess.mockResolvedValue(defaultAccess);
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await deleteVendor(1);

        expect(result).toEqual({
            success: null,
            error: { reason: "Organization not found" },
        });
    });

    it("should return error on generic failure", async () => {
        mockRequirePayablesWriteAccess.mockRejectedValue(new Error("fail"));

        const result = await deleteVendor(1);

        expect(result).toEqual({
            success: null,
            error: { reason: "Failed to delete vendor" },
        });
    });
});

// ─── getVendor ────────────────────────────────────────────────────────────────

describe("getVendor", () => {
    it("should return vendor with stats on success", async () => {
        setupPayablesMocks();
        mockQueryFindFirst.mockResolvedValueOnce(sampleVendor);
        queueDbResult([{
            totalBills: 5,
            totalSpend: "10000.00",
            amountPaid: "8000.00",
            outstandingAmount: "2000.00",
        }]);

        const result = await getVendor(1);

        expect(result).toMatchObject({
            ...sampleVendor,
            stats: {
                totalBills: 5,
                totalSpend: "10000.00",
                amountPaid: "8000.00",
                outstandingAmount: "2000.00",
            },
        });
    });

    it("should return null when vendor not found", async () => {
        setupPayablesMocks();
        mockQueryFindFirst.mockResolvedValueOnce(null);

        const result = await getVendor(999);

        expect(result).toBeNull();
    });

    it("should return null when org not found", async () => {
        mockRequirePayablesViewAccess.mockResolvedValue(defaultAccess);
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await getVendor(1);

        expect(result).toBeNull();
    });

    it("should return null on error", async () => {
        mockRequirePayablesViewAccess.mockRejectedValue(new Error("fail"));

        const result = await getVendor(1);

        expect(result).toBeNull();
    });

    it("should use fallback values for null stats", async () => {
        setupPayablesMocks();
        mockQueryFindFirst.mockResolvedValueOnce(sampleVendor);
        queueDbResult([{
            totalBills: 0,
            totalSpend: null,
            amountPaid: null,
            outstandingAmount: null,
        }]);

        const result = await getVendor(1);

        expect(result?.stats).toEqual({
            totalBills: 0,
            totalSpend: "0.00",
            amountPaid: "0.00",
            outstandingAmount: "0.00",
        });
    });
});

// ─── getAllVendors ─────────────────────────────────────────────────────────────

describe("getAllVendors", () => {
    it("should return all vendors on success", async () => {
        setupPayablesMocks();
        const vendorList = [sampleVendor, { ...sampleVendor, id: 2, name: "Beta Inc" }];
        queueDbResult(vendorList);

        const result = await getAllVendors();

        expect(result).toEqual(vendorList);
    });

    it("should return filtered vendors by status", async () => {
        setupPayablesMocks();
        queueDbResult([sampleVendor]);

        const result = await getAllVendors({ status: "Active" });

        expect(result).toEqual([sampleVendor]);
    });

    it("should return filtered vendors by category", async () => {
        setupPayablesMocks();
        queueDbResult([sampleVendor]);

        const result = await getAllVendors({ category: "Goods" });

        expect(result).toEqual([sampleVendor]);
    });

    it("should return filtered vendors by search term", async () => {
        setupPayablesMocks();
        queueDbResult([sampleVendor]);

        const result = await getAllVendors({ search: "Acme" });

        expect(result).toEqual([sampleVendor]);
    });

    it("should return empty array when org not found", async () => {
        mockRequirePayablesViewAccess.mockResolvedValue(defaultAccess);
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await getAllVendors();

        expect(result).toEqual([]);
    });

    it("should return empty array on error", async () => {
        mockRequirePayablesViewAccess.mockRejectedValue(new Error("fail"));

        const result = await getAllVendors();

        expect(result).toEqual([]);
    });
});

// ─── getVendorBills ───────────────────────────────────────────────────────────

describe("getVendorBills", () => {
    const billList = [
        { id: 10, vendorId: 1, status: "Draft", total: "500.00" },
        { id: 11, vendorId: 1, status: "Approved", total: "1200.00" },
    ];

    it("should return bills for a vendor", async () => {
        setupPayablesMocks();
        queueDbResult(billList);

        const result = await getVendorBills(1);

        expect(result).toEqual(billList);
    });

    it("should return filtered bills by status", async () => {
        setupPayablesMocks();
        queueDbResult([billList[1]]);

        const result = await getVendorBills(1, { status: "Approved" });

        expect(result).toEqual([billList[1]]);
    });

    it("should return empty array when org not found", async () => {
        mockRequirePayablesViewAccess.mockResolvedValue(defaultAccess);
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await getVendorBills(1);

        expect(result).toEqual([]);
    });

    it("should return empty array on error", async () => {
        mockRequirePayablesViewAccess.mockRejectedValue(new Error("fail"));

        const result = await getVendorBills(1);

        expect(result).toEqual([]);
    });
});

// ─── getVendorStats ───────────────────────────────────────────────────────────

describe("getVendorStats", () => {
    it("should return stats on success", async () => {
        setupPayablesMocks();
        queueDbResult([{
            totalBills: 10,
            totalSpend: "50000.00",
            amountPaid: "45000.00",
            outstandingAmount: "5000.00",
            overdueCount: 2,
            overdueAmount: "3000.00",
        }]);

        const result = await getVendorStats(1);

        expect(result).toEqual({
            totalBills: 10,
            totalSpend: "50000.00",
            amountPaid: "45000.00",
            outstandingAmount: "5000.00",
            overdueCount: 2,
            overdueAmount: "3000.00",
        });
    });

    it("should use fallback values for null stats", async () => {
        setupPayablesMocks();
        queueDbResult([{
            totalBills: 0,
            totalSpend: null,
            amountPaid: null,
            outstandingAmount: null,
            overdueCount: null,
            overdueAmount: null,
        }]);

        const result = await getVendorStats(1);

        expect(result).toEqual({
            totalBills: 0,
            totalSpend: "0.00",
            amountPaid: "0.00",
            outstandingAmount: "0.00",
            overdueCount: 0,
            overdueAmount: "0.00",
        });
    });

    it("should return null when org not found", async () => {
        mockRequirePayablesViewAccess.mockResolvedValue(defaultAccess);
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await getVendorStats(1);

        expect(result).toBeNull();
    });

    it("should return null on error", async () => {
        mockRequirePayablesViewAccess.mockRejectedValue(new Error("fail"));

        const result = await getVendorStats(1);

        expect(result).toBeNull();
    });
});
