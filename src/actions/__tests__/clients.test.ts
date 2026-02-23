import { describe, it, expect } from "vitest";
import {
    mockRequireInvoicingViewAccess,
    mockRequireInvoicingWriteAccess,
    mockGetFullOrganization,
    mockDbChain,
    mockQueryFindFirst,
    mockRevalidatePath,
    queueDbResult,
    DEFAULT_USER_ID,
    DEFAULT_ORG_ID,
} from "./helpers/setup";

import {
    generateClientCode,
    createClient,
    updateClient,
    deleteClient,
    getClient,
    getAllClients,
    getClientInvoices,
} from "@/actions/invoicing/clients";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const defaultOrg = { id: DEFAULT_ORG_ID, name: "Test Org", slug: "testorg" };
const defaultAccess = {
    userId: DEFAULT_USER_ID,
    employee: { userId: DEFAULT_USER_ID },
};

function setupInvoicingMocks() {
    mockRequireInvoicingViewAccess.mockResolvedValue(defaultAccess);
    mockRequireInvoicingWriteAccess.mockResolvedValue(defaultAccess);
    mockGetFullOrganization.mockResolvedValue(defaultOrg);
}

const year = new Date().getFullYear();

const sampleClient = {
    id: 1,
    clientCode: `CLI-${year}-0001`,
    name: "Acme Corp",
    email: "acme@example.com",
    isActive: true,
    organizationId: DEFAULT_ORG_ID,
};

const sampleClientInput = {
    name: "Acme Corp",
    email: "acme@example.com",
};

// ─── generateClientCode ───────────────────────────────────────────────────────

describe("generateClientCode", () => {
    it("should return first code when no clients exist", async () => {
        mockGetFullOrganization.mockResolvedValue(defaultOrg);
        queueDbResult([]);

        const result = await generateClientCode();

        expect(result).toBe(`CLI-${year}-0001`);
    });

    it("should increment from last client code", async () => {
        mockGetFullOrganization.mockResolvedValue(defaultOrg);
        queueDbResult([{ clientCode: `CLI-${year}-0003`, createdAt: new Date() }]);

        const result = await generateClientCode();

        expect(result).toBe(`CLI-${year}-0004`);
    });

    it("should return null when org not found", async () => {
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await generateClientCode();

        expect(result).toBeNull();
    });

    it("should return null on error", async () => {
        mockGetFullOrganization.mockRejectedValue(new Error("fail"));

        const result = await generateClientCode();

        expect(result).toBeNull();
    });
});

// ─── createClient ─────────────────────────────────────────────────────────────

describe("createClient", () => {
    it("should create a client successfully", async () => {
        setupInvoicingMocks();
        queueDbResult([]); // generateClientCode: no existing clients
        queueDbResult([sampleClient]); // insert returning

        const result = await createClient(sampleClientInput);

        expect(result.error).toBeNull();
        expect(result.success?.data).toMatchObject({ name: "Acme Corp" });
        expect(mockRevalidatePath).toHaveBeenCalledWith("/invoicing/clients");
    });

    it("should return error when org not found", async () => {
        mockRequireInvoicingWriteAccess.mockResolvedValue(defaultAccess);
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await createClient(sampleClientInput);

        expect(result).toEqual({
            success: null,
            error: { reason: "Organization not found" },
        });
    });

    it("should return error when client code generation fails", async () => {
        setupInvoicingMocks();
        // On second call (generateClientCode), org returns null
        mockGetFullOrganization
            .mockResolvedValueOnce(defaultOrg) // createClient call
            .mockResolvedValueOnce(null); // generateClientCode call

        const result = await createClient(sampleClientInput);

        expect(result).toEqual({
            success: null,
            error: { reason: "Failed to generate client code" },
        });
    });

    it("should return error on generic failure", async () => {
        mockRequireInvoicingWriteAccess.mockRejectedValue(new Error("fail"));

        const result = await createClient(sampleClientInput);

        expect(result).toEqual({
            success: null,
            error: { reason: "Failed to create client" },
        });
    });
});

// ─── updateClient ─────────────────────────────────────────────────────────────

describe("updateClient", () => {
    it("should update client successfully", async () => {
        setupInvoicingMocks();
        queueDbResult([sampleClient]); // existing client check
        queueDbResult([{ ...sampleClient, name: "Acme Corp Updated" }]); // update returning

        const result = await updateClient(1, { name: "Acme Corp Updated" });

        expect(result.error).toBeNull();
        expect(result.success?.data).toMatchObject({ name: "Acme Corp Updated" });
        expect(mockRevalidatePath).toHaveBeenCalledWith("/invoicing/clients");
        expect(mockRevalidatePath).toHaveBeenCalledWith("/invoicing/clients/1");
    });

    it("should return error when client not found", async () => {
        setupInvoicingMocks();
        queueDbResult([]); // empty → client not found

        const result = await updateClient(99, { name: "Ghost" });

        expect(result).toEqual({
            success: null,
            error: { reason: "Client not found" },
        });
    });

    it("should return error when org not found", async () => {
        mockRequireInvoicingWriteAccess.mockResolvedValue(defaultAccess);
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await updateClient(1, { name: "x" });

        expect(result).toEqual({
            success: null,
            error: { reason: "Organization not found" },
        });
    });

    it("should return error on generic failure", async () => {
        mockRequireInvoicingWriteAccess.mockRejectedValue(new Error("fail"));

        const result = await updateClient(1, { name: "x" });

        expect(result).toEqual({
            success: null,
            error: { reason: "Failed to update client" },
        });
    });
});

// ─── deleteClient ─────────────────────────────────────────────────────────────

describe("deleteClient", () => {
    it("should hard-delete client when no invoices exist", async () => {
        setupInvoicingMocks();
        queueDbResult([{ count: 0 }]); // invoice count check
        queueDbResult([]); // delete result

        const result = await deleteClient(1);

        expect(result).toEqual({
            success: { reason: "Client deleted successfully" },
            error: null,
        });
        expect(mockRevalidatePath).toHaveBeenCalledWith("/invoicing/clients");
    });

    it("should soft-delete (mark inactive) when client has invoices", async () => {
        setupInvoicingMocks();
        queueDbResult([{ count: 3 }]); // client has 3 invoices
        queueDbResult([]); // update isActive=false result

        const result = await deleteClient(1);

        expect(result).toEqual({
            success: { reason: "Client has invoices. Marked as inactive instead." },
            error: null,
        });
        expect(mockRevalidatePath).toHaveBeenCalledWith("/invoicing/clients");
    });

    it("should return error when org not found", async () => {
        mockRequireInvoicingWriteAccess.mockResolvedValue(defaultAccess);
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await deleteClient(1);

        expect(result).toEqual({
            success: null,
            error: { reason: "Organization not found" },
        });
    });

    it("should return error on generic failure", async () => {
        mockRequireInvoicingWriteAccess.mockRejectedValue(new Error("fail"));

        const result = await deleteClient(1);

        expect(result).toEqual({
            success: null,
            error: { reason: "Failed to delete client" },
        });
    });
});

// ─── getClient ────────────────────────────────────────────────────────────────

describe("getClient", () => {
    it("should return client with stats on success", async () => {
        setupInvoicingMocks();
        queueDbResult([sampleClient]); // client lookup
        queueDbResult([{
            totalInvoices: 5,
            totalRevenue: "25000.00",
            paidAmount: "20000.00",
            outstandingAmount: "5000.00",
        }]); // stats

        const result = await getClient(1);

        expect(result).toMatchObject({
            ...sampleClient,
            stats: {
                totalInvoices: 5,
                totalRevenue: "25000.00",
                paidAmount: "20000.00",
                outstandingAmount: "5000.00",
            },
        });
    });

    it("should use fallback values for null stats", async () => {
        setupInvoicingMocks();
        queueDbResult([sampleClient]);
        queueDbResult([{
            totalInvoices: 0,
            totalRevenue: null,
            paidAmount: null,
            outstandingAmount: null,
        }]);

        const result = await getClient(1);

        expect(result?.stats).toEqual({
            totalInvoices: 0,
            totalRevenue: "0.00",
            paidAmount: "0.00",
            outstandingAmount: "0.00",
        });
    });

    it("should return null when client not found", async () => {
        setupInvoicingMocks();
        queueDbResult([]); // no client found

        const result = await getClient(99);

        expect(result).toBeNull();
    });

    it("should return null when org not found", async () => {
        mockRequireInvoicingViewAccess.mockResolvedValue(defaultAccess);
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await getClient(1);

        expect(result).toBeNull();
    });

    it("should return null on error", async () => {
        mockRequireInvoicingViewAccess.mockRejectedValue(new Error("fail"));

        const result = await getClient(1);

        expect(result).toBeNull();
    });
});

// ─── getAllClients ─────────────────────────────────────────────────────────────

describe("getAllClients", () => {
    it("should return all clients on success", async () => {
        setupInvoicingMocks();
        const clientList = [sampleClient, { ...sampleClient, id: 2, name: "Beta Ltd" }];
        queueDbResult(clientList);

        const result = await getAllClients();

        expect(result).toEqual(clientList);
    });

    it("should return filtered clients by isActive", async () => {
        setupInvoicingMocks();
        queueDbResult([sampleClient]);

        const result = await getAllClients({ isActive: true });

        expect(result).toEqual([sampleClient]);
    });

    it("should return filtered clients by search", async () => {
        setupInvoicingMocks();
        queueDbResult([sampleClient]);

        const result = await getAllClients({ search: "Acme" });

        expect(result).toEqual([sampleClient]);
    });

    it("should return empty array when org not found", async () => {
        mockRequireInvoicingViewAccess.mockResolvedValue(defaultAccess);
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await getAllClients();

        expect(result).toEqual([]);
    });

    it("should return empty array on error", async () => {
        mockRequireInvoicingViewAccess.mockRejectedValue(new Error("fail"));

        const result = await getAllClients();

        expect(result).toEqual([]);
    });
});

// ─── getClientInvoices ────────────────────────────────────────────────────────

describe("getClientInvoices", () => {
    const invoiceList = [
        { id: 100, clientId: 1, status: "Draft", total: "1000.00" },
        { id: 101, clientId: 1, status: "Approved", total: "2000.00" },
    ];

    it("should return invoices for a client", async () => {
        setupInvoicingMocks();
        queueDbResult(invoiceList);

        const result = await getClientInvoices(1);

        expect(result).toEqual(invoiceList);
    });

    it("should return filtered invoices by status", async () => {
        setupInvoicingMocks();
        queueDbResult([invoiceList[1]]);

        const result = await getClientInvoices(1, { status: "Approved" });

        expect(result).toEqual([invoiceList[1]]);
    });

    it("should return empty array when org not found", async () => {
        mockRequireInvoicingViewAccess.mockResolvedValue(defaultAccess);
        mockGetFullOrganization.mockResolvedValue(null);

        const result = await getClientInvoices(1);

        expect(result).toEqual([]);
    });

    it("should return empty array on error", async () => {
        mockRequireInvoicingViewAccess.mockRejectedValue(new Error("fail"));

        const result = await getClientInvoices(1);

        expect(result).toEqual([]);
    });
});
