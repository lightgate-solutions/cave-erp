/** biome-ignore-all lint/suspicious/noArrayIndexKey: <> */
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Users,
  UserCheck,
  Calendar,
  Clock,
  FileText,
  ClipboardList,
  Settings,
  MessageSquare,
} from "lucide-react";

export function QuickActions() {
  const actions = [
    {
      title: "Manage Employees",
      description: "View and edit employee records",
      icon: Users,
      href: "/hr/employees",
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-950",
    },
    {
      title: "Leave Management",
      description: "Review and approve leave requests",
      icon: Calendar,
      href: "/hr/leaves",
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-950",
    },
    {
      title: "Attendance",
      description: "Track and manage attendance",
      icon: Clock,
      href: "/hr/attendance-records",
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-950",
    },
    {
      title: "User Administration",
      description: "Manage user accounts and roles",
      icon: UserCheck,
      href: "/hr/admin",
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-950",
    },
    {
      title: "All Tasks",
      description: "View organization tasks",
      icon: ClipboardList,
      href: "/hr/admin/tasks",
      color: "text-pink-600",
      bgColor: "bg-pink-100 dark:bg-pink-950",
    },
    {
      title: "Leave Balances",
      description: "Manage annual leave allocations",
      icon: FileText,
      href: "/hr/leaves/annual-balances",
      color: "text-indigo-600",
      bgColor: "bg-indigo-100 dark:bg-indigo-950",
    },
    {
      title: "Attendance Settings",
      description: "Configure attendance rules",
      icon: Settings,
      href: "/hr/attendance/settings",
      color: "text-teal-600",
      bgColor: "bg-teal-100 dark:bg-teal-950",
    },
    {
      title: "Ask HR",
      description: "Employee inquiries and questions",
      icon: MessageSquare,
      href: "/hr/ask-hr",
      color: "text-amber-600",
      bgColor: "bg-amber-100 dark:bg-amber-950",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <p className="text-sm text-muted-foreground">
          Common HR management tasks
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} href={action.href}>
                <Button
                  variant="outline"
                  className="w-full h-auto p-4 flex flex-col items-start gap-2 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className={`rounded-lg p-2 ${action.bgColor}`}>
                      <Icon className={`size-4 ${action.color}`} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold">{action.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
