/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

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
  Settings,
  Bell,
  DollarSign,
  Newspaper,
  Bug,
  Logs,
  Timer,
  MessageSquare,
  CreditCard,
  Calendar,
  type LucideIcon,
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
import { canAccessModule } from "@/lib/permissions/helpers";
import { MODULES } from "@/lib/permissions/types";
import type { UserPermissionContext } from "@/lib/permissions/types";

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
      module: MODULES.DASHBOARD,
    },
    {
      title: "Attendance",
      url: "/hr/attendance",
      icon: Timer,
      module: MODULES.ATTENDANCE,
    },
    {
      title: "Documents",
      url: "/documents",
      icon: Folder,
      isActive: false,
      module: MODULES.DOCUMENTS,
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
      module: MODULES.FINANCE,
    },
    // Task/Performance is customized per role at runtime
    {
      title: "Mail",
      url: "/mail/inbox",
      icon: Mail,
      module: MODULES.MAIL,
    },
    {
      title: "Projects",
      url: "/projects",
      icon: Warehouse,
      module: MODULES.PROJECTS,
    },
    {
      title: "Ask HR",
      url: "/hr/ask-hr",
      icon: MessageSquare,
      module: MODULES.ASK_HR,
    },
    {
      title: "Loan Management",
      url: "/hr/loans",
      icon: CreditCard,
      module: MODULES.LOAN_MANAGEMENT,
    },
    {
      title: "Leave Management",
      url: "/hr/leaves",
      icon: Calendar,
      module: MODULES.LEAVE_MANAGEMENT,
    },
    {
      title: "Hr",
      url: "/hr",
      icon: Users,
      module: MODULES.HR_EMPLOYEES,
      items: [
        {
          title: "Employees",
          url: "/hr/employees",
        },
      ],
    },
    {
      title: "Notifications",
      url: "/notifications",
      icon: Bell,
      module: MODULES.NOTIFICATIONS,
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
      module: MODULES.PAYROLL,
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
  userId,
  organizationId,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: User;
  userId: string;
  organizationId: string;
}) {
  const [isManager, setIsManager] = useState<boolean | null>(null);
  const [_isHrOrAdmin, setIsHrOrAdmin] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [employee, setEmployee] = useState<any>(null);
  // Query notifications - will return undefined if query fails or is loading
  const notifications = useQuery(api.notifications.getUserNotifications, {
    userId: userId,
    organizationId,
  });
  // Safely calculate unread count, defaulting to 0 if query fails or returns invalid data
  const unreadCount =
    notifications && Array.isArray(notifications)
      ? notifications.filter((n) => !n.isRead).length
      : 0;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const emp = await getEmployee();
        if (active) {
          setEmployee(emp);
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
          setEmployee(null);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const groupedItems = useMemo(() => {
    if (isManager === null || !employee) {
      return {
        overview: [],
        modules: [],
        management: [],
        system: [],
      };
    }

    // Create user permission context
    const userContext: UserPermissionContext = {
      department: employee?.department || "operations",
      role: employee?.role || "member",
      isManager: isManager || false,
    };

    // Filter base items by permission
    const base = data.navMain.filter((item) => {
      if (item.title === "Task/Performance") return false;
      if (!item.module) return true; // Allow items without module specified
      return canAccessModule(userContext, item.module);
    });

    const taskItem = {
      title: "Task/Performance",
      url: "/tasks",
      icon: AlarmClockCheck,
      isActive: false,
      module: MODULES.TASKS,
      items: isManager
        ? [
            { title: "Task Item", url: "/tasks" },
            { title: "To-Do", url: "/tasks/employee" },
            { title: "Task Submission", url: "/tasks/manager" },
          ]
        : [{ title: "To-Do", url: "/tasks/employee" }],
    };

    const newsItem = {
      title: "News",
      url: "/news",
      icon: Newspaper,
      isActive: false,
      module: MODULES.NEWS_VIEW,
      items: canAccessModule(userContext, MODULES.NEWS_MANAGE)
        ? [
            { title: "View News", url: "/news" },
            { title: "Manage News", url: "/news/manage" },
          ]
        : [{ title: "View News", url: "/news" }],
    };

    const allItems: Array<{
      title: string;
      url: string;
      icon?: LucideIcon;
      isActive?: boolean;
      module?: string;
      items?: Array<{ title: string; url: string }>;
    }> = [...base];

    // Add task item if user has access
    if (canAccessModule(userContext, MODULES.TASKS)) {
      allItems.push(taskItem);
    }

    // Add news item if user has access
    if (canAccessModule(userContext, MODULES.NEWS_VIEW)) {
      allItems.push(newsItem);
    }

    // Settings - available to all
    allItems.push({
      title: "Settings",
      url: "/settings",
      icon: Settings,
      isActive: false,
    });

    // Data Export - admin only
    if (isAdmin) {
      allItems.push({
        title: "Data Export",
        url: "/logs",
        icon: Logs,
        isActive: false,
        module: MODULES.DATA_EXPORT,
      });
    }

    // Support/Feedback - available to all
    allItems.push({
      title: "Support/Feedback",
      url: "/bug",
      icon: Bug,
      isActive: false,
      module: MODULES.SUPPORT,
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
      } else if (
        [
          "Finance",
          "Hr",
          "Payroll",
          "Ask HR",
          "Loan Management",
          "Leave Management",
        ].includes(item.title)
      ) {
        groups.management.push(item);
      } else {
        groups.system.push(item);
      }
    });

    return groups;
  }, [isManager, isAdmin, employee]);

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
