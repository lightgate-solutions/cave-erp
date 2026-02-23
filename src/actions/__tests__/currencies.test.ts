import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    mockRequireInvoicingViewAccess,
    mockRequireInvoicingWriteAccess,
    mockGetFullOrganization,
    queueDbResult,
    DEFAULT_USER_ID,
    DEFAULT_ORG_ID,
} from "./helpers/setup";

import {
    createOrganizationCurrency,
    updateOrganizationCurrency,
    deleteOrganizationCurrency,
    getAllOrganizationCurrencies,
    setDefaultCurrency,
    getDefaultCurrency,
    getCurrency,
} from "@/actions/invoicing/currencies";

const DEFAULT_ORG = { id: DEFAULT_ORG_ID, name: "Test Org" };
const DEFAULT_EMPLOYEE = { userId: DEFAULT_USER_ID };
const CURRENCY_ID = 5;
const SAMPLE_CURRENCY = {
    id: CURRENCY_ID,
    currencyCode: "USD",
    currencySymbol: "$",
    currencyName: "US Dollar",
    exchangeRate: "1.00",
    isDefault: true,
    organizationId: DEFAULT_ORG_ID,
};

function setupMocks() {
    mockGetFullOrganization.mockResolvedValue(DEFAULT_ORG);
    mockRequireInvoicingWriteAccess.mockResolvedValue({ employee: DEFAULT_EMPLOYEE });
    mockRequireInvoicingViewAccess.mockResolvedValue({ employee: DEFAULT_EMPLOYEE });
}

// ─── createOrganizationCurrency ───────────────────────────────────────────────

describe("createOrganizationCurrency", () => {
    beforeEach(setupMocks);

    it("returns error when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        const result = await createOrganizationCurrency({
            currencyCode: "USD", currencySymbol: "$",
            currencyName: "US Dollar", exchangeRate: 1,
        });
        expect(result.success).toBeNull();
        expect(result.error?.reason).toBe("Organization not found");
    });

    it("rejects duplicate currency code", async () => {
        // db.select duplicate check → finds existing
        queueDbResult([SAMPLE_CURRENCY]);
        const result = await createOrganizationCurrency({
            currencyCode: "USD", currencySymbol: "$",
            currencyName: "US Dollar", exchangeRate: 1,
        });
        expect(result.success).toBeNull();
        expect(result.error?.reason).toBe("Currency already exists for this organization");
    });

    it("creates currency as default when it is the first one", async () => {
        queueDbResult([]);                        // duplicate check → not found
        queueDbResult([{ count: 0 }]);            // currency count → 0
        queueDbResult(undefined);                 // update unset other defaults (no-op)
        queueDbResult([SAMPLE_CURRENCY]);         // insert returning

        const result = await createOrganizationCurrency({
            currencyCode: "USD", currencySymbol: "$",
            currencyName: "US Dollar", exchangeRate: 1,
        });
        expect(result.error).toBeNull();
        expect(result.success?.data.isDefault).toBe(true);
    });

    it("unsets other defaults when isDefault=true and others exist", async () => {
        queueDbResult([]);                                              // duplicate check
        queueDbResult([{ count: 1 }]);                                 // count → 1
        queueDbResult(undefined);                                      // unset update
        queueDbResult([{ ...SAMPLE_CURRENCY, currencyCode: "EUR" }]); // insert

        const result = await createOrganizationCurrency({
            currencyCode: "EUR", currencySymbol: "€",
            currencyName: "Euro", exchangeRate: 0.9, isDefault: true,
        });
        expect(result.error).toBeNull();
        expect(result.success?.data.currencyCode).toBe("EUR");
    });
});

// ─── updateOrganizationCurrency ───────────────────────────────────────────────

describe("updateOrganizationCurrency", () => {
    beforeEach(setupMocks);

    it("returns error when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        const result = await updateOrganizationCurrency(CURRENCY_ID, { exchangeRate: 1.1 });
        expect(result.success).toBeNull();
        expect(result.error?.reason).toBe("Organization not found");
    });

    it("returns error when currency is not found", async () => {
        queueDbResult([]);  // select existing → not found
        const result = await updateOrganizationCurrency(999, { exchangeRate: 1.1 });
        expect(result.success).toBeNull();
        expect(result.error?.reason).toBe("Currency not found");
    });

    it("updates exchange rate successfully", async () => {
        queueDbResult([SAMPLE_CURRENCY]);                              // fetch existing
        queueDbResult([{ ...SAMPLE_CURRENCY, exchangeRate: "1.10" }]); // update returning

        const result = await updateOrganizationCurrency(CURRENCY_ID, { exchangeRate: 1.1 });
        expect(result.error).toBeNull();
        expect(result.success?.data.exchangeRate).toBe("1.10");
    });
});

// ─── deleteOrganizationCurrency ───────────────────────────────────────────────

describe("deleteOrganizationCurrency", () => {
    beforeEach(setupMocks);

    it("returns error when currency is not found", async () => {
        queueDbResult([]);
        const result = await deleteOrganizationCurrency(999);
        expect(result.success).toBeNull();
        expect(result.error?.reason).toBe("Currency not found");
    });

    it("rejects deletion when invoices are using the currency", async () => {
        queueDbResult([{ ...SAMPLE_CURRENCY, isDefault: false }]); // fetch currency
        queueDbResult([{ count: 3 }]);                              // invoice count

        const result = await deleteOrganizationCurrency(CURRENCY_ID);
        expect(result.success).toBeNull();
        expect(result.error?.reason).toMatch(/3 invoice/i);
    });

    it("rejects deletion of default currency when others exist", async () => {
        queueDbResult([SAMPLE_CURRENCY]);      // fetch currency (isDefault=true)
        queueDbResult([{ count: 0 }]);          // invoice count
        queueDbResult([{ count: 2 }]);          // total currency count

        const result = await deleteOrganizationCurrency(CURRENCY_ID);
        expect(result.success).toBeNull();
        expect(result.error?.reason).toMatch(/cannot delete default currency/i);
    });

    it("deletes a non-default currency successfully", async () => {
        queueDbResult([{ ...SAMPLE_CURRENCY, isDefault: false }]); // fetch currency
        queueDbResult([{ count: 0 }]);                              // invoice count
        queueDbResult([{ count: 2 }]);                              // total count
        queueDbResult(undefined);                                   // delete

        const result = await deleteOrganizationCurrency(CURRENCY_ID);
        expect(result.error).toBeNull();
        expect(result.success?.reason).toMatch(/deleted/i);
    });
});

// ─── setDefaultCurrency ───────────────────────────────────────────────────────

describe("setDefaultCurrency", () => {
    beforeEach(setupMocks);

    it("returns error when currency is not found", async () => {
        queueDbResult([]);  // fetch → not found
        const result = await setDefaultCurrency(999);
        expect(result.success).toBeNull();
        expect(result.error?.reason).toBe("Currency not found");
    });

    it("sets the currency as default", async () => {
        queueDbResult([SAMPLE_CURRENCY]);  // fetch existing
        queueDbResult(undefined);          // unset other defaults
        queueDbResult(undefined);          // set new default

        const result = await setDefaultCurrency(CURRENCY_ID);
        expect(result.error).toBeNull();
        expect(result.success?.reason).toMatch(/updated/i);
    });
});

// ─── getDefaultCurrency ───────────────────────────────────────────────────────

describe("getDefaultCurrency", () => {
    beforeEach(setupMocks);

    it("returns null when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        expect(await getDefaultCurrency()).toBeNull();
    });

    it("returns null when no default currency exists", async () => {
        queueDbResult([]);  // no default found
        expect(await getDefaultCurrency()).toBeNull();
    });

    it("returns the default currency", async () => {
        queueDbResult([SAMPLE_CURRENCY]);
        const result = await getDefaultCurrency();
        expect(result?.currencyCode).toBe("USD");
    });
});

// ─── getAllOrganizationCurrencies ─────────────────────────────────────────────

describe("getAllOrganizationCurrencies", () => {
    beforeEach(setupMocks);

    it("returns empty array when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        expect(await getAllOrganizationCurrencies()).toEqual([]);
    });

    it("returns all currencies for the organization", async () => {
        queueDbResult([
            SAMPLE_CURRENCY,
            { ...SAMPLE_CURRENCY, id: 6, currencyCode: "EUR", isDefault: false },
        ]);
        const result = await getAllOrganizationCurrencies();
        expect(result).toHaveLength(2);
    });
});

// ─── getCurrency ──────────────────────────────────────────────────────────────

describe("getCurrency", () => {
    beforeEach(setupMocks);

    it("returns null when not found", async () => {
        queueDbResult([]);
        expect(await getCurrency(999)).toBeNull();
    });

    it("returns the currency when found", async () => {
        queueDbResult([SAMPLE_CURRENCY]);
        const result = await getCurrency(CURRENCY_ID);
        expect(result?.currencyCode).toBe("USD");
    });
});
