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
    addVendorContact,
    updateVendorContact,
    deleteVendorContact,
    getVendorContacts,
} from "@/actions/payables/vendor-contacts";

const DEFAULT_ORG = { id: DEFAULT_ORG_ID, name: "Test Org" };
const VENDOR_ID = 7;
const CONTACT_ID = 21;

const SAMPLE_VENDOR = { id: VENDOR_ID, name: "Supplier Co", organizationId: DEFAULT_ORG_ID };

const SAMPLE_CONTACT = {
    id: CONTACT_ID,
    vendorId: VENDOR_ID,
    name: "Jane Doe",
    email: "jane@supplier.com",
    phone: null,
    role: "Account Manager",
    isPrimary: true,
    organizationId: DEFAULT_ORG_ID,
};

function setupMocks() {
    mockGetFullOrganization.mockResolvedValue(DEFAULT_ORG);
    mockRequirePayablesWriteAccess.mockResolvedValue({ employee: { userId: DEFAULT_USER_ID } });
    mockRequirePayablesViewAccess.mockResolvedValue({ employee: { userId: DEFAULT_USER_ID } });
}

// ─── addVendorContact ─────────────────────────────────────────────────────────

describe("addVendorContact", () => {
    beforeEach(setupMocks);

    it("returns error when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        const result = await addVendorContact({
            vendorId: VENDOR_ID, name: "X", email: "x@x.com", isPrimary: false,
        });
        expect(result.success).toBeNull();
        expect(result.error?.reason).toBe("Organization not found");
    });

    it("returns error when vendor is not found", async () => {
        queueDbResult([]);  // vendor lookup → not found
        const result = await addVendorContact({
            vendorId: 999, name: "X", email: "x@x.com", isPrimary: false,
        });
        expect(result.success).toBeNull();
        expect(result.error?.reason).toBe("Vendor not found");
    });

    it("adds contact without unsetting primaries when isPrimary=false", async () => {
        queueDbResult([SAMPLE_VENDOR]);    // vendor check
        queueDbResult([SAMPLE_CONTACT]);   // insert returning

        const result = await addVendorContact({
            vendorId: VENDOR_ID, name: "Jane Doe", email: "jane@supplier.com",
            role: "Account Manager", isPrimary: false,
        });
        expect(result.error).toBeNull();
        expect(result.success?.data.name).toBe("Jane Doe");
    });

    it("unsets other primary contacts when isPrimary=true", async () => {
        queueDbResult([SAMPLE_VENDOR]);   // vendor check
        queueDbResult(undefined);          // unset isPrimary on others
        queueDbResult([SAMPLE_CONTACT]);   // insert returning

        const result = await addVendorContact({
            vendorId: VENDOR_ID, name: "Jane Doe", email: "jane@supplier.com", isPrimary: true,
        });
        expect(result.error).toBeNull();
        expect(result.success?.data.isPrimary).toBe(true);
    });
});

// ─── updateVendorContact ──────────────────────────────────────────────────────

describe("updateVendorContact", () => {
    beforeEach(setupMocks);

    it("returns error when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        expect((await updateVendorContact(CONTACT_ID, { name: "New" })).error?.reason)
            .toBe("Organization not found");
    });

    it("returns error when contact is not found", async () => {
        queueDbResult([]);  // select existing → not found
        const result = await updateVendorContact(999, { name: "New" });
        expect(result.success).toBeNull();
        expect(result.error?.reason).toBe("Contact not found");
    });

    it("updates contact name without touching primary flag", async () => {
        queueDbResult([SAMPLE_CONTACT]);                                        // fetch existing
        queueDbResult([{ ...SAMPLE_CONTACT, name: "John Smith" }]);             // update returning

        const result = await updateVendorContact(CONTACT_ID, { name: "John Smith" });
        expect(result.error).toBeNull();
        expect(result.success?.data.name).toBe("John Smith");
    });

    it("unsets other primary contacts when isPrimary=true", async () => {
        queueDbResult([SAMPLE_CONTACT]);                               // fetch existing
        queueDbResult(undefined);                                       // unset isPrimary on others
        queueDbResult([{ ...SAMPLE_CONTACT, isPrimary: true }]);       // update returning

        const result = await updateVendorContact(CONTACT_ID, { isPrimary: true });
        expect(result.error).toBeNull();
        expect(result.success?.data.isPrimary).toBe(true);
    });
});

// ─── deleteVendorContact ──────────────────────────────────────────────────────

describe("deleteVendorContact", () => {
    beforeEach(setupMocks);

    it("returns error when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        expect((await deleteVendorContact(CONTACT_ID)).error?.reason)
            .toBe("Organization not found");
    });

    it("returns error when contact is not found", async () => {
        queueDbResult([]);  // select → not found
        const result = await deleteVendorContact(999);
        expect(result.success).toBeNull();
        expect(result.error?.reason).toBe("Contact not found");
    });

    it("deletes contact successfully", async () => {
        queueDbResult([SAMPLE_CONTACT]);  // fetch contact (for vendorId)
        queueDbResult(undefined);          // delete

        const result = await deleteVendorContact(CONTACT_ID);
        expect(result.error).toBeNull();
        expect(result.success?.reason).toMatch(/deleted/i);
    });
});

// ─── getVendorContacts ────────────────────────────────────────────────────────

describe("getVendorContacts", () => {
    beforeEach(setupMocks);

    it("returns empty array when organization is not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        expect(await getVendorContacts(VENDOR_ID)).toEqual([]);
    });

    it("returns all contacts for the vendor", async () => {
        queueDbResult([
            SAMPLE_CONTACT,
            { ...SAMPLE_CONTACT, id: 22, name: "Bob Lee", isPrimary: false },
        ]);
        const result = await getVendorContacts(VENDOR_ID);
        expect(result).toHaveLength(2);
    });
});
