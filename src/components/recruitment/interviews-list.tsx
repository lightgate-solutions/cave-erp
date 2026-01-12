"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Briefcase } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { getUpcomingInterviews } from "@/actions/recruitment/interviews";

type Interview = Awaited<ReturnType<typeof getUpcomingInterviews>>[0];

export function InterviewsList({
  interviews: initialInterviews,
}: {
  interviews: Interview[];
}) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Filter interviews
  const filteredInterviews = initialInterviews.filter((interview) => {
    if (statusFilter !== "all" && interview.status !== statusFilter) {
      return false;
    }
    if (typeFilter !== "all" && interview.interviewType !== typeFilter) {
      return false;
    }
    return true;
  });

  // Group interviews by date
  const groupedInterviews = groupInterviewsByDate(filteredInterviews);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filters</CardTitle>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="Rescheduled">Rescheduled</SelectItem>
                  <SelectItem value="No Show">No Show</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Phone Screening">
                    Phone Screening
                  </SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Behavioral">Behavioral</SelectItem>
                  <SelectItem value="HR Round">HR Round</SelectItem>
                  <SelectItem value="Final Round">Final Round</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {filteredInterviews.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No interviews found matching your filters
            </p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedInterviews).map(([dateGroup, interviews]) => (
          <div key={dateGroup} className="space-y-4">
            <h2 className="text-lg font-semibold">{dateGroup}</h2>
            <div className="space-y-3">
              {interviews.map((interview) => (
                <InterviewCard key={interview.id} interview={interview} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function InterviewCard({ interview }: { interview: Interview }) {
  const duration = interview.scheduledEndDate
    ? Math.round(
        (new Date(interview.scheduledEndDate).getTime() -
          new Date(interview.scheduledDate).getTime()) /
          60000,
      )
    : null;

  return (
    <Link href={`/recruitment/candidates/${interview.candidateId}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{interview.interviewType}</h3>
                <Badge variant="outline">Round {interview.round}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {interview.candidateName}
              </p>
            </div>
            <Badge
              variant={
                interview.status === "Completed"
                  ? "default"
                  : interview.status === "Cancelled" ||
                      interview.status === "No Show"
                    ? "destructive"
                    : "secondary"
              }
            >
              {interview.status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center text-muted-foreground">
              <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
              <span>
                {new Date(interview.scheduledDate).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>

            <div className="flex items-center text-muted-foreground">
              <Clock className="mr-2 h-4 w-4 flex-shrink-0" />
              <span>
                {new Date(interview.scheduledDate).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {duration && ` (${duration} min)`}
              </span>
            </div>

            {interview.location && (
              <div className="flex items-center text-muted-foreground">
                <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">{interview.location}</span>
              </div>
            )}

            {interview.jobTitle && (
              <div className="flex items-center text-muted-foreground">
                <Briefcase className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">{interview.jobTitle}</span>
              </div>
            )}
          </div>

          {interview.feedback && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-sm font-medium mb-1">Feedback</p>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {interview.feedback}
              </p>
            </div>
          )}

          {interview.recommendation && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Recommendation:</p>
                <Badge
                  variant={
                    interview.recommendation === "Strong Hire" ||
                    interview.recommendation === "Hire"
                      ? "default"
                      : interview.recommendation === "Maybe"
                        ? "secondary"
                        : "destructive"
                  }
                >
                  {interview.recommendation}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function groupInterviewsByDate(
  interviews: Interview[],
): Record<string, Interview[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const groups: Record<string, Interview[]> = {
    Today: [],
    Tomorrow: [],
    "This Week": [],
    "Next Week": [],
    Later: [],
  };

  for (const interview of interviews) {
    const interviewDate = new Date(interview.scheduledDate);
    interviewDate.setHours(0, 0, 0, 0);

    if (interviewDate.getTime() === today.getTime()) {
      groups.Today.push(interview);
    } else if (interviewDate.getTime() === tomorrow.getTime()) {
      groups.Tomorrow.push(interview);
    } else if (interviewDate < nextWeek) {
      groups["This Week"].push(interview);
    } else if (
      interviewDate < new Date(nextWeek.getTime() + 7 * 24 * 60 * 60 * 1000)
    ) {
      groups["Next Week"].push(interview);
    } else {
      groups.Later.push(interview);
    }
  }

  // Remove empty groups
  return Object.fromEntries(
    Object.entries(groups).filter(([_, interviews]) => interviews.length > 0),
  );
}
