import { describe, it, expect, beforeEach } from "vitest";
import {
    mockRequireAuth,
    mockRequireHROrAdmin,
    mockGetFullOrganization,
    queueDbResult,
    DEFAULT_ORG_ID,
    DEFAULT_USER_ID,
} from "./helpers/setup";
import {
    getAllLeaveApplications,
    getLeaveApplication,
    applyForLeave,
    updateLeaveApplication,
    deleteLeaveApplication,
    getLeaveBalance,
    setAnnualLeaveAllocation,
    getAnnualLeaveAllocation,
} from "@/actions/hr/leaves";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function setup(hasOrg = true) {
    mockRequireAuth.mockResolvedValue({ userId: DEFAULT_USER_ID, role: "user" });
    mockRequireHROrAdmin.mockResolvedValue({ employee: { id: 1, authId: DEFAULT_USER_ID } });
    if (hasOrg) {
        mockGetFullOrganization.mockResolvedValue({ id: DEFAULT_ORG_ID });
    } else {
        mockGetFullOrganization.mockResolvedValue(null);
    }
}

const mockLeave = {
    id: 1,
    userId: DEFAULT_USER_ID,
    employeeName: "John Doe",
    employeeEmail: "john@example.com",
    leaveType: "Annual",
    startDate: "2025-06-01",
    endDate: "2025-06-05",
    totalDays: 5,
    reason: "Vacation",
    status: "Pending",
    approvedByUserId: null,
    approverName: null,
    approvedAt: null,
    rejectionReason: null,
    appliedAt: new Date(),
    createdAt: new Date(),
};

// ─── getAllLeaveApplications ──────────────────────────────────────────────────

describe("getAllLeaveApplications", () => {
    beforeEach(() => setup());

    it("returns empty result when org not found", async () => {
        setup(false);
        const result = await getAllLeaveApplications();
        expect(result.leaves).toEqual([]);
        expect(result.total).toBe(0);
    });

    it("returns paginated results", async () => {
        queueDbResult([{ count: 1 }]); // total count
        queueDbResult([mockLeave]); // results
        const result = await getAllLeaveApplications({ page: 1, limit: 10 });
        expect(result.leaves).toHaveLength(1);
        expect(result.total).toBe(1);
    });

    it("filters by userId", async () => {
        queueDbResult([{ count: 1 }]);
        queueDbResult([mockLeave]);
        const result = await getAllLeaveApplications({ userId: DEFAULT_USER_ID });
        expect(result.leaves[0].userId).toBe(DEFAULT_USER_ID);
    });

    it("filters by status", async () => {
        queueDbResult([{ count: 1 }]);
        queueDbResult([mockLeave]);
        const result = await getAllLeaveApplications({ status: "Pending" });
        expect(result.leaves[0].status).toBe("Pending");
    });

    it("handles empty results", async () => {
        queueDbResult([{ count: 0 }]);
        queueDbResult([]);
        const result = await getAllLeaveApplications();
        expect(result.total).toBe(0);
        expect(result.leaves).toEqual([]);
    });
});

// ─── getLeaveApplication ─────────────────────────────────────────────────────

describe("getLeaveApplication", () => {
    beforeEach(() => setup());

    it("returns null when org not found", async () => {
        setup(false);
        const result = await getLeaveApplication(1);
        expect(result).toBeNull();
    });

    it("returns leave application when found", async () => {
        queueDbResult([mockLeave]);
        const result = await getLeaveApplication(1);
        expect(result?.id).toBe(1);
        expect(result?.status).toBe("Pending");
    });

    it("returns undefined when not found", async () => {
        queueDbResult([]);
        const result = await getLeaveApplication(999);
        expect(result).toBeUndefined();
    });
});

// ─── applyForLeave ───────────────────────────────────────────────────────────

describe("applyForLeave", () => {
    beforeEach(() => setup());

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 3);

    const leaveInput = {
        userId: DEFAULT_USER_ID,
        leaveType: "Annual",
        startDate: tomorrow.toISOString().split("T")[0],
        endDate: dayAfter.toISOString().split("T")[0],
        reason: "Vacation",
    };

    it("returns error when org not found", async () => {
        setup(false);
        const result = await applyForLeave(leaveInput);
        expect(result.error?.reason).toContain("Organization not found");
    });

    it("returns error if start date is in the past", async () => {
        const result = await applyForLeave({
            ...leaveInput,
            startDate: "2020-01-01",
            endDate: "2020-01-05",
        });
        expect(result.error?.reason).toContain("past");
    });

    it("returns error if start date is after end date", async () => {
        const result = await applyForLeave({
            ...leaveInput,
            startDate: dayAfter.toISOString().split("T")[0],
            endDate: tomorrow.toISOString().split("T")[0],
        });
        expect(result.error?.reason).toContain("before end date");
    });

    it("returns error if overlapping leave exists", async () => {
        queueDbResult([mockLeave]); // overlap found
        const result = await applyForLeave(leaveInput);
        expect(result.error?.reason).toContain("overlapping");
    });

    it("returns error if insufficient annual leave balance", async () => {
        queueDbResult([]); // 1. no overlapping leaves
        // initializeEmployeeBalance queries:
        queueDbResult([{ allocatedDays: 10 }]); // 2. annualLeaveSettings
        queueDbResult([{ totalDays: 10 }]); // 3. approvedLeaves (recalculateUsedDays)
        queueDbResult([{ id: 1, remainingDays: 0 }]); // 4. current balance check
        queueDbResult([]); // 5. update balance
        // Back to applyForLeave:
        queueDbResult([{ id: 1, remainingDays: 0 }]); // 6. actual balance check
        const result = await applyForLeave(leaveInput);
        expect(result.error?.reason).toContain("Insufficient leave balance");
    });

    it("creates leave application successfully for non-Annual leave", async () => {
        queueDbResult([]); // no overlapping leaves
        queueDbResult([{ id: 3, ...leaveInput }]); // insert returning
        const result = await applyForLeave({ ...leaveInput, leaveType: "Sick" });
        expect(result.success?.reason).toContain("submitted successfully");
    });
});

// ─── updateLeaveApplication ──────────────────────────────────────────────────

describe("updateLeaveApplication", () => {
    beforeEach(() => setup());

    it("returns error when org not found", async () => {
        setup(false);
        const result = await updateLeaveApplication(1, { status: "Approved" }, 1);
        expect(result.error?.reason).toContain("Organization not found");
    });

    it("approves leave application successfully", async () => {
        // update is done directly without fetching first
        queueDbResult([]); // update
        // getLeaveApplication for notifications: count then data
        queueDbResult([{ count: 1 }]);
        queueDbResult([mockLeave]);
        const result = await updateLeaveApplication(1, { status: "Approved" }, 1);
        expect(result.success?.reason).toContain("updated successfully");
    });

    it("rejects leave application with reason", async () => {
        queueDbResult([]); // update
        queueDbResult([{ count: 1 }]);
        queueDbResult([mockLeave]);
        const result = await updateLeaveApplication(
            1, { status: "Rejected", rejectionReason: "Not eligible" }, 1
        );
        expect(result.success?.reason).toContain("updated successfully");
    });
});

// ─── deleteLeaveApplication ───────────────────────────────────────────────────

describe("deleteLeaveApplication", () => {
    beforeEach(() => setup());

    it("returns error when org not found", async () => {
        setup(false);
        const result = await deleteLeaveApplication(1);
        expect(result.error?.reason).toContain("Organization not found");
    });

    it("deletes leave application successfully", async () => {
        // getLeaveApplication: total count then data
        queueDbResult([{ count: 1 }]);
        queueDbResult([mockLeave]);
        queueDbResult([]); // delete
        const result = await deleteLeaveApplication(1);
        expect(result.success?.reason).toContain("deleted successfully");
    });
});

// ─── getLeaveBalance ──────────────────────────────────────────────────────────

describe("getLeaveBalance", () => {
    beforeEach(() => setup());

    it("returns empty when org not found", async () => {
        setup(false);
        const result = await getLeaveBalance(DEFAULT_USER_ID);
        expect(result).toEqual([]);
    });

    it("returns leave balance entries", async () => {
        queueDbResult([
            {
                id: 1, userId: DEFAULT_USER_ID, leaveType: "Annual", year: 2025, totalDays: 30,
                usedDays: 5, remainingDays: 25
            },
        ]);
        const result = await getLeaveBalance(DEFAULT_USER_ID, 2025);
        expect(result).toHaveLength(1);
        expect(result[0].remainingDays).toBe(25);
    });

    it("returns empty when no balance exists", async () => {
        queueDbResult([]);
        const result = await getLeaveBalance(DEFAULT_USER_ID);
        expect(result).toEqual([]);
    });
});

// ─── getAnnualLeaveAllocation ─────────────────────────────────────────────────

describe("getAnnualLeaveAllocation", () => {
    beforeEach(() => setup());

    it("returns default allocation (30) when org not found", async () => {
        setup(false);
        const result = await getAnnualLeaveAllocation(2025);
        expect(result).toBe(30);
    });

    it("returns configured allocation", async () => {
        queueDbResult([{ allocatedDays: 25 }]);
        const result = await getAnnualLeaveAllocation(2025);
        expect(result).toBe(25);
    });

    it("returns default 30 when not set", async () => {
        queueDbResult([]);
        const result = await getAnnualLeaveAllocation(2025);
        expect(result).toBe(30);
    });
});

// ─── setAnnualLeaveAllocation ─────────────────────────────────────────────────

describe("setAnnualLeaveAllocation", () => {
    beforeEach(() => setup());

    it("returns error when org not found", async () => {
        setup(false);
        const result = await setAnnualLeaveAllocation({ allocatedDays: 30, year: 2025 });
        expect(result.error?.reason).toContain("Organization not found");
    });

    it("creates new allocation when none exists", async () => {
        queueDbResult([]); // no existing
        queueDbResult([]); // insert
        // recalculateAllEmployeeBalances queries
        queueDbResult([]);
        const result = await setAnnualLeaveAllocation({ allocatedDays: 25, year: 2025 });
        expect(result.success?.reason).toContain("updated successfully");
    });

    it("updates existing allocation", async () => {
        queueDbResult([{ id: 1, allocatedDays: 20 }]); // existing
        queueDbResult([]); // update
        queueDbResult([]); // recalculate
        const result = await setAnnualLeaveAllocation({ allocatedDays: 30, year: 2025 });
        expect(result.success?.reason).toContain("updated successfully");
    });
});
