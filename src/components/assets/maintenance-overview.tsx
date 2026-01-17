"use client";

import { useQuery } from "@tanstack/react-query";
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
import { ArrowLeft, Wrench, AlertTriangle, Clock } from "lucide-react";
import Link from "next/link";

export default function MaintenanceOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ["asset-maintenance-overview"],
    queryFn: async () => {
      const response = await fetch("/api/assets/maintenance");
      if (!response.ok) {
        throw new Error("Failed to fetch maintenance data");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Loading maintenance data...</p>
      </div>
    );
  }

  const schedules = data?.schedules || [];
  const upcoming = data?.upcoming || [];
  const overdue = data?.overdue || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/assets/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Maintenance</h1>
            <p className="text-muted-foreground">
              Asset maintenance schedules and records
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Schedules
            </CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schedules.length}</div>
            <p className="text-xs text-muted-foreground">
              Maintenance schedules defined
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {overdue.length}
            </div>
            <p className="text-xs text-muted-foreground">Items past due date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming (30 days)
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {upcoming.length}
            </div>
            <p className="text-xs text-muted-foreground">Items due soon</p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Items */}
      {overdue.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <CardHeader>
            <CardTitle className="text-red-900 dark:text-red-200">
              <AlertTriangle className="h-5 w-5 inline mr-2" />
              Overdue Maintenance
            </CardTitle>
            <CardDescription>
              These items require immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Maintenance</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Days Overdue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdue.map(
                  (item: {
                    id: number;
                    assetName: string;
                    assetCode: string;
                    scheduleName: string;
                    nextDueDate: string;
                  }) => {
                    const daysOverdue = Math.floor(
                      (Date.now() - new Date(item.nextDueDate).getTime()) /
                        (1000 * 60 * 60 * 24),
                    );
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.assetName}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.assetCode}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{item.scheduleName}</TableCell>
                        <TableCell>
                          {new Date(item.nextDueDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <span className="text-red-600 font-medium">
                            {daysOverdue} days
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  },
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Maintenance */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Maintenance</CardTitle>
          <CardDescription>
            Scheduled maintenance in the next 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-muted-foreground py-4">
              No upcoming maintenance scheduled.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Maintenance</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Days Until</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcoming.map(
                  (item: {
                    id: number;
                    assetName: string;
                    assetCode: string;
                    scheduleName: string;
                    nextDueDate: string;
                  }) => {
                    const daysUntil = Math.floor(
                      (new Date(item.nextDueDate).getTime() - Date.now()) /
                        (1000 * 60 * 60 * 24),
                    );
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.assetName}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.assetCode}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{item.scheduleName}</TableCell>
                        <TableCell>
                          {new Date(item.nextDueDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              daysUntil <= 7
                                ? "text-yellow-600 font-medium"
                                : ""
                            }
                          >
                            {daysUntil} days
                          </span>
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

      {/* All Schedules */}
      <Card>
        <CardHeader>
          <CardTitle>All Maintenance Schedules</CardTitle>
          <CardDescription>
            Configured recurring maintenance schedules
          </CardDescription>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <p className="text-muted-foreground py-4">
              No maintenance schedules defined. Enable maintenance on assets to
              create schedules.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
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
                    assetName: string;
                    assetCode: string;
                    name: string;
                    intervalValue: number;
                    intervalUnit: string;
                    lastPerformedDate: string | null;
                    nextDueDate: string | null;
                    isActive: boolean;
                  }) => (
                    <TableRow key={schedule.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{schedule.assetName}</p>
                          <p className="text-xs text-muted-foreground">
                            {schedule.assetCode}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{schedule.name}</TableCell>
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
                        {schedule.nextDueDate
                          ? new Date(schedule.nextDueDate).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            schedule.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {schedule.isActive ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
