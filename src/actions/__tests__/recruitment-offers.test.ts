import { describe, it, expect, beforeEach } from "vitest";
import {
    mockRequireHROrAdmin,
    mockGetFullOrganization,
    queueDbResult,
    DEFAULT_ORG_ID,
    DEFAULT_USER_ID,
} from "./helpers/setup";
import {
    createOffer,
    updateOffer,
    getOffer,
    getCandidateOffers,
    getAllOffers,
    sendOffer,
    acceptOffer,
    rejectOffer,
} from "@/actions/recruitment/offers";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockEmployee = { id: 1, authId: DEFAULT_USER_ID, name: "HR User" };

function setup(hasOrg = true) {
    mockRequireHROrAdmin.mockResolvedValue({ employee: mockEmployee });
    if (hasOrg) {
        mockGetFullOrganization.mockResolvedValue({ id: DEFAULT_ORG_ID });
    } else {
        mockGetFullOrganization.mockResolvedValue(null);
    }
}

const offerInput = {
    candidateId: 1,
    jobPostingId: 1,
    position: "Senior Engineer",
    department: "operations" as const,
    salary: 100000,
    startDate: "2025-08-01",
    employmentType: "Full-time" as const,
    validUntil: "2025-07-15",
};

const mockOffer = {
    id: 1,
    candidateId: 1,
    jobPostingId: 1,
    offerCode: "OFFER-2025-0001",
    position: "Senior Engineer",
    department: "operations",
    employmentType: "Full-time",
    salary: 100000, // wait... is it number or string in db?
    startDate: "2025-08-01",
    joiningBonus: 0,
    benefits: null,
    validUntil: "2025-07-15",
    status: "Draft" as const,
    organizationId: DEFAULT_ORG_ID,
    createdAt: new Date(),
};

// ─── createOffer ──────────────────────────────────────────────────────────────

describe("createOffer", () => {
    beforeEach(() => setup());

    it("returns error when org not found", async () => {
        setup(false);
        const result = await createOffer(offerInput);
        expect(result.error?.reason).toContain("Organization not found");
    });

    it("creates offer successfully", async () => {
        queueDbResult([{ id: 1, name: "Jane" }]); // candidate found
        queueDbResult([mockOffer]); // insert
        const result = await createOffer(offerInput);
        expect(result.success?.data).toBeDefined();
        expect(result.error).toBeNull();
    });
});

// ─── updateOffer ──────────────────────────────────────────────────────────────

describe("updateOffer", () => {
    beforeEach(() => setup());

    it("returns error when org not found", async () => {
        setup(false);
        const result = await updateOffer(1, { salary: 110000 });
        expect(result.error?.reason).toContain("Organization not found");
    });

    it("returns error if offer not found", async () => {
        queueDbResult([]); // not found
        const result = await updateOffer(999, { salary: 110000 });
        expect(result.error?.reason).toContain("not found");
    });

    it("updates offer successfully", async () => {
        queueDbResult([mockOffer]); // found
        queueDbResult([{ ...mockOffer, salary: "110000" }]); // update
        const result = await updateOffer(1, { salary: 110000 });
        expect(result.success?.data).toBeDefined();
    });
});

// ─── getOffer ─────────────────────────────────────────────────────────────────

describe("getOffer", () => {
    beforeEach(() => setup());

    it("returns null when org not found", async () => {
        setup(false);
        const result = await getOffer(1);
        expect(result).toBeNull();
    });

    it("returns null when not found", async () => {
        queueDbResult([]);
        const result = await getOffer(999);
        expect(result).toBeNull();
    });

    it("returns offer when found", async () => {
        queueDbResult([mockOffer]);
        const result = await getOffer(1);
        expect(result?.id).toBe(1);
        expect(result?.status).toBe("Draft");
    });
});

// ─── getCandidateOffers ───────────────────────────────────────────────────────

describe("getCandidateOffers", () => {
    beforeEach(() => setup());

    it("returns empty when org not found", async () => {
        setup(false);
        const result = await getCandidateOffers(1);
        expect(result).toEqual([]);
    });

    it("returns offers for candidate", async () => {
        queueDbResult([mockOffer]);
        const result = await getCandidateOffers(1);
        expect(result[0].candidateId).toBe(1);
    });

    it("returns empty when no offers", async () => {
        queueDbResult([]);
        const result = await getCandidateOffers(99);
        expect(result).toEqual([]);
    });
});

// ─── getAllOffers ─────────────────────────────────────────────────────────────

describe("getAllOffers", () => {
    beforeEach(() => setup());

    it("returns empty when org not found", async () => {
        setup(false);
        const result = await getAllOffers();
        expect(result).toEqual([]);
    });

    it("returns all offers", async () => {
        queueDbResult([mockOffer]);
        const result = await getAllOffers();
        expect(result).toHaveLength(1);
    });

    it("filters by status", async () => {
        queueDbResult([mockOffer]);
        const result = await getAllOffers({ status: "Draft" });
        expect(result[0].status).toBe("Draft");
    });
});

// ─── sendOffer ────────────────────────────────────────────────────────────────

describe("sendOffer", () => {
    beforeEach(() => setup());

    it("returns error when org not found", async () => {
        setup(false);
        const result = await sendOffer(1);
        expect(result.error?.reason).toContain("Organization not found");
    });

    it("returns error if offer not found or not in draft", async () => {
        queueDbResult([]); // not found
        const result = await sendOffer(999);
        expect(result.error?.reason).toContain("not found");
    });

    it("sends draft offer successfully", async () => {
        queueDbResult([mockOffer]); // draft offer found
        queueDbResult([{ ...mockOffer, status: "Sent" }]); // update to Sent
        queueDbResult([{ id: 1 }]); // insert activity log
        const result = await sendOffer(1);
        expect(result.success?.data).toBeDefined();
    });
});

// ─── acceptOffer ──────────────────────────────────────────────────────────────

describe("acceptOffer", () => {
    beforeEach(() => setup());

    it("returns error when org not found", async () => {
        setup(false);
        const result = await acceptOffer(1);
        expect(result.error?.reason).toContain("Organization not found");
    });

    it("returns error if offer not found", async () => {
        queueDbResult([]);
        const result = await acceptOffer(999);
        expect(result.error?.reason).toContain("not found");
    });

    it("accepts sent offer successfully", async () => {
        queueDbResult([{ ...mockOffer, status: "Sent" }]); // sent offer
        queueDbResult([{ ...mockOffer, status: "Accepted" }]); // update
        queueDbResult([]); // candidate update
        queueDbResult([]); // insert log
        const result = await acceptOffer(1);
        expect(result.success?.data).toBeDefined();
    });
});

// ─── rejectOffer ──────────────────────────────────────────────────────────────

describe("rejectOffer", () => {
    beforeEach(() => setup());

    it("returns error when org not found", async () => {
        setup(false);
        const result = await rejectOffer(1);
        expect(result.error?.reason).toContain("Organization not found");
    });

    it("returns error if offer not found", async () => {
        queueDbResult([]);
        const result = await rejectOffer(999);
        expect(result.error?.reason).toContain("not found");
    });

    it("rejects sent offer", async () => {
        queueDbResult([{ ...mockOffer, status: "Sent" }]); // sent
        queueDbResult([{ ...mockOffer, status: "Rejected" }]); // update
        queueDbResult([]); // candidate update
        queueDbResult([]); // insert log
        const result = await rejectOffer(1, "Salary too low");
        expect(result.success?.data).toBeDefined();
    });
});
