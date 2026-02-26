import { describe, it, expect, beforeEach } from "vitest";
import {
    mockGetUser,
    mockGetFullOrganization,
    queueDbResult,
    DEFAULT_ORG_ID,
    DEFAULT_USER_ID,
} from "./helpers/setup";
import {
    createDeduction,
    getAllDeductions,
    getAllRecurringDeductions,
    getDeduction,
    updateDeduction,
    deleteDeduction,
} from "@/actions/payroll/deductions";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setupUser(role = "admin") {
    mockGetUser.mockResolvedValue({ authId: DEFAULT_USER_ID, role });
    mockGetFullOrganization.mockResolvedValue({ id: DEFAULT_ORG_ID });
}

const mockDeduction = {
    id: 1,
    name: "PAYE",
    type: "recurring" as const,
    percentage: "15",
    amount: null,
    createdById: DEFAULT_USER_ID,
    updatedAt: new Date(),
};

// ─── createDeduction ─────────────────────────────────────────────────────────

describe("createDeduction", () => {
    beforeEach(() => setupUser());

    it("throws if user not logged in", async () => {
        mockGetUser.mockResolvedValue(null);
        await expect(
            createDeduction({ name: "A", type: "recurring" }, "/"),
        ).rejects.toThrow("User not logged in");
    });

    it("throws if user is not admin", async () => {
        setupUser("employee");
        await expect(
            createDeduction({ name: "A", type: "recurring", amount: 100 }, "/"),
        ).rejects.toThrow("Access Restricted");
    });

    it("returns error if deduction name already exists", async () => {
        queueDbResult([{ id: 1 }]); // duplicate
        const result = await createDeduction(
            { name: "PAYE", type: "recurring", percentage: 15 },
            "/",
        );
        expect(result.error?.reason).toContain("already exists");
    });

    it("returns error if neither percentage nor amount provided", async () => {
        queueDbResult([]); // no duplicate
        const result = await createDeduction({ name: "PAYE", type: "recurring" }, "/");
        expect(result.error?.reason).toContain("Either percentage or amount");
    });

    it("creates deduction with percentage successfully", async () => {
        queueDbResult([]); // no duplicate
        queueDbResult([]); // insert
        const result = await createDeduction(
            { name: "PAYE", type: "recurring", percentage: 15 },
            "/",
        );
        expect(result.success?.reason).toContain("created successfully");
    });

    it("creates deduction with fixed amount successfully", async () => {
        queueDbResult([]);
        queueDbResult([]);
        const result = await createDeduction(
            { name: "Pension", type: "recurring", amount: 5000 },
            "/",
        );
        expect(result.success?.reason).toContain("created successfully");
    });
});

// ─── getAllDeductions ─────────────────────────────────────────────────────────

describe("getAllDeductions", () => {
    beforeEach(() => setupUser());

    it("returns deductions with creator names", async () => {
        queueDbResult([mockDeduction]);
        queueDbResult([{ authId: DEFAULT_USER_ID, name: "Test User" }]);
        const result = await getAllDeductions();
        expect(result).toHaveLength(1);
        expect(result[0].createdByUserId).toBe("Test User");
    });

    it("returns empty array when none exist", async () => {
        queueDbResult([]);
        const result = await getAllDeductions();
        expect(result).toEqual([]);
    });

    it("uses 'Unknown' when creator not in system", async () => {
        queueDbResult([mockDeduction]);
        queueDbResult([]); // no creators found
        const result = await getAllDeductions();
        expect(result[0].createdByUserId).toBe("Unknown");
    });
});

// ─── getAllRecurringDeductions ────────────────────────────────────────────────

describe("getAllRecurringDeductions", () => {
    beforeEach(() => setupUser());

    it("returns only recurring deductions", async () => {
        queueDbResult([mockDeduction]);
        queueDbResult([{ authId: DEFAULT_USER_ID, name: "Test User" }]);
        const result = await getAllRecurringDeductions();
        expect(result).toHaveLength(1);
    });

    it("returns empty when none", async () => {
        queueDbResult([]);
        const result = await getAllRecurringDeductions();
        expect(result).toEqual([]);
    });
});

// ─── getDeduction ─────────────────────────────────────────────────────────────

describe("getDeduction", () => {
    beforeEach(() => setupUser());

    it("returns null if not found", async () => {
        queueDbResult([]);
        const result = await getDeduction(999);
        expect(result).toBeNull();
    });

    it("returns deduction with creator name", async () => {
        queueDbResult([mockDeduction]);
        queueDbResult([{ name: "Test User" }]);
        const result = await getDeduction(1);
        expect(result?.createdByUserId).toBe("Test User");
    });

    it("uses 'Unknown' when creator missing", async () => {
        queueDbResult([mockDeduction]);
        queueDbResult([]);
        const result = await getDeduction(1);
        expect(result?.createdByUserId).toBe("Unknown");
    });
});

// ─── updateDeduction ─────────────────────────────────────────────────────────

describe("updateDeduction", () => {
    beforeEach(() => setupUser());

    it("returns error if deduction not found", async () => {
        queueDbResult([]);
        const result = await updateDeduction(99, { name: "X" }, "/");
        expect(result.error?.reason).toContain("not found");
    });

    it("returns error if name conflict", async () => {
        queueDbResult([{ id: 1 }]); // found
        queueDbResult([{ id: 2 }]); // name conflict
        const result = await updateDeduction(1, { name: "Conflict" }, "/");
        expect(result.error?.reason).toContain("already exists");
    });

    it("updates successfully", async () => {
        queueDbResult([{ id: 1 }]); // found
        queueDbResult([]); // no name conflict
        queueDbResult([]); // update
        const result = await updateDeduction(1, { name: "Updated PAYE", percentage: 20 }, "/");
        expect(result.success?.reason).toContain("updated successfully");
    });

    it("skips name check if name not changing", async () => {
        queueDbResult([{ id: 1 }]); // found
        queueDbResult([]); // update (no name check needed)
        const result = await updateDeduction(1, { percentage: 20 }, "/");
        expect(result.success?.reason).toContain("updated successfully");
    });
});

// ─── deleteDeduction ─────────────────────────────────────────────────────────

describe("deleteDeduction", () => {
    beforeEach(() => setupUser());

    it("returns error if deduction not found", async () => {
        queueDbResult([]);
        const result = await deleteDeduction(99, "/");
        expect(result.error?.reason).toContain("not found");
    });

    it("returns error if used in a salary structure", async () => {
        queueDbResult([{ id: 1 }]); // found
        queueDbResult([{ id: 10 }]); // used in salaryDeductions
        const result = await deleteDeduction(1, "/");
        expect(result.error?.reason).toContain("salary structures");
    });

    it("returns error if used in a payrun", async () => {
        queueDbResult([{ id: 1 }]); // found
        queueDbResult([]); // not in salary structure
        queueDbResult([{ id: 20 }]); // used in payrunItemDetails
        const result = await deleteDeduction(1, "/");
        expect(result.error?.reason).toContain("payroll runs");
    });

    it("deletes successfully when not in use", async () => {
        queueDbResult([{ id: 1 }]); // found
        queueDbResult([]); // not in salary structure
        queueDbResult([]); // not in payrun
        queueDbResult([]); // delete
        const result = await deleteDeduction(1, "/");
        expect(result.success?.reason).toContain("deleted successfully");
    });
});
