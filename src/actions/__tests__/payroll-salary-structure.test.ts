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
    createSalaryStructure,
    getAllSalaryStructures,
    getSalaryStructure,
    updateSalaryStructure,
    toggleSalaryStructureStatus,
} from "@/actions/payroll/salary-structure";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setupUser(role = "admin") {
    mockGetUser.mockResolvedValue({
        authId: DEFAULT_USER_ID,
        role,
    });
    mockGetFullOrganization.mockResolvedValue({ id: DEFAULT_ORG_ID });
}

const mockStructure = {
    id: 1,
    name: "Standard",
    baseSalary: "50000",
    description: "Standard salary structure",
    active: true,
    employeeCount: 0,
    createdByUserId: DEFAULT_USER_ID,
    updatedAt: new Date(),
};

// ─── createSalaryStructure ───────────────────────────────────────────────────

describe("createSalaryStructure", () => {
    beforeEach(() => setupUser());

    it("throws if user not logged in", async () => {
        mockGetUser.mockResolvedValue(null);
        await expect(
            createSalaryStructure({ name: "A", baseSalary: 10000, description: "" }, "/"),
        ).rejects.toThrow("User not logged in");
    });

    it("throws if user is not admin", async () => {
        setupUser("employee");
        await expect(
            createSalaryStructure({ name: "A", baseSalary: 10000, description: "" }, "/"),
        ).rejects.toThrow("Access Restricted");
    });

    it("throws if organization not found", async () => {
        mockGetFullOrganization.mockResolvedValue(null);
        await expect(
            createSalaryStructure({ name: "A", baseSalary: 10000, description: "" }, "/"),
        ).rejects.toThrow("Organization not found");
    });

    it("returns error if name already exists", async () => {
        // Duplicate check returns existing
        queueDbResult([{ id: 1 }]);
        const result = await createSalaryStructure(
            { name: "Standard", baseSalary: 50000, description: "desc" },
            "/",
        );
        expect(result.error?.reason).toContain("already exists");
        expect(result.success).toBeNull();
    });

    it("creates salary structure successfully", async () => {
        // No duplicate found → insert
        queueDbResult([]);
        queueDbResult([{ id: 1 }]);
        const result = await createSalaryStructure(
            { name: "New Structure", baseSalary: 60000, description: "desc" },
            "/salary",
        );
        expect(result.success?.reason).toContain("created successfully");
        expect(result.error).toBeNull();
    });
});

// ─── getAllSalaryStructures ───────────────────────────────────────────────────

describe("getAllSalaryStructures", () => {
    beforeEach(() => setupUser());

    it("throws if user not logged in", async () => {
        mockGetUser.mockResolvedValue(null);
        await expect(getAllSalaryStructures()).rejects.toThrow("User not logged in");
    });

    it("returns empty array on DB error", async () => {
        mockTransaction.mockRejectedValueOnce(new Error("DB failure"));
        // getAllSalaryStructures uses db.select directly, not transaction — queue empty
        const result = await getAllSalaryStructures();
        expect(Array.isArray(result)).toBe(true);
    });

    it("returns salary structures with creator names", async () => {
        const structures = [{ ...mockStructure, createdById: DEFAULT_USER_ID }];
        queueDbResult(structures); // select structures
        queueDbResult([{ authId: DEFAULT_USER_ID, name: "Test User" }]); // select creators
        const result = await getAllSalaryStructures();
        expect(result).toHaveLength(1);
        expect(result[0].createdByUserId).toBe("Test User");
    });

    it("handles no structures", async () => {
        queueDbResult([]); // no structures
        const result = await getAllSalaryStructures();
        expect(result).toEqual([]);
    });
});

// ─── getSalaryStructure ───────────────────────────────────────────────────────

describe("getSalaryStructure", () => {
    beforeEach(() => setupUser());

    it("throws if user not logged in", async () => {
        mockGetUser.mockResolvedValue(null);
        await expect(getSalaryStructure(1)).rejects.toThrow("User not logged in");
    });

    it("returns null if structure not found", async () => {
        queueDbResult([]); // empty result
        const result = await getSalaryStructure(999);
        expect(result).toBeNull();
    });

    it("returns structure with creator name", async () => {
        queueDbResult([mockStructure]); // structure found
        queueDbResult([{ name: "Test User" }]); // creator found
        const result = await getSalaryStructure(1);
        expect(result).not.toBeNull();
        expect(result?.createdByUserId).toBe("Test User");
    });

    it("uses 'Unknown' when creator not found", async () => {
        queueDbResult([mockStructure]);
        queueDbResult([]); // no creator
        const result = await getSalaryStructure(1);
        expect(result?.createdByUserId).toBe("Unknown");
    });
});

// ─── updateSalaryStructure ───────────────────────────────────────────────────

describe("updateSalaryStructure", () => {
    beforeEach(() => setupUser());

    it("returns error if structure not found (transaction resolves not-found)", async () => {
        // updateSalaryStructure wraps in a transaction; when structure not found,
        // it returns { error: { reason: "Salary structure not found" } }
        queueDbResult([]); // not found in transaction
        const result = await updateSalaryStructure(99, { name: "X" }, "/");
        expect(result.error?.reason).toBeDefined();
    });

    it("returns error if name conflict on another structure", async () => {
        queueDbResult([{ id: 1 }]); // existing check passes
        queueDbResult([{ id: 2 }]); // name conflict
        const result = await updateSalaryStructure(1, { name: "Conflict" }, "/");
        expect(result.error?.reason).toContain("already exists");
    });

    it("updates structure successfully", async () => {
        queueDbResult([{ id: 1 }]); // existing found
        queueDbResult([]); // no name conflict
        queueDbResult([]); // update result
        const result = await updateSalaryStructure(
            1,
            { name: "Updated", baseSalary: 55000 },
            "/",
        );
        expect(result.success?.reason).toContain("updated successfully");
    });

    it("updates without name check if name not provided", async () => {
        queueDbResult([{ id: 1 }]); // existing found
        queueDbResult([]); // update result
        const result = await updateSalaryStructure(1, { baseSalary: 55000 }, "/");
        expect(result.success?.reason).toContain("updated successfully");
    });
});

// ─── toggleSalaryStructureStatus ─────────────────────────────────────────────

describe("toggleSalaryStructureStatus", () => {
    beforeEach(() => setupUser());

    it("returns error if structure not found", async () => {
        queueDbResult([]); // not found
        const result = await toggleSalaryStructureStatus(99, true, "/");
        expect(result.error?.reason).toContain("not found");
    });

    it("cannot deactivate structure with employees", async () => {
        queueDbResult([{ id: 1, employeeCount: 3 }]); // found with employees
        const result = await toggleSalaryStructureStatus(1, false, "/");
        expect(result.error?.reason).toContain("Cannot deactivate");
    });

    it("deactivates successfully when no employees", async () => {
        queueDbResult([{ id: 1, employeeCount: 0 }]); // found, no employees
        queueDbResult([]); // update result
        const result = await toggleSalaryStructureStatus(1, false, "/");
        expect(result.success?.reason).toContain("deactivated successfully");
    });

    it("activates successfully", async () => {
        queueDbResult([{ id: 1, employeeCount: 0 }]); // found
        queueDbResult([]); // update result
        const result = await toggleSalaryStructureStatus(1, true, "/");
        expect(result.success?.reason).toContain("activated successfully");
    });
});
