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
  Package,
  DollarSign,
  Wrench,
  AlertTriangle,
  RefreshCw,
  MapPin,
  FolderOpen,
  Plus,
} from "lucide-react";
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
} from "recharts";
import Link from "next/link";

export default function AssetDashboard() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["asset-stats"],
    queryFn: async () => {
      const response = await fetch("/api/assets/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch asset stats");
      }
      return response.json();
    },
  });

  const { data: assetsData } = useQuery({
    queryKey: ["assets-list", { limit: 5 }],
    queryFn: async () => {
      const response = await fetch("/api/assets?limit=5");
      if (!response.ok) {
        throw new Error("Failed to fetch assets");
      }
      return response.json();
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["asset-categories"],
    queryFn: async () => {
      const response = await fetch("/api/assets/categories");
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      return response.json();
    },
  });

  const { data: locationsData } = useQuery({
    queryKey: ["asset-locations"],
    queryFn: async () => {
      const response = await fetch("/api/assets/locations");
      if (!response.ok) {
        throw new Error("Failed to fetch locations");
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

  const totalAssets = data?.totalAssets || 0;
  const totalValue = data?.totalValue || 0;
  const maintenanceDue = data?.maintenanceDue || 0;
  const expiringWarranties = data?.expiringWarranties || 0;

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  // Prepare category data for chart
  const categoryChartData =
    categoriesData?.categories?.map(
      (cat: { name: string; assetCount: number }) => ({
        name: cat.name,
        count: cat.assetCount || 0,
      }),
    ) || [];

  // Prepare status data for chart
  const statusData = data?.statusBreakdown || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Asset Management</h1>
          <p className="text-muted-foreground">
            Overview of your organization&apos;s assets
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Link href="/assets/categories">
            <Button variant="outline" size="sm">
              <FolderOpen className="h-4 w-4 mr-2" />
              Categories
            </Button>
          </Link>
          <Link href="/assets/locations">
            <Button variant="outline" size="sm">
              <MapPin className="h-4 w-4 mr-2" />
              Locations
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssets}</div>
            <p className="text-xs text-muted-foreground">
              Across all categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{Number(totalValue).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Current book value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Maintenance Due
            </CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenanceDue}</div>
            <p className="text-xs text-muted-foreground">
              Assets needing maintenance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Expiring Warranties
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expiringWarranties}</div>
            <p className="text-xs text-muted-foreground">Within 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(maintenanceDue > 0 || expiringWarranties > 0) && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
          <CardHeader>
            <CardTitle className="text-yellow-900 dark:text-yellow-200">
              <AlertTriangle className="h-5 w-5 inline mr-2" />
              Alerts
            </CardTitle>
            <CardDescription>Items requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2">
              {maintenanceDue > 0 && (
                <div className="text-sm">
                  <strong className="text-yellow-600">{maintenanceDue}</strong>{" "}
                  assets have overdue or upcoming maintenance
                </div>
              )}
              {expiringWarranties > 0 && (
                <div className="text-sm">
                  <strong className="text-yellow-600">
                    {expiringWarranties}
                  </strong>{" "}
                  warranties expiring within 30 days
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assets by Category</CardTitle>
            <CardDescription>Distribution across categories</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No category data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assets by Status</CardTitle>
            <CardDescription>Current status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {statusData.map(
                      (entry: { status: string }, index: number) => (
                        <Cell
                          key={entry.status}
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
                No status data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              <FolderOpen className="h-5 w-5 inline mr-2" />
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {categoriesData?.categories?.length || 0} categories defined
            </p>
            <Link href="/assets/categories">
              <Button variant="outline" size="sm" className="w-full">
                Manage Categories
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              <MapPin className="h-5 w-5 inline mr-2" />
              Locations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {locationsData?.locations?.length || 0} locations defined
            </p>
            <Link href="/assets/locations">
              <Button variant="outline" size="sm" className="w-full">
                Manage Locations
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              <Wrench className="h-5 w-5 inline mr-2" />
              Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View and manage maintenance schedules
            </p>
            <Link href="/assets/maintenance">
              <Button variant="outline" size="sm" className="w-full">
                View Maintenance
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Assets */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Assets</CardTitle>
            <CardDescription>Latest assets added to the system</CardDescription>
          </div>
          <Link href="/assets/list">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              View All Assets
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {assetsData?.assets?.length > 0 ? (
            <div className="space-y-4">
              {assetsData.assets.map(
                (asset: {
                  id: number;
                  assetCode: string;
                  name: string;
                  status: string;
                  category?: { name: string } | null;
                  currentValue?: string | null;
                }) => (
                  <div
                    key={asset.id}
                    className="flex items-center justify-between border-b pb-2"
                  >
                    <div>
                      <p className="font-medium">{asset.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {asset.assetCode} •{" "}
                        {asset.category?.name || "No category"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          asset.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : asset.status === "In Maintenance"
                              ? "bg-yellow-100 text-yellow-700"
                              : asset.status === "Disposed"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-red-100 text-red-700"
                        }`}
                      >
                        {asset.status}
                      </span>
                      {asset.currentValue && (
                        <p className="text-sm text-muted-foreground mt-1">
                          ₦{Number(asset.currentValue).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No assets found. Start by adding categories and locations, then
              create your first asset.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
