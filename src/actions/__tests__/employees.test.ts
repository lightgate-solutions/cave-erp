import { describe, it, expect, vi } from "vitest";
import {
    mockAuthSession,
    mockSessionApi,
    mockOrgApi,
    mockRequireAuth,
    mockRequireHROrAdmin,
    mockGetFullOrganization,
    mockDbChain,
    mockDbResult,
    mockRevalidatePath,
    mockTransaction,
    defaultOrganization,
    DEFAULT_USER_ID,
} from "./helpers/setup";

// Import the functions under test AFTER mock setup
import {
    getAllEmployees,
    getEmployee,
    updateEmployee,
    createEmployee,
} from "@/actions/hr/employees";

// ─── getAllEmployees ─────────────────────────────────────────────────────────

describe("getAllEmployees", () => {
    it("should return employee list when authenticated and org found", async () => {
        mockAuthSession();
        mockSessionApi();
        mockOrgApi();

        const fakeEmployees = [
            { id: "u1", name: "Alice", email: "alice@test.com", department: "hr" },
            { id: "u2", name: "Bob", email: "bob@test.com", department: "finance" },
        ];
        mockDbResult(fakeEmployees);

        const result = await getAllEmployees();
        expect(result).toEqual(fakeEmployees);
    });

    it("should return empty array when organization not found", async () => {
        mockAuthSession();
        mockSessionApi();
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await getAllEmployees();
        expect(result).toEqual([]);
    });

    it("should throw when requireAuth fails", async () => {
        mockRequireAuth.mockRejectedValue(
            new Error("Unauthorized: Authentication required"),
        );

        await expect(getAllEmployees()).rejects.toThrow(
            "Unauthorized: Authentication required",
        );
    });
});

// ─── getEmployee ────────────────────────────────────────────────────────────

describe("getEmployee", () => {
    it("should return single employee when found", async () => {
        mockAuthSession();
        mockSessionApi();
        mockOrgApi();

        const fakeEmployee = {
            authId: "u1",
            name: "Alice",
            email: "alice@test.com",
        };
        // getEmployee chains .then((res) => res[0]), so mock must resolve with an array
        mockDbResult([fakeEmployee]);

        const result = await getEmployee("u1");
        expect(result).toEqual(fakeEmployee);
    });

    it("should return null when organization not found", async () => {
        mockAuthSession();
        mockSessionApi();
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await getEmployee("u1");
        expect(result).toBeNull();
    });

    it("should throw when requireAuth fails", async () => {
        mockRequireAuth.mockRejectedValue(
            new Error("Unauthorized: Authentication required"),
        );

        await expect(getEmployee("u1")).rejects.toThrow(
            "Unauthorized: Authentication required",
        );
    });
});

// ─── updateEmployee ─────────────────────────────────────────────────────────

describe("updateEmployee", () => {
    it("should return success on valid update and call revalidatePath", async () => {
        mockAuthSession();
        mockSessionApi();
        mockOrgApi();

        // Transaction mock: tx has two update calls.
        // 1st: tx.update(employees).set(...).where(...).returning() → resolves with emp
        // 2nd: tx.update(user).set(...).where(...) → no .returning(), must be awaitable
        const txChain: Record<string, ReturnType<typeof vi.fn>> = {};
        const txMethods = [
            "update", "insert", "set", "values", "returning",
            "from", "select", "leftJoin", "limit",
        ];
        for (const m of txMethods) {
            txChain[m] = vi.fn().mockReturnValue(txChain);
        }
        txChain.returning.mockResolvedValue([{ authId: DEFAULT_USER_ID }]);

        // where() must return txChain for first call (.returning() follows),
        // but return a resolved Promise for second call (bare await without .returning())
        let whereCallCount = 0;
        txChain.where = vi.fn().mockImplementation(() => {
            whereCallCount++;
            if (whereCallCount <= 1) {
                return txChain; // first where → .returning() follows
            }
            return Promise.resolve(undefined); // second where → awaited directly
        });

        mockTransaction.mockImplementation(async (cb) => cb(txChain));

        const result = await updateEmployee("u1", { name: "Updated Name" });

        expect(result).toEqual({
            success: { reason: "Employee updated successfully" },
            error: null,
        });
        expect(mockRevalidatePath).toHaveBeenCalledWith("/hr/employees");
        // Verify both update calls were made in the transaction
        expect(txChain.update).toHaveBeenCalledTimes(2);
    });

    it("should return error when organization not found", async () => {
        mockAuthSession();
        mockSessionApi();
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await updateEmployee("u1", { name: "X" });

        expect(result).toEqual({
            success: null,
            error: { reason: "Organization not found" },
        });
    });

    it("should return error on DrizzleQueryError", async () => {
        mockAuthSession();
        mockSessionApi();
        mockOrgApi();

        // DrizzleQueryError takes (query, params, cause) — 3 args
        const { DrizzleQueryError } = await import("drizzle-orm");
        const cause = new Error("unique_violation");
        const drizzleErr = new DrizzleQueryError("UPDATE employees SET ...", [], cause);

        mockTransaction.mockRejectedValue(drizzleErr);

        const result = await updateEmployee("u1", { name: "X" });

        expect(result).toEqual({
            success: null,
            error: { reason: cause.message },
        });
    });

    it("should return generic error for unknown exceptions", async () => {
        mockAuthSession();
        mockSessionApi();
        mockOrgApi();

        mockTransaction.mockRejectedValue(new Error("something unexpected"));

        const result = await updateEmployee("u1", { name: "X" });

        expect(result).toEqual({
            error: {
                reason: "Couldn't update employee. Check inputs and try again!",
            },
            success: null,
        });
    });

    it("should throw when requireHROrAdmin fails", async () => {
        mockRequireHROrAdmin.mockRejectedValue(
            new Error("Forbidden: HR or Admin access required"),
        );

        await expect(updateEmployee("u1", { name: "X" })).rejects.toThrow(
            "Forbidden: HR or Admin access required",
        );
    });
});

// ─── createEmployee ─────────────────────────────────────────────────────────

describe("createEmployee", () => {
    const validData = {
        name: "New User",
        email: "new@test.com",
        authId: "new-user-001",
        role: "user" as const,
        isManager: false,
        data: {
            phone: "555-0100",
            staffNumber: "EMP-100",
            department: "hr",
        },
    };

    it("should return success on valid creation (org from session)", async () => {
        mockSessionApi();
        mockOrgApi();

        const txChain: any = {};
        for (const m of ["insert", "values", "returning", "update", "set", "where"]) {
            txChain[m] = vi.fn().mockReturnValue(txChain);
        }
        txChain.returning.mockResolvedValue([
            { authId: validData.authId, department: "hr" },
        ]);

        // Make inserts/updates without `.returning()` awaitable
        txChain.then = (resolve: any) => Promise.resolve(resolve(undefined));

        mockTransaction.mockImplementation(async (cb) => cb(txChain));

        const result = await createEmployee(validData);

        expect(result).toEqual({
            success: { reason: "User created successfully" },
            error: null,
            data: null,
        });
        expect(mockDbChain.update).toHaveBeenCalled(); // db.update(user) path executed
    });

    it("should return success when organizationId is passed directly", async () => {
        // No need for session/org mock since orgId is provided
        const txChain: any = {};
        for (const m of ["insert", "values", "returning", "update", "set", "where"]) {
            txChain[m] = vi.fn().mockReturnValue(txChain);
        }
        txChain.returning.mockResolvedValue([
            { authId: validData.authId, department: "hr" },
        ]);

        // Make inserts/updates without `.returning()` awaitable
        txChain.then = (resolve: any) => Promise.resolve(resolve(undefined));

        mockTransaction.mockImplementation(async (cb) => cb(txChain));

        const result = await createEmployee({
            ...validData,
            organizationId: "org-direct",
        });

        expect(result).toEqual({
            success: { reason: "User created successfully" },
            error: null,
            data: null,
        });
        expect(mockDbChain.update).toHaveBeenCalled(); // db.update(user) path executed
    });

    it("should return error when organization not found and no orgId", async () => {
        mockSessionApi();
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await createEmployee(validData);

        expect(result).toEqual({
            error: { reason: "Organization not found" },
            success: null,
            data: null,
        });
    });

    it("should return error on APIError", async () => {
        mockSessionApi();
        mockOrgApi();

        const { APIError } = await import("better-auth");
        mockTransaction.mockRejectedValue(new APIError("BAD_REQUEST", { message: "Email already exists" }));

        const result = await createEmployee(validData);

        expect(result).toEqual({
            error: { reason: "Email already exists" },
            success: null,
            data: null,
        });
    });

    it("should return generic error for unknown exceptions", async () => {
        mockSessionApi();
        mockOrgApi();

        mockTransaction.mockRejectedValue(new Error("boom"));

        const result = await createEmployee(validData);

        expect(result).toEqual({
            error: { reason: "Couldn't create user. Try again!" },
            success: null,
            data: null,
        });
    });
});
