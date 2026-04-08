import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const STATS_KEYS = ["s1", "s2", "s3", "s4"] as const;
const CHART_KEYS = ["c1", "c2"] as const;
const CONTENT_KEYS = ["x1", "x2"] as const;

export function DashboardLoading() {
  return (
    <div className="flex flex-1 flex-col gap-8 p-6 md:p-8 lg:p-10">
      {/* Header skeleton */}
      <div className="flex flex-col gap-3">
        <Skeleton className="h-12 w-96" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {STATS_KEYS.map((key) => (
          <Card key={key}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        {CHART_KEYS.map((key) => (
          <div key={key} className="rounded-lg border bg-card p-6">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-64 w-full" />
          </div>
        ))}
      </div>

      {/* Additional content skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        {CONTENT_KEYS.map((key) => (
          <Card key={key}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
