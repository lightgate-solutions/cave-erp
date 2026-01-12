import { requireHROrAdmin } from "@/actions/auth/dal";
import { PipelineBoard } from "@/components/recruitment/pipeline-board";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default async function PipelinePage() {
  await requireHROrAdmin();

  return (
    <div className="h-screen flex flex-col">
      <div className="p-6 pb-4">
        <h1 className="text-2xl font-bold">Recruitment Pipeline</h1>
        <p className="text-muted-foreground">
          Track candidates through the hiring process
        </p>
      </div>

      <Suspense fallback={<PipelineSkeleton />}>
        <PipelineBoard />
      </Suspense>
    </div>
  );
}

function PipelineSkeleton() {
  return (
    <div className="flex gap-4 p-6 overflow-x-auto">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex-shrink-0 w-80 space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ))}
    </div>
  );
}
