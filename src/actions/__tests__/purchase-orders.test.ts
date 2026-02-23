import { describe, it, expect, vi } from "vitest";
import {
    mockRequirePayablesViewAccess,
    mockRequirePayablesWriteAccess,
    mockRequirePayablesApprovalAccess,
    mockGetFullOrganization,
    mockDbChain,
    mockTransaction,
    mockQueryFindFirst,
    mockRevalidatePath,
    mockCalculateBillAmounts,
    queueDbResult,
    DEFAULT_USER_ID,
    DEFAULT_ORG_ID,
} from "./helpers/setup";

import {
    generatePONumber,
    createPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    getPurchaseOrder,
    getAllPurchaseOrders,
    updatePOStatus,
    approvePurchaseOrder,
    getPOMatchingStatus,
} from "@/actions/payables/purchase-orders";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const defaultOrg = { id: DEFAULT_ORG_ID, name: "Test Org", slug: "testorg" };
const defaultAccess = { userId: DEFAULT_USER_ID };

function setupPayablesMocks() {
    mockRequirePayablesViewAccess.mockResolvedValue(defaultAccess);
    mockRequirePayablesWriteAccess.mockResolvedValue(defaultAccess);
    mockRequirePayablesApprovalAccess.mockResolvedValue(defaultAccess);
    mockGetFullOrganization.mockResolvedValue(defaultOrg);
}

const year = new Date().getFullYear();

const sampleLineItems = [
    { description: "Widget A", quantity: 10, unitPrice: 50 },
    { description: "Widget B", quantity: 5, unitPrice: 100 },
];

const samplePO = {
    id: 1,
    poNumber: `PO-${year}-0001`,
    vendorId: 1,
    currencyId: 1,
    poDate: "2026-01-15",
    status: "Draft",
    subtotal: "1000.00",
    taxAmount: "0.00",
    total: "1000.00",
    receivedAmount: "0.00",
    billedAmount: "0.00",
    organizationId: DEFAULT_ORG_ID,
    createdBy: DEFAULT_USER_ID,
};

// ─── generatePONumber ─────────────────────────────────────────────────────────

describe("generatePONumber", () => {
    it("should return first PO number when no existing POs", async () => {
        mockGetFullOrganization.mockResolvedValue(defaultOrg);
        queueDbResult([]); // latest PO query returns empty

        const result = await generatePONumber();

        expect(result).toBe(`PO-${year}-0001`);
    });

    it("should increment from last PO number", async () => {
        mockGetFullOrganization.mockResolvedValue(defaultOrg);
        queueDbResult([{ poNumber: `PO-${year}-0007`, createdAt: new Date() }]);

        const result = await generatePONumber();

        expect(result).toBe(`PO-${year}-0008`);
    });

    it("should return null when org not found", async () => {
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await generatePONumber();

        expect(result).toBeNull();
    });

    it("should return null on error", async () => {
        mockGetFullOrganization.mockRejectedValue(new Error("fail"));

        const result = await generatePONumber();

        expect(result).toBeNull();
    });
});

// ─── createPurchaseOrder ──────────────────────────────────────────────────────

describe("createPurchaseOrder", () => {
    it("should create a PO with line items successfully", async () => {
        setupPayablesMocks();
        // calculateBillAmounts is mocked globally — return useful values
        mockCalculateBillAmounts.mockReturnValue({ subtotal: 1000, taxAmount: 0, total: 1000 });
        queueDbResult([]); // generatePONumber query: no existing POs

        mockTransaction.mockImplementation(async (cb: (tx: unknown) => unknown) => {
            const tx = {
                insert: vi.fn().mockReturnValue({
                    values: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([samplePO]),
                    }),
                }),
            };
            return cb(tx);
        });

        const result = await createPurchaseOrder({
            vendorId: 1,
            currencyId: 1,
            poDate: "2026-01-15",
            lineItems: sampleLineItems,
        });

        expect(result.error).toBeNull();
        expect(result.success?.data).toMatchObject({ poNumber: `PO-${year}-0001` });
        expect(mockRevalidatePath).toHaveBeenCalledWith("/payables/purchase-orders");
    });

    it("should return error when org not found", async () => {
        mockRequirePayablesWriteAccess.mockResolvedValue(defaultAccess);
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await createPurchaseOrder({
            vendorId: 1,
            currencyId: 1,
            poDate: "2026-01-15",
            lineItems: sampleLineItems,
        });

        expect(result).toEqual({
            success: null,
            error: { reason: "Organization not found" },
        });
    });

    it("should return error when PO number generation fails", async () => {
        setupPayablesMocks();
        // generatePONumber: org not found internally on second call
        mockGetFullOrganization
            .mockResolvedValueOnce(defaultOrg) // first call (createPurchaseOrder)
            .mockResolvedValueOnce(null); // second call (generatePONumber)

        const result = await createPurchaseOrder({
            vendorId: 1,
            currencyId: 1,
            poDate: "2026-01-15",
            lineItems: sampleLineItems,
        });

        expect(result).toEqual({
            success: null,
            error: { reason: "Failed to generate PO number" },
        });
    });

    it("should return error on generic failure", async () => {
        mockRequirePayablesWriteAccess.mockRejectedValue(new Error("fail"));

        const result = await createPurchaseOrder({
            vendorId: 1,
            currencyId: 1,
            poDate: "2026-01-15",
            lineItems: sampleLineItems,
        });

        expect(result).toEqual({
            success: null,
            error: { reason: "Failed to create purchase order" },
        });
    });
});

// ─── updatePurchaseOrder ──────────────────────────────────────────────────────

describe("updatePurchaseOrder", () => {
    it("should update a Draft PO successfully", async () => {
        setupPayablesMocks();
        const updatedPO = { ...samplePO, notes: "Updated notes" };

        queueDbResult([samplePO]); // existing PO check

        mockTransaction.mockImplementation(async (cb: (tx: unknown) => unknown) => {
            const tx = {
                delete: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
                insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue([]) }),
                update: vi.fn().mockReturnValue({
                    set: vi.fn().mockReturnValue({
                        where: vi.fn().mockReturnValue({
                            returning: vi.fn().mockResolvedValue([updatedPO]),
                        }),
                    }),
                }),
            };
            return cb(tx);
        });

        const result = await updatePurchaseOrder(1, { notes: "Updated notes" });

        expect(result.error).toBeNull();
        expect(result.success?.data).toMatchObject({ notes: "Updated notes" });
        expect(mockRevalidatePath).toHaveBeenCalledWith("/payables/purchase-orders");
        expect(mockRevalidatePath).toHaveBeenCalledWith("/payables/purchase-orders/1");
    });

    it("should reject update to non-Draft PO", async () => {
        setupPayablesMocks();
        // Existing PO has status "Approved" — cannot be edited
        queueDbResult([{ ...samplePO, status: "Approved" }]);

        const result = await updatePurchaseOrder(1, { notes: "Attempt edit" });

        expect(result).toEqual({
            success: null,
            error: { reason: "Only draft purchase orders can be edited" },
        });
    });

    it("should return error when PO not found", async () => {
        setupPayablesMocks();
        queueDbResult([]); // no PO found

        const result = await updatePurchaseOrder(99, { notes: "ghost" });

        expect(result).toEqual({
            success: null,
            error: { reason: "Purchase order not found" },
        });
    });

    it("should return error when org not found", async () => {
        mockRequirePayablesWriteAccess.mockResolvedValue(defaultAccess);
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await updatePurchaseOrder(1, { notes: "x" });

        expect(result).toEqual({
            success: null,
            error: { reason: "Organization not found" },
        });
    });
});

// ─── deletePurchaseOrder ──────────────────────────────────────────────────────

describe("deletePurchaseOrder", () => {
    it("should delete a Draft PO successfully", async () => {
        setupPayablesMocks();
        queueDbResult([samplePO]); // PO exists and is Draft
        queueDbResult([]); // delete result

        const result = await deletePurchaseOrder(1);

        expect(result).toEqual({
            success: { reason: "Purchase order deleted successfully" },
            error: null,
        });
        expect(mockRevalidatePath).toHaveBeenCalledWith("/payables/purchase-orders");
    });

    it("should reject deletion of non-Draft PO", async () => {
        setupPayablesMocks();
        queueDbResult([{ ...samplePO, status: "Sent" }]); // cannot delete Sent PO

        const result = await deletePurchaseOrder(1);

        expect(result).toEqual({
            success: null,
            error: { reason: "Only draft purchase orders can be deleted" },
        });
    });

    it("should return error when PO not found", async () => {
        setupPayablesMocks();
        queueDbResult([]); // PO not found

        const result = await deletePurchaseOrder(99);

        expect(result).toEqual({
            success: null,
            error: { reason: "Purchase order not found" },
        });
    });

    it("should return error when org not found", async () => {
        mockRequirePayablesWriteAccess.mockResolvedValue(defaultAccess);
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await deletePurchaseOrder(1);

        expect(result).toEqual({
            success: null,
            error: { reason: "Organization not found" },
        });
    });
});

// ─── getPurchaseOrder ─────────────────────────────────────────────────────────

describe("getPurchaseOrder", () => {
    it("should return PO with relations on success", async () => {
        setupPayablesMocks();
        const poWithRelations = { ...samplePO, vendor: { name: "Acme" }, lineItems: [] };
        mockQueryFindFirst.mockResolvedValueOnce(poWithRelations);

        const result = await getPurchaseOrder(1);

        expect(result).toEqual(poWithRelations);
    });

    it("should return null when PO not found", async () => {
        setupPayablesMocks();
        mockQueryFindFirst.mockResolvedValueOnce(null);

        const result = await getPurchaseOrder(99);

        expect(result).toBeNull();
    });

    it("should return null when org not found", async () => {
        mockRequirePayablesViewAccess.mockResolvedValue(defaultAccess);
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await getPurchaseOrder(1);

        expect(result).toBeNull();
    });

    it("should return null on error", async () => {
        mockRequirePayablesViewAccess.mockRejectedValue(new Error("fail"));

        const result = await getPurchaseOrder(1);

        expect(result).toBeNull();
    });
});

// ─── getAllPurchaseOrders ──────────────────────────────────────────────────────

describe("getAllPurchaseOrders", () => {
    it("should return all POs on success", async () => {
        setupPayablesMocks();
        const poList = [samplePO, { ...samplePO, id: 2, poNumber: `PO-${year}-0002` }];
        queueDbResult(poList);

        const result = await getAllPurchaseOrders();

        expect(result).toEqual(poList);
    });

    it("should return filtered POs by status", async () => {
        setupPayablesMocks();
        queueDbResult([samplePO]);

        const result = await getAllPurchaseOrders({ status: "Draft" });

        expect(result).toEqual([samplePO]);
    });

    it("should return filtered POs by vendor", async () => {
        setupPayablesMocks();
        queueDbResult([samplePO]);

        const result = await getAllPurchaseOrders({ vendorId: 1 });

        expect(result).toEqual([samplePO]);
    });

    it("should return empty array when org not found", async () => {
        mockRequirePayablesViewAccess.mockResolvedValue(defaultAccess);
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await getAllPurchaseOrders();

        expect(result).toEqual([]);
    });

    it("should return empty array on error", async () => {
        mockRequirePayablesViewAccess.mockRejectedValue(new Error("fail"));

        const result = await getAllPurchaseOrders();

        expect(result).toEqual([]);
    });
});

// ─── updatePOStatus ────────────────────────────────────────────────────────────

describe("updatePOStatus", () => {
    it("should update status to Sent and set sentAt", async () => {
        setupPayablesMocks();
        queueDbResult([samplePO]); // existing PO (Draft, sentAt is null)
        queueDbResult([]); // update result

        const result = await updatePOStatus(1, "Sent");

        expect(result).toEqual({
            success: { reason: "Status updated successfully" },
            error: null,
        });
        expect(mockRevalidatePath).toHaveBeenCalledWith("/payables/purchase-orders");
        expect(mockRevalidatePath).toHaveBeenCalledWith("/payables/purchase-orders/1");
    });

    it("should update status to Cancelled and set cancelledAt", async () => {
        setupPayablesMocks();
        queueDbResult([{ ...samplePO, status: "Approved" }]);
        queueDbResult([]);

        const result = await updatePOStatus(1, "Cancelled");

        expect(result).toEqual({
            success: { reason: "Status updated successfully" },
            error: null,
        });
    });

    it("should return error when PO not found", async () => {
        setupPayablesMocks();
        queueDbResult([]); // no PO

        const result = await updatePOStatus(99, "Sent");

        expect(result).toEqual({
            success: null,
            error: { reason: "Purchase order not found" },
        });
    });

    it("should return error when org not found", async () => {
        mockRequirePayablesWriteAccess.mockResolvedValue(defaultAccess);
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await updatePOStatus(1, "Sent");

        expect(result).toEqual({
            success: null,
            error: { reason: "Organization not found" },
        });
    });
});

// ─── approvePurchaseOrder ─────────────────────────────────────────────────────

describe("approvePurchaseOrder", () => {
    it("should approve a PO successfully", async () => {
        setupPayablesMocks();
        queueDbResult([]); // update result

        const result = await approvePurchaseOrder(1);

        expect(result).toEqual({
            success: { reason: "Purchase order approved successfully" },
            error: null,
        });
        expect(mockRevalidatePath).toHaveBeenCalledWith("/payables/purchase-orders");
        expect(mockRevalidatePath).toHaveBeenCalledWith("/payables/purchase-orders/1");
    });

    it("should return error when org not found", async () => {
        mockRequirePayablesApprovalAccess.mockResolvedValue(defaultAccess);
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await approvePurchaseOrder(1);

        expect(result).toEqual({
            success: null,
            error: { reason: "Organization not found" },
        });
    });

    it("should return error on generic failure", async () => {
        mockRequirePayablesApprovalAccess.mockRejectedValue(new Error("fail"));

        const result = await approvePurchaseOrder(1);

        expect(result).toEqual({
            success: null,
            error: { reason: "Failed to approve purchase order" },
        });
    });
});

// ─── getPOMatchingStatus ──────────────────────────────────────────────────────

describe("getPOMatchingStatus", () => {
    it("should return matching status with per-line calculations", async () => {
        setupPayablesMocks();
        const poWithLineItems = {
            ...samplePO,
            total: "1000.00",
            billedAmount: "400.00",
            receivedAmount: "0.00",
            lineItems: [
                {
                    id: 10,
                    description: "Widget A",
                    quantity: "10",
                    billedQuantity: "4",
                    receivedQuantity: "0",
                },
            ],
        };
        mockQueryFindFirst.mockResolvedValueOnce(poWithLineItems);

        const result = await getPOMatchingStatus(1);

        expect(result).not.toBeNull();
        expect(result?.totalOrdered).toBe(1000);
        expect(result?.totalBilled).toBe(400);
        expect(result?.totalUnbilled).toBe(600);
        expect(result?.percentBilled).toBe(40);
        expect(result?.fullyBilled).toBe(false);
        expect(result?.lineItems[0]).toMatchObject({
            orderedQuantity: 10,
            billedQuantity: 4,
            unbilledQuantity: 6,
            percentBilled: 40,
            fullyBilled: false,
        });
    });

    it("should return null when PO not found", async () => {
        setupPayablesMocks();
        mockQueryFindFirst.mockResolvedValueOnce(null);

        const result = await getPOMatchingStatus(99);

        expect(result).toBeNull();
    });

    it("should return null when org not found", async () => {
        mockRequirePayablesViewAccess.mockResolvedValue(defaultAccess);
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await getPOMatchingStatus(1);

        expect(result).toBeNull();
    });

    it("should return null on error", async () => {
        mockRequirePayablesViewAccess.mockRejectedValue(new Error("fail"));

        const result = await getPOMatchingStatus(1);

        expect(result).toBeNull();
    });
});
