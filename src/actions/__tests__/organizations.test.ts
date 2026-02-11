import { describe, it, expect, vi } from "vitest";
import {
    mockSessionApi,
    mockOrgApi,
    mockGetSession,
    mockGetFullOrganization,
    mockDbChain,
    mockDbResult,
    mockQueryFindFirst,
    mockQueryFindMany,
    mockCanCreateOrganization,
    mockGetUserPlan,
    mockGetOrgOwnerPlan,
    mockTransaction,
    mockGenerateId,
    defaultSession,
    defaultOrganization,
    DEFAULT_USER_ID,
    DEFAULT_ORG_ID,
} from "./helpers/setup";

import {
    validateOrganizationCreation,
    getOrganizationSubscriptionContext,
    acceptInvitationAndCreateEmployee,
} from "@/actions/organizations";

// ─── validateOrganizationCreation ───────────────────────────────────────────

describe("validateOrganizationCreation", () => {
    it("should return canCreate true when user is under limit", async () => {
        mockSessionApi();
        mockCanCreateOrganization.mockResolvedValue({
            canCreate: true,
            currentCount: 1,
            limit: 3,
        });
        mockGetUserPlan.mockResolvedValue("pro");

        const result = await validateOrganizationCreation();

        expect(result).toEqual({ canCreate: true, error: null });
    });

    it("should return canCreate false when session is missing", async () => {
        mockGetSession.mockResolvedValue(null);

        const result = await validateOrganizationCreation();

        expect(result).toEqual({
            canCreate: false,
            error: "User not authenticated",
        });
    });

    it("should return canCreate false with upgrade message when limit reached (free plan)", async () => {
        mockSessionApi();
        mockCanCreateOrganization.mockResolvedValue({
            canCreate: false,
            currentCount: 1,
            limit: 1,
        });
        mockGetUserPlan.mockResolvedValue("free");

        const result = await validateOrganizationCreation();

        expect(result.canCreate).toBe(false);
        expect(result.error).toContain("Free plan allows 1 organization");
        expect(result.error).toContain("upgrade to Pro");
    });

    it("should return canCreate false with upgrade message when limit reached (pro plan)", async () => {
        mockSessionApi();
        mockCanCreateOrganization.mockResolvedValue({
            canCreate: false,
            currentCount: 3,
            limit: 3,
        });
        mockGetUserPlan.mockResolvedValue("pro");

        const result = await validateOrganizationCreation();

        expect(result.canCreate).toBe(false);
        expect(result.error).toContain("Pro plan allows 3 organizations");
        expect(result.error).toContain("upgrade to Premium");
    });

    it("should return canCreate false on unexpected error", async () => {
        mockSessionApi();
        mockCanCreateOrganization.mockRejectedValue(new Error("DB down"));

        const result = await validateOrganizationCreation();

        expect(result).toEqual({
            canCreate: false,
            error: "Failed to validate organization creation",
        });
    });
});

// ─── getOrganizationSubscriptionContext ──────────────────────────────────────

describe("getOrganizationSubscriptionContext", () => {
    it("should return full context on success", async () => {
        const userSub = { userId: DEFAULT_USER_ID, plan: "pro" };
        const ownerSub = { userId: "owner-001", plan: "premium" };

        // First call: user subscription
        // Second call: org lookup
        // Third call: owner subscription
        mockQueryFindFirst
            .mockResolvedValueOnce(userSub) // subscriptions for user
            .mockResolvedValueOnce({ ownerId: "owner-001" }) // organization
            .mockResolvedValueOnce(ownerSub); // subscriptions for owner

        mockGetUserPlan.mockResolvedValue("pro");
        mockGetOrgOwnerPlan.mockResolvedValue("premium");

        const result = await getOrganizationSubscriptionContext(
            DEFAULT_USER_ID,
            DEFAULT_ORG_ID,
        );

        expect(result).toEqual({
            success: true,
            data: {
                userSubscription: userSub,
                userPlan: "pro",
                orgOwnerSubscription: ownerSub,
                orgOwnerPlan: "premium",
            },
            error: null,
        });
    });

    it("should return null orgOwnerSubscription when org has no owner", async () => {
        const userSub = { userId: DEFAULT_USER_ID, plan: "free" };

        mockQueryFindFirst
            .mockResolvedValueOnce(userSub) // user subscription
            .mockResolvedValueOnce({ ownerId: null }); // org with no owner

        mockGetUserPlan.mockResolvedValue("free");
        mockGetOrgOwnerPlan.mockResolvedValue("free");

        const result = await getOrganizationSubscriptionContext(
            DEFAULT_USER_ID,
            DEFAULT_ORG_ID,
        );

        expect(result.success).toBe(true);
        expect(result.data!.orgOwnerSubscription).toBeNull();
    });

    it("should return error on exception", async () => {
        mockQueryFindFirst.mockRejectedValue(new Error("Connection failed"));

        const result = await getOrganizationSubscriptionContext(
            DEFAULT_USER_ID,
            DEFAULT_ORG_ID,
        );

        expect(result).toEqual({
            success: false,
            data: null,
            error: "Failed to fetch subscription context",
        });
    });
});

// ─── acceptInvitationAndCreateEmployee ──────────────────────────────────────

describe("acceptInvitationAndCreateEmployee", () => {
    const pendingInvitation = {
        id: "inv-001",
        organizationId: DEFAULT_ORG_ID,
        role: "member",
        status: "pending",
        department: "hr",
        expiresAt: new Date(Date.now() + 86400000), // +1 day
    };

    it("should return success on happy path", async () => {
        mockSessionApi();
        mockQueryFindFirst.mockResolvedValue(pendingInvitation);

        // Transaction mock
        const txChain: Record<string, ReturnType<typeof vi.fn>> = {};
        const txMethods = [
            "insert", "update", "set", "values", "where", "returning", "from",
        ];
        for (const m of txMethods) {
            txChain[m] = vi.fn().mockReturnValue(txChain);
        }
        txChain.returning.mockResolvedValue([
            { authId: DEFAULT_USER_ID, department: "hr" },
        ]);
        txChain.where.mockImplementation(() => txChain);

        mockTransaction.mockImplementation(async (cb) => {
            const result = await cb(txChain);
            return { organizationId: pendingInvitation.organizationId };
        });

        const result =
            await acceptInvitationAndCreateEmployee("inv-001");

        expect(result).toEqual({
            success: true,
            organizationId: DEFAULT_ORG_ID,
        });
    });

    it("should return error when unauthenticated", async () => {
        mockGetSession.mockResolvedValue(null);

        const result =
            await acceptInvitationAndCreateEmployee("inv-001");

        expect(result).toEqual({
            success: false,
            error: "User not authenticated",
        });
    });

    it("should return error when invitation not found", async () => {
        mockSessionApi();
        mockQueryFindFirst.mockResolvedValue(undefined);

        const result =
            await acceptInvitationAndCreateEmployee("inv-999");

        expect(result).toEqual({
            success: false,
            error: "Invitation not found",
        });
    });

    it("should return error when invitation already accepted", async () => {
        mockSessionApi();
        mockQueryFindFirst.mockResolvedValue({
            ...pendingInvitation,
            status: "accepted",
        });

        const result =
            await acceptInvitationAndCreateEmployee("inv-001");

        expect(result).toEqual({
            success: false,
            error: "Invitation has already been processed",
        });
    });

    it("should return error when invitation has expired", async () => {
        mockSessionApi();
        mockQueryFindFirst.mockResolvedValue({
            ...pendingInvitation,
            expiresAt: new Date(Date.now() - 86400000), // -1 day
        });

        const result =
            await acceptInvitationAndCreateEmployee("inv-001");

        expect(result).toEqual({
            success: false,
            error: "Invitation has expired",
        });
    });

    it("should return error on transaction failure", async () => {
        mockSessionApi();
        mockQueryFindFirst.mockResolvedValue(pendingInvitation);
        mockTransaction.mockRejectedValue(new Error("Transaction deadlock"));

        const result =
            await acceptInvitationAndCreateEmployee("inv-001");

        expect(result).toEqual({
            success: false,
            error: "Transaction deadlock",
        });
    });
});
