"use client";

import type * as React from "react";
import {
  AlarmClockCheck,
  Folder,
  GalleryVerticalEnd,
  Landmark,
  Mail,
  TvMinimal,
  Users,
  Warehouse,
  Bell,
  DollarSign,
  Newspaper,
  Bug,
  Logs,
  Timer,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import type { User } from "better-auth";
import { useEffect, useMemo, useState } from "react";
import { getUser as getEmployee } from "@/actions/auth/dal";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { OrganizationSwitcher } from "../settings/organization-switcher";

const data = {
  org: [
    {
      name: "Cave ERP",
      logo: GalleryVerticalEnd,
      plan: "Management System",
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: TvMinimal,
      isActive: false,
    },
    {
      title: "Attendance",
      url: "/hr/attendance",
      icon: Timer,
    },
    {
      title: "Documents",
      url: "/documents",
      icon: Folder,
      isActive: false,
      items: [
        {
          title: "Main",
          url: "/documents",
        },
        {
          title: "Search",
          url: "/documents/search",
        },
        {
          title: "All Documents",
          url: "/documents/all",
        },
        {
          title: "Archive",
          url: "/documents/archive",
        },
      ],
    },
    {
      title: "Finance",
      url: "/finance",
      icon: Landmark,
    },
    // Task/Performance is customized per role at runtime
    {
      title: "Mail",
      url: "/mail/inbox",
      icon: Mail,
    },
    {
      title: "Projects",
      url: "/projects",
      icon: Warehouse,
    },
    {
      title: "Hr",
      url: "/hr",
      icon: Users,
      items: [
        {
          title: "User Management",
          url: "/hr/admin",
        },
        {
          title: "View Employees",
          url: "/hr/employees",
        },
        {
          title: "Ask HR",
          url: "/hr/ask-hr",
        },
        {
          title: "Loan Management",
          url: "/hr/loans",
        },
        {
          title: "Leave Management",
          url: "/hr/leaves",
        },
      ],
    },
    {
      title: "Notifications",
      url: "/notifications",
      icon: Bell,
      items: [
        {
          title: "View Notifications",
          url: "/notification",
        },
        {
          title: "Notifications Preferences",
          url: "/notification-preferences",
        },
      ],
    },
    {
      title: "Payroll",
      url: "/payroll",
      icon: DollarSign,
      items: [
        {
          title: "Salary Structures",
          url: "/payroll/structure",
        },
        {
          title: "Employees",
          url: "/payroll/employees",
        },
        {
          title: "Payrun",
          url: "/payroll/payrun",
        },
      ],
    },
  ],
};

export function AppSidebar({
  user,
  employeeId,
  organizationId,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: User;
  employeeId: number;
  organizationId: string;
}) {
  const [isManager, setIsManager] = useState<boolean | null>(null);
  const [isHrOrAdmin, setIsHrOrAdmin] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const notifications = useQuery(api.notifications.getUserNotifications, {
    userId: employeeId,
    organizationId,
  });
  const unreadCount = notifications?.filter((n) => !n.isRead).length;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const emp = await getEmployee();
        if (active) {
          setIsManager(!!emp?.isManager);
          setIsAdmin(emp?.role === "admin");

          if (emp?.department === "hr" || emp?.role === "admin") {
            setIsHrOrAdmin(true);
          } else {
            setIsHrOrAdmin(false);
          }
        }
      } catch {
        if (active) {
          setIsManager(null);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const groupedItems = useMemo(() => {
    const base = data.navMain.filter((i) => i.title !== "Task/Performance");
    const taskItem = {
      title: "Task/Performance",
      url: "/tasks",
      icon: AlarmClockCheck,
      items: isManager
        ? [
            { title: "Task Item", url: "/tasks" },
            { title: "To-Do", url: "/tasks/employee" },
            { title: "Task Submission", url: "/tasks/manager" },
          ]
        : [],
    };
    const newsItem = {
      title: "News",
      url: "/news",
      icon: Newspaper,
      items: isHrOrAdmin
        ? [
            { title: "View News", url: "/news" },
            { title: "Manage News", url: "/news/manage" },
          ]
        : [{ title: "View News", url: "/news" }],
    };

    const allItems = [...base, taskItem, newsItem];

    // Only show Data Export to admins
    if (isAdmin) {
      allItems.push({
        title: "Data Export",
        url: "/logs",
        icon: Logs,
        isActive: false,
      });
    }

    allItems.push({
      title: "Support/Feedback",
      url: "/bug",
      icon: Bug,
      isActive: false,
    });

    const groups = {
      overview: [] as typeof allItems,
      modules: [] as typeof allItems,
      management: [] as typeof allItems,
      system: [] as typeof allItems,
    };

    allItems.forEach((item) => {
      if (["Dashboard", "Attendance"].includes(item.title)) {
        groups.overview.push(item);
      } else if (
        ["Documents", "Mail", "Projects", "Task/Performance"].includes(
          item.title,
        )
      ) {
        groups.modules.push(item);
      } else if (["Finance", "Hr", "Payroll"].includes(item.title)) {
        groups.management.push(item);
      } else {
        groups.system.push(item);
      }
    });

    return groups;
  }, [isManager, isHrOrAdmin, isAdmin]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <OrganizationSwitcher size="md" />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={groupedItems.overview} />
        <NavMain items={groupedItems.modules} label="Modules" />
        <NavMain items={groupedItems.management} label="Management" />
        <NavMain
          items={groupedItems.system}
          label="System"
          unreadCount={unreadCount}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
