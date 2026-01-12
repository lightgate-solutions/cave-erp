import { requireHROrAdmin } from "@/actions/auth/dal";
import { JobPostingForm } from "@/components/recruitment/job-posting-form";

export default async function NewJobPostingPage() {
  await requireHROrAdmin();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create Job Posting</h1>
        <p className="text-muted-foreground">
          Fill in the details for your new job posting
        </p>
      </div>

      <JobPostingForm />
    </div>
  );
}
