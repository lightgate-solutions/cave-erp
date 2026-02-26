import { describe, it, expect, beforeEach } from "vitest";
import {
    mockRequireHROrAdmin,
    mockGetFullOrganization,
    queueDbResult,
    DEFAULT_ORG_ID,
    DEFAULT_USER_ID,
} from "./helpers/setup";
import {
    scheduleInterview,
    updateInterview,
    cancelInterview,
    getInterview,
    getCandidateInterviews,
    getUpcomingInterviews,
} from "@/actions/recruitment/interviews";

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

const interviewInput = {
    candidateId: 1,
    jobPostingId: 1,
    interviewType: "Technical" as const,
    scheduledDate: new Date("2025-07-01T10:00:00Z"),
    interviewerIds: [DEFAULT_USER_ID],
    location: "Zoom",
    notes: "First round",
};

const mockInterview = {
    id: 1,
    candidateId: 1,
    jobPostingId: 1,
    interviewType: "Technical",
    scheduledAt: new Date("2025-07-01T10:00:00Z"),
    status: "Scheduled",
    location: "Zoom",
    notes: "First round",
    organizationId: DEFAULT_ORG_ID,
    createdAt: new Date(),
};

// ─── scheduleInterview ────────────────────────────────────────────────────────

describe("scheduleInterview", () => {
    beforeEach(() => setup());

    it("returns error when org not found", async () => {
        setup(false);
        const result = await scheduleInterview(interviewInput);
        expect(result.error?.reason).toContain("Organization not found");
    });

    it("returns error if candidate not found", async () => {
        queueDbResult([]); // candidate not found - wraps as generic failure
        const result = await scheduleInterview(interviewInput);
        expect(result.error?.reason).toBeDefined();
        expect(result.success).toBeNull();
    });

    it("schedules interview successfully", async () => {
        queueDbResult([{ id: 1, name: "Jane Doe" }]); // candidate found
        queueDbResult([mockInterview]); // insert
        const result = await scheduleInterview(interviewInput);
        expect(result.success?.data).toBeDefined();
        expect(result.error).toBeNull();
    });
});

// ─── updateInterview ──────────────────────────────────────────────────────────

describe("updateInterview", () => {
    beforeEach(() => setup());

    it("returns error when org not found", async () => {
        setup(false);
        const result = await updateInterview(1, { location: "Google Meet" });
        expect(result.error?.reason).toContain("Organization not found");
    });

    it("returns error if interview not found", async () => {
        queueDbResult([]); // not found
        const result = await updateInterview(999, { location: "Google Meet" });
        expect(result.error?.reason).toContain("not found");
    });

    it("updates interview successfully", async () => {
        queueDbResult([mockInterview]); // found
        queueDbResult([{ ...mockInterview, location: "Google Meet" }]); // update
        const result = await updateInterview(1, { location: "Google Meet" });
        expect(result.success?.data).toBeDefined();
    });
});

// ─── cancelInterview ──────────────────────────────────────────────────────────

describe("cancelInterview", () => {
    beforeEach(() => setup());

    it("returns error when org not found", async () => {
        setup(false);
        const result = await cancelInterview(1);
        expect(result.error?.reason).toContain("Organization not found");
    });

    it("returns error if interview not found", async () => {
        queueDbResult([]);
        const result = await cancelInterview(999);
        expect(result.error?.reason).toContain("not found");
    });

    it("cancels scheduled interview successfully", async () => {
        queueDbResult([mockInterview]); // found scheduled
        queueDbResult([{ ...mockInterview, status: "Cancelled" }]); // update
        const result = await cancelInterview(1);
        expect(result.success?.data).toBeDefined();
        expect(result.error).toBeNull();
    });
});

// ─── getInterview ─────────────────────────────────────────────────────────────

describe("getInterview", () => {
    beforeEach(() => setup());

    it("returns null when org not found", async () => {
        setup(false);
        const result = await getInterview(1);
        expect(result).toBeNull();
    });

    it("returns null when interview not found", async () => {
        queueDbResult([]);
        const result = await getInterview(999);
        expect(result).toBeNull();
    });

    it("returns interview when found", async () => {
        queueDbResult([mockInterview]);
        const result = await getInterview(1);
        expect(result?.id).toBe(1);
        expect(result?.interviewType).toBe("Technical");
    });
});

// ─── getCandidateInterviews ───────────────────────────────────────────────────

describe("getCandidateInterviews", () => {
    beforeEach(() => setup());

    it("returns empty when org not found", async () => {
        setup(false);
        const result = await getCandidateInterviews(1);
        expect(result).toEqual([]);
    });

    it("returns all interviews for a candidate", async () => {
        queueDbResult([mockInterview]);
        const result = await getCandidateInterviews(1);
        expect(result).toHaveLength(1);
        expect(result[0].candidateId).toBe(1);
    });
});

// ─── getUpcomingInterviews ────────────────────────────────────────────────────

describe("getUpcomingInterviews", () => {
    beforeEach(() => setup());

    it("returns empty when org not found", async () => {
        setup(false);
        const result = await getUpcomingInterviews();
        expect(result).toEqual([]);
    });

    it("returns upcoming scheduled interviews", async () => {
        queueDbResult([mockInterview]);
        const result = await getUpcomingInterviews();
        expect(result).toHaveLength(1);
    });

    it("returns empty when no upcoming interviews", async () => {
        queueDbResult([]);
        const result = await getUpcomingInterviews();
        expect(result).toEqual([]);
    });
});
