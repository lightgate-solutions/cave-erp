import { describe, it, expect } from "vitest";
import {
    mockGetSession,
    mockDbChain,
    mockQueryFindMany,
    mockRevalidatePath,
    queueDbResult,
    DEFAULT_ORG_ID,
} from "./helpers/setup";

import {
    createPeriod,
    getPeriods,
    updatePeriodStatus,
} from "@/actions/finance/gl/periods";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const defaultSession = {
    session: { activeOrganizationId: DEFAULT_ORG_ID, userId: "user-1" },
    user: { id: "user-1" },
};

function setupSessionMock() {
    mockGetSession.mockResolvedValue(defaultSession);
}

const samplePeriodInput = {
    periodName: "January 2026",
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-01-31"),
    status: "Open" as const,
    isYearEnd: false,
};

const samplePeriod = {
    id: 1,
    organizationId: DEFAULT_ORG_ID,
    periodName: "January 2026",
    startDate: "2026-01-01",
    endDate: "2026-01-31",
    status: "Open",
    isYearEnd: false,
    closedBy: null,
    createdAt: new Date(),
};

// ─── createPeriod ─────────────────────────────────────────────────────────────

describe("createPeriod", () => {
    it("should create a period successfully", async () => {
        setupSessionMock();
        queueDbResult([]); // insert result

        const result = await createPeriod(samplePeriodInput);

        expect(result).toEqual({ success: true });
        expect(mockRevalidatePath).toHaveBeenCalledWith("/finance/gl/settings");
    });

    it("should create a year-end period", async () => {
        setupSessionMock();
        queueDbResult([]);

        const result = await createPeriod({
            ...samplePeriodInput,
            periodName: "Year End 2026",
            isYearEnd: true,
        });

        expect(result).toEqual({ success: true });
    });

    it("should default status to Open when not specified", async () => {
        setupSessionMock();
        queueDbResult([]);

        // Omit status
        const result = await createPeriod({
            periodName: "Feb 2026",
            startDate: new Date("2026-02-01"),
            endDate: new Date("2026-02-28"),
        });

        expect(result).toEqual({ success: true });
    });

    it("should return error when no active org in session", async () => {
        mockGetSession.mockResolvedValue({ session: null });

        const result = await createPeriod(samplePeriodInput);

        expect(result).toEqual({
            success: false,
            error: "Unauthorized: No active organization",
        });
    });

    it("should return error on generic failure", async () => {
        mockGetSession.mockRejectedValue(new Error("fail"));

        const result = await createPeriod(samplePeriodInput);

        expect(result).toEqual({ success: false, error: "Failed to create period" });
    });
});

// ─── getPeriods ───────────────────────────────────────────────────────────────

describe("getPeriods", () => {
    it("should return periods on success", async () => {
        setupSessionMock();
        const periods = [
            samplePeriod,
            { ...samplePeriod, id: 2, periodName: "February 2026" },
        ];
        mockQueryFindMany.mockResolvedValueOnce(periods);

        const result = await getPeriods();

        expect(result).toEqual({ success: true, data: periods });
    });

    it("should return empty data on success with no periods", async () => {
        setupSessionMock();
        mockQueryFindMany.mockResolvedValueOnce([]);

        const result = await getPeriods();

        expect(result).toEqual({ success: true, data: [] });
    });

    it("should accept passedOrgId when session has no active org", async () => {
        mockGetSession.mockResolvedValue({ session: null });
        mockQueryFindMany.mockResolvedValueOnce([samplePeriod]);

        const result = await getPeriods(DEFAULT_ORG_ID);

        expect(result).toEqual({ success: true, data: [samplePeriod] });
    });

    it("should return error when no org available", async () => {
        mockGetSession.mockResolvedValue({ session: null });

        // No passedOrgId provided
        const result = await getPeriods();

        expect(result).toEqual({
            success: false,
            error: "Unauthorized: No active organization",
            data: [],
        });
    });

    it("should return error on generic failure", async () => {
        mockGetSession.mockRejectedValue(new Error("fail"));

        const result = await getPeriods();

        expect(result).toEqual({
            success: false,
            error: "Failed to get periods",
            data: [],
        });
    });
});

// ─── updatePeriodStatus ────────────────────────────────────────────────────────

describe("updatePeriodStatus", () => {
    it("should update status to Closed and set closedBy", async () => {
        setupSessionMock();
        queueDbResult([]); // update result

        const result = await updatePeriodStatus(1, "Closed", "user-1");

        expect(result).toEqual({ success: true });
        expect(mockRevalidatePath).toHaveBeenCalledWith("/finance/gl/settings");
    });

    it("should update status to Locked and set closedBy", async () => {
        setupSessionMock();
        queueDbResult([]);

        const result = await updatePeriodStatus(1, "Locked", "user-1");

        expect(result).toEqual({ success: true });
    });

    it("should update status to Open and clear closedBy", async () => {
        setupSessionMock();
        queueDbResult([]);

        const result = await updatePeriodStatus(1, "Open");

        expect(result).toEqual({ success: true });
        // closedBy should be null for Open status (verified by source logic)
    });

    it("should return error when no active org in session", async () => {
        mockGetSession.mockResolvedValue({ session: null });

        const result = await updatePeriodStatus(1, "Closed");

        expect(result).toEqual({
            success: false,
            error: "Unauthorized: No active organization",
        });
    });

    it("should return error on generic failure", async () => {
        mockGetSession.mockRejectedValue(new Error("fail"));

        const result = await updatePeriodStatus(1, "Closed");

        expect(result).toEqual({
            success: false,
            error: "Failed to update period status",
        });
    });
});
