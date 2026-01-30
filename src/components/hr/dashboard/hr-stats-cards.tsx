"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, Calendar, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface HrStatsCardsProps {
  stats: {
    totalEmployees: number;
    newHires: number;
    pendingLeaves: number;
    activeLeaves: number;
    pendingAttendance: number;
  } | null;
  isLoading?: boolean;
}

export function HrStatsCards({ stats, isLoading }: HrStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="size-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      title: "Total Employees",
      value: stats.totalEmployees,
      description: "Active employees",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-950",
    },
    {
      title: "New Hires",
      value: stats.newHires,
      description: "This month",
      icon: UserPlus,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-950",
    },
    {
      title: "Pending Leaves",
      value: stats.pendingLeaves,
      description: "Awaiting approval",
      icon: Calendar,
      color: "text-amber-600",
      bgColor: "bg-amber-100 dark:bg-amber-950",
    },
    {
      title: "On Leave Today",
      value: stats.activeLeaves,
      description: "Currently on leave",
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-950",
    },
    {
      title: "Pending Attendance",
      value: stats.pendingAttendance,
      description: "To be reviewed",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-950",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${card.bgColor}`}>
                <Icon className={`size-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
