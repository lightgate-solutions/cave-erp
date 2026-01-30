"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface LeaveTrendsChartProps {
  data: Array<{
    month: string;
    approved: number;
    pending: number;
    rejected: number;
    total: number;
  }> | null;
  isLoading?: boolean;
}

export function LeaveTrendsChart({ data, isLoading }: LeaveTrendsChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leave Applications Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Applications Trend</CardTitle>
        <p className="text-sm text-muted-foreground">Last 6 months overview</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              className="text-xs"
              tick={{ fill: "hsl(var(--foreground))" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--foreground))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="approved"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              name="Approved"
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="pending"
              stroke="hsl(var(--chart-3))"
              strokeWidth={2}
              name="Pending"
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="rejected"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              name="Rejected"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
