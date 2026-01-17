"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Plus,
  Calendar,
  Wrench,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { MaintenanceScheduleDialog } from "./maintenance-schedule-dialog";
import { MaintenanceRecordDialog } from "./maintenance-record-dialog";

interface AssetMaintenanceTabProps {
  assetId: number;
  requiresMaintenance: boolean;
}

export function AssetMaintenanceTab({
  assetId,
  requiresMaintenance,
}: AssetMaintenanceTabProps) {
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [recordDialogOpen, setRecordDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["asset-maintenance", assetId],
    queryFn: async () => {
      const response = await fetch(`/api/assets/${assetId}/maintenance`);
      if (!response.ok) throw new Error("Failed to fetch maintenance data");
      return response.json();
    },
    enabled: requiresMaintenance,
  });

  if (!requiresMaintenance) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Maintenance</CardTitle>
          <CardDescription>
            Maintenance tracking is not enabled for this asset.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Enable maintenance tracking by editing this asset to set up
            maintenance schedules.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-muted-foreground text-center">
            Loading maintenance data...
          </p>
        </CardContent>
      </Card>
    );
  }

  const schedules = data?.schedules || [];
  const records = data?.records || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "In Progress":
        return <Wrench className="h-4 w-4 text-blue-500" />;
      case "Scheduled":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "Overdue":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Completed: "bg-green-100 text-green-700",
      "In Progress": "bg-blue-100 text-blue-700",
      Scheduled: "bg-yellow-100 text-yellow-700",
      Cancelled: "bg-gray-100 text-gray-700",
      Overdue: "bg-red-100 text-red-700",
    };

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-700"}`}
      >
        {getStatusIcon(status)}
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Maintenance Schedules */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Maintenance Schedules</CardTitle>
            <CardDescription>
              Recurring maintenance schedules for this asset
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setScheduleDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Schedule
          </Button>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <p className="text-muted-foreground py-4">
              No maintenance schedules defined. Create a schedule to track
              recurring maintenance.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Schedule Name</TableHead>
                  <TableHead>Interval</TableHead>
                  <TableHead>Last Performed</TableHead>
                  <TableHead>Next Due</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map(
                  (schedule: {
                    id: number;
                    name: string;
                    intervalValue: number;
                    intervalUnit: string;
                    lastPerformedDate: string | null;
                    nextDueDate: string | null;
                    isActive: boolean;
                  }) => {
                    const isOverdue =
                      schedule.nextDueDate &&
                      new Date(schedule.nextDueDate) < new Date();
                    return (
                      <TableRow key={schedule.id}>
                        <TableCell className="font-medium">
                          {schedule.name}
                        </TableCell>
                        <TableCell>
                          Every {schedule.intervalValue} {schedule.intervalUnit}
                        </TableCell>
                        <TableCell>
                          {schedule.lastPerformedDate
                            ? new Date(
                                schedule.lastPerformedDate,
                              ).toLocaleDateString()
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              isOverdue ? "text-red-600 font-medium" : ""
                            }
                          >
                            {schedule.nextDueDate
                              ? new Date(
                                  schedule.nextDueDate,
                                ).toLocaleDateString()
                              : "-"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {isOverdue ? (
                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium bg-red-100 text-red-700">
                              <AlertTriangle className="h-3 w-3" />
                              Overdue
                            </span>
                          ) : schedule.isActive ? (
                            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-700">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700">
                              Inactive
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  },
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Maintenance Records */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Maintenance Records</CardTitle>
            <CardDescription>
              History of maintenance activities performed
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setRecordDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Log Maintenance
          </Button>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <p className="text-muted-foreground py-4">
              No maintenance records yet. Log maintenance activities to track
              history.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                  <TableHead>Completed Date</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map(
                  (record: {
                    id: number;
                    title: string;
                    scheduledDate: string;
                    completedDate: string | null;
                    cost: string | null;
                    status: string;
                  }) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.title}
                      </TableCell>
                      <TableCell>
                        {new Date(record.scheduledDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {record.completedDate
                          ? new Date(record.completedDate).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {record.cost
                          ? `₦${Number(record.cost).toLocaleString()}`
                          : "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <MaintenanceScheduleDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        assetId={assetId}
      />
      <MaintenanceRecordDialog
        open={recordDialogOpen}
        onOpenChange={setRecordDialogOpen}
        assetId={assetId}
      />
    </div>
  );
}
