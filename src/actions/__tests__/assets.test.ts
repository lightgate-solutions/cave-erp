import { describe, it, expect, beforeEach } from "vitest";
import {
    mockRequireAssetAccess,
    mockGetFullOrganization,
    queueDbResult,
    DEFAULT_USER_ID,
    DEFAULT_ORG_ID,
} from "./helpers/setup";

import {
    getAssets,
    getAsset,
    createAsset,
    updateAsset,
    deleteAsset,
    disposeAsset,
} from "@/actions/assets/assets";

const DEFAULT_ORG = { id: DEFAULT_ORG_ID, name: "Test Org" };

const SAMPLE_CATEGORY = {
    id: 3,
    name: "Computers",
    codePrefix: "COMP",
    organizationId: DEFAULT_ORG_ID,
};

const SAMPLE_ASSET = {
    id: 10,
    organizationId: DEFAULT_ORG_ID,
    assetCode: "2026-COMP-0001",
    name: "Dell Laptop",
    description: null,
    categoryId: 3,
    locationId: null,
    purchasePrice: "1500.00",
    currentValue: "1500.00",
    status: "Active",
    serialNumber: "SN-001",
    requiresMaintenance: false,
    createdBy: DEFAULT_USER_ID,
};

function setupMocks() {
    mockGetFullOrganization.mockResolvedValue(DEFAULT_ORG);
    mockRequireAssetAccess.mockResolvedValue({ userId: DEFAULT_USER_ID, role: "admin" });
}

// ─── getAssets ────────────────────────────────────────────────────────────────

describe("getAssets", () => {
    beforeEach(setupMocks);

    it("throws when organization not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        await expect(getAssets()).rejects.toThrow("Organization not found");
    });

    it("returns paginated assets with empty list (no assignments query)", async () => {
        // Promise.all: assetsList query consumes first, countResult consumes second
        queueDbResult([]);               // assetsList
        queueDbResult([{ count: 0 }]);   // countResult

        const result = await getAssets();
        expect(result.assets).toHaveLength(0);
        expect(result.total).toBe(0);
        expect(result.page).toBe(1);
    });

    it("returns assets with currentAssignment mapped from assetAssignments", async () => {
        queueDbResult([SAMPLE_ASSET]);              // assetsList
        queueDbResult([{ count: 1 }]);              // countResult
        queueDbResult([{                            // assignments query
            assetId: 10,
            targetType: "employee",
            employeeId: DEFAULT_USER_ID,
            department: null,
            projectId: null,
            employeeName: "Alice",
        }]);

        const result = await getAssets();
        expect(result.assets).toHaveLength(1);
        expect(result.assets[0].currentAssignment).not.toBeNull();
        expect(result.assets[0].currentAssignment?.employeeName).toBe("Alice");
    });

    it("respects pagination params", async () => {
        queueDbResult([]);
        queueDbResult([{ count: 50 }]);

        const result = await getAssets({ page: 3, limit: 10 });
        expect(result.page).toBe(3);
        expect(result.totalPages).toBe(5);
    });
});

// ─── getAsset ─────────────────────────────────────────────────────────────────

describe("getAsset", () => {
    beforeEach(setupMocks);

    it("throws when organization not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        await expect(getAsset(1)).rejects.toThrow("Organization not found");
    });

    it("returns null when asset not found", async () => {
        queueDbResult([]);  // asset select returns empty
        expect(await getAsset(999)).toBeNull();
    });

    it("returns asset with currentAssignment", async () => {
        queueDbResult([SAMPLE_ASSET]);   // main asset
        queueDbResult([{                 // current assignment
            id: 1,
            targetType: "employee",
            employeeId: DEFAULT_USER_ID,
            employeeName: "Alice",
            assignedDate: "2026-01-01",
            expectedReturnDate: null,
            department: null,
            projectId: null,
            notes: null,
        }]);

        const result = await getAsset(10);
        expect(result?.name).toBe("Dell Laptop");
        expect(result?.currentAssignment?.employeeName).toBe("Alice");
    });

    it("returns asset with null assignment when no active assignment", async () => {
        queueDbResult([SAMPLE_ASSET]);
        queueDbResult([]);  // no assignment

        const result = await getAsset(10);
        expect(result?.currentAssignment).toBeNull();
    });
});

// ─── createAsset ──────────────────────────────────────────────────────────────

describe("createAsset", () => {
    beforeEach(setupMocks);

    it("creates asset with auto-generated code", async () => {
        // generateAssetCode is called internally and makes:
        //   1. getFullOrg (already returns DEFAULT_ORG via setupMocks)
        //   2. category lookup → queueDbResult
        //   3. last asset code lookup → queueDbResult
        // Then createAsset makes:
        //   4. insert returning → queueDbResult
        queueDbResult([SAMPLE_CATEGORY]);         // category lookup in generateAssetCode
        queueDbResult([]);                         // no previous asset code → sequence = 1
        queueDbResult([SAMPLE_ASSET]);             // insert returning

        const result = await createAsset({
            name: "Dell Laptop",
            categoryId: 3,
            purchasePrice: 1500,
        });
        expect(result.name).toBe("Dell Laptop");
        expect(result.assetCode).toBe("2026-COMP-0001");
    });

    it("sets currentValue to purchasePrice when not provided", async () => {
        queueDbResult([SAMPLE_CATEGORY]);
        queueDbResult([]);
        queueDbResult([{ ...SAMPLE_ASSET, currentValue: "1500.00" }]);

        const result = await createAsset({ name: "Laptop", categoryId: 3, purchasePrice: 1500 });
        expect(result.currentValue).toBe("1500.00");
    });
});

// ─── updateAsset ──────────────────────────────────────────────────────────────

describe("updateAsset", () => {
    beforeEach(setupMocks);

    it("throws when organization not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        await expect(updateAsset(10, { name: "New" })).rejects.toThrow("Organization not found");
    });

    it("updates asset fields and returns updated record", async () => {
        queueDbResult([{ ...SAMPLE_ASSET, name: "Lenovo Laptop" }]);
        const result = await updateAsset(10, { name: "Lenovo Laptop" });
        expect(result?.name).toBe("Lenovo Laptop");
    });

    it("sets purchasePrice to null when explicitly passed null", async () => {
        queueDbResult([{ ...SAMPLE_ASSET, purchasePrice: null }]);
        const result = await updateAsset(10, { purchasePrice: null });
        expect(result?.purchasePrice).toBeNull();
    });
});

// ─── deleteAsset ──────────────────────────────────────────────────────────────

describe("deleteAsset", () => {
    beforeEach(setupMocks);

    it("throws when organization not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        await expect(deleteAsset(10)).rejects.toThrow("Organization not found");
    });

    it("deletes the asset and returns success", async () => {
        queueDbResult(undefined);
        expect((await deleteAsset(10)).success).toBe(true);
    });
});

// ─── disposeAsset ─────────────────────────────────────────────────────────────

describe("disposeAsset", () => {
    beforeEach(setupMocks);

    it("throws when organization not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        await expect(
            disposeAsset(10, { disposalDate: "2026-06-01", disposalReason: "End of life" }),
        ).rejects.toThrow("Organization not found");
    });

    it("marks asset as Disposed and returns updated record", async () => {
        queueDbResult([{
            ...SAMPLE_ASSET,
            status: "Disposed",
            disposalDate: new Date("2026-06-01"),
            disposalReason: "End of life",
            disposalPrice: "200.00",
            disposedBy: DEFAULT_USER_ID,
        }]);

        const result = await disposeAsset(10, {
            disposalDate: "2026-06-01",
            disposalReason: "End of life",
            disposalPrice: 200,
        });
        expect(result?.status).toBe("Disposed");
        expect(result?.disposalReason).toBe("End of life");
    });
});
