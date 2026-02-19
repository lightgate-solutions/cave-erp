import { describe, it, expect, vi } from "vitest";
import {
    mockGetUser,
    mockQueryFindFirst,
    mockQueryFindMany,
    mockDbChain,
    mockTransaction,
    mockRedirect,
    mockSendInvoiceEmail,
    mockCalculatePlanChangeProration,
    DEFAULT_USER_ID,
} from "./helpers/setup";

// Import the functions under test AFTER mock setup
import {
    getSubscriptionDetails,
    getInvoiceHistory,
    payInvoice,
    createCheckoutSession,
    changePlan,
    requestSubscriptionCancellation,
} from "@/actions/billing";

// ─── Helpers ────────────────────────────────────────────────────────────────

const defaultUser = {
    authId: DEFAULT_USER_ID,
    email: "user@test.com",
    name: "Test User",
};

function mockUser(overrides?: Partial<typeof defaultUser>) {
    const user = { ...defaultUser, ...overrides };
    mockGetUser.mockResolvedValue(user);
    return user;
}

// ─── getSubscriptionDetails ─────────────────────────────────────────────────

describe("getSubscriptionDetails", () => {
    it("should return subscription on success", async () => {
        mockUser();
        const sub = { id: "sub-1", plan: "pro", userId: DEFAULT_USER_ID };
        mockQueryFindFirst.mockResolvedValue(sub);

        const result = await getSubscriptionDetails();

        expect(result).toEqual({ subscription: sub, error: null });
    });

    it("should return error when user not authenticated", async () => {
        mockGetUser.mockResolvedValue(null);

        const result = await getSubscriptionDetails();

        expect(result).toEqual({
            subscription: null,
            error: "User not authenticated",
        });
    });

    it("should return error on db failure", async () => {
        mockUser();
        mockQueryFindFirst.mockRejectedValue(new Error("db fail"));

        const result = await getSubscriptionDetails();

        expect(result).toEqual({
            subscription: null,
            error: "Failed to fetch subscription details",
        });
    });
});

// ─── getInvoiceHistory ──────────────────────────────────────────────────────

describe("getInvoiceHistory", () => {
    it("should return invoices on success", async () => {
        mockUser();
        // First call: findFirst for subscription
        mockQueryFindFirst.mockResolvedValueOnce({ id: "sub-1" });
        // Second call: findMany for invoices
        mockQueryFindMany.mockResolvedValueOnce([
            { id: "inv-1", amount: "5000" },
        ]);

        const result = await getInvoiceHistory();

        expect(result).toEqual({
            invoices: [{ id: "inv-1", amount: "5000" }],
            error: null,
        });
    });

    it("should return error when user not authenticated", async () => {
        mockGetUser.mockResolvedValue(null);

        const result = await getInvoiceHistory();

        expect(result).toEqual({
            invoices: [],
            error: "User not authenticated",
        });
    });

    it("should return empty invoices when no subscription", async () => {
        mockUser();
        mockQueryFindFirst.mockResolvedValue(null);

        const result = await getInvoiceHistory();

        expect(result).toEqual({ invoices: [], error: null });
    });

    it("should return error on db failure", async () => {
        mockUser();
        mockQueryFindFirst.mockRejectedValue(new Error("db fail"));

        const result = await getInvoiceHistory();

        expect(result).toEqual({
            invoices: [],
            error: "Failed to fetch invoice history",
        });
    });
});

// ─── payInvoice ─────────────────────────────────────────────────────────────

describe("payInvoice", () => {
    it("should return error when user not authenticated", async () => {
        mockGetUser.mockResolvedValue(null);

        const result = await payInvoice("inv-1");

        expect(result).toEqual({
            error: "User not authenticated or email is missing.",
        });
    });

    it("should return error when no subscription found", async () => {
        mockUser();
        mockQueryFindFirst.mockResolvedValue(null);

        const result = await payInvoice("inv-1");

        expect(result).toEqual({ error: "No subscription found." });
    });

    it("should return error when invoice not found", async () => {
        mockUser();
        // First findFirst → subscription, second → null invoice
        mockQueryFindFirst
            .mockResolvedValueOnce({ id: "sub-1" })
            .mockResolvedValueOnce(null);

        const result = await payInvoice("inv-1");

        expect(result).toEqual({ error: "Invoice not found." });
    });

    it("should return error when invoice does not belong to user", async () => {
        mockUser();
        mockQueryFindFirst
            .mockResolvedValueOnce({ id: "sub-1" })
            .mockResolvedValueOnce({
                id: "inv-1",
                amount: "5000",
                subscriptionId: "sub-OTHER",
                status: "open",
            });

        const result = await payInvoice("inv-1");

        expect(result).toEqual({
            error: "Invoice does not belong to current user.",
        });
    });

    it("should return error when invoice already paid", async () => {
        mockUser();
        mockQueryFindFirst
            .mockResolvedValueOnce({ id: "sub-1" })
            .mockResolvedValueOnce({
                id: "inv-1",
                amount: "5000",
                subscriptionId: "sub-1",
                status: "paid",
            });

        const result = await payInvoice("inv-1");

        expect(result).toEqual({ error: "Invoice is already paid." });
    });

    it("should return error when PAYSTACK_SECRET_KEY not set", async () => {
        mockUser();
        mockQueryFindFirst
            .mockResolvedValueOnce({ id: "sub-1" })
            .mockResolvedValueOnce({
                id: "inv-1",
                amount: "5000",
                subscriptionId: "sub-1",
                status: "open",
            });
        // Ensure PAYSTACK_SECRET_KEY is not set
        delete process.env.PAYSTACK_SECRET_KEY;

        const result = await payInvoice("inv-1");

        expect(result).toEqual({ error: "Server configuration error." });
    });

    it("should return error on Paystack API failure", async () => {
        mockUser();
        mockQueryFindFirst
            .mockResolvedValueOnce({ id: "sub-1" })
            .mockResolvedValueOnce({
                id: "inv-1",
                amount: "5000",
                subscriptionId: "sub-1",
                status: "open",
            });
        process.env.PAYSTACK_SECRET_KEY = "sk_test_key";

        // Mock global fetch
        const originalFetch = globalThis.fetch;
        globalThis.fetch = vi.fn().mockRejectedValue(new Error("network error"));

        const result = await payInvoice("inv-1");

        expect(result).toEqual({
            error: "An unexpected error occurred while contacting the payment provider.",
        });

        globalThis.fetch = originalFetch;
        delete process.env.PAYSTACK_SECRET_KEY;
    });

    it("should convert amount to Kobo and send correct payload to Paystack", async () => {
        mockUser();
        mockQueryFindFirst
            .mockResolvedValueOnce({ id: "sub-1" })
            .mockResolvedValueOnce({
                id: "inv-1",
                amount: "5000",
                subscriptionId: "sub-1",
                status: "open",
            });
        process.env.PAYSTACK_SECRET_KEY = "sk_test_key";

        const originalFetch = globalThis.fetch;
        globalThis.fetch = vi.fn().mockResolvedValue({
            json: vi.fn().mockResolvedValue({
                status: true,
                data: { authorization_url: "https://paystack.co/pay/abc123" },
            }),
        });

        // redirect throws NEXT_REDIRECT so we catch it
        try {
            await payInvoice("inv-1");
        } catch {
            // redirect throws — expected
        }

        // Verify Kobo conversion: 5000 NGN → 500000 kobo
        expect(globalThis.fetch).toHaveBeenCalledWith(
            "https://api.paystack.co/transaction/initialize",
            expect.objectContaining({
                method: "POST",
                body: expect.stringContaining('"amount":500000'),
            }),
        );

        // Verify metadata in payload
        const callBody = JSON.parse(
            (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
        );
        expect(callBody).toEqual({
            email: "user@test.com",
            amount: 500000,
            metadata: {
                invoice_id: "inv-1",
                user_id: DEFAULT_USER_ID,
                type: "invoice-payment",
            },
        });

        globalThis.fetch = originalFetch;
        delete process.env.PAYSTACK_SECRET_KEY;
    });
});

// ─── createCheckoutSession ──────────────────────────────────────────────────

describe("createCheckoutSession", () => {
    it("should return error when user not authenticated", async () => {
        mockGetUser.mockResolvedValue(null);

        const result = await createCheckoutSession("pro");

        expect(result).toEqual({
            error: "User not authenticated or email is missing.",
        });
    });

    it("should return error when PAYSTACK_SECRET_KEY not set", async () => {
        mockUser();
        delete process.env.PAYSTACK_SECRET_KEY;

        const result = await createCheckoutSession("pro");

        expect(result).toEqual({ error: "Server configuration error." });
    });

    it("should insert new subscription when none exists", async () => {
        mockUser();
        process.env.PAYSTACK_SECRET_KEY = "sk_test_key";
        mockQueryFindFirst.mockResolvedValue(null); // no existing subscription

        await createCheckoutSession("pro");

        expect(mockDbChain.insert).toHaveBeenCalled();
        expect(mockRedirect).toHaveBeenCalledWith("/settings/billing");

        delete process.env.PAYSTACK_SECRET_KEY;
    });

    it("should update subscription when one exists", async () => {
        mockUser();
        process.env.PAYSTACK_SECRET_KEY = "sk_test_key";
        mockQueryFindFirst.mockResolvedValue({ id: "sub-1" });

        await createCheckoutSession("pro");

        expect(mockDbChain.update).toHaveBeenCalled();
        expect(mockRedirect).toHaveBeenCalledWith("/settings/billing");

        delete process.env.PAYSTACK_SECRET_KEY;
    });
});

// ─── changePlan ─────────────────────────────────────────────────────────────

describe("changePlan", () => {
    it("should return error when user not authenticated", async () => {
        mockGetUser.mockResolvedValue(null);

        const result = await changePlan("pro");

        expect(result).toEqual({
            error: "User not authenticated or email is missing.",
        });
    });

    it("should return error when no subscription exists", async () => {
        mockUser();
        mockQueryFindFirst.mockResolvedValue(null);

        const result = await changePlan("pro");

        expect(result).toEqual({ error: "No subscription found." });
    });

    it("should return error when already on same plan", async () => {
        mockUser();
        mockQueryFindFirst.mockResolvedValue({
            id: "sub-1",
            plan: "pro",
            pricePerMember: "9000.00",
        });

        const result = await changePlan("pro");

        expect(result).toEqual({ error: "Already on this plan." });
    });

    it("should return error when no organizations found", async () => {
        mockUser();
        mockQueryFindFirst.mockResolvedValue({
            id: "sub-1",
            plan: "premium",
            pricePerMember: "45000.00",
            currentPeriodStart: new Date("2026-02-01"),
            currentPeriodEnd: new Date("2026-03-01"),
        });
        mockQueryFindMany.mockResolvedValueOnce([]); // no orgs

        const result = await changePlan("pro");

        expect(result).toEqual({
            error: "No organizations found for billing.",
        });
    });

    it("should return success with proration invoice (downgrade)", async () => {
        mockUser();
        mockQueryFindFirst.mockResolvedValue({
            id: "sub-1",
            plan: "premium",
            pricePerMember: "45000.00",
            currentPeriodStart: new Date(Date.UTC(2026, 1, 1)),
            currentPeriodEnd: new Date(Date.UTC(2026, 2, 1)),
        });
        // findMany: orgs, then members
        mockQueryFindMany
            .mockResolvedValueOnce([{ id: "org-1" }])
            .mockResolvedValueOnce([{ userId: "u1" }, { userId: "u2" }]);

        mockCalculatePlanChangeProration.mockReturnValue({
            netAmount: -18000,
            remainingDays: 15,
            totalDays: 30,
        });

        // Transaction mock for invoice creation
        mockDbChain.returning.mockResolvedValue([{ id: "inv-new" }]);

        const result = await changePlan("pro");

        expect(result).toEqual({
            success: true,
            prorationInvoiceId: "inv-new",
        });
        // Downgrade: no email or Paystack link should be generated
        expect(mockSendInvoiceEmail).not.toHaveBeenCalled();
    });

    it("should send email and generate Paystack link on upgrade", async () => {
        mockUser();
        mockQueryFindFirst.mockResolvedValue({
            id: "sub-1",
            plan: "pro",
            pricePerMember: "9000.00",
            currentPeriodStart: new Date(Date.UTC(2026, 1, 1)),
            currentPeriodEnd: new Date(Date.UTC(2026, 2, 1)),
        });
        mockQueryFindMany
            .mockResolvedValueOnce([{ id: "org-1" }])
            .mockResolvedValueOnce([{ userId: "u1" }, { userId: "u2" }]);

        // Positive netAmount = upgrade
        mockCalculatePlanChangeProration.mockReturnValue({
            netAmount: 36000,
            remainingDays: 15,
            totalDays: 30,
        });

        // Invoice creation via chain
        mockDbChain.returning.mockResolvedValue([{ id: "inv-upgrade" }]);

        // generatePaystackLink is a local function that calls fetch
        process.env.PAYSTACK_SECRET_KEY = "sk_test_key";
        const originalFetch = globalThis.fetch;
        globalThis.fetch = vi.fn().mockResolvedValue({
            json: vi.fn().mockResolvedValue({
                status: true,
                data: { authorization_url: "https://paystack.co/pay/xyz" },
            }),
        });

        const result = await changePlan("premium");

        expect(result).toEqual({
            success: true,
            prorationInvoiceId: "inv-upgrade",
        });
        // Email should be sent for upgrades
        expect(mockSendInvoiceEmail).toHaveBeenCalledWith(
            expect.objectContaining({
                to: "user@test.com",
                invoiceDetails: expect.objectContaining({
                    invoiceId: "inv-upgrade",
                    amount: 36000,
                    paymentLink: "https://paystack.co/pay/xyz",
                }),
            }),
        );
        // Paystack fetch should have been called with Kobo amount
        expect(globalThis.fetch).toHaveBeenCalledWith(
            "https://api.paystack.co/transaction/initialize",
            expect.objectContaining({
                body: expect.stringContaining('"amount":3600000'),
            }),
        );

        globalThis.fetch = originalFetch;
        delete process.env.PAYSTACK_SECRET_KEY;
    });

    it("should return error on failure", async () => {
        mockUser();
        mockQueryFindFirst.mockResolvedValue({
            id: "sub-1",
            plan: "premium",
            pricePerMember: "45000.00",
        });
        mockQueryFindMany.mockRejectedValue(new Error("boom"));

        const result = await changePlan("pro");

        expect(result).toEqual({
            error: "Failed to change subscription plan.",
        });
    });
});

// ─── requestSubscriptionCancellation ────────────────────────────────────────

describe("requestSubscriptionCancellation", () => {
    it("should return error when user not authenticated", async () => {
        mockGetUser.mockResolvedValue(null);

        const result = await requestSubscriptionCancellation();

        expect(result).toEqual({ error: "User not authenticated." });
    });

    it("should return error when no subscription found", async () => {
        mockUser();
        mockQueryFindFirst.mockResolvedValue(null);

        const result = await requestSubscriptionCancellation();

        expect(result).toEqual({ error: "No subscription found to cancel." });
    });

    it("should return success on cancellation", async () => {
        mockUser();
        mockQueryFindFirst.mockResolvedValue({ id: "sub-1" });

        const result = await requestSubscriptionCancellation();

        expect(result).toEqual({ success: true });
        expect(mockDbChain.update).toHaveBeenCalled();
    });

    it("should return error on db failure", async () => {
        mockUser();
        mockQueryFindFirst.mockResolvedValue({ id: "sub-1" });
        mockDbChain.where.mockRejectedValueOnce(new Error("db error"));

        const result = await requestSubscriptionCancellation();

        expect(result).toEqual({
            error: "Failed to request subscription cancellation.",
        });
    });
});
