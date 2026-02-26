import { describe, it, expect, beforeEach } from "vitest";
import {
    mockRequireAssetAccess,
    mockGetFullOrganization,
    queueDbResult,
    DEFAULT_USER_ID,
    DEFAULT_ORG_ID,
} from "./helpers/setup";

import {
    getAssetCategories,
    getAssetCategory,
    createAssetCategory,
    updateAssetCategory,
    deleteAssetCategory,
} from "@/actions/assets/categories";

const DEFAULT_ORG = { id: DEFAULT_ORG_ID, name: "Test Org" };

const SAMPLE_CATEGORY = {
    id: 1,
    name: "Computers",
    description: "IT equipment",
    codePrefix: "COMP",
    defaultUsefulLifeYears: 5,
    defaultResidualValuePercent: "10",
    isActive: true,
    organizationId: DEFAULT_ORG_ID,
    createdBy: DEFAULT_USER_ID,
};

function setupMocks() {
    mockGetFullOrganization.mockResolvedValue(DEFAULT_ORG);
    mockRequireAssetAccess.mockResolvedValue({ userId: DEFAULT_USER_ID, role: "admin" });
}

// ─── getAssetCategories ───────────────────────────────────────────────────────

describe("getAssetCategories", () => {
    beforeEach(setupMocks);

    it("throws when organization not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        await expect(getAssetCategories()).rejects.toThrow("Organization not found");
    });

    it("returns all categories for the org", async () => {
        queueDbResult([SAMPLE_CATEGORY]);
        const result = await getAssetCategories();
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("Computers");
    });
});

// ─── getAssetCategory ─────────────────────────────────────────────────────────

describe("getAssetCategory", () => {
    beforeEach(setupMocks);

    it("throws when organization not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        await expect(getAssetCategory(1)).rejects.toThrow("Organization not found");
    });

    it("returns the category by id", async () => {
        queueDbResult([SAMPLE_CATEGORY]);
        const result = await getAssetCategory(1);
        expect(result?.codePrefix).toBe("COMP");
    });

    it("returns undefined when category not found", async () => {
        queueDbResult([]);
        expect(await getAssetCategory(999)).toBeUndefined();
    });
});

// ─── createAssetCategory ──────────────────────────────────────────────────────

describe("createAssetCategory", () => {
    beforeEach(setupMocks);

    it("throws when organization not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        await expect(
            createAssetCategory({ name: "Furniture", codePrefix: "FURN" }),
        ).rejects.toThrow("Organization not found");
    });

    it("throws when code prefix already exists", async () => {
        queueDbResult([SAMPLE_CATEGORY]); // duplicate exists
        await expect(
            createAssetCategory({ name: "Computers", codePrefix: "COMP" }),
        ).rejects.toThrow("A category with this code prefix already exists");
    });

    it("creates category and uppercases the code prefix", async () => {
        queueDbResult([]);                    // no duplicate
        queueDbResult([SAMPLE_CATEGORY]);     // insert returning

        const result = await createAssetCategory({
            name: "Computers", codePrefix: "comp",
            defaultUsefulLifeYears: 5,
        });
        expect(result.name).toBe("Computers");
        expect(result.codePrefix).toBe("COMP");
    });
});

// ─── updateAssetCategory ──────────────────────────────────────────────────────

describe("updateAssetCategory", () => {
    beforeEach(setupMocks);

    it("throws when organization not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        await expect(updateAssetCategory(1, { name: "New" })).rejects.toThrow("Organization not found");
    });

    it("throws when new codePrefix conflicts with another category", async () => {
        // existing with different id
        queueDbResult([{ ...SAMPLE_CATEGORY, id: 99 }]); // conflict found
        await expect(
            updateAssetCategory(1, { codePrefix: "COMP" }),
        ).rejects.toThrow("A category with this code prefix already exists");
    });

    it("allows update when codePrefix matches own record", async () => {
        queueDbResult([SAMPLE_CATEGORY]);  // existing is the same id=1
        queueDbResult([{ ...SAMPLE_CATEGORY, name: "Updated Computers" }]);  // update returning

        const result = await updateAssetCategory(1, { codePrefix: "COMP", name: "Updated Computers" });
        expect(result?.name).toBe("Updated Computers");
    });

    it("updates without duplicate check when codePrefix not in data", async () => {
        queueDbResult([{ ...SAMPLE_CATEGORY, isActive: false }]);  // update returning
        const result = await updateAssetCategory(1, { isActive: false });
        expect(result?.isActive).toBe(false);
    });
});

// ─── deleteAssetCategory ──────────────────────────────────────────────────────

describe("deleteAssetCategory", () => {
    beforeEach(setupMocks);

    it("throws when organization not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        await expect(deleteAssetCategory(1)).rejects.toThrow("Organization not found");
    });

    it("deletes and returns success", async () => {
        queueDbResult(undefined); // delete
        const result = await deleteAssetCategory(1);
        expect(result.success).toBe(true);
    });
});
