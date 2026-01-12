"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, subMonths } from "date-fns";
import {
  getEmployeeAttendanceRecords,
  issueAttendanceWarning,
} from "@/actions/hr/attendance";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, TrendingUp, Users } from "lucide-react";

interface Employee {
  id: number;
  authId: string;
  name: string;
  staffNumber: string | null;
  department: string;
  email: string;
}

interface AttendanceRecord {
  id: number;
  date: string;
  signInTime: Date | string | null;
  signOutTime: Date | string | null;
  status: "Approved" | "Rejected";
  rejectionReason: string | null;
  warningId: number | null;
  hasWarning: boolean;
}

export default function AttendanceRecordsClient({
  employees,
}: {
  employees: Employee[];
}) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null,
  );
  const [dateRange, setDateRange] = useState({
    start: format(subMonths(new Date(), 1), "yyyy-MM-dd"),
    end: format(new Date(), "yyyy-MM-dd"),
  });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [isWarningDialogOpen, setIsWarningDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(
    null,
  );
  const [warningForm, setWarningForm] = useState({
    warningType: "late_arrival" as
      | "late_arrival"
      | "early_departure"
      | "missing_signout"
      | "general",
    reason: "",
    message: "",
  });

  const queryClient = useQueryClient();

  // Fetch attendance records
  const { data, isLoading } = useQuery({
    queryKey: [
      "attendance-records",
      selectedEmployeeId,
      dateRange,
      statusFilter,
      page,
    ],
    queryFn: async () => {
      if (!selectedEmployeeId) return null;
      return await getEmployeeAttendanceRecords({
        userId: selectedEmployeeId,
        startDate: dateRange.start,
        endDate: dateRange.end,
        status:
          statusFilter === "all"
            ? undefined
            : (statusFilter as "Approved" | "Rejected"),
        page,
        limit: 10,
      });
    },
    enabled: !!selectedEmployeeId,
  });

  // Issue warning mutation
  const warningMutation = useMutation({
    mutationFn: issueAttendanceWarning,
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Warning issued successfully");
        queryClient.invalidateQueries({ queryKey: ["attendance-records"] });
        setIsWarningDialogOpen(false);
        setWarningForm({
          warningType: "late_arrival",
          reason: "",
          message: "",
        });
      } else {
        toast.error(result.error?.reason || "Failed to issue warning");
      }
    },
    onError: () => {
      toast.error("An error occurred while issuing warning");
    },
  });

  const selectedEmployee = employees.find(
    (emp) => emp.authId === selectedEmployeeId,
  );

  const handleOpenWarningDialog = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    const defaultMessage = `You are being issued a warning for attendance on ${format(new Date(record.date), "PPP")}. Please ensure to follow attendance policies.`;
    setWarningForm({
      warningType: "late_arrival",
      reason: "",
      message: defaultMessage,
    });
    setIsWarningDialogOpen(true);
  };

  const handleIssueWarning = () => {
    if (!selectedRecord || !selectedEmployeeId) return;

    if (warningForm.reason.length < 10) {
      toast.error("Reason must be at least 10 characters long");
      return;
    }

    warningMutation.mutate({
      attendanceId: selectedRecord.id,
      userId: selectedEmployeeId,
      warningType: warningForm.warningType,
      reason: warningForm.reason,
      message: warningForm.message,
    });
  };

  const formatTime = (timestamp: string | Date | null) => {
    if (!timestamp) return "N/A";
    return format(new Date(timestamp), "h:mm a");
  };

  const records = data?.records || [];
  const statistics = data?.statistics || {
    totalPresent: 0,
    totalAbsent: 0,
    averageSignInTime: "N/A",
    lateArrivals: 0,
    earlySignIns: 0,
    missingSignOuts: 0,
    perfectDays: 0,
  };
  const pagination = data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Attendance Records</h1>
        <p className="text-muted-foreground">
          View and manage employee attendance records
        </p>
      </div>

      {/* Filters Section */}
      <Card className="bg-muted">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Select an employee and date range to view attendance records
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Employee</Label>
            <Select
              value={selectedEmployeeId || ""}
              onValueChange={(value) => {
                setSelectedEmployeeId(value);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.authId} value={emp.authId}>
                    {emp.name} {emp.staffNumber ? `(${emp.staffNumber})` : ""} -{" "}
                    {emp.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => {
                  setDateRange({ ...dateRange, start: e.target.value });
                  setPage(1);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => {
                  setDateRange({ ...dateRange, end: e.target.value });
                  setPage(1);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Section */}
      {selectedEmployeeId && data && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            Attendance Statistics for {selectedEmployee?.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Present
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statistics.totalPresent}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Late Arrivals
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statistics.lateArrivals}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Missing Sign-outs
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statistics.missingSignOuts}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Absent
                </CardTitle>
                <Users className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statistics.totalAbsent}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Early Sign-ins
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statistics.earlySignIns}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Perfect Days
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statistics.perfectDays}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Avg: {statistics.averageSignInTime}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Records Table */}
      {selectedEmployeeId && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
            <CardDescription>
              Showing {records.length} of {pagination.total} records
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : records.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No attendance records found for the selected filters
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Sign In</TableHead>
                      <TableHead>Sign Out</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>
                          {format(new Date(record.date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>{formatTime(record.signInTime)}</TableCell>
                        <TableCell>{formatTime(record.signOutTime)}</TableCell>
                        <TableCell>
                          {record.status === "Approved" ? (
                            <Badge className="bg-green-500">Approved</Badge>
                          ) : (
                            <Badge variant="destructive">Rejected</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {record.hasWarning ? (
                            <Badge variant="outline">Warning Issued</Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenWarningDialog(record)}
                            >
                              Warn
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-4">
                    <Pagination>
                      <PaginationPrevious
                        onClick={() => setPage(Math.max(1, page - 1))}
                        className={
                          page === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                      <PaginationContent>
                        {Array.from(
                          { length: pagination.totalPages },
                          (_, i) => i + 1,
                        )
                          .filter((pageNum) => {
                            return (
                              pageNum === 1 ||
                              pageNum === pagination.totalPages ||
                              (pageNum >= page - 1 && pageNum <= page + 1)
                            );
                          })
                          .map((pageNum, idx, arr) => (
                            <>
                              {idx > 0 && arr[idx - 1] !== pageNum - 1 && (
                                <PaginationItem key={`ellipsis-${pageNum}`}>
                                  <span className="px-2">...</span>
                                </PaginationItem>
                              )}
                              <PaginationItem key={pageNum}>
                                <PaginationLink
                                  onClick={() => setPage(pageNum)}
                                  isActive={page === pageNum}
                                  className="cursor-pointer"
                                >
                                  {pageNum}
                                </PaginationLink>
                              </PaginationItem>
                            </>
                          ))}
                      </PaginationContent>
                      <PaginationNext
                        onClick={() =>
                          setPage(Math.min(pagination.totalPages, page + 1))
                        }
                        className={
                          page === pagination.totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Warning Dialog */}
      <Dialog open={isWarningDialogOpen} onOpenChange={setIsWarningDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Attendance Warning</DialogTitle>
            <DialogDescription>
              {selectedRecord && (
                <>
                  Attendance Date:{" "}
                  {format(new Date(selectedRecord.date), "PPP")}
                  <br />
                  Employee: {selectedEmployee?.name}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Warning Type</Label>
              <Select
                value={warningForm.warningType}
                onValueChange={(
                  value:
                    | "late_arrival"
                    | "early_departure"
                    | "missing_signout"
                    | "general",
                ) => setWarningForm({ ...warningForm, warningType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="late_arrival">Late Arrival</SelectItem>
                  <SelectItem value="early_departure">
                    Early Departure
                  </SelectItem>
                  <SelectItem value="missing_signout">
                    Missing Sign-out
                  </SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reason (min 10 characters)</Label>
              <Textarea
                placeholder="Enter reason for warning..."
                value={warningForm.reason}
                onChange={(e) =>
                  setWarningForm({ ...warningForm, reason: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Message to Employee</Label>
              <Textarea
                placeholder="Message that will be sent to the employee..."
                value={warningForm.message}
                onChange={(e) =>
                  setWarningForm({ ...warningForm, message: e.target.value })
                }
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsWarningDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleIssueWarning}
              disabled={
                warningMutation.isPending || warningForm.reason.length < 10
              }
            >
              {warningMutation.isPending ? "Issuing..." : "Issue Warning"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
