import { requireHR } from "@/actions/auth/dal";
import { getEmployeesForAttendance } from "@/actions/hr/attendance";
import AttendanceRecordsClient from "./attendance-records-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Attendance Records",
  description: "View and manage employee attendance records",
};

export default async function AttendanceRecordsPage() {
  await requireHR();

  const employees = await getEmployeesForAttendance();

  return <AttendanceRecordsClient employees={employees} />;
}
