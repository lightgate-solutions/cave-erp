import { requireHROrAdmin } from "@/actions/auth/dal";
import { getJobPosting } from "@/actions/recruitment/job-postings";
import { getAllCandidates } from "@/actions/recruitment/candidates";
import { JobPostingDetails } from "@/components/recruitment/job-posting-details";
import { notFound, redirect } from "next/navigation";

export default async function JobPostingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requireHROrAdmin();
  } catch {
    redirect("/");
  }

  const { id } = await params;
  const jobId = Number.parseInt(id);
  const job = await getJobPosting(jobId);

  if (!job) {
    notFound();
  }

  // Get candidates for this job
  const candidates = await getAllCandidates({ jobPostingId: jobId });

  return (
    <div className="p-6">
      <JobPostingDetails job={job} candidates={candidates} />
    </div>
  );
}
