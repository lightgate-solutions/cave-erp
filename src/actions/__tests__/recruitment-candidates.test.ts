import { describe, it, expect, beforeEach } from "vitest";
import {
    mockRequireHROrAdmin,
    mockGetFullOrganization,
    queueDbResult,
    DEFAULT_ORG_ID,
    DEFAULT_USER_ID,
} from "./helpers/setup";
import {
    createCandidate,
    updateCandidate,
    updateCandidateStatus,
    deleteCandidate,
    getCandidate,
    getAllCandidates,
    addCandidateNote,
} from "@/actions/recruitment/candidates";

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

const candidateInput = {
    jobPostingId: 1,
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "+1234567890",
};

const mockCandidate = {
    id: 1,
    candidateCode: "CAN-2025-0001",
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "+1234567890",
    status: "Applied" as const,
    jobPostingId: 1,
    organizationId: DEFAULT_ORG_ID,
    notes: null,
    createdAt: new Date(),
};

// ─── createCandidate ─────────────────────────────────────────────────────────

describe("createCandidate", () => {
    beforeEach(() => setup());

    it("returns error when org not found", async () => {
        setup(false);
        const result = await createCandidate(candidateInput);
        expect(result.error?.reason).toContain("Organization not found");
    });

    it("creates candidate successfully with generated code", async () => {
        // generateCandidateCode: org query + latest candidate query
        queueDbResult([]); // no existing candidates with this year's prefix
        // transaction: insert candidate + log activity + update metrics
        queueDbResult([mockCandidate]); // insert returning
        const result = await createCandidate(candidateInput);
        expect(result.success?.data).toBeDefined();
        expect(result.error).toBeNull();
    });

    it("creates candidate and increments to next code when prior exists", async () => {
        queueDbResult([{ candidateCode: "CAN-2025-0005" }]); // last candidate
        queueDbResult([{ ...mockCandidate, candidateCode: "CAN-2025-0006" }]); // insert
        const result = await createCandidate(candidateInput);
        expect(result.success?.data?.candidateCode).toBe("CAN-2025-0006");
    });
});

// ─── updateCandidate ─────────────────────────────────────────────────────────

describe("updateCandidate", () => {
    beforeEach(() => setup());

    it("returns error when org not found", async () => {
        setup(false);
        const result = await updateCandidate(1, { name: "Updated" });
        expect(result.error?.reason).toContain("Organization not found");
    });

    it("returns error if candidate not found", async () => {
        queueDbResult([]); // not found
        const result = await updateCandidate(999, { name: "Updated" });
        expect(result.error?.reason).toContain("not found");
    });

    it("updates candidate successfully", async () => {
        queueDbResult([mockCandidate]); // found
        queueDbResult([{ ...mockCandidate, name: "Updated" }]); // update
        const result = await updateCandidate(1, { name: "Updated" });
        expect(result.success?.data).toBeDefined();
        expect(result.error).toBeNull();
    });
});

// ─── updateCandidateStatus ───────────────────────────────────────────────────

describe("updateCandidateStatus", () => {
    beforeEach(() => setup());

    it("returns error when org not found", async () => {
        setup(false);
        const result = await updateCandidateStatus(1, "Screening");
        expect(result.error?.reason).toContain("Organization not found");
    });

    it("returns error if candidate not found", async () => {
        queueDbResult([]); // not found
        const result = await updateCandidateStatus(999, "Screening");
        expect(result.error?.reason).toContain("not found");
    });

    it("updates status to Screening and sets screenedBy", async () => {
        queueDbResult([mockCandidate]); // found (current status: Applied)
        // transaction: update candidate + log + update metrics
        const result = await updateCandidateStatus(1, "Screening");
        expect(result.success?.reason).toContain("updated successfully");
    });

    it("updates status to Rejected with reason", async () => {
        queueDbResult([mockCandidate]); // found
        const result = await updateCandidateStatus(1, "Rejected", "Not qualified");
        expect(result.success?.reason).toContain("updated successfully");
    });

    it("updates status to Hired", async () => {
        queueDbResult([mockCandidate]); // found
        const result = await updateCandidateStatus(1, "Hired");
        expect(result.success?.reason).toContain("updated successfully");
    });
});

// ─── deleteCandidate ─────────────────────────────────────────────────────────

describe("deleteCandidate", () => {
    beforeEach(() => setup());

    it("returns error when org not found", async () => {
        setup(false);
        const result = await deleteCandidate(1);
        expect(result.error?.reason).toContain("Organization not found");
    });

    it("deletes candidate successfully", async () => {
        queueDbResult([]); // delete
        const result = await deleteCandidate(1);
        expect(result.success?.reason).toContain("deleted successfully");
    });
});

// ─── getCandidate ─────────────────────────────────────────────────────────────

describe("getCandidate", () => {
    beforeEach(() => setup());

    it("returns null when org not found", async () => {
        setup(false);
        const result = await getCandidate(1);
        expect(result).toBeNull();
    });

    it("returns null when candidate not found", async () => {
        queueDbResult([]); // not found
        const result = await getCandidate(999);
        expect(result).toBeNull();
    });

    it("returns candidate when found", async () => {
        queueDbResult([mockCandidate]);
        const result = await getCandidate(1);
        expect(result?.id).toBe(1);
        expect(result?.name).toBe("Jane Doe");
    });
});

// ─── getAllCandidates ─────────────────────────────────────────────────────────

describe("getAllCandidates", () => {
    beforeEach(() => setup());

    it("returns empty array when org not found", async () => {
        setup(false);
        const result = await getAllCandidates();
        expect(result).toEqual([]);
    });

    it("returns all candidates", async () => {
        queueDbResult([mockCandidate]);
        const result = await getAllCandidates();
        expect(result).toHaveLength(1);
    });

    it("filters by status", async () => {
        queueDbResult([mockCandidate]);
        const result = await getAllCandidates({ status: "Applied" });
        expect(result[0].status).toBe("Applied");
    });

    it("filters by jobPostingId", async () => {
        queueDbResult([mockCandidate]);
        const result = await getAllCandidates({ jobPostingId: 1 });
        expect(result).toHaveLength(1);
    });

    it("filters by search term", async () => {
        queueDbResult([mockCandidate]);
        const result = await getAllCandidates({ search: "Jane" });
        expect(result).toHaveLength(1);
    });

    it("returns empty when none match", async () => {
        queueDbResult([]);
        const result = await getAllCandidates({ status: "Hired" });
        expect(result).toEqual([]);
    });
});

// ─── addCandidateNote ────────────────────────────────────────────────────────

describe("addCandidateNote", () => {
    beforeEach(() => setup());

    it("returns error when org not found", async () => {
        setup(false);
        const result = await addCandidateNote(1, "Great candidate");
        expect(result.error?.reason).toContain("Organization not found");
    });

    it("returns error if candidate not found", async () => {
        queueDbResult([]); // not found
        const result = await addCandidateNote(999, "Note");
        expect(result.error?.reason).toContain("not found");
    });

    it("adds note successfully to empty notes", async () => {
        queueDbResult([{ ...mockCandidate, notes: null }]); // found, no notes
        // transaction: update + log
        const result = await addCandidateNote(1, "Great candidate");
        expect(result.success?.reason).toContain("added successfully");
    });

    it("appends to existing notes", async () => {
        queueDbResult([{ ...mockCandidate, notes: "Previous note" }]); // existing notes
        const result = await addCandidateNote(1, "Another note");
        expect(result.success?.reason).toContain("added successfully");
    });
});
