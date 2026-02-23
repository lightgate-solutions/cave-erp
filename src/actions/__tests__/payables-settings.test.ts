import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    mockRequirePayablesViewAccess,
    mockRequirePayablesWriteAccess,
    mockGetFullOrganization,
    mockDbChain,
    queueDbResult,
    DEFAULT_USER_ID,
    DEFAULT_ORG_ID,
} from "./helpers/setup";

import {
    createTaxConfig,
    updateTaxConfig,
    deleteTaxConfig,
    getAllTaxConfigs,
    getTaxConfig,
    createCustomCategory,
    updateCustomCategory,
    deleteCustomCategory,
    getAllCustomCategories,
    getCustomCategory,
} from "@/actions/payables/settings";

const DEFAULT_ORG = { id: DEFAULT_ORG_ID, name: "Test Org" };
const DEFAULT_EMPLOYEE = { userId: DEFAULT_USER_ID };

function setupMocks() {
    mockGetFullOrganization.mockResolvedValue(DEFAULT_ORG);
    mockRequirePayablesWriteAccess.mockResolvedValue({ employee: DEFAULT_EMPLOYEE });
    mockRequirePayablesViewAccess.mockResolvedValue({ employee: DEFAULT_EMPLOYEE });
}

// ─── Tax Config ───────────────────────────────────────────────────────────────

describe("createTaxConfig", () => {
    beforeEach(setupMocks);

    it("returns error when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        const result = await createTaxConfig({ taxType: "VAT", taxName: "VAT", defaultRate: 15 });
        expect(result.success).toBeNull();
        expect(result.error?.reason).toBe("Organization not found");
    });

    it("creates a tax config and returns it", async () => {
        const taxConfig = {
            id: 1, taxType: "VAT", taxName: "VAT", defaultRate: "15",
            description: null, isActive: true, organizationId: DEFAULT_ORG_ID,
        };
        queueDbResult([taxConfig]);
        const result = await createTaxConfig({ taxType: "VAT", taxName: "VAT", defaultRate: 15 });
        expect(result.error).toBeNull();
        expect(result.success?.data.taxType).toBe("VAT");
    });
});

describe("updateTaxConfig", () => {
    beforeEach(setupMocks);

    it("returns error when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        const result = await updateTaxConfig(1, { taxName: "New" });
        expect(result.success).toBeNull();
        expect(result.error?.reason).toBe("Organization not found");
    });

    it("returns error when tax config is not found", async () => {
        mockDbChain.limit.mockResolvedValueOnce([]);
        const result = await updateTaxConfig(999, { taxName: "New" });
        expect(result.success).toBeNull();
        expect(result.error?.reason).toBe("Tax configuration not found");
    });

    it("updates tax config successfully", async () => {
        const existing = { id: 1, taxType: "VAT", taxName: "Old", defaultRate: "10", isActive: true, organizationId: DEFAULT_ORG_ID };
        mockDbChain.limit.mockResolvedValueOnce([existing]);
        queueDbResult([{ ...existing, taxName: "New", defaultRate: "12" }]);
        const result = await updateTaxConfig(1, { taxName: "New", defaultRate: 12 });
        expect(result.error).toBeNull();
        expect(result.success?.data.taxName).toBe("New");
    });
});

describe("deleteTaxConfig", () => {
    beforeEach(setupMocks);

    it("returns error when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        expect((await deleteTaxConfig(1)).error?.reason).toBe("Organization not found");
    });

    it("returns error when tax config is not found", async () => {
        mockDbChain.limit.mockResolvedValueOnce([]);
        expect((await deleteTaxConfig(999)).error?.reason).toBe("Tax configuration not found");
    });

    it("deletes tax config successfully", async () => {
        const existing = { id: 1, isActive: true, organizationId: DEFAULT_ORG_ID };
        mockDbChain.limit.mockResolvedValueOnce([existing]);
        const result = await deleteTaxConfig(1);
        expect(result.error).toBeNull();
        expect(result.success?.reason).toMatch(/deleted/i);
    });
});

describe("getAllTaxConfigs", () => {
    beforeEach(setupMocks);

    it("returns empty array when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        expect(await getAllTaxConfigs()).toEqual([]);
    });

    it("returns active configs by default", async () => {
        mockDbChain.orderBy.mockResolvedValueOnce([{ id: 1, taxName: "VAT", isActive: true }]);
        const result = await getAllTaxConfigs();
        expect(result).toHaveLength(1);
    });

    it("returns all configs including inactive when includeInactive=true", async () => {
        mockDbChain.orderBy.mockResolvedValueOnce([
            { id: 1, taxName: "VAT", isActive: true },
            { id: 2, taxName: "Old", isActive: false },
        ]);
        const result = await getAllTaxConfigs(true);
        expect(result).toHaveLength(2);
    });
});

describe("getTaxConfig", () => {
    beforeEach(setupMocks);

    it("returns null when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        expect(await getTaxConfig(1)).toBeNull();
    });

    it("returns null when not found", async () => {
        mockDbChain.limit.mockResolvedValueOnce([]);
        expect(await getTaxConfig(999)).toBeNull();
    });

    it("returns the tax config when found", async () => {
        const config = { id: 1, taxName: "VAT", taxType: "VAT", isActive: true, organizationId: DEFAULT_ORG_ID };
        mockDbChain.limit.mockResolvedValueOnce([config]);
        const result = await getTaxConfig(1);
        expect(result?.taxName).toBe("VAT");
    });
});

// ─── Custom Category ──────────────────────────────────────────────────────────

describe("createCustomCategory", () => {
    beforeEach(setupMocks);

    it("returns error when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        expect((await createCustomCategory({ name: "Software" })).error?.reason)
            .toBe("Organization not found");
    });

    it("rejects duplicate category name", async () => {
        mockDbChain.limit.mockResolvedValueOnce([{ id: 1, name: "Software" }]);
        const result = await createCustomCategory({ name: "Software" });
        expect(result.success).toBeNull();
        expect(result.error?.reason).toBe("Category with this name already exists");
    });

    it("creates a new category when name is unique", async () => {
        mockDbChain.limit.mockResolvedValueOnce([]);  // no duplicate
        const category = { id: 1, name: "Software", isActive: true, organizationId: DEFAULT_ORG_ID };
        queueDbResult([category]);
        const result = await createCustomCategory({ name: "Software" });
        expect(result.error).toBeNull();
        expect(result.success?.data.name).toBe("Software");
    });
});

describe("updateCustomCategory", () => {
    beforeEach(setupMocks);

    it("returns error when category is not found", async () => {
        mockDbChain.limit.mockResolvedValueOnce([]);
        expect((await updateCustomCategory(999, { name: "X" })).error?.reason)
            .toBe("Custom category not found");
    });

    it("rejects renaming to an existing category name", async () => {
        const existing = { id: 1, name: "Software", isActive: true, organizationId: DEFAULT_ORG_ID };
        mockDbChain.limit
            .mockResolvedValueOnce([existing])                         // fetch category
            .mockResolvedValueOnce([{ id: 2, name: "Hardware" }]);    // duplicate check
        const result = await updateCustomCategory(1, { name: "Hardware" });
        expect(result.success).toBeNull();
        expect(result.error?.reason).toBe("Category with this name already exists");
    });

    it("updates category successfully (no name change)", async () => {
        const existing = { id: 1, name: "Software", isActive: true, organizationId: DEFAULT_ORG_ID };
        mockDbChain.limit.mockResolvedValueOnce([existing]);
        queueDbResult([{ ...existing, isActive: false }]);
        const result = await updateCustomCategory(1, { isActive: false });
        expect(result.error).toBeNull();
        expect(result.success?.data.isActive).toBe(false);
    });
});

describe("deleteCustomCategory", () => {
    beforeEach(setupMocks);

    it("returns error when category is not found", async () => {
        mockDbChain.limit.mockResolvedValueOnce([]);
        expect((await deleteCustomCategory(999)).error?.reason).toBe("Custom category not found");
    });

    it("deletes category successfully", async () => {
        const existing = { id: 1, name: "Software", isActive: true, organizationId: DEFAULT_ORG_ID };
        mockDbChain.limit.mockResolvedValueOnce([existing]);
        const result = await deleteCustomCategory(1);
        expect(result.error).toBeNull();
        expect(result.success?.reason).toMatch(/deleted/i);
    });
});

describe("getAllCustomCategories", () => {
    beforeEach(setupMocks);

    it("returns empty array when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        expect(await getAllCustomCategories()).toEqual([]);
    });

    it("returns active categories by default", async () => {
        mockDbChain.orderBy.mockResolvedValueOnce([{ id: 1, name: "Software", isActive: true }]);
        expect(await getAllCustomCategories()).toHaveLength(1);
    });
});

describe("getCustomCategory", () => {
    beforeEach(setupMocks);

    it("returns null when not found", async () => {
        mockDbChain.limit.mockResolvedValueOnce([]);
        expect(await getCustomCategory(999)).toBeNull();
    });

    it("returns the category when found", async () => {
        const category = { id: 1, name: "Hardware", isActive: true, organizationId: DEFAULT_ORG_ID };
        mockDbChain.limit.mockResolvedValueOnce([category]);
        expect((await getCustomCategory(1))?.name).toBe("Hardware");
    });
});
