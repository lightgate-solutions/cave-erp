import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    mockGetSession,
    queueDbResult,
    mockQueryFindMany,
    mockEnsureDefaultGLAccounts,
    DEFAULT_USER_ID,
    DEFAULT_ORG_ID,
} from "./helpers/setup";

vi.mock("@/actions/finance/gl/accounts", async () => {
    const { mockEnsureDefaultGLAccounts } = await import("./helpers/setup");
    return {
        ensureDefaultGLAccounts: (...args: unknown[]) =>
            mockEnsureDefaultGLAccounts(...args),
    };
});

import {
    getTrialBalance,
    getIncomeStatement,
    getBalanceSheet,
} from "@/actions/finance/gl/reports";

const ASSET_ACCOUNT = { id: 1, code: "1000", name: "Cash", type: "Asset", organizationId: DEFAULT_ORG_ID };
const LIABILITY_ACCOUNT = { id: 2, code: "2000", name: "Accounts Payable", type: "Liability", organizationId: DEFAULT_ORG_ID };
const EQUITY_ACCOUNT = { id: 3, code: "3000", name: "Retained Earnings", type: "Equity", organizationId: DEFAULT_ORG_ID };
const INCOME_ACCOUNT = { id: 4, code: "4000", name: "Revenue", type: "Income", organizationId: DEFAULT_ORG_ID };
const EXPENSE_ACCOUNT = { id: 5, code: "5000", name: "Salaries", type: "Expense", organizationId: DEFAULT_ORG_ID };

function setupMocks() {
    mockGetSession.mockResolvedValue({
        user: { id: DEFAULT_USER_ID },
        session: { activeOrganizationId: DEFAULT_ORG_ID },
    });
    mockEnsureDefaultGLAccounts.mockResolvedValue(undefined);
}

// ─── getTrialBalance ──────────────────────────────────────────────────────────

describe("getTrialBalance", () => {
    beforeEach(setupMocks);

    it("returns error when no active organization and no passedOrgId", async () => {
        mockGetSession.mockResolvedValueOnce({
            user: { id: DEFAULT_USER_ID },
            session: { activeOrganizationId: null },
        });
        const result = await getTrialBalance();
        expect(result.success).toBe(false);
        expect(result.error).toMatch(/unauthorized/i);
        expect(result.data).toEqual([]);
    });

    it("maps journal aggregates to trial balance rows", async () => {
        // db.select(...).from().leftJoin().where().groupBy() → queueDbResult
        queueDbResult([
            { accountId: 1, totalDebits: "500", totalCredits: "0" },
            { accountId: 2, totalDebits: "0", totalCredits: "200" },
        ]);
        mockQueryFindMany.mockResolvedValueOnce([ASSET_ACCOUNT, LIABILITY_ACCOUNT]);

        const result = await getTrialBalance();
        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(2);

        const assetRow = result.data!.find((r) => r.accountCode === "1000");
        expect(assetRow?.totalDebits).toBe(500);
        expect(assetRow?.totalCredits).toBe(0);
        expect(assetRow?.netBalance).toBe(500);

        const liabRow = result.data!.find((r) => r.accountCode === "2000");
        expect(liabRow?.totalDebits).toBe(0);
        expect(liabRow?.totalCredits).toBe(200);
        expect(liabRow?.netBalance).toBe(-200);
    });

    it("assigns zero balances for accounts with no journal lines", async () => {
        queueDbResult([]);  // no aggregates
        mockQueryFindMany.mockResolvedValueOnce([ASSET_ACCOUNT]);

        const result = await getTrialBalance();
        expect(result.success).toBe(true);
        const row = result.data![0];
        expect(row.totalDebits).toBe(0);
        expect(row.totalCredits).toBe(0);
        expect(row.netBalance).toBe(0);
    });

    it("accepts a passedOrgId when session has none", async () => {
        mockGetSession.mockResolvedValueOnce({
            user: { id: DEFAULT_USER_ID },
            session: { activeOrganizationId: null },
        });
        queueDbResult([]);
        mockQueryFindMany.mockResolvedValueOnce([]);

        const result = await getTrialBalance(DEFAULT_ORG_ID);
        expect(result.success).toBe(true);
    });

    it("calls the db query when date range is provided", async () => {
        queueDbResult([]);
        mockQueryFindMany.mockResolvedValueOnce([]);

        const result = await getTrialBalance(
            undefined,
            new Date("2026-01-01"),
            new Date("2026-12-31"),
        );
        expect(result.success).toBe(true);
    });
});

// ─── getIncomeStatement ───────────────────────────────────────────────────────

describe("getIncomeStatement", () => {
    beforeEach(setupMocks);

    it("filters to only Income and Expense accounts", async () => {
        queueDbResult([
            { accountId: 4, totalDebits: "0", totalCredits: "1000" },
            { accountId: 5, totalDebits: "400", totalCredits: "0" },
        ]);
        mockQueryFindMany.mockResolvedValueOnce([
            ASSET_ACCOUNT, LIABILITY_ACCOUNT, INCOME_ACCOUNT, EXPENSE_ACCOUNT,
        ]);

        const result = await getIncomeStatement(
            DEFAULT_ORG_ID,
            new Date("2026-01-01"),
            new Date("2026-12-31"),
        );
        expect(result.success).toBe(true);
        expect(result.data?.revenue).toHaveLength(1);
        expect(result.data?.expenses).toHaveLength(1);
        expect(result.data?.totalRevenue).toBe(1000);
        expect(result.data?.totalExpenses).toBe(400);
        expect(result.data?.netIncome).toBe(600);
    });

    it("computes negative net income when expenses exceed revenue", async () => {
        queueDbResult([
            { accountId: 4, totalDebits: "0", totalCredits: "200" },
            { accountId: 5, totalDebits: "1000", totalCredits: "0" },
        ]);
        mockQueryFindMany.mockResolvedValueOnce([INCOME_ACCOUNT, EXPENSE_ACCOUNT]);

        const result = await getIncomeStatement(
            DEFAULT_ORG_ID,
            new Date("2026-01-01"),
            new Date("2026-12-31"),
        );
        expect(result.success).toBe(true);
        expect(result.data?.totalRevenue).toBe(200);
        expect(result.data?.totalExpenses).toBe(1000);
        expect(result.data?.netIncome).toBe(-800);
    });

    it("returns success=false when trial balance fails", async () => {
        mockGetSession.mockResolvedValueOnce({
            user: { id: DEFAULT_USER_ID },
            session: { activeOrganizationId: null },
        });
        const result = await getIncomeStatement(
            undefined,
            new Date("2026-01-01"),
            new Date("2026-12-31"),
        );
        expect(result.success).toBe(false);
    });
});

// ─── getBalanceSheet ──────────────────────────────────────────────────────────

describe("getBalanceSheet", () => {
    beforeEach(setupMocks);

    it("computes assets, liabilities, equity, and retained earnings", async () => {
        queueDbResult([
            { accountId: 1, totalDebits: "1400", totalCredits: "0" }, // Asset
            { accountId: 2, totalDebits: "0", totalCredits: "200" }, // Liability
            { accountId: 3, totalDebits: "0", totalCredits: "200" }, // Equity
            { accountId: 4, totalDebits: "0", totalCredits: "1000" }, // Income
            { accountId: 5, totalDebits: "400", totalCredits: "0" }, // Expense
        ]);
        mockQueryFindMany.mockResolvedValueOnce([
            ASSET_ACCOUNT, LIABILITY_ACCOUNT, EQUITY_ACCOUNT,
            INCOME_ACCOUNT, EXPENSE_ACCOUNT,
        ]);

        const result = await getBalanceSheet(DEFAULT_ORG_ID, new Date("2026-12-31"));
        expect(result.success).toBe(true);
        expect(result.data?.totalAssets).toBe(1400);       // 1400 - 0
        expect(result.data?.totalLiabilities).toBe(200);   // 200 - 0
        expect(result.data?.retainedEarnings).toBe(600);   // 1000 - 400
        expect(result.data?.totalEquity).toBe(800);        // 200 (equity) + 600 (retained)
        expect(result.data?.check).toBeDefined();
    });

    it("returns success=false when trial balance fails", async () => {
        mockGetSession.mockResolvedValueOnce({
            user: { id: DEFAULT_USER_ID },
            session: { activeOrganizationId: null },
        });
        const result = await getBalanceSheet(undefined, new Date("2026-12-31"));
        expect(result.success).toBe(false);
    });

    it("handles empty ledger (no accounts)", async () => {
        queueDbResult([]);
        mockQueryFindMany.mockResolvedValueOnce([]);

        const result = await getBalanceSheet(DEFAULT_ORG_ID, new Date("2026-12-31"));
        expect(result.success).toBe(true);
        expect(result.data?.totalAssets).toBe(0);
        expect(result.data?.totalLiabilities).toBe(0);
        expect(result.data?.totalEquity).toBe(0);
        expect(result.data?.retainedEarnings).toBe(0);
        expect(result.data?.check).toBe(0);
    });
});
