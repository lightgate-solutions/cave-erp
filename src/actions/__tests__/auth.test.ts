import { describe, it, expect } from "vitest";
import {
    mockGetFullOrganization,
    mockAuthApiBanUser,
    mockAuthApiUnbanUser,
    mockAuthApiRemoveUser,
    mockAuthApiRevokeUserSessions,
    mockAuthApiCreateUser,
    mockAuthApiSetRole,
    mockDbChain,
    mockDbResult,
    mockTransaction,
    mockCreateNotification,
    mockOrgApi,
    defaultOrganization,
    DEFAULT_USER_ID,
} from "./helpers/setup";

// Import the functions under test AFTER mock setup
import {
    banUser,
    unbanUser,
    deleteUser,
    revokeUserSessions,
    createUser,
    updateUserRole,
} from "@/actions/auth/auth";

// ─── banUser ────────────────────────────────────────────────────────────────

describe("banUser", () => {
    it("should return success when user is banned", async () => {
        mockAuthApiBanUser.mockResolvedValue({
            user: { name: "Bad Actor" },
        });

        const result = await banUser("u1", "Violation of ToS", 86400);

        expect(result).toEqual({
            success: { reason: "User Bad Actor banned successful!" },
            error: null,
            data: undefined,
        });
        expect(mockAuthApiBanUser).toHaveBeenCalledWith(
            expect.objectContaining({
                body: { userId: "u1", banReason: "Violation of ToS", banExpiresIn: 86400 },
            }),
        );
    });

    it("should return error on APIError", async () => {
        const { APIError } = await import("better-auth/api");
        mockAuthApiBanUser.mockRejectedValue(
            new APIError("FORBIDDEN", { message: "Not authorized to ban" }),
        );

        const result = await banUser("u1", "reason");

        expect(result).toEqual({
            error: { reason: "Not authorized to ban" },
            success: null,
        });
    });

    it("should return generic error for unknown exceptions", async () => {
        mockAuthApiBanUser.mockRejectedValue(new Error("network failure"));

        const result = await banUser("u1", "reason");

        expect(result).toEqual({
            error: { reason: "Couldn't ban user. Try again!" },
            success: null,
        });
    });
});

// ─── unbanUser ──────────────────────────────────────────────────────────────

describe("unbanUser", () => {
    it("should return success and send notification", async () => {
        mockOrgApi();
        mockAuthApiUnbanUser.mockResolvedValue({
            user: { name: "Restored User" },
        });
        // Mock employee lookup for notification
        mockDbResult([{ authId: "u1", name: "Restored User" }]);

        const result = await unbanUser("u1");

        expect(result).toEqual({
            success: { reason: "User Restored User has been unbanned successful!" },
            error: null,
            data: undefined,
        });
        expect(mockCreateNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                user_id: "u1",
                title: "Account Unbanned",
            }),
        );
    });

    it("should succeed without notification when employee not found", async () => {
        mockOrgApi();
        mockAuthApiUnbanUser.mockResolvedValue({
            user: { name: "External User" },
        });
        // Empty array = no matching employee record
        mockDbResult([]);

        const result = await unbanUser("u1");

        expect(result).toEqual({
            success: { reason: "User External User has been unbanned successful!" },
            error: null,
            data: undefined,
        });
        // Notification should NOT have been called
        expect(mockCreateNotification).not.toHaveBeenCalled();
    });

    it("should return error when organization not found", async () => {
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await unbanUser("u1");

        expect(result).toEqual({
            success: null,
            error: { reason: "Organization not found" },
        });
    });

    it("should return error on APIError", async () => {
        mockOrgApi();
        const { APIError } = await import("better-auth/api");
        mockAuthApiUnbanUser.mockRejectedValue(
            new APIError("BAD_REQUEST", { message: "User not banned" }),
        );

        const result = await unbanUser("u1");

        expect(result).toEqual({
            error: { reason: "User not banned" },
            success: null,
        });
    });

    it("should return generic error for unknown exceptions", async () => {
        mockOrgApi();
        mockAuthApiUnbanUser.mockRejectedValue(new Error("boom"));

        const result = await unbanUser("u1");

        expect(result).toEqual({
            error: { reason: "Couldn't unban user. Try again!" },
            success: null,
        });
    });
});

// ─── deleteUser ─────────────────────────────────────────────────────────────

describe("deleteUser", () => {
    it("should return success when user is deleted", async () => {
        mockOrgApi();
        mockAuthApiRemoveUser.mockResolvedValue(undefined);
        // Mock db.delete().where()
        mockDbChain.where.mockResolvedValue(undefined);

        const result = await deleteUser("u1");

        expect(result).toEqual({
            success: { reason: "User has been deleted permanently!" },
            error: null,
            data: undefined,
        });
    });

    it("should return error when organization not found", async () => {
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await deleteUser("u1");

        expect(result).toEqual({
            success: null,
            error: { reason: "Organization not found" },
        });
    });

    it("should return error on APIError", async () => {
        mockOrgApi();
        const { APIError } = await import("better-auth/api");
        mockAuthApiRemoveUser.mockRejectedValue(
            new APIError("NOT_FOUND", { message: "User not found" }),
        );

        const result = await deleteUser("u1");

        expect(result).toEqual({
            error: { reason: "User not found" },
            success: null,
        });
    });

    it("should return generic error for unknown exceptions", async () => {
        mockOrgApi();
        mockAuthApiRemoveUser.mockRejectedValue(new Error("db error"));

        const result = await deleteUser("u1");

        expect(result).toEqual({
            error: { reason: "Failed to delete user. Try again!" },
            success: null,
        });
    });
});

// ─── revokeUserSessions ─────────────────────────────────────────────────────

describe("revokeUserSessions", () => {
    it("should return success when sessions are revoked", async () => {
        mockAuthApiRevokeUserSessions.mockResolvedValue(undefined);

        const result = await revokeUserSessions("u1");

        expect(result).toEqual({
            success: { reason: "user session has been revoked!" },
            error: null,
            data: undefined,
        });
        expect(mockAuthApiRevokeUserSessions).toHaveBeenCalledWith(
            expect.objectContaining({
                body: { userId: "u1" },
            }),
        );
    });

    it("should return error on APIError", async () => {
        const { APIError } = await import("better-auth/api");
        mockAuthApiRevokeUserSessions.mockRejectedValue(
            new APIError("BAD_REQUEST", { message: "Invalid user" }),
        );

        const result = await revokeUserSessions("u1");

        expect(result).toEqual({
            error: { reason: "Invalid user" },
            success: null,
        });
    });

    it("should return generic error for unknown exceptions", async () => {
        mockAuthApiRevokeUserSessions.mockRejectedValue(
            new Error("session store error"),
        );

        const result = await revokeUserSessions("u1");

        expect(result).toEqual({
            error: { reason: "Failed to revoke user session. Try again!" },
            success: null,
        });
    });
});

// ─── createUser ─────────────────────────────────────────────────────────────

describe("createUser", () => {
    const validData = {
        name: "New User",
        email: "new@test.com",
        password: "securePass123",
        role: "user" as const,
        isManager: false,
        data: {
            phone: "555-0100",
            staffNumber: "EMP-100",
            department: "hr",
        },
    };

    it("should return success on valid creation", async () => {
        mockOrgApi();
        mockAuthApiCreateUser.mockResolvedValue({
            user: { id: "new-auth-id", role: "user" },
        });

        // Transaction mock
        const txChain: Record<string, ReturnType<typeof import("vitest").vi.fn>> = {};
        const txMethods = [
            "insert", "update", "set", "values", "where", "returning", "from",
        ];
        for (const m of txMethods) {
            txChain[m] = (await import("vitest")).vi.fn().mockReturnValue(txChain);
        }
        txChain.returning.mockResolvedValue([
            { authId: "new-auth-id", department: "hr" },
        ]);
        txChain.where.mockImplementation(() => txChain);

        mockTransaction.mockImplementation(async (cb) => cb(txChain));

        const result = await createUser(validData);

        expect(result).toEqual({
            success: { reason: "User created successfully" },
            error: null,
            data: null,
        });
        expect(mockAuthApiCreateUser).toHaveBeenCalled();
    });

    it("should pass emailVerified when autoVerify is true", async () => {
        mockOrgApi();
        mockAuthApiCreateUser.mockResolvedValue({
            user: { id: "verified-id", role: "user" },
        });

        // Transaction mock
        const txChain: Record<string, ReturnType<typeof import("vitest").vi.fn>> = {};
        const txMethods = [
            "insert", "update", "set", "values", "where", "returning", "from",
        ];
        for (const m of txMethods) {
            txChain[m] = (await import("vitest")).vi.fn().mockReturnValue(txChain);
        }
        txChain.returning.mockResolvedValue([
            { authId: "verified-id", department: "hr" },
        ]);
        txChain.where.mockImplementation(() => txChain);

        mockTransaction.mockImplementation(async (cb) => cb(txChain));

        const result = await createUser({ ...validData, autoVerify: true });

        expect(result).toEqual({
            success: { reason: "User created successfully" },
            error: null,
            data: null,
        });
        // Verify autoVerify causes emailVerified: true in the API call body
        expect(mockAuthApiCreateUser).toHaveBeenCalledWith(
            expect.objectContaining({
                body: expect.objectContaining({
                    data: expect.objectContaining({
                        emailVerified: true,
                    }),
                }),
            }),
        );
    });

    it("should return error when organization not found", async () => {
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await createUser(validData);

        expect(result).toEqual({
            error: { reason: "Organization not found" },
            success: null,
            data: null,
        });
    });

    it("should return error on APIError", async () => {
        mockOrgApi();
        const { APIError } = await import("better-auth/api");
        mockAuthApiCreateUser.mockRejectedValue(
            new APIError("BAD_REQUEST", { message: "Email already exists" }),
        );

        const result = await createUser(validData);

        expect(result).toEqual({
            error: { reason: "Email already exists" },
            success: null,
            data: null,
        });
    });

    it("should return generic error for unknown exceptions", async () => {
        mockOrgApi();
        mockAuthApiCreateUser.mockRejectedValue(new Error("unexpected"));

        const result = await createUser(validData);

        expect(result).toEqual({
            error: { reason: "Couldn't create user. Try again!" },
            success: null,
            data: null,
        });
    });
});

// ─── updateUserRole ─────────────────────────────────────────────────────────

describe("updateUserRole", () => {
    it("should return success and send notification", async () => {
        mockOrgApi();
        mockAuthApiSetRole.mockResolvedValue(undefined);
        // Mock employee lookup for notification
        mockDbResult([{ authId: "u1", name: "Some User" }]);

        const result = await updateUserRole("u1", "admin");

        expect(result).toEqual({
            success: { reason: "Updated users role successfully" },
            error: null,
            data: undefined,
        });
        expect(mockAuthApiSetRole).toHaveBeenCalledWith(
            expect.objectContaining({
                body: { userId: "u1", role: "admin" },
            }),
        );
        expect(mockCreateNotification).toHaveBeenCalledWith(
            expect.objectContaining({
                user_id: "u1",
                title: "Role Updated",
                message: "Your account role has been changed to: admin",
            }),
        );
    });

    it("should return error when organization not found", async () => {
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await updateUserRole("u1", "admin");

        expect(result).toEqual({
            success: null,
            error: { reason: "Organization not found" },
        });
    });

    it("should return error on APIError", async () => {
        mockOrgApi();
        const { APIError } = await import("better-auth/api");
        mockAuthApiSetRole.mockRejectedValue(
            new APIError("FORBIDDEN", { message: "Cannot change role" }),
        );

        const result = await updateUserRole("u1", "admin");

        expect(result).toEqual({
            error: { reason: "Cannot change role" },
            success: null,
        });
    });

    it("should return generic error for unknown exceptions", async () => {
        mockOrgApi();
        mockAuthApiSetRole.mockRejectedValue(new Error("db write error"));

        const result = await updateUserRole("u1", "admin");

        expect(result).toEqual({
            error: { reason: "Couldn't update user role. Try again!" },
            success: null,
        });
    });
});
