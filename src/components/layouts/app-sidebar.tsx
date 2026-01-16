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
  Bell,
  DollarSign,
  Newspaper,
  Bug,
  Logs,
  Timer,
  MessageSquare,
  CreditCard,
  Calendar,
  Briefcase,
  Car,
  Receipt,
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
import { useMemo } from "react";
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
      title: "Recruitment",
      url: "/recruitment",
      icon: Briefcase,
      module: MODULES.RECRUITMENT,
      items: [
        {
          title: "Analytics",
          url: "/recruitment/analytics",
        },
        {
          title: "Jobs",
          url: "/recruitment/jobs",
        },
        {
          title: "Pipeline",
          url: "/recruitment/pipeline",
        },
        {
          title: "Candidates",
          url: "/recruitment/candidates",
        },
        {
          title: "Interviews",
          url: "/recruitment/interviews",
        },
        {
          title: "Offers",
          url: "/recruitment/offers",
        },
      ],
    },
    {
      title: "Receivables",
      url: "/invoicing",
      icon: Receipt,
      module: MODULES.INVOICING,
      items: [
        {
          title: "Dashboard",
          url: "/invoicing",
        },
        {
          title: "Invoices",
          url: "/invoicing/invoices",
        },
        {
          title: "Clients",
          url: "/invoicing/clients",
        },
        {
          title: "Payments",
          url: "/invoicing/payments",
        },
        {
          title: "Analytics",
          url: "/invoicing/analytics",
        },
        {
          title: "Templates",
          url: "/invoicing/templates",
        },
        {
          title: "Settings",
          url: "/invoicing/settings",
        },
      ],
    },
    {
      title: "Fleet",
      url: "/fleet/dashboard",
      icon: Car,
      module: MODULES.FLEET,
      items: [
        {
          title: "Dashboard",
          url: "/fleet/dashboard",
        },
        {
          title: "Vehicles",
          url: "/fleet/vehicles",
        },
        {
          title: "Drivers",
          url: "/fleet/drivers",
        },
        {
          title: "Maintenance",
          url: "/fleet/maintenance",
        },
        {
          title: "Incidents",
          url: "/fleet/incidents",
        },
      ],
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
        {
          title: "Attendance Records",
          url: "/hr/attendance-records",
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
  employee,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: User;
  userId: string;
  organizationId: string;
  employee: any;
}) {
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

  const isManager = !!employee?.isManager;
  const isAdmin = employee?.role === "admin";

  const groupedItems = useMemo(() => {
    if (!employee) {
      return {
        overview: [],
        modules: [],
        management: [],
        accounting: [],
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
      // Only add items (dropdown) for HR and admin users who can manage news
      // Non-admin users will see just "News" as a direct link
      ...(canAccessModule(userContext, MODULES.NEWS_MANAGE)
        ? {
            items: [
              { title: "News", url: "/news" },
              { title: "Manage News", url: "/news/manage" },
            ],
          }
        : {}),
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
      accounting: [] as typeof allItems,
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
          "Hr",
          "Payroll",
          "Ask HR",
          "Loan Management",
          "Leave Management",
          "Recruitment",
          "Fleet",
        ].includes(item.title)
      ) {
        groups.management.push(item);
      } else if (["Receivables", "Finance"].includes(item.title)) {
        groups.accounting.push(item);
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
        <NavMain items={groupedItems.overview} label="General" />
        <NavMain items={groupedItems.modules} label="Modules" />
        <NavMain items={groupedItems.accounting} label="Accounting" />
        <NavMain items={groupedItems.management} label="Corporate Services" />
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
