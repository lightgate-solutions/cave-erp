import { describe, it, expect, beforeEach } from "vitest";
import {
    mockRequireHROrAdmin,
    mockGetFullOrganization,
    queueDbResult,
    DEFAULT_ORG_ID,
    DEFAULT_USER_ID,
} from "./helpers/setup";
import {
    createJobPosting,
    updateJobPosting,
    closeJobPosting,
    deleteJobPosting,
    getJobPosting,
    getAllJobPostings,
} from "@/actions/recruitment/job-postings";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockEmployee = { id: 1, authId: DEFAULT_USER_ID, userId: DEFAULT_USER_ID, name: "HR User" };

function setup(hasOrg = true) {
    mockRequireHROrAdmin.mockResolvedValue({ employee: mockEmployee });
    if (hasOrg) {
        mockGetFullOrganization.mockResolvedValue({ id: DEFAULT_ORG_ID });
    } else {
        mockGetFullOrganization.mockResolvedValue(null);
    }
}

const postingInput = {
    title: "Senior Engineer",
    code: "JOB-2025-0001",
    department: "hr" as const,
    position: "Engineer",
    description: "We are hiring...",
    requirements: "5+ years experience",
    employmentType: "Full-time" as const,
    salaryRangeMin: 80000,
    salaryRangeMax: 120000,
    location: "Remote",
    openings: 2,
};

const mockPosting = {
    id: 1,
    code: "JOB-2025-0001",
    title: "Senior Engineer",
    department: "hr" as const,
    position: "Engineer",
    status: "Published" as const,
    organizationId: DEFAULT_ORG_ID,
    createdAt: new Date(),
};

// ─── createJobPosting ─────────────────────────────────────────────────────────

describe("createJobPosting", () => {
    beforeEach(() => setup());

    it("returns error when org not found", async () => {
        setup(false);
        const result = await createJobPosting(postingInput);
        expect(result.error?.reason).toContain("Organization not found");
    });

    it("creates job posting successfully", async () => {
        queueDbResult([]); // no existing code conflict
        queueDbResult([mockPosting]); // insert returning
        queueDbResult([]); // insert metrics
        const result = await createJobPosting(postingInput);
        expect(result.success?.data).toBeDefined();
        expect(result.error).toBeNull();
    });

    it("returns error if job code already exists", async () => {
        queueDbResult([{ id: 2, code: "JOB-2025-0001" }]); // code conflict
        const result = await createJobPosting(postingInput);
        expect(result.error?.reason).toContain("code already exists");
    });
});

// ─── updateJobPosting ─────────────────────────────────────────────────────────

describe("updateJobPosting", () => {
    beforeEach(() => setup());

    it("returns error when org not found", async () => {
        setup(false);
        const result = await updateJobPosting(1, { title: "Updated" });
        expect(result.error?.reason).toContain("Organization not found");
    });

    it("returns error if posting not found", async () => {
        queueDbResult([]); // not found
        const result = await updateJobPosting(999, { title: "Updated" });
        expect(result.error?.reason).toContain("not found");
    });

    it("updates open posting successfully", async () => {
        queueDbResult([mockPosting]); // open posting found
        queueDbResult([{ ...mockPosting, title: "Updated" }]); // update
        const result = await updateJobPosting(1, { title: "Updated" });
        expect(result.success?.data).toBeDefined();
        expect(result.error).toBeNull();
    });
});

// ─── closeJobPosting ──────────────────────────────────────────────────────────

describe("closeJobPosting", () => {
    beforeEach(() => setup());

    it("returns error when org not found", async () => {
        setup(false);
        const result = await closeJobPosting(1);
        expect(result.error?.reason).toContain("Organization not found");
    });

    it("returns error if posting not found", async () => {
        queueDbResult([]); // not found
        const result = await closeJobPosting(999);
        expect(result.error?.reason).toContain("not found");
    });

    it("closes open posting successfully", async () => {
        queueDbResult([mockPosting]); // open posting found
        queueDbResult([{ ...mockPosting, status: "Closed" }]); // update result
        const result = await closeJobPosting(1);
        expect(result.success?.data).toBeDefined();
        expect(result.error).toBeNull();
    });
});

// ─── deleteJobPosting ─────────────────────────────────────────────────────────

describe("deleteJobPosting", () => {
    beforeEach(() => setup());

    it("returns error when org not found", async () => {
        setup(false);
        const result = await deleteJobPosting(1);
        expect(result.error?.reason).toContain("Organization not found");
    });

    it("deletes posting successfully", async () => {
        queueDbResult([]); // delete result (no returning)
        const result = await deleteJobPosting(1);
        expect(result.success?.reason).toContain("deleted successfully");
        expect(result.error).toBeNull();
    });
});

// ─── getJobPosting ────────────────────────────────────────────────────────────

describe("getJobPosting", () => {
    beforeEach(() => setup());

    it("returns null when org not found", async () => {
        setup(false);
        const result = await getJobPosting(1);
        expect(result).toBeNull();
    });

    it("returns null when not found", async () => {
        queueDbResult([]); // not found
        const result = await getJobPosting(999);
        expect(result).toBeNull();
    });

    it("returns job posting when found", async () => {
        queueDbResult([mockPosting]);
        const result = await getJobPosting(1);
        expect(result?.id).toBe(1);
        expect(result?.title).toBe("Senior Engineer");
    });
});

// ─── getAllJobPostings ────────────────────────────────────────────────────────

describe("getAllJobPostings", () => {
    beforeEach(() => setup());

    it("returns empty array when org not found", async () => {
        setup(false);
        const result = await getAllJobPostings();
        expect(result).toEqual([]);
    });

    it("returns all postings", async () => {
        queueDbResult([mockPosting]);
        const result = await getAllJobPostings();
        expect(result).toHaveLength(1);
    });

    it("filters by status", async () => {
        queueDbResult([mockPosting]);
        const result = await getAllJobPostings({ status: "Published" });
        expect(result[0].status).toBe("Published");
    });

    it("filters by department", async () => {
        queueDbResult([mockPosting]);
        const result = await getAllJobPostings({ department: "hr" });
        expect(result).toHaveLength(1);
    });

    it("returns empty when none match", async () => {
        queueDbResult([]);
        const result = await getAllJobPostings({ status: "Closed" });
        expect(result).toEqual([]);
    });
});
