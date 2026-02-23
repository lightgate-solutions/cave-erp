import { describe, it, expect } from "vitest";
import {
    mockGetSession,
    mockGetFullOrganization,
    mockDbChain,
    mockQueryFindFirst,
    mockQueryFindMany,
    mockRevalidatePath,
    queueDbResult,
    DEFAULT_ORG_ID,
} from "./helpers/setup";

import {
    createAccount,
    updateAccount,
    deleteAccount,
    getChartOfAccounts,
    getGLAccount,
    getGLAccountActivity,
    ensureDefaultGLAccounts,
} from "@/actions/finance/gl/accounts";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const defaultSession = {
    session: { activeOrganizationId: DEFAULT_ORG_ID, userId: "user-1" },
    user: { id: "user-1" },
};

function setupSessionMock(orgId = DEFAULT_ORG_ID) {
    mockGetSession.mockResolvedValue({
        ...defaultSession,
        session: { ...defaultSession.session, activeOrganizationId: orgId },
    });
}

const sampleAccountInput = {
    code: "7000",
    name: "Marketing Expenses",
    type: "Expense" as const,
    accountClass: "Expense" as const,
    organizationId: DEFAULT_ORG_ID,
};

const sampleAccount = {
    id: 1,
    ...sampleAccountInput,
    isSystem: false,
    currentBalance: "0.00",
    organizationId: DEFAULT_ORG_ID,
};

// ─── ensureDefaultGLAccounts ──────────────────────────────────────────────────

describe("ensureDefaultGLAccounts", () => {
    it("should insert all 5 default accounts when none exist", async () => {
        // findMany for existing accounts
        mockQueryFindMany.mockResolvedValueOnce([]);
        queueDbResult([]); // insert result

        await ensureDefaultGLAccounts(DEFAULT_ORG_ID);

        // Should have tried to insert (db.insert called)
        expect(mockDbChain.insert).toHaveBeenCalled();
    });

    it("should skip inserting if all default accounts already exist", async () => {
        mockQueryFindMany.mockResolvedValueOnce([
            { code: "1000" },
            { code: "1200" },
            { code: "2000" },
            { code: "4000" },
            { code: "6000" },
        ]);

        await ensureDefaultGLAccounts(DEFAULT_ORG_ID);

        // insert should NOT be called
        expect(mockDbChain.insert).not.toHaveBeenCalled();
    });

    it("should only insert missing accounts", async () => {
        // Three accounts already exist, two are missing
        mockQueryFindMany.mockResolvedValueOnce([
            { code: "1000" },
            { code: "1200" },
            { code: "2000" },
        ]);
        queueDbResult([]); // insert for 4000 and 6000

        await ensureDefaultGLAccounts(DEFAULT_ORG_ID);

        expect(mockDbChain.insert).toHaveBeenCalled();
    });
});

// ─── createAccount ────────────────────────────────────────────────────────────

describe("createAccount", () => {
    it("should create an account successfully", async () => {
        setupSessionMock();
        mockQueryFindFirst.mockResolvedValueOnce(null); // no duplicate code
        queueDbResult([]); // insert result

        const result = await createAccount(sampleAccountInput);

        expect(result).toEqual({ success: true });
        expect(mockRevalidatePath).toHaveBeenCalledWith("/finance/gl/accounts");
    });

    it("should reject duplicate account code", async () => {
        setupSessionMock();
        mockQueryFindFirst.mockResolvedValueOnce(sampleAccount); // duplicate found

        const result = await createAccount(sampleAccountInput);

        expect(result).toEqual({ success: false, error: "Account code already exists" });
    });

    it("should return error when no active org in session", async () => {
        mockGetSession.mockResolvedValue({ session: null });

        const result = await createAccount(sampleAccountInput);

        expect(result).toEqual({
            success: false,
            error: "Unauthorized: No active organization",
        });
    });

    it("should return error on generic failure", async () => {
        mockGetSession.mockRejectedValue(new Error("fail"));

        const result = await createAccount(sampleAccountInput);

        expect(result).toEqual({ success: false, error: "Failed to create account" });
    });
});

// ─── updateAccount ────────────────────────────────────────────────────────────

describe("updateAccount", () => {
    it("should update a non-system account successfully", async () => {
        setupSessionMock();
        mockQueryFindFirst.mockResolvedValueOnce({ isSystem: false }); // account exists, not system
        queueDbResult([]); // update result

        const result = await updateAccount(1, { name: "Marketing & Ads" });

        expect(result).toEqual({ success: true });
        expect(mockRevalidatePath).toHaveBeenCalledWith("/finance/gl/accounts");
    });

    it("should reject update to system account", async () => {
        setupSessionMock();
        mockQueryFindFirst.mockResolvedValueOnce({ isSystem: true }); // system account!

        const result = await updateAccount(1, { name: "Cash Renamed" });

        expect(result).toEqual({
            success: false,
            error: "System default accounts cannot be edited. You can add custom accounts instead.",
        });
    });

    it("should return error when account not found", async () => {
        setupSessionMock();
        mockQueryFindFirst.mockResolvedValueOnce(null); // not found

        const result = await updateAccount(99, { name: "Ghost" });

        expect(result).toEqual({ success: false, error: "Account not found" });
    });

    it("should return error when no active org in session", async () => {
        mockGetSession.mockResolvedValue({ session: null });

        const result = await updateAccount(1, { name: "x" });

        expect(result).toEqual({
            success: false,
            error: "Unauthorized: No active organization",
        });
    });
});

// ─── deleteAccount ────────────────────────────────────────────────────────────

describe("deleteAccount", () => {
    it("should delete a non-system account successfully", async () => {
        setupSessionMock();
        mockQueryFindFirst.mockResolvedValueOnce({ isSystem: false, code: "7000" });
        queueDbResult([]); // delete result

        const result = await deleteAccount(1);

        expect(result).toEqual({ success: true });
        expect(mockRevalidatePath).toHaveBeenCalledWith("/finance/gl/accounts");
    });

    it("should reject deletion of system account", async () => {
        setupSessionMock();
        mockQueryFindFirst.mockResolvedValueOnce({ isSystem: true, code: "1000" });

        const result = await deleteAccount(1);

        expect(result).toEqual({
            success: false,
            error: "System default accounts (1000, 1200, 2000, 4000, 6000) cannot be deleted. They are required for invoicing and payables.",
        });
    });

    it("should return error when account not found", async () => {
        setupSessionMock();
        mockQueryFindFirst.mockResolvedValueOnce(null);

        const result = await deleteAccount(99);

        expect(result).toEqual({ success: false, error: "Account not found" });
    });

    it("should return error when no active org in session", async () => {
        mockGetSession.mockResolvedValue({ session: null });

        const result = await deleteAccount(1);

        expect(result).toEqual({
            success: false,
            error: "Unauthorized: No active organization",
        });
    });

    it("should return error on generic failure", async () => {
        mockGetSession.mockRejectedValue(new Error("fail"));

        const result = await deleteAccount(1);

        expect(result).toEqual({ success: false, error: "Failed to delete account" });
    });
});

// ─── getChartOfAccounts ────────────────────────────────────────────────────────

describe("getChartOfAccounts", () => {
    it("should return all accounts on success", async () => {
        setupSessionMock();
        // ensureDefaultGLAccounts: findMany — all 5 default accounts exist
        mockQueryFindMany
            .mockResolvedValueOnce([
                { code: "1000" }, { code: "1200" }, { code: "2000" },
                { code: "4000" }, { code: "6000" },
            ])
            // actual findMany for chart of accounts
            .mockResolvedValueOnce([sampleAccount]);

        const result = await getChartOfAccounts();

        expect(result).toEqual({ success: true, data: [sampleAccount] });
    });

    it("should return error when no active org in session", async () => {
        mockGetSession.mockResolvedValue({ session: null });

        const result = await getChartOfAccounts();

        expect(result).toEqual({
            success: false,
            error: "Unauthorized: No active organization",
        });
    });

    it("should return error on generic failure", async () => {
        mockGetSession.mockRejectedValue(new Error("fail"));

        const result = await getChartOfAccounts();

        expect(result).toEqual({ success: false, error: "Failed to get accounts" });
    });
});

// ─── getGLAccount ─────────────────────────────────────────────────────────────

describe("getGLAccount", () => {
    it("should return account when found", async () => {
        setupSessionMock();
        mockQueryFindFirst.mockResolvedValueOnce(sampleAccount);

        const result = await getGLAccount(1);

        expect(result).toEqual({ success: true, data: sampleAccount });
    });

    it("should return error when account not found", async () => {
        setupSessionMock();
        mockQueryFindFirst.mockResolvedValueOnce(null);

        const result = await getGLAccount(99);

        expect(result).toEqual({
            success: false,
            error: "Account not found",
            data: null,
        });
    });

    it("should return error when unauthorized", async () => {
        mockGetSession.mockResolvedValue({ session: null });

        const result = await getGLAccount(1);

        expect(result).toEqual({ success: false, error: "Unauthorized", data: null });
    });
});

// ─── getGLAccountActivity ─────────────────────────────────────────────────────

describe("getGLAccountActivity", () => {
    const lines = [
        {
            id: 1,
            journalId: 10,
            description: "Invoice payment",
            debit: "500.00",
            credit: "0.00",
            journalNumber: "JRN-001",
            transactionDate: "2026-01-15",
            source: "Receivables",
            status: "Posted",
        },
    ];

    it("should return journal lines for an account", async () => {
        setupSessionMock();
        queueDbResult(lines);

        const result = await getGLAccountActivity(1);

        expect(result).toEqual({ success: true, data: lines });
    });

    it("should return activity filtered by date range", async () => {
        setupSessionMock();
        queueDbResult([lines[0]]);

        const result = await getGLAccountActivity(1, undefined, 50, "2026-01-01", "2026-01-31");

        expect(result).toEqual({ success: true, data: [lines[0]] });
    });

    it("should return error when unauthorized", async () => {
        mockGetSession.mockResolvedValue({ session: null });

        const result = await getGLAccountActivity(1);

        expect(result).toEqual({ success: false, error: "Unauthorized", data: [] });
    });

    it("should return error on generic failure", async () => {
        mockGetSession.mockRejectedValue(new Error("fail"));

        const result = await getGLAccountActivity(1);

        expect(result).toEqual({ success: false, error: "Failed to get activity", data: [] });
    });
});
