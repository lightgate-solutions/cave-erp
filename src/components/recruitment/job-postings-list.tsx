/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <> */
/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
"use client";

import { useState, useEffect } from "react";
import {
  getAllJobPostings,
  type JobPostingStatus,
} from "@/actions/recruitment/job-postings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Building, MapPin, DollarSign } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type JobPosting = Awaited<ReturnType<typeof getAllJobPostings>>[0];

export function JobPostingsList() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<JobPostingStatus | "All">(
    "All",
  );
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadJobs();
  }, [statusFilter]);

  async function loadJobs() {
    setLoading(true);
    const filters: any = {};
    if (statusFilter !== "All") {
      filters.status = statusFilter;
    }
    const data = await getAllJobPostings(filters);
    setJobs(data);
    setLoading(false);
  }

  const filteredJobs = jobs.filter((job) =>
    search
      ? job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.position.toLowerCase().includes(search.toLowerCase()) ||
        job.code.toLowerCase().includes(search.toLowerCase())
      : true,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as JobPostingStatus | "All")
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Published">Published</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Link href="/recruitment/jobs/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Job Posting
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading jobs...
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {search
              ? "No jobs match your search"
              : "No job postings yet. Create your first one!"}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredJobs.map((job) => (
            <JobPostingCard key={job.id} job={job} onUpdate={loadJobs} />
          ))}
        </div>
      )}
    </div>
  );
}

function JobPostingCard({
  job,
  // biome-ignore lint/correctness/noUnusedFunctionParameters: <>
  onUpdate,
}: {
  job: JobPosting;
  onUpdate: () => void;
}) {
  const statusColors = {
    Draft: "bg-gray-100 text-gray-800",
    Published: "bg-green-100 text-green-800",
    Closed: "bg-red-100 text-red-800",
    Cancelled: "bg-yellow-100 text-yellow-800",
  };

  return (
    <Link href={`/recruitment/jobs/${job.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-1">{job.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{job.code}</p>
            </div>
            <Badge className={statusColors[job.status]}>{job.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Building className="mr-2 h-4 w-4" />
            <span className="capitalize">{job.department}</span>
            <span className="mx-2">•</span>
            <span>{job.employmentType}</span>
          </div>

          {job.location && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="mr-2 h-4 w-4" />
              {job.location}
            </div>
          )}

          {(job.salaryRangeMin || job.salaryRangeMax) && (
            <div className="flex items-center text-sm text-muted-foreground">
              <DollarSign className="mr-2 h-4 w-4" />
              {job.salaryRangeMin && job.salaryRangeMax
                ? `$${job.salaryRangeMin.toLocaleString()} - $${job.salaryRangeMax.toLocaleString()}`
                : job.salaryRangeMin
                  ? `From $${job.salaryRangeMin.toLocaleString()}`
                  : `Up to $${job.salaryRangeMax?.toLocaleString()}`}
            </div>
          )}

          <div className="flex items-center justify-between text-sm pt-2 border-t">
            <span className="text-muted-foreground">
              {job.openings} {job.openings === 1 ? "opening" : "openings"}
            </span>
            <span className="text-muted-foreground">
              {new Date(job.createdAt).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
