import { describe, it, expect, beforeEach } from "vitest";
import {
    mockGetUser,
    mockGetFullOrganization,
    queueDbResult,
    DEFAULT_ORG_ID,
    DEFAULT_USER_ID,
} from "./helpers/setup";
import {
    addAllowanceToStructure,
    removeAllowanceFromStructure,
    getStructureAllowances,
} from "@/actions/payroll/salary-allowances";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setupUser(role = "admin") {
    mockGetUser.mockResolvedValue({ authId: DEFAULT_USER_ID, role });
    mockGetFullOrganization.mockResolvedValue({ id: DEFAULT_ORG_ID });
}

// ─── addAllowanceToStructure ─────────────────────────────────────────────────

describe("addAllowanceToStructure", () => {
    beforeEach(() => setupUser());

    it("throws if user not logged in", async () => {
        mockGetUser.mockResolvedValue(null);
        await expect(
            addAllowanceToStructure({ salaryStructureId: 1, allowanceId: 1 }, "/")
        ).rejects.toThrow("User not logged in");
    });

    it("throws if user is not admin", async () => {
        setupUser("employee");
        await expect(
            addAllowanceToStructure({ salaryStructureId: 1, allowanceId: 1 }, "/")
        ).rejects.toThrow("Access Restricted");
    });

    it("returns error if structure not found", async () => {
        queueDbResult([]); // structure not found
        const result = await addAllowanceToStructure(
            { salaryStructureId: 99, allowanceId: 1 }, "/"
        );
        expect(result.error?.reason).toContain("Salary structure not found");
    });

    it("returns error if structure is inactive", async () => {
        queueDbResult([{ id: 1, active: false }]); // inactive structure
        const result = await addAllowanceToStructure(
            { salaryStructureId: 1, allowanceId: 1 }, "/"
        );
        expect(result.error?.reason).toContain("inactive");
    });

    it("returns error if allowance not found", async () => {
        queueDbResult([{ id: 1, active: true }]); // structure found
        queueDbResult([]); // allowance not found
        const result = await addAllowanceToStructure(
            { salaryStructureId: 1, allowanceId: 99 }, "/"
        );
        expect(result.error?.reason).toContain("Allowance not found");
    });

    it("returns error if allowance already added to structure", async () => {
        queueDbResult([{ id: 1, active: true }]); // structure found
        queueDbResult([{ id: 1 }]); // allowance found
        queueDbResult([{ id: 10 }]); // already exists
        const result = await addAllowanceToStructure(
            { salaryStructureId: 1, allowanceId: 1 }, "/"
        );
        expect(result.error?.reason).toContain("already added");
    });

    it("adds allowance to structure successfully", async () => {
        queueDbResult([{ id: 1, active: true }]); // structure found
        queueDbResult([{ id: 1 }]); // allowance found
        queueDbResult([]); // not yet in structure
        queueDbResult([]); // insert
        const result = await addAllowanceToStructure(
            { salaryStructureId: 1, allowanceId: 1 }, "/"
        );
        expect(result.success?.reason).toContain("Allowance added to salary structure");
    });
});

// ─── removeAllowanceFromStructure ────────────────────────────────────────────

describe("removeAllowanceFromStructure", () => {
    beforeEach(() => setupUser());

    it("throws if user not logged in", async () => {
        mockGetUser.mockResolvedValue(null);
        await expect(removeAllowanceFromStructure(1, "/")).rejects.toThrow("User not logged in");
    });

    it("throws if user is not admin", async () => {
        setupUser("employee");
        await expect(removeAllowanceFromStructure(1, "/")).rejects.toThrow("Access Restricted");
    });

    it("returns error if relationship not found", async () => {
        queueDbResult([]); // not found
        const result = await removeAllowanceFromStructure(99, "/");
        expect(result.error?.reason).toContain("not found");
    });

    it("removes allowance from structure successfully", async () => {
        queueDbResult([{ id: 10, structureId: 1 }]); // found
        queueDbResult([{ id: 1, active: true }]); // structure active check
        queueDbResult([]); // delete
        const result = await removeAllowanceFromStructure(10, "/");
        expect(result.success?.reason).toContain("Allowance removed from salary structure");
    });
});

// ─── getStructureAllowances ──────────────────────────────────────────────────

describe("getStructureAllowances", () => {
    beforeEach(() => setupUser());

    it("throws if user not logged in", async () => {
        mockGetUser.mockResolvedValue(null);
        await expect(getStructureAllowances(1)).rejects.toThrow("User not logged in");
    });

    it("returns allowances for structure", async () => {
        queueDbResult([
            { id: 10, allowanceId: 1, allowanceName: "Housing", amount: 1000 },
        ]);
        const result = await getStructureAllowances(1);
        expect(result).toHaveLength(1);
        expect(result[0].allowanceId).toBe(1);
    });

    it("returns empty array when structure has no allowances", async () => {
        queueDbResult([]);
        const result = await getStructureAllowances(1);
        expect(result).toEqual([]);
    });
});
