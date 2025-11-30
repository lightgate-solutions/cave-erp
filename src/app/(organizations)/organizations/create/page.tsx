import { headers } from "next/headers";
import { redirect } from "next/navigation";
import BillingsTab from "@/components/settings/billings-tab";
import { CreateOrganizationButton } from "@/components/settings/create-organization";
import { auth } from "@/lib/auth";

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session == null) return redirect("/auth/login");

  const data = await auth.api.listOrganizations({
    headers: await headers(),
  });

  if (data.length > 0) {
    redirect("/");
  }

  return (
    <div className="p-4 space-y-4">
      <CreateOrganizationButton />
      <BillingsTab user={session.user} />
    </div>
  );
}
