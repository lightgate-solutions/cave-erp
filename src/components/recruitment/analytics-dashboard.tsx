"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Briefcase,
  Calendar,
  FileText,
  TrendingUp,
  Clock,
} from "lucide-react";
import Link from "next/link";
import type {
  getOverallMetrics,
  getTopJobs,
  getRecentActivity,
} from "@/actions/recruitment/analytics";

type OverallMetrics = NonNullable<
  Awaited<ReturnType<typeof getOverallMetrics>>
>;
type TopJobs = Awaited<ReturnType<typeof getTopJobs>>;
type RecentActivity = Awaited<ReturnType<typeof getRecentActivity>>;

export function AnalyticsDashboard({
  overallMetrics,
  topJobs,
  recentActivity,
}: {
  overallMetrics: OverallMetrics;
  topJobs: TopJobs;
  recentActivity: RecentActivity;
}) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Jobs"
          value={overallMetrics.totalJobs}
          icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
          description="Active job postings"
        />
        <StatCard
          title="Total Candidates"
          value={overallMetrics.totalCandidates}
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          description="All applicants"
        />
        <StatCard
          title="Interviews"
          value={overallMetrics.totalInterviews}
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
          description="Scheduled & completed"
        />
        <StatCard
          title="Offers"
          value={overallMetrics.totalOffers}
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
          description="Total offers created"
        />
      </div>

      {/* Recent Activity (Last 30 Days) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Activity (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <p className="text-2xl font-bold">
                {recentActivity.recentApplications}
              </p>
              <p className="text-sm text-muted-foreground">New Applications</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">
                {recentActivity.recentInterviews}
              </p>
              <p className="text-sm text-muted-foreground">
                Interviews Scheduled
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">
                {recentActivity.recentOffers}
              </p>
              <p className="text-sm text-muted-foreground">Offers Extended</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{recentActivity.recentHires}</p>
              <p className="text-sm text-muted-foreground">New Hires</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Candidates by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Candidates by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {overallMetrics.candidatesByStatus.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        item.status === "Hired"
                          ? "default"
                          : item.status === "Rejected"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{item.count}</span>
                    <span className="text-sm text-muted-foreground">
                      (
                      {(
                        (item.count / overallMetrics.totalCandidates) *
                        100
                      ).toFixed(1)}
                      %)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Offers by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Offers by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {overallMetrics.offersByStatus.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No offers created yet
              </p>
            ) : (
              <div className="space-y-4">
                {overallMetrics.offersByStatus.map((item) => (
                  <div
                    key={item.status}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          item.status === "Accepted"
                            ? "default"
                            : item.status === "Rejected" ||
                                item.status === "Expired"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {item.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{item.count}</span>
                      <span className="text-sm text-muted-foreground">
                        (
                        {(
                          (item.count / overallMetrics.totalOffers) *
                          100
                        ).toFixed(1)}
                        %)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Time to Hire */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Hiring Efficiency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Average Time to Hire
              </p>
              <p className="text-4xl font-bold">
                {overallMetrics.avgTimeToHire}
                <span className="text-xl text-muted-foreground ml-2">days</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Based on {overallMetrics.hiredCount} hired candidate
                {overallMetrics.hiredCount !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Overall Success Rate
              </p>
              <p className="text-4xl font-bold">
                {overallMetrics.totalCandidates > 0
                  ? (
                      (overallMetrics.hiredCount /
                        overallMetrics.totalCandidates) *
                      100
                    ).toFixed(1)
                  : "0"}
                <span className="text-xl text-muted-foreground ml-2">%</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Candidates hired from total applicants
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {topJobs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No jobs with hires yet
            </p>
          ) : (
            <div className="space-y-4">
              {topJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/recruitment/jobs/${job.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors">
                    <div className="space-y-1">
                      <p className="font-medium">{job.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {job.department}
                      </p>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-bold text-lg">
                          {job.totalApplicants}
                        </p>
                        <p className="text-muted-foreground">Applicants</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-lg text-green-600">
                          {job.hired}
                        </p>
                        <p className="text-muted-foreground">Hired</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-lg text-red-600">
                          {job.rejected}
                        </p>
                        <p className="text-muted-foreground">Rejected</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-lg">
                          {job.totalApplicants > 0
                            ? ((job.hired / job.totalApplicants) * 100).toFixed(
                                1,
                              )
                            : "0"}
                          %
                        </p>
                        <p className="text-muted-foreground">Success</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
