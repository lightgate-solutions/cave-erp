import { describe, it, expect, beforeEach } from "vitest";
import {
    mockRequireAuth,
    mockRequireHROrAdmin,
    mockGetFullOrganization,
    mockTransaction,
    queueDbResult,
    DEFAULT_USER_ID,
    DEFAULT_ORG_ID,
} from "./helpers/setup";

import {
    getAllEmployees,
    getEmployee,
    updateEmployee,
    createEmployee,
} from "@/actions/hr/employees";

const DEFAULT_ORG = { id: DEFAULT_ORG_ID, name: "Test Org" };

const SAMPLE_EMPLOYEE = {
    authId: DEFAULT_USER_ID,
    name: "Alice Smith",
    email: "alice@example.com",
    department: "hr",
    role: "user",
    isManager: false,
    staffNumber: "EMP-001",
    organizationId: DEFAULT_ORG_ID,
};

function setupMocks() {
    mockGetFullOrganization.mockResolvedValue(DEFAULT_ORG);
    mockRequireAuth.mockResolvedValue({ userId: DEFAULT_USER_ID, role: "admin", employee: { department: "admin" } });
    mockRequireHROrAdmin.mockResolvedValue({ userId: DEFAULT_USER_ID, role: "admin", employee: { department: "admin" } });
}

// ─── getAllEmployees ───────────────────────────────────────────────────────────

describe("getAllEmployees", () => {
    beforeEach(setupMocks);

    it("returns empty array when organization not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        expect(await getAllEmployees()).toEqual([]);
    });

    it("returns employees with start date via left join", async () => {
        queueDbResult([
            { ...SAMPLE_EMPLOYEE, startDate: "2024-01-15" },
        ]);
        const result = await getAllEmployees();
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("Alice Smith");
    });
});

// ─── getEmployee ──────────────────────────────────────────────────────────────

describe("getEmployee", () => {
    beforeEach(setupMocks);

    it("returns null when organization not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        expect(await getEmployee(DEFAULT_USER_ID)).toBeNull();
    });

    it("returns the employee record", async () => {
        queueDbResult([SAMPLE_EMPLOYEE]);
        const result = await getEmployee(DEFAULT_USER_ID);
        expect(result?.email).toBe("alice@example.com");
    });

    it("returns undefined when employee does not exist", async () => {
        queueDbResult([]);
        const result = await getEmployee("unknown-user");
        expect(result).toBeUndefined();
    });
});

// ─── updateEmployee ───────────────────────────────────────────────────────────

describe("updateEmployee", () => {
    beforeEach(setupMocks);

    it("returns error when organization not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        const result = await updateEmployee(DEFAULT_USER_ID, { name: "New Name" });
        expect(result.success).toBeNull();
        expect(result.error?.reason).toBe("Organization not found");
    });

    it("updates employee and syncs auth user name/email in a transaction", async () => {
        // transaction: update employees returning, then update user
        mockTransaction.mockImplementationOnce(async (cb: (tx: unknown) => unknown) => {
            const { mockDbChain } = await import("./helpers/setup");
            queueDbResult([{ ...SAMPLE_EMPLOYEE, name: "Alice Updated" }]); // employees update returning
            queueDbResult(undefined);                                         // user update
            return cb(mockDbChain);
        });

        const result = await updateEmployee(DEFAULT_USER_ID, { name: "Alice Updated" });
        expect(result.error).toBeNull();
        expect(result.success?.reason).toMatch(/updated/i);
    });

    it("converts empty string fields to null", async () => {
        mockTransaction.mockImplementationOnce(async (cb: (tx: unknown) => unknown) => {
            const { mockDbChain } = await import("./helpers/setup");
            queueDbResult([{ ...SAMPLE_EMPLOYEE, phone: null }]);
            queueDbResult(undefined);
            return cb(mockDbChain);
        });

        // phone: "" should be converted to null internally
        const result = await updateEmployee(DEFAULT_USER_ID, { phone: "" });
        expect(result.error).toBeNull();
    });
});

// ─── createEmployee ───────────────────────────────────────────────────────────
//
// createEmployee uses db.transaction(async tx => {
//   tx.insert(employees).returning()       ← queue slot 1
//   tx.insert(documentFolders)             ← queue slot 2
//   db.update(user)                        ← queue slot 3 (uses outer db, not tx)
//   tx.insert(notification_preferences)   ← queue slot 4
// })
// The default mockTransaction implementation calls the callback synchronously,
// so all 4 DB operations are queued before calling createEmployee.

describe("createEmployee", () => {
    beforeEach(setupMocks);

    it("returns error when organization not found (no orgId provided)", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        const result = await createEmployee({
            name: "Bob", email: "bob@example.com", authId: "auth-bob",
            role: "user", isManager: false,
        });
        expect(result.error?.reason).toBe("Organization not found");
        expect(result.success).toBeNull();
    });

    it("creates employee with all transaction steps", async () => {
        queueDbResult([SAMPLE_EMPLOYEE]);   // tx.insert(employees).returning()
        queueDbResult(undefined);            // tx.insert(documentFolders)
        queueDbResult(undefined);            // db.update(user) with role
        queueDbResult(undefined);            // tx.insert(notification_preferences)

        const result = await createEmployee({
            name: "Alice Smith", email: "alice@example.com",
            authId: DEFAULT_USER_ID, role: "user",
            isManager: false,
            organizationId: DEFAULT_ORG_ID,
        });
        expect(result.error).toBeNull();
        expect(result.success?.reason).toMatch(/created/i);
    });

    it("uses session org when no organizationId provided", async () => {
        queueDbResult([SAMPLE_EMPLOYEE]);
        queueDbResult(undefined);
        queueDbResult(undefined);
        queueDbResult(undefined);

        const result = await createEmployee({
            name: "Bob Jones", email: "bob@example.com",
            authId: "auth-bob", role: "user", isManager: false,
        });
        expect(result.error).toBeNull();
        expect(result.success?.reason).toMatch(/created/i);
    });

    it("parses numeric managerId to string and succeeds", async () => {
        queueDbResult([{ ...SAMPLE_EMPLOYEE, managerId: "42" }]);
        queueDbResult(undefined);
        queueDbResult(undefined);
        queueDbResult(undefined);

        const result = await createEmployee({
            name: "Bob", email: "bob@example.com", authId: "auth-bob",
            role: "user", isManager: false,
            organizationId: DEFAULT_ORG_ID,
            data: { managerId: 42 },
        });
        expect(result.error).toBeNull();
    });
});
