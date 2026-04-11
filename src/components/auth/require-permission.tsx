import { redirect } from "next/navigation";
import { getUserPermissionContext } from "@/actions/auth/dal";
import {
  canAccessRoute,
  getUnauthorizedRedirect,
} from "@/lib/permissions/helpers";

interface RequirePermissionProps {
  children: React.ReactNode;
  route: string;
}

export async function RequirePermission({
  children,
  route,
}: RequirePermissionProps) {
  const userContext = await getUserPermissionContext();

  if (!userContext) {
    redirect("/auth/login");
  }

  const hasAccess = canAccessRoute(userContext, route);

  if (!hasAccess) {
    redirect(getUnauthorizedRedirect());
  }

  return <>{children}</>;
}
