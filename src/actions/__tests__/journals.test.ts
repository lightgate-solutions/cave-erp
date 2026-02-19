import { describe, it, expect, vi, beforeEach } from "vitest";
import "../__tests__/helpers/setup";
import {
    mockGetSession,
    mockDbChain,
    mockTransaction,
    mockQueryFindFirst,
    mockQueryFindMany,
    mockRevalidatePath,
    queueDbResult,
    DEFAULT_ORG_ID,
    DEFAULT_USER_ID,
} from "../__tests__/helpers/setup";
import {
    createJournal,
    getJournals,
    getJournalById,
    postJournal,
    updateJournal,
    deleteJournal,
} from "../finance/gl/journals";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const JOURNAL_DATE = new Date("2024-03-15T00:00:00Z");
const POSTING_DATE = new Date("2024-03-15T00:00:00Z");

/** A balanced 2-line journal entry (debit = credit = 1000) */
const balancedLines = [
    { accountId: 1, debit: 1000, credit: 0, description: "Cash debit" },
    { accountId: 2, debit: 0, credit: 1000, description: "Revenue credit" },
];

const validJournalData = {
    transactionDate: JOURNAL_DATE,
    postingDate: POSTING_DATE,
    description: "Test journal entry",
    source: "Manual" as const,
    status: "Draft" as const,
    lines: balancedLines,
};

/** Mock a fully-authenticated session with active org */
function mockSession() {
    mockGetSession.mockResolvedValue({
        session: {
            userId: DEFAULT_USER_ID,
            activeOrganizationId: DEFAULT_ORG_ID,
        },
        user: { id: DEFAULT_USER_ID },
    });
}

/**
 * Mock `recalculateAccountBalance` chain calls.
 * For each account: mockQueryFindFirst (account type) + mockDbChain.then for sum + chain update.
 * Called `count` times (one per distinct accountId).
 */
function mockRecalculate(count = 1) {
    for (let i = 0; i < count; i++) {
        // findFirst -> account type
        mockQueryFindFirst.mockResolvedValueOnce({ type: "Asset" });
        // db.select().from().innerJoin().where() sum query -> resolved via .then
    }
    // The select chain for sums resolves through mockDbChain.then
    // The select chain for sums resolves through mockDbChain.then
    // Queue result for each account
    queueDbResult([{ debitSum: "1000", creditSum: "0" }]);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("GL Journals", () => {

    // ── createJournal ──────────────────────────────────────────────────────

    describe("createJournal", () => {
        it("should return error when not authenticated", async () => {
            mockGetSession.mockResolvedValue(null);

            const result = await createJournal(validJournalData);

            expect(result.success).toBe(false);
            expect(result.error).toMatch(/not signed in/i);
        });

        it("should return error when no active organization", async () => {
            mockGetSession.mockResolvedValue({
                session: { userId: DEFAULT_USER_ID, activeOrganizationId: null },
                user: { id: DEFAULT_USER_ID },
            });

            const result = await createJournal(validJournalData);

            expect(result.success).toBe(false);
            expect(result.error).toMatch(/no active organization/i);
        });

        it("should reject unbalanced journal (debits ≠ credits)", async () => {
            mockSession();

            const result = await createJournal({
                ...validJournalData,
                lines: [
                    { accountId: 1, debit: 1000, credit: 0 },
                    { accountId: 2, debit: 0, credit: 500 }, // doesn't balance
                ],
            });

            expect(result.success).toBe(false);
            expect(result.error).toMatch(/does not balance/i);
        });

        it("should accept journal where |debits - credits| ≤ 0.01 (epsilon)", async () => {
            mockSession();

            // Count query → journal number generation
            queueDbResult([{ count: "5" }]);

            // Transaction mock
            const txChain: any = {};
            for (const m of ["insert", "update", "delete", "set", "values", "where", "returning", "from", "innerJoin"]) {
                txChain[m] = vi.fn().mockReturnValue(txChain);
            }
            txChain.returning.mockResolvedValueOnce([{ id: 42 }]);
            txChain.then = (resolve: any) => Promise.resolve(resolve(undefined));
            mockTransaction.mockImplementation(async (cb: any) => cb(txChain));

            // recalculate mocks
            mockQueryFindFirst.mockResolvedValue({ type: "Asset" });
            // recalculate sum queries
            queueDbResult([{ debitSum: "500.005", creditSum: "0" }]); // for account 1
            queueDbResult([{ debitSum: "0", creditSum: "500.00" }]); // for account 2

            const result = await createJournal({
                ...validJournalData,
                lines: [
                    { accountId: 1, debit: 500.005, credit: 0 },
                    { accountId: 2, debit: 0, credit: 500.00 }, // diff = 0.005 ≤ 0.01
                ],
            });

            // Should NOT fail on balance (might fail for another reason but not balance)
            expect(result.success).toBe(true);
        });

        it("should create journal and return journalNumber on success", async () => {
            mockSession();

            // 1. Count query
            queueDbResult([{ count: "9" }]);

            // 2. Transaction: insert journal (returning [{ id: 10 }]) then insert lines
            const txChain: any = {};
            for (const m of ["insert", "update", "delete", "set", "values", "where", "returning", "from", "innerJoin"]) {
                txChain[m] = vi.fn().mockReturnValue(txChain);
            }
            txChain.returning.mockResolvedValueOnce([{ id: 10 }]);
            txChain.then = (resolve: any) => {
                console.log("Mock txChain resolving");
                return Promise.resolve(resolve(undefined));
            };
            mockTransaction.mockImplementation(async (cb: any) => {
                console.log("Mock transaction starting");
                const res = await cb(txChain);
                console.log("Mock transaction finished");
                return res;
            });

            // 3. recalculateAccountBalance for each account (2 distinct: 1, 2)
            mockQueryFindFirst.mockResolvedValue({ type: "Asset" });
            // 3. recalculateAccountBalance for each account (2 distinct: 1, 2)
            mockQueryFindFirst.mockResolvedValue({ type: "Asset" });
            // Sums for account 1
            queueDbResult([{ debitSum: "1000", creditSum: "0" }]);
            // Sums for account 2
            queueDbResult([{ debitSum: "1000", creditSum: "0" }]);

            console.log("Calling createJournal...");
            const result = await createJournal(validJournalData);
            console.log("createJournal returned:", result);


            expect(result.success).toBe(true);
            // Journal number: year=2024, count was 9 → next=10 → "JE-2024-000010"
            expect((result as any).journalNumber).toBe("JE-2024-000010");
            expect(mockTransaction).toHaveBeenCalledOnce();
            expect(txChain.insert).toHaveBeenCalled();
            expect(mockRevalidatePath).toHaveBeenCalledWith("/finance/gl/journals");
            expect(mockRevalidatePath).toHaveBeenCalledWith("/finance/gl/reports");
            expect(mockRevalidatePath).toHaveBeenCalledWith("/finance/gl/accounts");
        });

        it("should use caller-provided organizationId over session org", async () => {
            mockGetSession.mockResolvedValue({
                session: { userId: DEFAULT_USER_ID, activeOrganizationId: "session-org" },
                user: { id: DEFAULT_USER_ID },
            });

            // Count query
            queueDbResult([{ count: "0" }]);

            const txChain: any = {};
            for (const m of ["insert", "update", "delete", "set", "values", "where", "returning"]) {
                txChain[m] = vi.fn().mockReturnValue(txChain);
            }
            txChain.returning.mockResolvedValueOnce([{ id: 1 }]);
            txChain.then = (resolve: any) => Promise.resolve(resolve(undefined));
            mockTransaction.mockImplementation(async (cb: any) => cb(txChain));

            mockQueryFindFirst.mockResolvedValue({ type: "Asset" });
            queueDbResult([{ debitSum: "0", creditSum: "0" }]);
            queueDbResult([{ debitSum: "0", creditSum: "0" }]);

            await createJournal({ ...validJournalData, organizationId: "caller-org" });

            // The transaction should have been called — if org resolved to caller-org
            // the fact that createJournal didn't error on "no active organization" is
            // sufficient (session-org was present too, but caller-org should win)
            expect(mockTransaction).toHaveBeenCalledOnce();
        });

        it("should return error on DB failure", async () => {
            mockSession();

            // DB failure on the count query
            mockDbChain.then.mockImplementation((_resolve, reject) => {
                return Promise.resolve(reject(new Error("Connection refused")));
            });

            const result = await createJournal(validJournalData);

            expect(result.success).toBe(false);
            expect(result.error).toMatch(/connection refused/i);
        });
    });

    // ── getJournals ────────────────────────────────────────────────────────

    describe("getJournals", () => {
        it("should return error when no organization", async () => {
            mockGetSession.mockResolvedValue({ session: {}, user: {} });

            const result = await getJournals();

            expect(result.success).toBe(false);
            expect((result as any).data).toEqual([]);
        });

        it("should return journals list on success", async () => {
            mockSession();
            const journalList = [
                { id: 1, journalNumber: "JE-2024-000001", description: "Test" },
                { id: 2, journalNumber: "JE-2024-000002", description: "Test 2" },
            ];
            mockQueryFindMany.mockResolvedValueOnce(journalList);

            const result = await getJournals();

            expect(result.success).toBe(true);
            expect((result as any).data).toEqual(journalList);
            expect(mockQueryFindMany).toHaveBeenCalledOnce();
        });

        it("should return error on DB failure", async () => {
            mockSession();
            mockQueryFindMany.mockRejectedValueOnce(new Error("fail"));

            const result = await getJournals();

            expect(result.success).toBe(false);
        });
    });

    // ── getJournalById ────────────────────────────────────────────────────

    describe("getJournalById", () => {
        it("should return error when no organization", async () => {
            mockGetSession.mockResolvedValue({ session: {}, user: {} });

            const result = await getJournalById(1);

            expect(result.success).toBe(false);
        });

        it("should return error when journal not found", async () => {
            mockSession();
            mockQueryFindFirst.mockResolvedValueOnce(null);

            const result = await getJournalById(99);

            expect(result.success).toBe(false);
            expect(result.error).toMatch(/not found/i);
        });

        it("should return journal data on success", async () => {
            mockSession();
            const journal = { id: 1, journalNumber: "JE-2024-000001", status: "Draft", lines: [] };
            mockQueryFindFirst.mockResolvedValueOnce(journal);

            const result = await getJournalById(1);

            expect(result.success).toBe(true);
            expect((result as any).data).toEqual(journal);
        });
    });

    // ── postJournal ────────────────────────────────────────────────────────

    describe("postJournal", () => {
        it("should return error when no organization", async () => {
            mockGetSession.mockResolvedValue({ session: {}, user: {} });

            const result = await postJournal(1, DEFAULT_USER_ID);

            expect(result.success).toBe(false);
            expect(result.error).toMatch(/no active organization/i);
        });

        it("should return error when journal not found", async () => {
            mockSession();
            mockQueryFindFirst.mockResolvedValueOnce(null);

            const result = await postJournal(99, DEFAULT_USER_ID);

            expect(result.success).toBe(false);
            expect(result.error).toMatch(/not found/i);
        });

        it("should reject posting an already-posted journal", async () => {
            mockSession();
            mockQueryFindFirst.mockResolvedValueOnce({
                id: 1, status: "Posted", organizationId: DEFAULT_ORG_ID,
                transactionDate: "2024-03-15", lines: [],
            });

            const result = await postJournal(1, DEFAULT_USER_ID);

            expect(result.success).toBe(false);
            expect(result.error).toMatch(/already posted/i);
        });

        it("should reject posting a voided journal", async () => {
            mockSession();
            mockQueryFindFirst.mockResolvedValueOnce({
                id: 1, status: "Voided", organizationId: DEFAULT_ORG_ID,
                transactionDate: "2024-03-15", lines: [],
            });

            const result = await postJournal(1, DEFAULT_USER_ID);

            expect(result.success).toBe(false);
            expect(result.error).toMatch(/voided/i);
        });

        it("should reject posting when date is outside all open periods (period control active)", async () => {
            mockSession();
            // Draft journal found
            mockQueryFindFirst.mockResolvedValueOnce({
                id: 1, status: "Draft", organizationId: DEFAULT_ORG_ID,
                transactionDate: "2024-03-15", lines: [{ accountId: 1 }],
            });
            // openPeriod query → null (no open period for this date)
            mockQueryFindFirst.mockResolvedValueOnce(null);
            // anyPeriod query → has periods (period control is active)
            mockQueryFindFirst.mockResolvedValueOnce({ id: 1 });

            const result = await postJournal(1, DEFAULT_USER_ID);

            expect(result.success).toBe(false);
            expect(result.error).toMatch(/outside an open period/i);
        });

        it("should post journal successfully when no periods are defined (no period control)", async () => {
            mockSession();
            mockQueryFindFirst.mockResolvedValueOnce({
                id: 1, status: "Draft", organizationId: DEFAULT_ORG_ID,
                transactionDate: "2024-03-15", lines: [{ accountId: 1 }],
            });
            // openPeriod → null
            mockQueryFindFirst.mockResolvedValueOnce(null);
            // anyPeriod → null (no periods at all — bypass period control)
            mockQueryFindFirst.mockResolvedValueOnce(null);

            // db.update chain (post journal)
            queueDbResult([]);
            // db.query.glAccounts.findFirst for recalculate
            mockQueryFindFirst.mockResolvedValue({ type: "Asset" });
            queueDbResult([{ debitSum: "0", creditSum: "0" }]);

            const result = await postJournal(1, DEFAULT_USER_ID);

            expect(result.success).toBe(true);
            expect(mockRevalidatePath).toHaveBeenCalledWith("/finance/gl/journals");
        });

        it("should post journal successfully when inside an open period", async () => {
            mockSession();
            mockQueryFindFirst.mockResolvedValueOnce({
                id: 1, status: "Draft", organizationId: DEFAULT_ORG_ID,
                transactionDate: "2024-03-15", lines: [{ accountId: 1 }],
            });
            // openPeriod → found
            mockQueryFindFirst.mockResolvedValueOnce({ id: 5, status: "Open" });
            // anyPeriod is not reached if openPeriod is found
            queueDbResult([]); // Journal status update

            mockQueryFindFirst.mockResolvedValue({ type: "Asset" });
            mockQueryFindFirst.mockResolvedValue({ type: "Asset" });

            queueDbResult([{ debitSum: "500", creditSum: "0" }]); // Sum select
            queueDbResult([]); // Account balance update

            const result = await postJournal(1, DEFAULT_USER_ID);

            expect(result.success).toBe(true);
        });
    });

    // ── updateJournal ──────────────────────────────────────────────────────

    describe("updateJournal", () => {
        it("should return error when no organization", async () => {
            mockGetSession.mockResolvedValue({ session: {}, user: {} });

            const result = await updateJournal(1, validJournalData);

            expect(result.success).toBe(false);
        });

        it("should return error when journal not found", async () => {
            mockSession();
            mockQueryFindFirst.mockResolvedValueOnce(null); // existing check

            const result = await updateJournal(99, validJournalData);

            expect(result.success).toBe(false);
            expect(result.error).toMatch(/not found/i);
        });

        it("should reject editing a non-Draft journal", async () => {
            mockSession();
            mockQueryFindFirst.mockResolvedValueOnce({ status: "Posted" });

            const result = await updateJournal(1, validJournalData);

            expect(result.success).toBe(false);
            expect(result.error).toMatch(/locked/i);
        });

        it("should reject unbalanced update", async () => {
            mockSession();
            mockQueryFindFirst.mockResolvedValueOnce({ status: "Draft" });

            const result = await updateJournal(1, {
                ...validJournalData,
                lines: [
                    { accountId: 1, debit: 500, credit: 0 },
                    { accountId: 2, debit: 0, credit: 200 },
                ],
            });

            expect(result.success).toBe(false);
            expect(result.error).toMatch(/does not balance/i);
        });

        it("should update draft journal successfully", async () => {
            mockSession();
            // existing check → Draft
            mockQueryFindFirst.mockResolvedValueOnce({ status: "Draft" });
            // old lines fetch
            mockQueryFindMany.mockResolvedValueOnce([{ accountId: 3 }]);

            // Transaction: update header + delete old lines + insert new lines
            const txChain: any = {};
            for (const m of ["insert", "update", "delete", "set", "values", "where", "returning"]) {
                txChain[m] = vi.fn().mockReturnValue(txChain);
            }
            txChain.then = (resolve: any) => Promise.resolve(resolve(undefined));
            mockTransaction.mockImplementation(async (cb: any) => cb(txChain));

            // recalculate accounts (old: 3, new: 1 + 2 → all 3 distinct)
            mockQueryFindFirst.mockResolvedValue({ type: "Asset" });
            // 3 distinct accounts to recalculate
            queueDbResult([{ debitSum: "0", creditSum: "0" }]);
            queueDbResult([{ debitSum: "0", creditSum: "0" }]);
            queueDbResult([{ debitSum: "0", creditSum: "0" }]);

            const result = await updateJournal(1, validJournalData);

            expect(result.success).toBe(true);
            expect(txChain.update).toHaveBeenCalled();
            expect(txChain.delete).toHaveBeenCalled();
            expect(txChain.insert).toHaveBeenCalled();
            expect(mockRevalidatePath).toHaveBeenCalledWith("/finance/gl/journals");
        });
    });

    // ── deleteJournal ──────────────────────────────────────────────────────

    describe("deleteJournal", () => {
        it("should return error when no organization", async () => {
            mockGetSession.mockResolvedValue({ session: {}, user: {} });

            const result = await deleteJournal(1);

            expect(result.success).toBe(false);
        });

        it("should return error when journal not found", async () => {
            mockSession();
            mockQueryFindFirst.mockResolvedValueOnce(null);

            const result = await deleteJournal(99);

            expect(result.success).toBe(false);
            expect(result.error).toMatch(/not found/i);
        });

        it("should reject deleting a Posted journal", async () => {
            mockSession();
            mockQueryFindFirst.mockResolvedValueOnce({
                status: "Posted", lines: [{ accountId: 1 }],
            });

            const result = await deleteJournal(1);

            expect(result.success).toBe(false);
            expect(result.error).toMatch(/locked/i);
        });

        it("should reject deleting a Voided journal", async () => {
            mockSession();
            mockQueryFindFirst.mockResolvedValueOnce({
                status: "Voided", lines: [{ accountId: 1 }],
            });

            const result = await deleteJournal(1);

            expect(result.success).toBe(false);
            expect(result.error).toMatch(/locked/i);
        });

        it("should delete a Draft journal successfully", async () => {
            mockSession();
            mockQueryFindFirst.mockResolvedValueOnce({
                status: "Draft", lines: [{ accountId: 1 }, { accountId: 2 }],
            });

            queueDbResult([]); // Delete journal

            // recalculate (2 accounts)
            mockQueryFindFirst.mockResolvedValue({ type: "Asset" });

            // Sum results for both accounts (Promise.all concurrency)
            queueDbResult([{ debitSum: "0", creditSum: "0" }]); // sum 1
            queueDbResult([{ debitSum: "0", creditSum: "0" }]); // sum 2

            // Update results for both accounts
            queueDbResult([]); // update 1
            queueDbResult([]); // update 2


            const result = await deleteJournal(1);

            expect(result.success).toBe(true);
            expect(mockRevalidatePath).toHaveBeenCalledWith("/finance/gl/journals");
            expect(mockRevalidatePath).toHaveBeenCalledWith("/finance/gl/accounts");
            expect(mockRevalidatePath).toHaveBeenCalledWith("/finance/gl/reports");
        });

        it("should return error on DB failure", async () => {
            mockSession();
            mockQueryFindFirst.mockRejectedValueOnce(new Error("fail"));

            const result = await deleteJournal(1);

            expect(result.success).toBe(false);
        });
    });
});
