import { requireHROrAdmin } from "@/actions/auth/dal";
import { getCandidate } from "@/actions/recruitment/candidates";
import { getCandidateActivityLog } from "@/actions/recruitment/activity-log";
import { getCandidateInterviews } from "@/actions/recruitment/interviews";
import { getCandidateOffers } from "@/actions/recruitment/offers";
import { CandidateDetails } from "@/components/recruitment/candidate-details";
import { notFound, redirect } from "next/navigation";

export default async function CandidateDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requireHROrAdmin();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Forbidden") || error.message.includes("HR")) {
        redirect("/unauthorized");
      }
      throw error;
    }
    redirect("/unauthorized");
  }

  const { id } = await params;
  const candidateId = Number.parseInt(id, 10);
  const candidate = await getCandidate(candidateId);

  if (!candidate) {
    notFound();
  }

  const [activityLog, interviews, offers] = await Promise.all([
    getCandidateActivityLog(candidateId, 10, 0),
    getCandidateInterviews(candidateId),
    getCandidateOffers(candidateId),
  ]);

  return (
    <div className="p-6">
      <CandidateDetails
        candidate={candidate}
        activityLog={activityLog}
        interviews={interviews}
        offers={offers}
      />
    </div>
  );
}
