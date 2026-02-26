import { describe, it, expect, beforeEach } from "vitest";
import {
    mockGetUser,
    mockGetFullOrganization,
    queueDbResult,
    mockTransaction,
    DEFAULT_ORG_ID,
    DEFAULT_USER_ID,
} from "./helpers/setup";
import {
    getEmployeesBySalaryStructure,
    getEmployeeSalaryHistory,
    getEmployeesNotInStructure,
    assignEmployeeToStructure,
    removeEmployeeFromStructure,
} from "@/actions/payroll/employee-salary";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setupUser(role = "admin") {
    mockGetUser.mockResolvedValue({ authId: DEFAULT_USER_ID, role });
    mockGetFullOrganization.mockResolvedValue({ id: DEFAULT_ORG_ID });
}

const mockEmployee = {
    authId: "emp-1",
    name: "John Doe",
    staffNumber: "EMP-001",
    organizationId: DEFAULT_ORG_ID,
};

const mockStructure = {
    id: 1,
    name: "Standard",
    active: true,
    employeeCount: 2,
};

const mockEmployeeInStructure = {
    id: 1,
    userId: "emp-1",
    salaryId: 5,
    name: "John Doe",
    staffNumber: "EMP-001",
    department: "IT",
    role: "Engineer",
    effectiveFrom: "2024-01-01",
};

// ─── getEmployeesBySalaryStructure ───────────────────────────────────────────

describe("getEmployeesBySalaryStructure", () => {
    beforeEach(() => setupUser());

    it("throws if user not logged in", async () => {
        mockGetUser.mockResolvedValue(null);
        await expect(getEmployeesBySalaryStructure(1)).rejects.toThrow("User not logged in");
    });

    it("returns flat array of employees in structure", async () => {
        queueDbResult([mockEmployeeInStructure]);
        const result = await getEmployeesBySalaryStructure(1);
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("John Doe");
    });

    it("returns empty array when no employees in structure", async () => {
        queueDbResult([]);
        const result = await getEmployeesBySalaryStructure(1);
        expect(result).toEqual([]);
    });
});

// ─── getEmployeeSalaryHistory ────────────────────────────────────────────────

describe("getEmployeeSalaryHistory", () => {
    beforeEach(() => setupUser());

    it("throws if user not logged in", async () => {
        mockGetUser.mockResolvedValue(null);
        await expect(getEmployeeSalaryHistory("emp-1")).rejects.toThrow("User not logged in");
    });

    it("returns salary history for employee", async () => {
        queueDbResult([
            {
                id: 1,
                userId: "emp-1",
                salaryStructureId: 1,
                effectiveFrom: "2024-01-01",
                structureName: "Standard",
                baseSalary: 50000,
            },
        ]);
        const result = await getEmployeeSalaryHistory("emp-1");
        expect(result).toHaveLength(1);
        expect(result[0].structureName).toBe("Standard");
    });

    it("returns empty if no history", async () => {
        queueDbResult([]);
        const result = await getEmployeeSalaryHistory("emp-1");
        expect(result).toEqual([]);
    });
});

// ─── getEmployeesNotInStructure ──────────────────────────────────────────────

describe("getEmployeesNotInStructure", () => {
    beforeEach(() => setupUser());

    it("throws if user not logged in", async () => {
        mockGetUser.mockResolvedValue(null);
        await expect(getEmployeesNotInStructure(1)).rejects.toThrow("User not logged in");
    });

    it("returns all active employees not in structure", async () => {
        // Second query: all active employees (getEmployeesNotInStructure uses a NOT IN subquery)
        queueDbResult([{ authId: "emp-2", name: "Jane" }]);
        const result = await getEmployeesNotInStructure(1);
        expect(result).toHaveLength(1);
        expect(result[0].authId).toBe("emp-2");
    });

    it("returns all employees when structure is empty", async () => {
        queueDbResult([mockEmployee, { authId: "emp-2", name: "Jane" }]);
        const result = await getEmployeesNotInStructure(1);
        expect(result).toHaveLength(2);
    });
});

// ─── assignEmployeeToStructure ───────────────────────────────────────────────

describe("assignEmployeeToStructure", () => {
    const assignData = {
        userId: "emp-1",
        salaryStructureId: 1,
        effectiveFrom: new Date("2025-01-01"),
    };

    beforeEach(() => setupUser());

    it("throws if user not logged in", async () => {
        mockGetUser.mockResolvedValue(null);
        await expect(assignEmployeeToStructure(assignData, "/")).rejects.toThrow("User not logged in");
    });

    it("returns error if structure not found", async () => {
        queueDbResult([]); // structure not found in transaction
        const result = await assignEmployeeToStructure(
            { ...assignData, salaryStructureId: 99 }, "/"
        );
        expect(result?.error?.reason).toContain("Salary structure not found");
    });

    it("returns error if structure is inactive", async () => {
        queueDbResult([{ id: 1, active: false, employeeCount: 0 }]); // inactive structure
        const result = await assignEmployeeToStructure(assignData, "/");
        expect(result?.error?.reason).toContain("inactive");
    });

    it("assigns employee successfully without existing assignment", async () => {
        queueDbResult([mockStructure]); // structure found and active
        queueDbResult([mockEmployee]); // employee found
        queueDbResult([]); // no current salary assignment
        queueDbResult([]); // insert new
        queueDbResult([]); // increment new count
        const result = await assignEmployeeToStructure(assignData, "/");
        expect(result?.success?.reason).toContain("Successfully assigned");
    });

    it("moves employee from old structure to new one", async () => {
        queueDbResult([mockStructure]); // new structure found
        queueDbResult([mockEmployee]); // employee found
        queueDbResult([{ id: 5, structureId: 2 }]); // existing assignment to different structure
        queueDbResult([]); // update old record end date
        queueDbResult([]); // decrement old count
        queueDbResult([]); // insert new entry
        queueDbResult([]); // increment new count
        const result = await assignEmployeeToStructure(assignData, "/");
        expect(result?.success?.reason).toContain("Successfully assigned");
    });

    it("returns error if employee already in same structure", async () => {
        queueDbResult([mockStructure]); // structure found
        queueDbResult([mockEmployee]); // employee found
        queueDbResult([{ id: 5, structureId: 1 }]); // same structure id
        const result = await assignEmployeeToStructure(assignData, "/");
        expect(result?.error?.reason).toContain("already assigned to this structure");
    });
});

// ─── removeEmployeeFromStructure ─────────────────────────────────────────────

describe("removeEmployeeFromStructure", () => {
    const effectiveDate = new Date("2025-06-01");

    beforeEach(() => setupUser());

    it("throws if user not logged in", async () => {
        mockGetUser.mockResolvedValue(null);
        await expect(removeEmployeeFromStructure(5, 1, effectiveDate, "/")).rejects.toThrow("User not logged in");
    });

    it("removes employee from structure successfully", async () => {
        // In transaction: update employeeSalary, update salaryStructure count
        queueDbResult([]); // update
        queueDbResult([]); // decrement count
        const result = await removeEmployeeFromStructure(5, 1, effectiveDate, "/");
        expect(result?.success?.reason).toContain("Employee has been removed from the salary structure");
    });
});
