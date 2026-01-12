import { requireHROrAdmin } from "@/actions/auth/dal";
import {
  getOverallMetrics,
  getTopJobs,
  getRecentActivity,
} from "@/actions/recruitment/analytics";
import { AnalyticsDashboard } from "@/components/recruitment/analytics-dashboard";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default async function AnalyticsPage() {
  await requireHROrAdmin();

  const [overallMetrics, topJobs, recentActivity] = await Promise.all([
    getOverallMetrics(),
    getTopJobs(),
    getRecentActivity(),
  ]);

  if (!overallMetrics) {
    return (
      <div className="p-6">
        <p className="text-center text-muted-foreground">
          Unable to load analytics
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Recruitment Analytics</h1>
        <p className="text-muted-foreground">
          Track your recruitment performance and metrics
        </p>
      </div>

      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsDashboard
          overallMetrics={overallMetrics}
          topJobs={topJobs}
          recentActivity={recentActivity}
        />
      </Suspense>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}
