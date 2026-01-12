"use client";

import { useState } from "react";
import { getCandidateActivityLog } from "@/actions/recruitment/activity-log";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type Activity = Awaited<ReturnType<typeof getCandidateActivityLog>>[0];

interface ActivityTimelineProps {
  candidateId: number;
  initialActivities: Activity[];
}

export function ActivityTimeline({
  candidateId,
  initialActivities,
}: ActivityTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialActivities.length === 10);

  async function loadMore() {
    setLoading(true);
    try {
      const newActivities = await getCandidateActivityLog(
        candidateId,
        10,
        activities.length,
      );

      if (newActivities.length < 10) {
        setHasMore(false);
      }

      setActivities([...activities, ...newActivities]);
    } catch (error) {
      console.error("Error loading more activities:", error);
    } finally {
      setLoading(false);
    }
  }

  if (activities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No activity yet
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={activity.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-2 h-2 bg-primary rounded-full" />
            {index < activities.length - 1 && (
              <div className="w-px h-full bg-border" />
            )}
          </div>
          <div className="flex-1 pb-4">
            <p className="text-sm font-medium">{activity.activityType}</p>
            <p className="text-sm text-muted-foreground">
              {activity.description}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {activity.performedByName} •{" "}
              {new Date(activity.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      ))}

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
