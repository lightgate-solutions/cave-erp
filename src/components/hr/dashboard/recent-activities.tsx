"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";

interface RecentActivity {
  id: string | number;
  employeeName: string | null;
  leaveType: string | null;
  startDate: Date | string | null;
  endDate: Date | string | null;
  status: string | null;
  createdAt: Date | null;
}

interface RecentActivitiesProps {
  activities: RecentActivity[] | null;
  isLoading?: boolean;
}

const statusColors: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  Approved: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  Rejected: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
  Cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200",
};

export function RecentActivities({
  activities,
  isLoading,
}: RecentActivitiesProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: Skeleton list, index is stable
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Leave Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Calendar className="size-12 mb-2 opacity-50" />
            <p className="text-sm">No recent activities</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Leave Applications</CardTitle>
        <p className="text-sm text-muted-foreground">
          Latest leave requests from employees
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const initials =
              activity.employeeName
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "NA";

            return (
              <div
                key={activity.id}
                className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <Avatar className="size-10">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {activity.employeeName || "Unknown Employee"}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="font-medium">{activity.leaveType}</span>
                    {activity.startDate && activity.endDate && (
                      <>
                        <span>•</span>
                        <span>
                          {format(new Date(activity.startDate), "MMM d")} -{" "}
                          {format(new Date(activity.endDate), "MMM d")}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={statusColors[activity.status || "Pending"] || ""}
                >
                  {activity.status}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
