import { requireHROrAdmin } from "@/actions/auth/dal";
import { getCandidate } from "@/actions/recruitment/candidates";
import { getCandidateActivityLog } from "@/actions/recruitment/activity-log";
import { getCandidateInterviews } from "@/actions/recruitment/interviews";
import { getCandidateOffers } from "@/actions/recruitment/offers";
import { CandidateDetails } from "@/components/recruitment/candidate-details";

export default async function CandidateDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  await requireHROrAdmin();

  const candidateId = Number.parseInt(params.id, 10);
  const candidate = await getCandidate(candidateId);

  if (!candidate) {
    return null;
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
