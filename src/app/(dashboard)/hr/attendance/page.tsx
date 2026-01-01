import { Suspense } from "react";
import { requireAuth } from "@/actions/auth/dal";
import {
  getMyTodayAttendance,
  getAttendanceRecords,
} from "@/actions/hr/attendance";
import AttendanceClient from "./attendance-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Attendance | HR",
  description: "Manage your attendance",
};

export default async function AttendancePage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const authData = await requireAuth();
  const myAttendance = await getMyTodayAttendance();

  // Check if user is HR or Manager
  let isManagerOrHR = false;
  if (authData.role === "admin" || authData.employee.department === "hr") {
    isManagerOrHR = true;
  } else {
    // Check if isManager flag is true
    if (authData.employee.isManager) {
      isManagerOrHR = true;
    }
  }

  let allAttendance = null;
  let filters: { page: number; limit: number; managerId?: string } | undefined;

  if (isManagerOrHR) {
    const page =
      typeof searchParams.page === "string" ? Number(searchParams.page) : 1;
    const limit =
      typeof searchParams.limit === "string" ? Number(searchParams.limit) : 10;

    // Pass search params to filter if needed
    filters = {
      page,
      limit,
    };

    // If manager but not HR/Admin, restrict to direct reports
    if (
      isManagerOrHR &&
      authData.role !== "admin" &&
      authData.employee.department !== "hr" &&
      authData.employee.isManager
    ) {
      filters.managerId = authData.userId;
    }

    allAttendance = await getAttendanceRecords(filters);
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Attendance</h2>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <AttendanceClient
          myAttendance={myAttendance}
          allAttendance={allAttendance}
          isManagerOrHR={isManagerOrHR}
          currentEmployeeId={authData.userId}
          managerIdFilter={filters?.managerId}
        />
      </Suspense>
    </div>
  );
}
