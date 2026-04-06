"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Cake } from "lucide-react";
import { format } from "date-fns";

interface Birthday {
  id: string;
  name: string;
  department: string | null;
  dateOfBirth: Date;
  daysUntil: number;
  nextBirthday: Date;
}

interface UpcomingBirthdaysProps {
  birthdays: Birthday[] | null;
  isLoading?: boolean;
}

export function UpcomingBirthdays({
  birthdays,
  isLoading,
}: UpcomingBirthdaysProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!birthdays || birthdays.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Birthdays</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Cake className="size-12 mb-2 opacity-50" />
            <p className="text-sm">No upcoming birthdays</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cake className="size-5" />
          Upcoming Birthdays
        </CardTitle>
        <p className="text-sm text-muted-foreground">Next 30 days</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {birthdays.map((birthday) => {
            const initials = birthday.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase();

            const isToday = birthday.daysUntil === 0;
            const isTomorrow = birthday.daysUntil === 1;

            return (
              <div
                key={birthday.id}
                className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                  isToday
                    ? "bg-primary/5 border-primary/20"
                    : "hover:bg-muted/50"
                }`}
              >
                <Avatar className="size-10">
                  <AvatarFallback
                    className={
                      isToday
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary/10 text-primary"
                    }
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {birthday.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    {birthday.department && (
                      <>
                        <span className="capitalize">
                          {birthday.department}
                        </span>
                        <span>•</span>
                      </>
                    )}
                    <span>
                      {format(new Date(birthday.nextBirthday), "MMM d")}
                    </span>
                  </div>
                </div>
                <Badge
                  variant={isToday ? "default" : "secondary"}
                  className={
                    isToday
                      ? "bg-primary"
                      : isTomorrow
                        ? "bg-primary/20 text-primary"
                        : ""
                  }
                >
                  {isToday
                    ? "Today"
                    : isTomorrow
                      ? "Tomorrow"
                      : `${birthday.daysUntil}d`}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
