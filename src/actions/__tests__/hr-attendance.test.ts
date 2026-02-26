/**
 * Integration tests for hr/attendance.ts
 *
 * Key notes:
 * - signIn / signOut check time windows via getAttendanceSettings().
 *   We bypass time-window guards by mocking the attendanceSettings DB select
 *   to return wide-open hours (0–23), so the current clock time always passes.
 * - requireHR-protected functions use mockRequireHR.
 * - requireHROrAdmin-protected functions use mockRequireHROrAdmin.
 * - getAttendanceSettings internally calls getFullOrganization once.
 *   Since mockGetFullOrganization.mockResolvedValue(DEFAULT_ORG) is set in
 *   beforeEach, all calls get DEFAULT_ORG — no double-queuing needed.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
    mockRequireAuth,
    mockRequireHROrAdmin,
    mockRequireHR,
    mockGetFullOrganization,
    mockQueryFindFirst,
    queueDbResult,
    DEFAULT_USER_ID,
    DEFAULT_ORG_ID,
} from "./helpers/setup";

import {
    getCurrentAttendanceSettings,
    updateAttendanceSettings,
    signIn,
    signOut,
    rejectAttendance,
    getAttendanceRecords,
    getMyTodayAttendance,
    getEmployeesForAttendance,
    issueAttendanceWarning,
} from "@/actions/hr/attendance";

const DEFAULT_ORG = { id: DEFAULT_ORG_ID, name: "Test Org" };

// Wide-open hours so any test clock time passes the window check
const WIDE_HOURS_ROW = {
    signInStartHour: 0,
    signInEndHour: 23,
    signOutStartHour: 0,
    signOutEndHour: 23,
    isActive: true,
    id: 1,
};

const TODAY = new Date().toISOString().split("T")[0];

const SAMPLE_RECORD = {
    id: 1,
    userId: DEFAULT_USER_ID,
    date: TODAY,
    signInTime: new Date(),
    signOutTime: null,
    status: "Approved",
    rejectionReason: null,
    rejectedByUserId: null,
    organizationId: DEFAULT_ORG_ID,
    updatedAt: null,
};

const ADMIN_AUTH = { userId: DEFAULT_USER_ID, role: "admin", employee: { department: "admin" } };
const HR_AUTH = { userId: DEFAULT_USER_ID, role: "user", employee: { department: "hr" } };

function setupMocks() {
    mockGetFullOrganization.mockResolvedValue(DEFAULT_ORG);
    mockRequireAuth.mockResolvedValue(ADMIN_AUTH);
    mockRequireHROrAdmin.mockResolvedValue(ADMIN_AUTH);
    mockRequireHR.mockResolvedValue(HR_AUTH);
    mockQueryFindFirst.mockResolvedValue(null);
}

// ─── getCurrentAttendanceSettings ─────────────────────────────────────────────

describe("getCurrentAttendanceSettings", () => {
    beforeEach(setupMocks);

    it("returns defaults when no org found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        const result = await getCurrentAttendanceSettings();
        expect(result.signInStartHour).toBe(6);
    });

    it("returns custom settings when org has them", async () => {
        queueDbResult([WIDE_HOURS_ROW]);
        const result = await getCurrentAttendanceSettings();
        expect(result.signInStartHour).toBe(0);
        expect(result.signInEndHour).toBe(23);
    });

    it("returns defaults when no settings record exists", async () => {
        queueDbResult([]); // empty settings
        const result = await getCurrentAttendanceSettings();
        expect(result.signInStartHour).toBe(6); // default
    });
});

// ─── updateAttendanceSettings ─────────────────────────────────────────────────

describe("updateAttendanceSettings", () => {
    beforeEach(setupMocks);

    it("returns error when organization not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        const result = await updateAttendanceSettings({
            signInStartHour: 6, signInEndHour: 9, signOutStartHour: 14, signOutEndHour: 20,
        });
        expect(result.error?.reason).toBe("Organization not found");
    });

    it("rejects hours outside 0–23", async () => {
        const result = await updateAttendanceSettings({
            signInStartHour: 25, signInEndHour: 9, signOutStartHour: 14, signOutEndHour: 20,
        });
        expect(result.error?.reason).toBe("Hours must be between 0 and 23");
    });

    it("rejects when signInStart >= signInEnd", async () => {
        const result = await updateAttendanceSettings({
            signInStartHour: 9, signInEndHour: 6, signOutStartHour: 14, signOutEndHour: 20,
        });
        expect(result.error?.reason).toBe("Sign-in start hour must be before end hour");
    });

    it("rejects when signOutStart >= signOutEnd", async () => {
        const result = await updateAttendanceSettings({
            signInStartHour: 6, signInEndHour: 9, signOutStartHour: 20, signOutEndHour: 14,
        });
        expect(result.error?.reason).toBe("Sign-out start hour must be before end hour");
    });

    it("deactivates existing settings and creates new ones", async () => {
        queueDbResult(undefined);  // update existing → isActive=false
        queueDbResult(undefined);  // insert new settings
        const result = await updateAttendanceSettings({
            signInStartHour: 6, signInEndHour: 9, signOutStartHour: 14, signOutEndHour: 20,
        });
        expect(result.error).toBeNull();
        expect(result.success?.reason).toMatch(/updated/i);
    });
});

// ─── signIn ───────────────────────────────────────────────────────────────────

describe("signIn", () => {
    beforeEach(setupMocks);

    it("rejects when user tries to sign in for someone else (non-admin/hr)", async () => {
        mockRequireAuth.mockResolvedValueOnce({
            userId: "other-user", role: "user", employee: { department: "finance" },
        });
        const result = await signIn(DEFAULT_USER_ID);
        expect(result.error?.reason).toBe("You can only sign in for yourself");
    });

    it("returns error when organization not found", async () => {
        // Only one org check needed — signIn checks org BEFORE calling getAttendanceSettings
        mockGetFullOrganization.mockResolvedValueOnce(null);
        const result = await signIn(DEFAULT_USER_ID);
        expect(result.error?.reason).toBe("Organization not found");
    });

    it("rejects when already signed in today", async () => {
        // getAttendanceSettings → queueDbResult → wide hours
        queueDbResult([WIDE_HOURS_ROW]);
        // existing attendance check
        queueDbResult([SAMPLE_RECORD]);

        const result = await signIn(DEFAULT_USER_ID);
        expect(result.error?.reason).toBe("You have already signed in for today");
    });

    it("signs in successfully within wide-open time window", async () => {
        queueDbResult([WIDE_HOURS_ROW]);  // getAttendanceSettings
        queueDbResult([]);                 // no existing attendance
        queueDbResult(undefined);          // insert

        const result = await signIn(DEFAULT_USER_ID);
        expect(result.error).toBeNull();
        expect(result.success?.reason).toMatch(/signed in/i);
    });
});

// ─── signOut ──────────────────────────────────────────────────────────────────

describe("signOut", () => {
    beforeEach(setupMocks);

    it("rejects when user tries to sign out for someone else", async () => {
        mockRequireAuth.mockResolvedValueOnce({
            userId: "other-user", role: "user", employee: {},
        });
        const result = await signOut(DEFAULT_USER_ID);
        expect(result.error?.reason).toBe("You can only sign out for yourself");
    });

    it("returns error when organization not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        const result = await signOut(DEFAULT_USER_ID);
        expect(result.error?.reason).toBe("Organization not found");
    });

    it("rejects when not signed in today", async () => {
        queueDbResult([WIDE_HOURS_ROW]);  // getAttendanceSettings
        queueDbResult([]);                 // no sign-in record

        const result = await signOut(DEFAULT_USER_ID);
        expect(result.error?.reason).toBe("You have not signed in today");
    });

    it("rejects when already signed out", async () => {
        queueDbResult([WIDE_HOURS_ROW]);
        queueDbResult([{ ...SAMPLE_RECORD, signOutTime: new Date() }]);

        const result = await signOut(DEFAULT_USER_ID);
        expect(result.error?.reason).toBe("You have already signed out today");
    });

    it("signs out successfully", async () => {
        queueDbResult([WIDE_HOURS_ROW]);
        queueDbResult([SAMPLE_RECORD]);   // signed in, no signOut yet
        queueDbResult(undefined);          // update signOutTime

        const result = await signOut(DEFAULT_USER_ID);
        expect(result.error).toBeNull();
        expect(result.success?.reason).toMatch(/signed out/i);
    });
});

// ─── rejectAttendance ─────────────────────────────────────────────────────────

describe("rejectAttendance", () => {
    beforeEach(setupMocks);

    it("returns error when organization not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        const result = await rejectAttendance(1, "Late without notice");
        expect(result.error?.reason).toBe("Organization not found");
    });

    it("returns error when attendance record not found", async () => {
        mockQueryFindFirst.mockResolvedValueOnce(null);
        const result = await rejectAttendance(999, "Late without notice");
        expect(result.error?.reason).toBe("Attendance record not found");
    });

    it("admin rejects attendance and sends notification", async () => {
        mockQueryFindFirst.mockResolvedValueOnce(SAMPLE_RECORD); // attendance record
        queueDbResult(undefined);                                 // update → Rejected
        queueDbResult([{ id: 5, authId: DEFAULT_USER_ID }]);     // employee lookup for notification

        const result = await rejectAttendance(1, "Late without permission");
        expect(result.error).toBeNull();
        expect(result.success?.reason).toMatch(/rejected/i);
    });

    it("returns unauthorized for non-hr/admin/manager users", async () => {
        mockRequireHROrAdmin.mockResolvedValueOnce({
            userId: "finance-user",
            role: "user",
            employee: { department: "finance" },
        });
        mockQueryFindFirst.mockResolvedValueOnce(SAMPLE_RECORD);

        // getEmployee → select employees → returns no matching manager record
        queueDbResult([]);

        const result = await rejectAttendance(1, "Late");
        expect(result.error?.reason).toBe("Unauthorized to reject this attendance");
    });
});

// ─── getAttendanceRecords ─────────────────────────────────────────────────────

describe("getAttendanceRecords", () => {
    beforeEach(setupMocks);

    it("returns empty pagination when organization not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        const result = await getAttendanceRecords();
        expect(result.attendance).toEqual([]);
        expect(result.total).toBe(0);
    });

    it("returns paginated attendance records", async () => {
        queueDbResult([{ count: 2 }]);  // count query (includes leftJoin)
        queueDbResult([SAMPLE_RECORD, { ...SAMPLE_RECORD, id: 2 }]); // records

        const result = await getAttendanceRecords();
        expect(result.total).toBe(2);
        expect(result.attendance).toHaveLength(2);
    });
});

// ─── getMyTodayAttendance ─────────────────────────────────────────────────────

describe("getMyTodayAttendance", () => {
    beforeEach(setupMocks);

    it("returns null when organization not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        expect(await getMyTodayAttendance()).toBeNull();
    });

    it("returns today's attendance record", async () => {
        queueDbResult([SAMPLE_RECORD]);
        const result = await getMyTodayAttendance();
        expect(result?.status).toBe("Approved");
    });

    it("returns null when no sign-in today", async () => {
        queueDbResult([]);
        expect(await getMyTodayAttendance()).toBeNull();
    });
});

// ─── getEmployeesForAttendance ────────────────────────────────────────────────

describe("getEmployeesForAttendance", () => {
    beforeEach(setupMocks);

    it("returns empty array when organization not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        expect(await getEmployeesForAttendance()).toEqual([]);
    });

    it("returns employee list for HR", async () => {
        queueDbResult([
            { id: 1, authId: DEFAULT_USER_ID, name: "Alice", staffNumber: "EMP-001", department: "hr", email: "a@x.com" },
        ]);
        const result = await getEmployeesForAttendance();
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe("Alice");
    });
});

// ─── issueAttendanceWarning ───────────────────────────────────────────────────

describe("issueAttendanceWarning", () => {
    beforeEach(setupMocks);

    it("returns error when organization not found", async () => {
        mockGetFullOrganization.mockResolvedValueOnce(null);
        const result = await issueAttendanceWarning({
            attendanceId: 1, userId: DEFAULT_USER_ID,
            warningType: "late_arrival", reason: "A reason long enough to pass", message: "Late",
        });
        expect(result.error?.reason).toBe("Organization not found");
    });

    it("returns error when reason is too short (< 10 chars)", async () => {
        const result = await issueAttendanceWarning({
            attendanceId: 1, userId: DEFAULT_USER_ID,
            warningType: "late_arrival", reason: "Short", message: "Late",
        });
        expect(result.error?.reason).toBe("Reason must be at least 10 characters long");
    });

    it("returns error when attendance record not found", async () => {
        queueDbResult([]);  // attendance not found
        const result = await issueAttendanceWarning({
            attendanceId: 999, userId: DEFAULT_USER_ID,
            warningType: "general", reason: "A reason long enough to pass", message: "Details",
        });
        expect(result.error?.reason).toBe("Attendance record not found");
    });

    it("returns error when warning already exists for this attendance", async () => {
        queueDbResult([SAMPLE_RECORD]);   // attendance found
        queueDbResult([{ id: 5 }]);        // existing warning found

        const result = await issueAttendanceWarning({
            attendanceId: 1, userId: DEFAULT_USER_ID,
            warningType: "general", reason: "A reason long enough to pass", message: "Details",
        });
        expect(result.error?.reason).toMatch(/already been issued/i);
    });

    it("issues warning and sends notification", async () => {
        queueDbResult([SAMPLE_RECORD]);   // attendance found
        queueDbResult([]);                 // no existing warning
        queueDbResult(undefined);          // insert warning (no returning)

        const result = await issueAttendanceWarning({
            attendanceId: 1, userId: DEFAULT_USER_ID,
            warningType: "late_arrival",
            reason: "Arrived 30 minutes after shift start",
            message: "Please be on time",
        });
        expect(result.error).toBeNull();
        expect(result.success?.reason).toMatch(/issued/i);
    });
});
