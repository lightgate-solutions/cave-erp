"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  publishJobPosting,
  closeJobPosting,
  deleteJobPosting,
} from "@/actions/recruitment/job-postings";
import type { getAllCandidates } from "@/actions/recruitment/candidates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Building,
  MapPin,
  DollarSign,
  Calendar,
  Users,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AddCandidateDialog } from "./add-candidate-dialog";

type JobPosting = Awaited<
  ReturnType<typeof import("@/actions/recruitment/job-postings").getJobPosting>
>;
type Candidate = Awaited<ReturnType<typeof getAllCandidates>>[0];

export function JobPostingDetails({
  job,
  candidates,
}: {
  job: NonNullable<JobPosting>;
  candidates: Candidate[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const statusColors = {
    Draft: "bg-gray-100 text-gray-800",
    Published: "bg-green-100 text-green-800",
    Closed: "bg-red-100 text-red-800",
    Cancelled: "bg-yellow-100 text-yellow-800",
  };

  async function handlePublish() {
    setLoading(true);
    const result = await publishJobPosting(job.id);
    if (result.error) {
      toast.error(result.error.reason);
    } else {
      toast.success("Job posting published");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleClose() {
    setLoading(true);
    const result = await closeJobPosting(job.id);
    if (result.error) {
      toast.error(result.error.reason);
    } else {
      toast.success("Job posting closed");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleDelete() {
    setLoading(true);
    const result = await deleteJobPosting(job.id);
    if (result.error) {
      toast.error(result.error.reason);
    } else {
      toast.success("Job posting deleted");
      router.push("/recruitment/jobs");
    }
    setLoading(false);
  }

  const candidatesByStatus = candidates.reduce(
    (acc, candidate) => {
      if (!acc[candidate.status]) {
        acc[candidate.status] = [];
      }
      acc[candidate.status].push(candidate);
      return acc;
    },
    {} as Record<string, Candidate[]>,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/recruitment/jobs">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
        </Link>

        <div className="flex gap-2">
          {job.status === "Draft" && (
            <Button onClick={handlePublish} disabled={loading}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Publish
            </Button>
          )}
          {job.status === "Published" && (
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              <XCircle className="mr-2 h-4 w-4" />
              Close
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={loading}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Job Posting?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this job posting and all
                  associated candidates. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{job.title}</CardTitle>
              <p className="text-muted-foreground">{job.code}</p>
            </div>
            <Badge className={statusColors[job.status]}>{job.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center text-sm">
              <Building className="mr-2 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Department</p>
                <p className="font-medium capitalize">{job.department}</p>
              </div>
            </div>

            <div className="flex items-center text-sm">
              <Users className="mr-2 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Type</p>
                <p className="font-medium">{job.employmentType}</p>
              </div>
            </div>

            {job.location && (
              <div className="flex items-center text-sm">
                <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Location</p>
                  <p className="font-medium">{job.location}</p>
                </div>
              </div>
            )}

            <div className="flex items-center text-sm">
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Posted</p>
                <p className="font-medium">
                  {new Date(job.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {(job.salaryRangeMin || job.salaryRangeMax) && (
            <div className="flex items-center text-sm">
              <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Salary Range</p>
                <p className="font-medium">
                  {job.salaryRangeMin && job.salaryRangeMax
                    ? `$${job.salaryRangeMin.toLocaleString()} - $${job.salaryRangeMax.toLocaleString()}`
                    : job.salaryRangeMin
                      ? `From $${job.salaryRangeMin.toLocaleString()}`
                      : `Up to $${job.salaryRangeMax?.toLocaleString()}`}
                </p>
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {job.description}
            </p>
          </div>

          {job.requirements && (
            <div>
              <h3 className="font-semibold mb-2">Requirements</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {job.requirements}
              </p>
            </div>
          )}

          {job.responsibilities && (
            <div>
              <h3 className="font-semibold mb-2">Responsibilities</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {job.responsibilities}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Candidates ({candidates.length})</CardTitle>
            <AddCandidateDialog
              preSelectedJobId={job.id}
              onSuccess={() => router.refresh()}
            />
          </div>
        </CardHeader>
        <CardContent>
          {candidates.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No candidates yet
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(candidatesByStatus).map(
                ([status, statusCandidates]) => (
                  <div key={status}>
                    <h4 className="font-medium mb-2">
                      {status} ({statusCandidates.length})
                    </h4>
                    <div className="space-y-2">
                      {statusCandidates.map((candidate) => (
                        <Link
                          key={candidate.id}
                          href={`/recruitment/candidates/${candidate.id}`}
                        >
                          <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer">
                            <div>
                              <p className="font-medium">{candidate.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {candidate.email}
                              </p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Applied{" "}
                              {new Date(
                                candidate.appliedAt,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
