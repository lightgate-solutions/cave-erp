import { requireHROrAdmin } from "@/actions/auth/dal";
import { JobPostingsList } from "@/components/recruitment/job-postings-list";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { redirect } from "next/navigation";

export default async function JobPostingsPage() {
  try {
    await requireHROrAdmin();
  } catch {
    redirect("/");
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Job Postings</h1>
        <p className="text-muted-foreground">
          Manage your organization's job openings
        </p>
      </div>

      <Suspense fallback={<JobPostingsListSkeleton />}>
        <JobPostingsList />
      </Suspense>
    </div>
  );
}

function JobPostingsListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-10 flex-1" />
      </div>
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-32 w-full" />
      ))}
    </div>
  );
}
