import { describe, it, expect, beforeEach } from "vitest";
import {
    mockRequireInvoicingViewAccess,
    mockRequireFinanceOrAdmin,
    mockGetFullOrganization,
    mockQueryFindFirst,
    queueDbResult,
    DEFAULT_ORG_ID,
} from "./helpers/setup";

import {
    createBankAccount,
    updateBankAccount,
    deleteBankAccount,
    getBankAccounts,
} from "@/actions/invoicing/bank-accounts";

const DEFAULT_ORG = { id: DEFAULT_ORG_ID, name: "Test Org" };

const SAMPLE_ACCOUNT = {
    id: 1,
    accountName: "Main USD",
    bankName: "First Bank",
    accountNumber: "123456789",
    routingNumber: null,
    swiftCode: null,
    currency: "USD",
    isDefault: true,
    isActive: true,
    organizationId: DEFAULT_ORG_ID,
};

function setupMocks() {
    mockGetFullOrganization.mockResolvedValue(DEFAULT_ORG);
    mockRequireFinanceOrAdmin.mockResolvedValue(undefined);
    mockRequireInvoicingViewAccess.mockResolvedValue(undefined);
    mockQueryFindFirst.mockResolvedValue(null);
}

// ─── createBankAccount ────────────────────────────────────────────────────────

describe("createBankAccount", () => {
    beforeEach(setupMocks);

    it("returns error when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        const result = await createBankAccount({
            accountName: "Main", bankName: "Bank", accountNumber: "1234", currency: "USD",
        });
        expect(result.success).toBeNull();
        expect(result.error?.reason).toBe("Organization not found");
    });

    it("creates account without unsetting defaults when isDefault=false", async () => {
        queueDbResult([SAMPLE_ACCOUNT]);  // insert returning

        const result = await createBankAccount({
            accountName: "Main", bankName: "Bank", accountNumber: "1234",
            currency: "USD", isDefault: false,
        });
        expect(result.error).toBeNull();
        expect(result.success?.data.accountName).toBe("Main USD");
    });

    it("unsets other defaults when isDefault=true", async () => {
        queueDbResult(undefined);         // update isDefault=false
        queueDbResult([SAMPLE_ACCOUNT]);  // insert returning

        const result = await createBankAccount({
            accountName: "Main USD", bankName: "First Bank", accountNumber: "123456789",
            currency: "USD", isDefault: true,
        });
        expect(result.error).toBeNull();
        expect(result.success?.data.isDefault).toBe(true);
    });
});

// ─── updateBankAccount ────────────────────────────────────────────────────────

describe("updateBankAccount", () => {
    beforeEach(setupMocks);

    it("returns error when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        expect((await updateBankAccount(1, { accountName: "New" })).error?.reason)
            .toBe("Organization not found");
    });

    it("updates account name without touching defaults", async () => {
        queueDbResult([{ ...SAMPLE_ACCOUNT, accountName: "New Name" }]);  // update returning

        const result = await updateBankAccount(1, { accountName: "New Name" });
        expect(result.error).toBeNull();
        expect(result.success?.data.accountName).toBe("New Name");
    });

    it("looks up currency via findFirst when isDefault=true and no currency in data", async () => {
        // findFirst → existing account to get currency
        mockQueryFindFirst.mockResolvedValueOnce({ currency: "USD" });
        queueDbResult(undefined);                                              // unset other defaults
        queueDbResult([{ ...SAMPLE_ACCOUNT, isDefault: true }]);              // update returning

        const result = await updateBankAccount(1, { isDefault: true });
        expect(result.error).toBeNull();
        expect(result.success?.data.isDefault).toBe(true);
    });

    it("skips unset step if currency is provided in data when isDefault=true", async () => {
        queueDbResult(undefined);                                       // unset defaults
        queueDbResult([{ ...SAMPLE_ACCOUNT, isDefault: true }]);        // update returning

        const result = await updateBankAccount(1, { isDefault: true, currency: "USD" });
        expect(result.error).toBeNull();
    });
});

// ─── deleteBankAccount ────────────────────────────────────────────────────────

describe("deleteBankAccount", () => {
    beforeEach(setupMocks);

    it("returns error when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        expect((await deleteBankAccount(1)).error?.reason).toBe("Organization not found");
    });

    it("deletes account successfully", async () => {
        queueDbResult(undefined);  // delete
        const result = await deleteBankAccount(1);
        expect(result.error).toBeNull();
        expect(result.success?.reason).toMatch(/deleted/i);
    });

    it("returns foreign key error when account is used in invoices", async () => {
        // Force the delete to throw a foreign key constraint error
        const { mockDbChain } = await import("./helpers/setup");
        mockDbChain.where.mockRejectedValueOnce(
            new Error("violates foreign key constraint"),
        );

        const result = await deleteBankAccount(1);
        expect(result.success).toBeNull();
        expect(result.error?.reason).toMatch(/cannot delete account used in invoices/i);
    });
});

// ─── getBankAccounts ──────────────────────────────────────────────────────────

describe("getBankAccounts", () => {
    beforeEach(setupMocks);

    it("returns empty array when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        expect(await getBankAccounts()).toEqual([]);
    });

    it("returns all accounts for the organization", async () => {
        queueDbResult([
            SAMPLE_ACCOUNT,
            { ...SAMPLE_ACCOUNT, id: 2, currency: "EUR", isDefault: false },
        ]);
        const result = await getBankAccounts();
        expect(result).toHaveLength(2);
    });
});
