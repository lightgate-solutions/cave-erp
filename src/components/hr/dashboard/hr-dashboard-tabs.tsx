"use client";

import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load chart component (bundle-dynamic-imports)
const DepartmentDistributionChart = dynamic(
  () =>
    import("@/components/hr/dashboard/department-distribution-chart").then(
      (mod) => ({ default: mod.DepartmentDistributionChart }),
    ),
  {
    loading: () => (
      <div className="rounded-lg border bg-card p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    ),
    ssr: false,
  },
);

interface DepartmentData {
  department: string | null;
  count: number;
}

interface HrDashboardTabsProps {
  departmentData: DepartmentData[] | null;
  employmentTypeData: DepartmentData[] | null;
}

export function HrDashboardTabs({
  departmentData,
  employmentTypeData,
}: HrDashboardTabsProps) {
  return (
    <Tabs defaultValue="department" className="w-full">
      <TabsList>
        <TabsTrigger value="department">Department View</TabsTrigger>
        <TabsTrigger value="employment">Employment Type</TabsTrigger>
      </TabsList>
      <TabsContent value="department" className="mt-6">
        <DepartmentDistributionChart
          data={departmentData}
          isLoading={false}
          title="Employee Distribution by Department"
          description="Total employee count across all departments"
        />
      </TabsContent>
      <TabsContent value="employment" className="mt-6">
        <DepartmentDistributionChart
          data={
            employmentTypeData?.map((item) => ({
              department: item.department,
              count: item.count,
            })) || null
          }
          isLoading={false}
          title="Employee Distribution by Employment Type"
          description="Breakdown of full-time, part-time, contract, and intern employees"
        />
      </TabsContent>
    </Tabs>
  );
}
