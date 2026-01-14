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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Car,
  DollarSign,
  Wrench,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

export default function FleetDashboard() {
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["fleet-stats", dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: dateRange.from,
        to: dateRange.to,
      });
      const response = await fetch(`/api/fleet/stats?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch fleet stats");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  const totalVehicles =
    data?.vehicleStats?.reduce(
      (sum: number, s: { count: number }) => sum + s.count,
      0,
    ) || 0;
  const totalExpenses = Number(data?.expenseStats?.total || 0);
  const totalMaintenance = Number(data?.maintenanceStats?.total || 0);
  const activeIncidents = data?.incidentStats?.pending || 0;

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fleet Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your fleet operations and analytics
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
          <CardDescription>Filter statistics by date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="grid gap-2">
              <Label htmlFor="from">From</Label>
              <Input
                id="from"
                type="date"
                value={dateRange.from}
                onChange={(e) =>
                  setDateRange({ ...dateRange, from: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                type="date"
                value={dateRange.to}
                onChange={(e) =>
                  setDateRange({ ...dateRange, to: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Vehicles
            </CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVehicles}</div>
            <p className="text-xs text-muted-foreground">Across all statuses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Fleet Expenses
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{totalExpenses.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {data?.expenseStats?.count || 0} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Maintenance Costs
            </CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{totalMaintenance.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {data?.maintenanceStats?.count || 0} services
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Incidents
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeIncidents}</div>
            <p className="text-xs text-muted-foreground">
              {data?.incidentStats?.total || 0} total incidents
            </p>
          </CardContent>
        </Card>
      </div>

      {data?.complianceAlerts && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
          <CardHeader>
            <CardTitle className="text-yellow-900 dark:text-yellow-200">
              <AlertTriangle className="h-5 w-5 inline mr-2" />
              Compliance Alerts
            </CardTitle>
            <CardDescription>
              Items requiring immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-3">
              {data.complianceAlerts.expiredInsurance > 0 && (
                <div className="text-sm">
                  <strong className="text-red-600">
                    {data.complianceAlerts.expiredInsurance}
                  </strong>{" "}
                  expired insurance policies
                </div>
              )}
              {data.complianceAlerts.expiringInsurance > 0 && (
                <div className="text-sm">
                  <strong className="text-yellow-600">
                    {data.complianceAlerts.expiringInsurance}
                  </strong>{" "}
                  insurance policies expiring soon
                </div>
              )}
              {data.complianceAlerts.expiredRegistration > 0 && (
                <div className="text-sm">
                  <strong className="text-red-600">
                    {data.complianceAlerts.expiredRegistration}
                  </strong>{" "}
                  expired registrations
                </div>
              )}
              {data.complianceAlerts.expiringRegistration > 0 && (
                <div className="text-sm">
                  <strong className="text-yellow-600">
                    {data.complianceAlerts.expiringRegistration}
                  </strong>{" "}
                  registrations expiring soon
                </div>
              )}
              {data.complianceAlerts.expiredDriverLicenses > 0 && (
                <div className="text-sm">
                  <strong className="text-red-600">
                    {data.complianceAlerts.expiredDriverLicenses}
                  </strong>{" "}
                  expired driver licenses
                </div>
              )}
              {data.complianceAlerts.expiringDriverLicenses > 0 && (
                <div className="text-sm">
                  <strong className="text-yellow-600">
                    {data.complianceAlerts.expiringDriverLicenses}
                  </strong>{" "}
                  driver licenses expiring soon
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown by Category</CardTitle>
            <CardDescription>Fleet expenses by type</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.expenseByCategory && data.expenseByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.expenseByCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number | string) =>
                      `₦${Number(value).toLocaleString()}`
                    }
                  />
                  <Bar dataKey="total" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No expense data available for selected period
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vehicle Status Distribution</CardTitle>
            <CardDescription>Vehicles by current status</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.vehicleStats && data.vehicleStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.vehicleStats}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {data.vehicleStats.map(
                      (
                        _entry: { status: string; count: number },
                        index: number,
                      ) => (
                        <Cell
                          key={_entry.status}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ),
                    )}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No vehicle data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {data?.expenseTrends && data.expenseTrends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              <TrendingUp className="h-5 w-5 inline mr-2" />
              Expense Trends (Last 6 Months)
            </CardTitle>
            <CardDescription>Monthly fleet expense overview</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.expenseTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number | string) =>
                    `₦${Number(value).toLocaleString()}`
                  }
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Total Expenses"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              <Wrench className="h-5 w-5 inline mr-2" />
              Maintenance by Type
            </CardTitle>
            <CardDescription>Breakdown of maintenance services</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.maintenanceByType && data.maintenanceByType.length > 0 ? (
              <div className="space-y-2">
                {data.maintenanceByType.map(
                  (item: {
                    type: string;
                    totalCost: string;
                    count: number;
                  }) => (
                    <div
                      key={item.type}
                      className="flex items-center justify-between py-2 border-b"
                    >
                      <span className="text-sm font-medium">{item.type}</span>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          ₦{Number(item.totalCost).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.count} services
                        </p>
                      </div>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No maintenance data available for selected period
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Users className="h-5 w-5 inline mr-2" />
              Driver Statistics
            </CardTitle>
            <CardDescription>Active drivers and assignments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.driverStats?.map(
                (stat: { status: string; count: number }) => (
                  <div
                    key={stat.status}
                    className="flex items-center justify-between py-2 border-b"
                  >
                    <span className="text-sm font-medium">
                      {stat.status} Drivers
                    </span>
                    <span className="text-2xl font-bold">{stat.count}</span>
                  </div>
                ),
              )}
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium">Active Assignments</span>
                <span className="text-2xl font-bold">
                  {data?.activeAssignments || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
