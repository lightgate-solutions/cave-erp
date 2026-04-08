import { requireHROrAdmin } from "@/actions/auth/dal";
import { CandidatesList } from "@/components/recruitment/candidates-list";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { redirect } from "next/navigation";

export default async function CandidatesPage() {
  try {
    await requireHROrAdmin();
  } catch {
    redirect("/");
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Candidates</h1>
        <p className="text-muted-foreground">
          View and manage all job applicants
        </p>
      </div>

      <Suspense fallback={<CandidatesListSkeleton />}>
        <CandidatesList />
      </Suspense>
    </div>
  );
}

function CandidatesListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-10 flex-1" />
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-24 w-full" />
      ))}
    </div>
  );
}
