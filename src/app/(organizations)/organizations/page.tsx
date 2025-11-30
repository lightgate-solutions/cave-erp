import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CreateOrganizationButton } from "@/components/settings/create-organization";
import { InvitesCard } from "@/components/settings/invites-card";
import { auth } from "@/lib/auth";

export default async function OrganizationsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session == null) return redirect("/auth/login");

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-3xl">Organizations</h1>
      <div className="space-y-4">
        <CreateOrganizationButton />
        <InvitesCard />
      </div>
    </div>
  );
}
