import { requireAuth } from "@/actions/auth/dal";
import NotificationsClient from "./notifications-client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function NotificationsPage() {
  const authData = await requireAuth();
  const userId = authData.userId;

  const organization = await auth.api.getFullOrganization({
    headers: await headers(),
  });
  if (!organization) {
    redirect("/organizations/create");
  }

  return (
    <NotificationsClient userId={userId} organizationId={organization.id} />
  );
}
