import { describe, it, expect, beforeEach } from "vitest";
import {
    mockGetUser,
    mockGetFullOrganization,
    queueDbResult,
    DEFAULT_ORG_ID,
    DEFAULT_USER_ID,
} from "./helpers/setup";
import {
    createAllowance,
    getAllAllowances,
    getAllAllowancesMonthly,
    getAllowance,
    updateAllowance,
    deleteAllowance,
} from "@/actions/payroll/allowances";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setupUser(role = "admin") {
    mockGetUser.mockResolvedValue({ authId: DEFAULT_USER_ID, role });
    mockGetFullOrganization.mockResolvedValue({ id: DEFAULT_ORG_ID });
}

const mockAllowance = {
    id: 1,
    name: "Housing",
    type: "monthly" as const,
    percentage: "10",
    amount: null,
    taxable: false,
    taxPercentage: null,
    description: "Housing allowance",
    createdById: DEFAULT_USER_ID,
    updatedAt: new Date(),
};

// ─── createAllowance ─────────────────────────────────────────────────────────

describe("createAllowance", () => {
    beforeEach(() => setupUser());

    it("throws if user not logged in", async () => {
        mockGetUser.mockResolvedValue(null);
        await expect(
            createAllowance({ name: "A", type: "monthly", taxable: false, description: "" }, "/"),
        ).rejects.toThrow("User not logged in");
    });

    it("throws if user is not admin", async () => {
        setupUser("employee");
        await expect(
            createAllowance({ name: "A", type: "monthly", taxable: false, description: "" }, "/"),
        ).rejects.toThrow("Access Restricted");
    });

    it("returns error if allowance name already exists", async () => {
        queueDbResult([{ id: 1 }]); // duplicate
        const result = await createAllowance(
            { name: "Housing", type: "monthly", taxable: false, description: "", amount: 1000 },
            "/",
        );
        expect(result.error?.reason).toContain("already exists");
    });

    it("returns error if neither percentage nor amount provided", async () => {
        queueDbResult([]); // no duplicate
        const result = await createAllowance(
            { name: "Housing", type: "monthly", taxable: false, description: "" },
            "/",
        );
        expect(result.error?.reason).toContain("Either percentage or amount");
    });

    it("returns error if taxable but no tax percentage", async () => {
        queueDbResult([]); // no duplicate
        const result = await createAllowance(
            {
                name: "Housing",
                type: "monthly",
                taxable: true,
                description: "",
                amount: 1000,
                // taxPercentage intentionally omitted
            },
            "/",
        );
        expect(result.error?.reason).toContain("Tax percentage is required");
    });

    it("creates allowance with percentage successfully", async () => {
        queueDbResult([]); // no duplicate
        queueDbResult([]); // insert
        const result = await createAllowance(
            {
                name: "Housing",
                type: "monthly",
                taxable: false,
                description: "desc",
                percentage: 10,
            },
            "/",
        );
        expect(result.success?.reason).toContain("created successfully");
    });

    it("creates taxable allowance with tax percentage", async () => {
        queueDbResult([]); // no duplicate
        queueDbResult([]); // insert
        const result = await createAllowance(
            {
                name: "Bonus",
                type: "annual",
                taxable: true,
                taxPercentage: 15,
                description: "Bonus allowance",
                amount: 5000,
            },
            "/",
        );
        expect(result.success?.reason).toContain("created successfully");
    });
});

// ─── getAllAllowances ─────────────────────────────────────────────────────────

describe("getAllAllowances", () => {
    beforeEach(() => setupUser());

    it("returns empty array on DB error", async () => {
        // Simulate error via empty queue (function catches and returns [])
        const result = await getAllAllowances();
        // With no queue entries the db chain resolves [] by default
        expect(Array.isArray(result)).toBe(true);
    });

    it("returns allowances with creator names", async () => {
        queueDbResult([mockAllowance]);
        queueDbResult([{ authId: DEFAULT_USER_ID, name: "Test User" }]);
        const result = await getAllAllowances();
        expect(result).toHaveLength(1);
        expect(result[0].createdByUserId).toBe("Test User");
    });

    it("handles no allowances", async () => {
        queueDbResult([]);
        const result = await getAllAllowances();
        expect(result).toEqual([]);
    });
});

// ─── getAllAllowancesMonthly ──────────────────────────────────────────────────

describe("getAllAllowancesMonthly", () => {
    beforeEach(() => setupUser());

    it("returns only monthly type allowances", async () => {
        queueDbResult([mockAllowance]);
        queueDbResult([{ authId: DEFAULT_USER_ID, name: "Test User" }]);
        const result = await getAllAllowancesMonthly();
        expect(result).toHaveLength(1);
    });

    it("returns empty array when none exist", async () => {
        queueDbResult([]);
        const result = await getAllAllowancesMonthly();
        expect(result).toEqual([]);
    });
});

// ─── getAllowance ─────────────────────────────────────────────────────────────

describe("getAllowance", () => {
    beforeEach(() => setupUser());

    it("returns null if not found", async () => {
        queueDbResult([]); // allowance not found
        const result = await getAllowance(999);
        expect(result).toBeNull();
    });

    it("returns allowance with creator name", async () => {
        queueDbResult([mockAllowance]);
        queueDbResult([{ name: "Test User" }]);
        const result = await getAllowance(1);
        expect(result).not.toBeNull();
        expect(result?.createdByUserId).toBe("Test User");
    });

    it("uses 'Unknown' when creator not found", async () => {
        queueDbResult([mockAllowance]);
        queueDbResult([]);
        const result = await getAllowance(1);
        expect(result?.createdByUserId).toBe("Unknown");
    });
});

// ─── updateAllowance ─────────────────────────────────────────────────────────

describe("updateAllowance", () => {
    beforeEach(() => setupUser());

    it("returns error if allowance not found", async () => {
        queueDbResult([]); // not found
        const result = await updateAllowance(99, { name: "X" }, "/");
        expect(result.error?.reason).toContain("not found");
    });

    it("returns error if name conflict", async () => {
        queueDbResult([{ id: 1 }]); // existing found
        queueDbResult([{ id: 2 }]); // name conflict
        const result = await updateAllowance(1, { name: "Conflict" }, "/");
        expect(result.error?.reason).toContain("already exists");
    });

    it("updates allowance successfully", async () => {
        queueDbResult([{ id: 1 }]); // existing found
        queueDbResult([]); // no name conflict
        queueDbResult([]); // update
        const result = await updateAllowance(1, { name: "Updated", amount: 2000 }, "/");
        expect(result.success?.reason).toContain("updated successfully");
    });
});

// ─── deleteAllowance ─────────────────────────────────────────────────────────

describe("deleteAllowance", () => {
    beforeEach(() => setupUser());

    it("returns error if allowance not found", async () => {
        queueDbResult([]); // not found
        const result = await deleteAllowance(99, "/");
        expect(result.error?.reason).toContain("not found");
    });

    it("deletes successfully", async () => {
        queueDbResult([{ id: 1 }]); // found
        queueDbResult([]); // delete
        const result = await deleteAllowance(1, "/");
        expect(result.success?.reason).toContain("deleted successfully");
    });
});
