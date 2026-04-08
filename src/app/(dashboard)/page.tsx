import { Suspense } from "react";
import { getUser } from "@/actions/auth/dal";
import { getUserPreferences } from "@/actions/user-preferences/preferences";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import HrDashboard from "@/components/dashboard/HrDashboard";
import FinanceDashboard from "@/components/dashboard/FinanceDashboard";
import StaffDashboard from "@/components/dashboard/StaffDashboard";
import ManagerDashboard from "@/components/dashboard/ManagerDashboard";
import { DashboardLoading } from "@/components/dashboard/dashboard-loading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please log in to access the dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check user preferences for defaultView (gracefully handle if table doesn't exist)
  let defaultView = "dashboard";
  try {
    const preferences = await getUserPreferences();
    defaultView = preferences?.defaultView || "dashboard";
  } catch {
    // If preferences can't be loaded, default to dashboard view
  }

  // If user has set a defaultView preference and it's not "dashboard", redirect them
  if (defaultView && defaultView !== "dashboard") {
    switch (defaultView) {
      case "documents":
        redirect("/documents");
        break;
      case "tasks":
        // Redirect to appropriate tasks page based on role
        if (user.isManager) {
          redirect("/tasks");
        } else {
          redirect("/tasks/employee");
        }
        break;
      case "projects":
        redirect("/projects");
        break;
      case "mail":
        redirect("/mail/inbox");
        break;
      default:
        // If invalid defaultView, continue to show dashboard
        break;
    }
  }

  // Normalize role to lowercase and trim for comparison
  const normalizedRole = user.role?.toLowerCase().trim() || "user";
  const isManager = user.isManager || false;

  const normalizedDepartment =
    user.department?.toLowerCase().trim() || "operations";

  // Priority: Admin > Manager (if isManager flag) > Role-based > Default Staff

  // Get organization for admin dashboard
  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });

  // Admin always gets admin dashboard
  if (normalizedRole === "admin") {
    if (!organization) {
      redirect("/organizations/create");
    }
    return (
      <Suspense fallback={<DashboardLoading />}>
        <AdminDashboard userId={user.id} organizationId={organization.id} />
      </Suspense>
    );
  }

  // Department-based dashboards take precedence over manager dashboard
  // This allows HR managers to see HR dashboard with manager elements
  switch (normalizedDepartment) {
    case "hr":
      return (
        <Suspense fallback={<DashboardLoading />}>
          <HrDashboard isManager={isManager} />
        </Suspense>
      );
    case "finance":
    case "accounting":
    case "accountant":
      return (
        <Suspense fallback={<DashboardLoading />}>
          <FinanceDashboard isManager={isManager} />
        </Suspense>
      );

    default:
      // If user has manager flag but no specific department dashboard, show manager dashboard
      if (isManager) {
        return (
          <Suspense fallback={<DashboardLoading />}>
            <ManagerDashboard />
          </Suspense>
        );
      }
      // Default fallback: Show staff dashboard for any unrecognized role
      // This ensures ALL users get a dashboard, even if their role is not explicitly handled
      return (
        <Suspense fallback={<DashboardLoading />}>
          <StaffDashboard />
        </Suspense>
      );
  }
}
