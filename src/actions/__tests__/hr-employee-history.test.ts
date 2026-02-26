import { describe, it, expect, beforeEach } from "vitest";
import {
    mockRequireHROrAdmin,
    mockRequireAuth,
    mockGetFullOrganization,
    mockQueryFindMany,
    queueDbResult,
    DEFAULT_ORG_ID,
} from "./helpers/setup";
import {
    getEmployeeHistory,
    addEmploymentHistory,
    updateEmploymentHistory,
    deleteEmploymentHistory,
} from "@/actions/hr/employee-history";

const userId = "user-123";

function setup(hasOrg = true) {
    mockRequireAuth.mockResolvedValue({ userId, role: "admin" });
    mockRequireHROrAdmin.mockResolvedValue({ employee: { id: 1 } });
    if (hasOrg) {
        mockGetFullOrganization.mockResolvedValue({ id: DEFAULT_ORG_ID });
    } else {
        mockGetFullOrganization.mockResolvedValue(null);
    }
}

const historyData = {
    userId,
    startDate: "2023-01-01",
    endDate: "2024-01-01",
    department: "Engineering",
    employmentType: "Full-time" as const,
};

const mockHistoryRecord = {
    id: 1,
    userId,
    department: "Engineering",
    employmentType: "Full-time",
    startDate: "2023-01-01",
    endDate: "2024-01-01",
    organizationId: DEFAULT_ORG_ID,
};

// ─── getEmployeeHistory ───────────────────────────────────────────────────────

describe("getEmployeeHistory", () => {
    beforeEach(() => setup());

    it("returns empty array when org not found", async () => {
        setup(false);
        const result = await getEmployeeHistory(userId);
        expect(result).toEqual([]);
    });

    it("returns history records", async () => {
        mockQueryFindMany.mockResolvedValueOnce([mockHistoryRecord]);
        const result = await getEmployeeHistory(userId);
        expect(result).toHaveLength(1);
        expect(result?.[0].department).toBe("Engineering");
    });

    it("returns empty array when no history", async () => {
        mockQueryFindMany.mockResolvedValueOnce([]);
        const result = await getEmployeeHistory(userId);
        expect(result).toEqual([]);
    });
});

// ─── addEmploymentHistory ────────────────────────────────────────────────────

describe("addEmploymentHistory", () => {
    beforeEach(() => setup());

    it("returns error when org not found", async () => {
        setup(false);
        const result = await addEmploymentHistory(historyData);
        expect(result?.success).toBe(false);
    });

    it("adds history successfully", async () => {
        queueDbResult([]); // insert
        const result = await addEmploymentHistory(historyData);
        expect(result?.success).toBe(true);
    });

    it("handles null dates", async () => {
        queueDbResult([]);
        const result = await addEmploymentHistory({
            ...historyData,
            startDate: null,
            endDate: null,
        });
        expect(result?.success).toBe(true);
    });
});

// ─── updateEmploymentHistory ──────────────────────────────────────────────────

describe("updateEmploymentHistory", () => {
    beforeEach(() => setup());

    it("returns error when org not found", async () => {
        setup(false);
        const result = await updateEmploymentHistory(1, historyData);
        expect(result?.success).toBe(false);
    });

    it("updates history successfully", async () => {
        queueDbResult([]); // update
        const result = await updateEmploymentHistory(1, historyData);
        expect(result?.success).toBe(true);
    });
});

// ─── deleteEmploymentHistory ──────────────────────────────────────────────────

describe("deleteEmploymentHistory", () => {
    beforeEach(() => setup());

    it("returns error when org not found", async () => {
        setup(false);
        const result = await deleteEmploymentHistory(1);
        expect(result?.success).toBe(false);
    });

    it("deletes successfully", async () => {
        queueDbResult([]); // delete
        const result = await deleteEmploymentHistory(1);
        expect(result?.success).toBe(true);
    });
});
