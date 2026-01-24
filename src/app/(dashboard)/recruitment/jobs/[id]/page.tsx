import { requireHROrAdmin } from "@/actions/auth/dal";
import { getJobPosting } from "@/actions/recruitment/job-postings";
import { getAllCandidates } from "@/actions/recruitment/candidates";
import { JobPostingDetails } from "@/components/recruitment/job-posting-details";

export default async function JobPostingDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  await requireHROrAdmin();

  const jobId = Number.parseInt(params.id);
  const job = await getJobPosting(jobId);

  if (!job) {
    return null;
  }

  // Get candidates for this job
  const candidates = await getAllCandidates({ jobPostingId: jobId });

  return (
    <div className="p-6">
      <JobPostingDetails job={job} candidates={candidates} />
    </div>
  );
}
