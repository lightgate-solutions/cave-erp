import { describe, it, expect, beforeEach } from "vitest";
import {
    mockRequireAuth,
    mockRequireHROrAdmin,
    mockGetFullOrganization,
    mockQueryFindFirst,
    queueDbResult,
    DEFAULT_ORG_ID,
} from "./helpers/setup";
import {
    getEmployeeBankDetails,
    saveBankDetails,
    deleteBankDetails,
} from "@/actions/hr/employee-bank";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const userId = "user-123";
const bankData = {
    userId,
    bankName: "Standard Chartered",
    accountName: "John Doe",
    accountNumber: "123456789",
};

function setup(hasOrg = true) {
    mockRequireAuth.mockResolvedValue({ userId });
    mockRequireHROrAdmin.mockResolvedValue({ employee: { id: 1 } });
    if (hasOrg) {
        mockGetFullOrganization.mockResolvedValue({ id: DEFAULT_ORG_ID });
    } else {
        mockGetFullOrganization.mockResolvedValue(null);
    }
}

// ─── getEmployeeBankDetails ──────────────────────────────────────────────────

describe("getEmployeeBankDetails", () => {
    beforeEach(() => setup());

    it("returns null when org not found", async () => {
        setup(false);
        const result = await getEmployeeBankDetails(userId);
        expect(result).toBeNull();
    });

    it("returns bank details when found", async () => {
        mockQueryFindFirst.mockResolvedValueOnce({ ...bankData, id: 1 });
        const result = await getEmployeeBankDetails(userId);
        expect(result?.bankName).toBe("Standard Chartered");
    });

    it("returns null when no bank details exist", async () => {
        mockQueryFindFirst.mockResolvedValueOnce(null);
        const result = await getEmployeeBankDetails(userId);
        expect(result).toBeNull();
    });
});

// ─── saveBankDetails ─────────────────────────────────────────────────────────

describe("saveBankDetails", () => {
    beforeEach(() => setup());

    it("returns error when org not found", async () => {
        setup(false);
        const result = await saveBankDetails(bankData);
        expect(result.success).toBe(false);
        expect(result.message).toContain("Organization not found");
    });

    it("creates new bank details when none exist", async () => {
        mockQueryFindFirst.mockResolvedValueOnce(null); // no existing
        queueDbResult([]); // insert
        const result = await saveBankDetails(bankData);
        expect(result.success).toBe(true);
        expect(result.message).toContain("saved successfully");
    });

    it("updates existing bank details", async () => {
        mockQueryFindFirst.mockResolvedValueOnce({ id: 1, ...bankData }); // existing
        queueDbResult([]); // update
        const result = await saveBankDetails({
            ...bankData,
            bankName: "First Bank",
        });
        expect(result.success).toBe(true);
    });

    it("returns error for invalid bank name", async () => {
        const result = await saveBankDetails({
            ...bankData,
            bankName: "X", // too short
        });
        expect(result.success).toBe(false);
        expect(result.message).toContain("Invalid bank details");
    });

    it("returns error for invalid account number", async () => {
        const result = await saveBankDetails({
            ...bankData,
            accountNumber: "123", // too short
        });
        expect(result.success).toBe(false);
    });
});

// ─── deleteBankDetails ───────────────────────────────────────────────────────

describe("deleteBankDetails", () => {
    beforeEach(() => setup());

    it("returns error when org not found", async () => {
        setup(false);
        const result = await deleteBankDetails(userId);
        expect(result.success).toBe(false);
        expect(result.message).toContain("Organization not found");
    });

    it("deletes bank details successfully", async () => {
        queueDbResult([]); // delete
        const result = await deleteBankDetails(userId);
        expect(result.success).toBe(true);
        expect(result.message).toContain("deleted successfully");
    });
});
