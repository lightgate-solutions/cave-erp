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
import { Car, DollarSign, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function FleetDashboardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["fleet-widget-stats"],
    queryFn: async () => {
      const response = await fetch("/api/fleet/stats");
      if (!response.ok) return null;
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fleet Overview</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!data) return null;

  const totalVehicles =
    data?.vehicleStats?.reduce(
      (sum: number, s: { count: number }) => sum + s.count,
      0,
    ) || 0;
  const totalExpenses = Number(data?.expenseStats?.total || 0);
  const activeIncidents = data?.incidentStats?.pending || 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Fleet Overview
            </CardTitle>
            <CardDescription>Quick fleet statistics</CardDescription>
          </div>
          <Link href="/fleet/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Total Vehicles</span>
            </div>
            <span className="text-2xl font-bold">{totalVehicles}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Fleet Expenses</span>
            </div>
            <span className="text-xl font-semibold">
              ₦{totalExpenses.toLocaleString()}
            </span>
          </div>

          {activeIncidents > 0 && (
            <div className="flex items-center justify-between text-yellow-600 dark:text-yellow-400">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Active Incidents</span>
              </div>
              <span className="text-xl font-semibold">{activeIncidents}</span>
            </div>
          )}

          <Link href="/fleet/dashboard">
            <Button variant="outline" className="w-full" size="sm">
              View Full Dashboard
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
