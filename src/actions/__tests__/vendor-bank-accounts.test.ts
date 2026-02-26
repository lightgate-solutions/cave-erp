import { describe, it, expect, beforeEach } from "vitest";
import {
    mockRequirePayablesViewAccess,
    mockRequirePayablesWriteAccess,
    mockGetFullOrganization,
    queueDbResult,
    DEFAULT_USER_ID,
    DEFAULT_ORG_ID,
} from "./helpers/setup";

import {
    addVendorBankAccount,
    updateVendorBankAccount,
    deleteVendorBankAccount,
    getVendorBankAccounts,
    getVendorDefaultBankAccount,
} from "@/actions/payables/vendor-bank-accounts";

const DEFAULT_ORG = { id: DEFAULT_ORG_ID, name: "Test Org" };
const VENDOR_ID = 7;
const ACCOUNT_ID = 42;

const SAMPLE_VENDOR = { id: VENDOR_ID, name: "Supplier Co", organizationId: DEFAULT_ORG_ID };

const SAMPLE_ACCOUNT = {
    id: ACCOUNT_ID,
    vendorId: VENDOR_ID,
    accountName: "Supplier Main",
    bankName: "First National",
    accountNumber: "987654321",
    currency: "USD",
    isDefault: true,
    isActive: true,
    organizationId: DEFAULT_ORG_ID,
};

function setupMocks() {
    mockGetFullOrganization.mockResolvedValue(DEFAULT_ORG);
    mockRequirePayablesWriteAccess.mockResolvedValue({ employee: { userId: DEFAULT_USER_ID } });
    mockRequirePayablesViewAccess.mockResolvedValue({ employee: { userId: DEFAULT_USER_ID } });
}

// ─── addVendorBankAccount ─────────────────────────────────────────────────────

describe("addVendorBankAccount", () => {
    beforeEach(setupMocks);

    it("returns error when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        const result = await addVendorBankAccount({
            vendorId: VENDOR_ID, accountName: "A", bankName: "B",
            accountNumber: "C", currency: "USD", isDefault: false, isActive: true,
        });
        expect(result.success).toBeNull();
        expect(result.error?.reason).toBe("Organization not found");
    });

    it("returns error when vendor is not found", async () => {
        queueDbResult([]);  // vendor select → not found
        const result = await addVendorBankAccount({
            vendorId: 999, accountName: "A", bankName: "B",
            accountNumber: "C", currency: "USD", isDefault: false, isActive: true,
        });
        expect(result.success).toBeNull();
        expect(result.error?.reason).toBe("Vendor not found");
    });

    it("adds account without unsetting defaults when isDefault=false", async () => {
        queueDbResult([SAMPLE_VENDOR]);    // vendor check
        queueDbResult([SAMPLE_ACCOUNT]);   // insert returning

        const result = await addVendorBankAccount({
            vendorId: VENDOR_ID, accountName: "Supplier Main", bankName: "First National",
            accountNumber: "987654321", currency: "USD", isDefault: false, isActive: true,
        });
        expect(result.error).toBeNull();
        expect(result.success?.data.accountName).toBe("Supplier Main");
    });

    it("unsets other defaults when isDefault=true", async () => {
        queueDbResult([SAMPLE_VENDOR]);   // vendor check
        queueDbResult(undefined);          // unset other defaults
        queueDbResult([SAMPLE_ACCOUNT]);   // insert returning

        const result = await addVendorBankAccount({
            vendorId: VENDOR_ID, accountName: "Supplier Main", bankName: "First National",
            accountNumber: "987654321", currency: "USD", isDefault: true, isActive: true,
        });
        expect(result.error).toBeNull();
        expect(result.success?.data.isDefault).toBe(true);
    });
});

// ─── updateVendorBankAccount ──────────────────────────────────────────────────

describe("updateVendorBankAccount", () => {
    beforeEach(setupMocks);

    it("returns error when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        expect((await updateVendorBankAccount(ACCOUNT_ID, { accountName: "New" })).error?.reason)
            .toBe("Organization not found");
    });

    it("returns error when account is not found", async () => {
        queueDbResult([]);  // select existing → not found
        const result = await updateVendorBankAccount(999, { accountName: "New" });
        expect(result.success).toBeNull();
        expect(result.error?.reason).toBe("Bank account not found");
    });

    it("updates account without touching defaults when isDefault not set", async () => {
        queueDbResult([SAMPLE_ACCOUNT]);                                         // fetch existing
        queueDbResult([{ ...SAMPLE_ACCOUNT, accountName: "Updated Name" }]);    // update returning

        const result = await updateVendorBankAccount(ACCOUNT_ID, { accountName: "Updated Name" });
        expect(result.error).toBeNull();
        expect(result.success?.data.accountName).toBe("Updated Name");
    });

    it("unsets other default accounts when isDefault=true", async () => {
        queueDbResult([SAMPLE_ACCOUNT]);                                  // fetch existing
        queueDbResult(undefined);                                          // unset other defaults
        queueDbResult([{ ...SAMPLE_ACCOUNT, isDefault: true }]);          // update returning

        const result = await updateVendorBankAccount(ACCOUNT_ID, { isDefault: true });
        expect(result.error).toBeNull();
        expect(result.success?.data.isDefault).toBe(true);
    });
});

// ─── deleteVendorBankAccount ──────────────────────────────────────────────────

describe("deleteVendorBankAccount", () => {
    beforeEach(setupMocks);

    it("returns error when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        expect((await deleteVendorBankAccount(ACCOUNT_ID)).error?.reason)
            .toBe("Organization not found");
    });

    it("returns error when account is not found", async () => {
        queueDbResult([]);  // select → not found
        const result = await deleteVendorBankAccount(999);
        expect(result.success).toBeNull();
        expect(result.error?.reason).toBe("Bank account not found");
    });

    it("deletes account successfully", async () => {
        queueDbResult([SAMPLE_ACCOUNT]);  // fetch account (for vendorId)
        queueDbResult(undefined);          // delete

        const result = await deleteVendorBankAccount(ACCOUNT_ID);
        expect(result.error).toBeNull();
        expect(result.success?.reason).toMatch(/deleted/i);
    });
});

// ─── getVendorBankAccounts ────────────────────────────────────────────────────

describe("getVendorBankAccounts", () => {
    beforeEach(setupMocks);

    it("returns empty array when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        expect(await getVendorBankAccounts(VENDOR_ID)).toEqual([]);
    });

    it("returns all accounts for the vendor", async () => {
        queueDbResult([
            SAMPLE_ACCOUNT,
            { ...SAMPLE_ACCOUNT, id: 43, currency: "EUR", isDefault: false },
        ]);
        const result = await getVendorBankAccounts(VENDOR_ID);
        expect(result).toHaveLength(2);
    });
});

// ─── getVendorDefaultBankAccount ─────────────────────────────────────────────

describe("getVendorDefaultBankAccount", () => {
    beforeEach(setupMocks);

    it("returns null when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        expect(await getVendorDefaultBankAccount(VENDOR_ID)).toBeNull();
    });

    it("returns null when no default account exists", async () => {
        queueDbResult([]);  // no default found
        expect(await getVendorDefaultBankAccount(VENDOR_ID)).toBeNull();
    });

    it("returns the default account", async () => {
        queueDbResult([SAMPLE_ACCOUNT]);
        const result = await getVendorDefaultBankAccount(VENDOR_ID);
        expect(result?.isDefault).toBe(true);
        expect(result?.accountName).toBe("Supplier Main");
    });
});
