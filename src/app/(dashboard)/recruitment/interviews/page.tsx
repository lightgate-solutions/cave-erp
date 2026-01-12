import { requireHROrAdmin } from "@/actions/auth/dal";
import { getUpcomingInterviews } from "@/actions/recruitment/interviews";
import { InterviewsList } from "@/components/recruitment/interviews-list";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default async function InterviewsPage() {
  await requireHROrAdmin();

  const interviews = await getUpcomingInterviews();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Interviews</h1>
        <p className="text-muted-foreground">
          View and manage all scheduled interviews
        </p>
      </div>

      <Suspense fallback={<InterviewsSkeleton />}>
        <InterviewsList interviews={interviews} />
      </Suspense>
    </div>
  );
}

function InterviewsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
  );
}
