import { redirect } from "next/navigation";
import { getUser } from "@/actions/auth/dal";
import {
  canAccessRoute,
  getUnauthorizedRedirect,
} from "@/lib/permissions/helpers";
import type { UserPermissionContext } from "@/lib/permissions/types";

interface RequirePermissionProps {
  children: React.ReactNode;
  route: string;
}

export async function RequirePermission({
  children,
  route,
}: RequirePermissionProps) {
  const user = await getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const userContext: UserPermissionContext = {
    department: user.department,
    role: user.role,
    isManager: user.isManager,
  };

  const hasAccess = canAccessRoute(userContext, route);

  if (!hasAccess) {
    redirect(getUnauthorizedRedirect());
  }

  return <>{children}</>;
}
