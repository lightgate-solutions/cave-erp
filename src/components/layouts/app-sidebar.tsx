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
  Briefcase,
  Car,
  Receipt,
  Package,
  BookOpen, // Added for General Ledger
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

/** Better Auth user may include `role` at runtime; types are not always extended. */
type UserWithRole = User & { role?: string | null };
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { usePathname, useSearchParams } from "next/navigation";
import { getEmailStats } from "@/actions/mail/email";
import { api } from "../../../convex/_generated/api";
import { OrganizationSwitcher } from "../settings/organization-switcher";
import { canAccessModule } from "@/lib/permissions/helpers";
import { MODULES } from "@/lib/permissions/types";
import { useDashboardPermission } from "@/components/layouts/dashboard-permission-context";

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
    {
      title: "General Ledger",
      url: "/finance/gl",
      icon: BookOpen,
      module: MODULES.FINANCE,
      items: [
        {
          title: "Dashboard",
          url: "/finance/gl",
        },
        {
          title: "Chart of Accounts",
          url: "/finance/gl/accounts",
        },
        {
          title: "Journal Entries",
          url: "/finance/gl/journals",
        },
        {
          title: "Financial Reports",
          url: "/finance/gl/reports",
        },
        {
          title: "Fiscal Periods",
          url: "/finance/gl/periods",
        },
      ],
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
          title: "Payment Receivables",
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
      title: "Payables",
      url: "/payables",
      icon: DollarSign,
      module: MODULES.PAYABLES,
      items: [
        {
          title: "Dashboard",
          url: "/payables",
        },
        {
          title: "Purchase Orders",
          url: "/payables/purchase-orders",
        },
        {
          title: "Bills",
          url: "/payables/bills",
        },
        {
          title: "Vendors",
          url: "/payables/vendors",
        },
        {
          title: "Payments",
          url: "/payables/payments",
        },
        {
          title: "AP Overview",
          url: "/payables/overview",
        },
        {
          title: "Reports",
          url: "/payables/reports",
        },
        {
          title: "Settings",
          url: "/payables/settings",
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
      title: "Assets",
      url: "/assets/dashboard",
      icon: Package,
      module: MODULES.ASSETS,
      items: [
        {
          title: "Dashboard",
          url: "/assets/dashboard",
        },
        {
          title: "Assets",
          url: "/assets/list",
        },
        {
          title: "Categories",
          url: "/assets/categories",
        },
        {
          title: "Locations",
          url: "/assets/locations",
        },
        {
          title: "Maintenance",
          url: "/assets/maintenance",
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

type AppSidebarProps = {
  user: UserWithRole;
  userId: string;
  organizationId: string;
  employee: any;
} & React.ComponentProps<typeof Sidebar>;

export function AppSidebar(props: AppSidebarProps) {
  const { user, userId, organizationId, employee, ...sidebarDomProps } = props;
  const permissionContext = useDashboardPermission();

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mailUnreadCount, setMailUnreadCount] = useState(0);

  const mailRouteSignature = pathname.startsWith("/mail")
    ? `${pathname}?${searchParams.toString()}`
    : pathname;

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
    if (!employee) return;
    void mailRouteSignature;
    let cancelled = false;

    const load = async () => {
      const res = await getEmailStats();
      if (cancelled || !res.success || !res.data) return;
      setMailUnreadCount(res.data.unreadCount);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [mailRouteSignature, employee]);

  useEffect(() => {
    if (!employee) return;
    const id = window.setInterval(() => {
      getEmailStats().then((res) => {
        if (res.success && res.data) setMailUnreadCount(res.data.unreadCount);
      });
    }, 30_000);
    return () => clearInterval(id);
  }, [employee]);

  useEffect(() => {
    if (!employee) return;
    const onVis = () => {
      if (document.visibilityState !== "visible") return;
      getEmailStats().then((res) => {
        if (res.success && res.data) setMailUnreadCount(res.data.unreadCount);
      });
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [employee]);

  const sessionIsAdmin = user.role === "admin";
  const isAdmin = employee?.role === "admin" || sessionIsAdmin;

  const groupedItems = useMemo(() => {
    if (!permissionContext) {
      return {
        overview: [],
        modules: [],
        management: [],
        accounting: [],
        system: [],
      };
    }

    const userContext = permissionContext;
    const isManager = userContext.isManager;

    const base = data.navMain.filter((item) => {
      if (item.title === "Task/Performance") return false;
      if (!item.module) return true;
      return canAccessModule(userContext, item.module);
    });

    const withoutDupHrTools = base.filter((item) => {
      if (!canAccessModule(userContext, MODULES.HR_EMPLOYEES)) return true;
      if (
        ["Ask HR", "Loan Management", "Leave Management"].includes(item.title)
      ) {
        return false;
      }
      return true;
    });

    const withExpandedHr = withoutDupHrTools.map((item) =>
      item.title === "Hr"
        ? {
            ...item,
            items: [
              ...(item.items ?? []),
              { title: "My attendance", url: "/hr/attendance" },
              { title: "Ask HR", url: "/hr/ask-hr" },
              { title: "Leave management", url: "/hr/leaves" },
              { title: "Loan management", url: "/hr/loans" },
            ],
          }
        : item,
    );

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
            { title: "Self assign", url: "/tasks/self" },
            { title: "Task Submission", url: "/tasks/manager" },
          ]
        : [
            { title: "To-Do", url: "/tasks/employee" },
            { title: "Self assign", url: "/tasks/self" },
          ],
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
      badge?: number;
      items?: Array<{ title: string; url: string }>;
    }> = [...withExpandedHr];

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
      accounting: [] as typeof allItems,
      system: [] as typeof allItems,
    };

    allItems.forEach((item) => {
      const withMailBadge =
        item.title === "Mail" && mailUnreadCount > 0
          ? { ...item, badge: mailUnreadCount }
          : item;

      if (["Dashboard", "Attendance"].includes(item.title)) {
        groups.overview.push(withMailBadge);
      } else if (
        ["Documents", "Mail", "Projects", "Task/Performance"].includes(
          item.title,
        )
      ) {
        groups.modules.push(withMailBadge);
      } else if (
        [
          "Hr",
          "Payroll",
          "Ask HR",
          "Loan Management",
          "Leave Management",
          "Recruitment",
          "Fleet",
          "Assets",
        ].includes(item.title)
      ) {
        groups.management.push(item);
      } else if (
        ["Receivables", "Finance", "Payables", "General Ledger"].includes(
          item.title,
        )
      ) {
        groups.accounting.push(withMailBadge);
      } else {
        groups.system.push(withMailBadge);
      }
    });

    return groups;
  }, [permissionContext, isAdmin, mailUnreadCount]);

  return (
    <Sidebar collapsible="icon" {...sidebarDomProps}>
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
