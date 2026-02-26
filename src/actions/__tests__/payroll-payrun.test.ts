import { describe, it, expect, beforeEach } from "vitest";
import {
    mockGetUser,
    mockGetFullOrganization,
    mockTransaction,
    queueDbResult,
    DEFAULT_ORG_ID,
    DEFAULT_USER_ID,
} from "./helpers/setup";
import {
    generatePayrun,
    getPayruns,
    getPayrunById,
} from "@/actions/payroll/payrun";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setupUser(role = "admin") {
    mockGetUser.mockResolvedValue({ authId: DEFAULT_USER_ID, role });
    mockGetFullOrganization.mockResolvedValue({ id: DEFAULT_ORG_ID });
}

const mockPayrun = {
    id: 1,
    name: "Salary Payrun - January 2025",
    type: "salary",
    allowanceId: null,
    allowanceName: null,
    day: 1,
    month: 1,
    year: 2025,
    totalEmployees: 5,
    totalGrossPay: "250000",
    totalDeductions: "25000",
    totalNetPay: "225000",
    status: "draft",
    generatedByUserId: DEFAULT_USER_ID,
    generatedByName: "Test Admin",
    approvedByUserId: null,
    approvedAt: null,
    organizationId: DEFAULT_ORG_ID,
    createdAt: new Date("2025-01-01"),
};

// ─── generatePayrun ───────────────────────────────────────────────────────────

describe("generatePayrun", () => {
    beforeEach(() => setupUser());

    it("throws if user not logged in", async () => {
        mockGetUser.mockResolvedValue(null);
        await expect(
            generatePayrun({ type: "salary", month: 1, year: 2025 }, "/")
        ).rejects.toThrow("User not logged in");
    });

    it("throws if user is not admin", async () => {
        setupUser("employee");
        await expect(
            generatePayrun({ type: "salary", month: 1, year: 2025 }, "/")
        ).rejects.toThrow("Access Restricted");
    });

    it("throws if organization not found", async () => {
        mockGetFullOrganization.mockResolvedValue(null);
        await expect(
            generatePayrun({ type: "salary", month: 1, year: 2025 }, "/")
        ).rejects.toThrow("Organization not found");
    });

    it("returns error if payrun already exists for this period", async () => {
        mockTransaction.mockImplementationOnce(async (cb: (tx: unknown) => Promise<unknown>) => {
            return { error: { reason: "A payrun already exists for this period and type" }, success: null };
        });
        const result = await generatePayrun(
            { type: "salary", month: 1, year: 2025 },
            "/payroll",
        );
        expect(result.error?.reason).toContain("payrun already exists");
    });

    it("generates salary payrun successfully", async () => {
        mockTransaction.mockImplementationOnce(async () => ({
            success: { reason: "Payrun generated successfully" },
            error: null,
        }));
        const result = await generatePayrun(
            { type: "salary", month: 2, year: 2025 },
            "/payroll",
        );
        expect(result.success?.reason).toContain("generated successfully");
    });

    it("generates allowance payrun successfully", async () => {
        mockTransaction.mockImplementationOnce(async () => ({
            success: { reason: "Payrun generated successfully" },
            error: null,
        }));
        const result = await generatePayrun(
            { type: "allowance", allowanceId: 1, month: 2, year: 2025 },
            "/payroll",
        );
        expect(result.success?.reason).toContain("generated successfully");
    });
});

// ─── getPayruns ───────────────────────────────────────────────────────────────

describe("getPayruns", () => {
    beforeEach(() => setupUser());

    it("throws if user not logged in", async () => {
        mockGetUser.mockResolvedValue(null);
        await expect(getPayruns()).rejects.toThrow("User not logged in");
    });

    it("returns list of payruns", async () => {
        queueDbResult([mockPayrun]);
        const result = await getPayruns();
        expect(result).toHaveLength(1);
        expect(result[0].type).toBe("salary");
    });

    it("returns empty array when none exist", async () => {
        queueDbResult([]);
        const result = await getPayruns();
        expect(result).toEqual([]);
    });
});

// ─── getPayrunById ────────────────────────────────────────────────────────────

describe("getPayrunById", () => {
    beforeEach(() => setupUser());

    it("throws if user not logged in", async () => {
        mockGetUser.mockResolvedValue(null);
        await expect(getPayrunById(1)).rejects.toThrow("User not logged in");
    });

    it("returns null if payrun not found", async () => {
        queueDbResult([]); // payrun not found
        const result = await getPayrunById(999);
        expect(result).toBeNull();
    });

    it("returns payrun data with items", async () => {
        queueDbResult([mockPayrun]); // payrun found
        queueDbResult([
            { id: 10, payrunId: 1, userId: "emp-1", grossPay: "50000", netPay: "45000", details: [] },
        ]); // items
        const result = await getPayrunById(1);
        expect(result).not.toBeNull();
        expect(result?.id).toBe(1);
        expect(result?.items).toHaveLength(1);
    });

    it("returns payrun with empty items array", async () => {
        queueDbResult([mockPayrun]);
        queueDbResult([]); // no items
        const result = await getPayrunById(1);
        expect(result?.items).toEqual([]);
    });
});
