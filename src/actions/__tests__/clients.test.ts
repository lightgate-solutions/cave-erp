import { describe, it, expect, beforeEach } from "vitest";
import {
    mockRequireInvoicingViewAccess,
    mockRequireInvoicingWriteAccess,
    mockGetFullOrganization,
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

const DEFAULT_ORG = { id: DEFAULT_ORG_ID, name: "Test Org", slug: "TES" };
const DEFAULT_EMPLOYEE = { userId: DEFAULT_USER_ID };

const SAMPLE_CLIENT = {
    id: 1,
    clientCode: `CLI-${new Date().getFullYear()}-0001`,
    name: "ACME Corp",
    email: "acme@example.com",
    phone: null,
    companyName: null,
    isActive: true,
    organizationId: DEFAULT_ORG_ID,
    createdBy: DEFAULT_USER_ID,
};

function setupMocks() {
    mockGetFullOrganization.mockResolvedValue(DEFAULT_ORG);
    mockRequireInvoicingWriteAccess.mockResolvedValue({ employee: DEFAULT_EMPLOYEE });
    mockRequireInvoicingViewAccess.mockResolvedValue({ employee: DEFAULT_EMPLOYEE });
}

// ─── generateClientCode ───────────────────────────────────────────────────────

describe("generateClientCode", () => {
    beforeEach(setupMocks);

    it("returns null when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        expect(await generateClientCode()).toBeNull();
    });

    it("returns first code when no clients exist yet", async () => {
        queueDbResult([]);  // no existing client
        const year = new Date().getFullYear();
        expect(await generateClientCode()).toBe(`CLI-${year}-0001`);
    });

    it("increments code from the latest client", async () => {
        const year = new Date().getFullYear();
        queueDbResult([{ clientCode: `CLI-${year}-0005` }]);
        expect(await generateClientCode()).toBe(`CLI-${year}-0006`);
    });
});

// ─── createClient ─────────────────────────────────────────────────────────────

describe("createClient", () => {
    beforeEach(setupMocks);

    it("returns error when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        const result = await createClient({ name: "Foo", email: "foo@test.com" });
        expect(result.success).toBeNull();
        expect(result.error?.reason).toBe("Organization not found");
    });

    it("creates client and returns it", async () => {
        const year = new Date().getFullYear();
        queueDbResult([]);               // generateClientCode: no existing
        queueDbResult([SAMPLE_CLIENT]);  // insert returning

        const result = await createClient({ name: "ACME Corp", email: "acme@example.com" });
        expect(result.error).toBeNull();
        expect(result.success?.data.name).toBe("ACME Corp");
        expect(result.success?.data.clientCode).toMatch(new RegExp(`CLI-${year}-`));
    });

    it("returns error when client code generation fails", async () => {
        // generateClientCode calls getFullOrganization first (succeeds),
        // then fails on the select (error → null code)
        mockGetFullOrganization
            .mockResolvedValueOnce(DEFAULT_ORG)  // main createClient call
            .mockResolvedValueOnce(null);         // inner generateClientCode call
        const result = await createClient({ name: "X", email: "x@x.com" });
        expect(result.success).toBeNull();
        expect(result.error?.reason).toBe("Failed to generate client code");
    });
});

// ─── updateClient ─────────────────────────────────────────────────────────────

describe("updateClient", () => {
    beforeEach(setupMocks);

    it("returns error when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        expect((await updateClient(1, { name: "New" })).error?.reason).toBe("Organization not found");
    });

    it("returns error when client is not found", async () => {
        queueDbResult([]);  // select existing
        const result = await updateClient(999, { name: "New" });
        expect(result.success).toBeNull();
        expect(result.error?.reason).toBe("Client not found");
    });

    it("updates client and returns updated record", async () => {
        queueDbResult([SAMPLE_CLIENT]);                               // fetch existing
        queueDbResult([{ ...SAMPLE_CLIENT, name: "New Name" }]);     // update returning

        const result = await updateClient(1, { name: "New Name" });
        expect(result.error).toBeNull();
        expect(result.success?.data.name).toBe("New Name");
    });
});

// ─── deleteClient ─────────────────────────────────────────────────────────────

describe("deleteClient", () => {
    beforeEach(setupMocks);

    it("returns error when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        expect((await deleteClient(1)).error?.reason).toBe("Organization not found");
    });

    it("marks client as inactive when it has invoices", async () => {
        queueDbResult([{ count: 3 }]);  // invoiceCount
        queueDbResult(undefined);        // update isActive=false

        const result = await deleteClient(1);
        expect(result.error).toBeNull();
        expect(result.success?.reason).toMatch(/inactive/i);
    });

    it("hard-deletes client when it has no invoices", async () => {
        queueDbResult([{ count: 0 }]);  // invoiceCount
        queueDbResult(undefined);        // delete

        const result = await deleteClient(1);
        expect(result.error).toBeNull();
        expect(result.success?.reason).toMatch(/deleted/i);
    });
});

// ─── getClient ────────────────────────────────────────────────────────────────

describe("getClient", () => {
    beforeEach(setupMocks);

    it("returns null when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        expect(await getClient(1)).toBeNull();
    });

    it("returns null when client is not found", async () => {
        queueDbResult([]);  // client select
        expect(await getClient(999)).toBeNull();
    });

    it("returns client with stats", async () => {
        queueDbResult([SAMPLE_CLIENT]);  // client select
        queueDbResult([{                 // stats select
            totalInvoices: 5,
            totalRevenue: "12500.00",
            paidAmount: "10000.00",
            outstandingAmount: "2500.00",
        }]);

        const result = await getClient(1);
        expect(result).not.toBeNull();
        expect(result?.name).toBe("ACME Corp");
        expect(result?.stats.totalInvoices).toBe(5);
        expect(result?.stats.totalRevenue).toBe("12500.00");
        expect(result?.stats.outstandingAmount).toBe("2500.00");
    });

    it("returns zero stats when client has no invoices", async () => {
        queueDbResult([SAMPLE_CLIENT]);
        queueDbResult([{ totalInvoices: 0, totalRevenue: null, paidAmount: null, outstandingAmount: null }]);

        const result = await getClient(1);
        expect(result?.stats.totalInvoices).toBe(0);
        expect(result?.stats.totalRevenue).toBe("0.00");
        expect(result?.stats.outstandingAmount).toBe("0.00");
    });
});

// ─── getAllClients ────────────────────────────────────────────────────────────

describe("getAllClients", () => {
    beforeEach(setupMocks);

    it("returns empty array when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        expect(await getAllClients()).toEqual([]);
    });

    it("returns all clients with invoice counts", async () => {
        queueDbResult([
            { ...SAMPLE_CLIENT, invoiceCount: 3, totalOutstanding: "500.00" },
            { ...SAMPLE_CLIENT, id: 2, name: "Beta Inc", invoiceCount: 0, totalOutstanding: "0" },
        ]);
        const result = await getAllClients();
        expect(result).toHaveLength(2);
    });

    it("supports isActive filter", async () => {
        queueDbResult([{ ...SAMPLE_CLIENT, isActive: true }]);
        const result = await getAllClients({ isActive: true });
        expect(result).toHaveLength(1);
    });
});

// ─── getClientInvoices ────────────────────────────────────────────────────────

describe("getClientInvoices", () => {
    beforeEach(setupMocks);

    it("returns empty array when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        expect(await getClientInvoices(1)).toEqual([]);
    });

    it("returns invoices for the client", async () => {
        queueDbResult([
            { id: 10, clientId: 1, status: "Sent", total: "1000.00" },
            { id: 11, clientId: 1, status: "Paid", total: "500.00" },
        ]);
        const result = await getClientInvoices(1);
        expect(result).toHaveLength(2);
    });

    it("supports status filter", async () => {
        queueDbResult([{ id: 10, clientId: 1, status: "Sent" }]);
        const result = await getClientInvoices(1, { status: "Sent" });
        expect(result).toHaveLength(1);
        expect(result[0].status).toBe("Sent");
    });
});
