import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AskHrQuestionDetail } from "@/components/hr/ask-hr/ask-hr-question-detail";
import { notFound } from "next/navigation";

function QuestionDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-32" />
      </div>
      <Skeleton className="h-[200px] w-full rounded-md" />
      <Skeleton className="h-12 w-32" />
      <Skeleton className="h-[150px] w-full rounded-md" />
      <Skeleton className="h-[150px] w-full rounded-md" />
    </div>
  );
}

export default async function QuestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const questionId = Number(id);

  if (Number.isNaN(questionId) || questionId <= 0) {
    notFound();
  }

  return (
    <div className="container mx-auto py-4">
      <Suspense fallback={<QuestionDetailSkeleton />}>
        <AskHrQuestionDetail questionId={questionId} />
      </Suspense>
    </div>
  );
}
