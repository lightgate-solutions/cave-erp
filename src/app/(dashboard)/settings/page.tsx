import { Loader2Icon } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { AccountDeletion } from "@/components/settings/account-deletion";
import LinkedAccountsTab from "@/components/settings/accounts-tab";
import BillingsTab from "@/components/settings/billings-tab";
import { CreateOrganizationButton } from "@/components/settings/create-organization";
import { InvitesCard } from "@/components/settings/invites-card";
import { MembersTable } from "@/components/settings/members-table";
import { OrganizationDeletion } from "@/components/settings/organization-deletion";
import { ProfileUpdateForm } from "@/components/settings/profile-update-form";
import SecurityTab from "@/components/settings/security-tab";
import SessionsTab from "@/components/settings/sessions-tab";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from "@/lib/auth";

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session == null) return redirect("/auth/login");

  return (
    <div className="space-y-4">
      <h1 className="text-3xl">Settings</h1>
      <Tabs defaultValue="profile" className="gap-4">
        <TabsList className="bg-background justify-start w-full rounded-none border-b p-0">
          <TabsTrigger
            value="profile"
            className="border-b-border dark:data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5"
          >
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="border-b-border dark:data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5"
          >
            Security
          </TabsTrigger>
          <TabsTrigger
            value="sessions"
            className="border-b-border dark:data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5"
          >
            Sessions
          </TabsTrigger>
          <TabsTrigger
            value="accounts"
            className="border-b-border dark:data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5"
          >
            Accounts
          </TabsTrigger>
          <TabsTrigger
            value="organizations"
            className="border-b-border dark:data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5"
          >
            Organizations
          </TabsTrigger>
          <TabsTrigger
            value="members"
            className="border-b-border dark:data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5"
          >
            Members
          </TabsTrigger>
          <TabsTrigger
            value="billing"
            className="border-b-border dark:data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5"
          >
            Billing
          </TabsTrigger>
          <TabsTrigger
            value="danger"
            className="border-b-border dark:data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5"
          >
            Danger
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileUpdateForm user={session.user} />
        </TabsContent>

        <TabsContent value="security">
          <LoadingSuspense>
            <SecurityTab
              email={session.user.email}
              isTwoFactorEnabled={session.user.twoFactorEnabled ?? false}
            />
          </LoadingSuspense>
        </TabsContent>

        <TabsContent value="sessions">
          <LoadingSuspense>
            <SessionsTab currentSessionToken={session.session.token} />
          </LoadingSuspense>
        </TabsContent>

        <TabsContent value="accounts">
          <LoadingSuspense>
            <LinkedAccountsTab />
          </LoadingSuspense>
        </TabsContent>

        <TabsContent value="organizations" className="space-y-4">
          <CreateOrganizationButton />
          <InvitesCard />
        </TabsContent>

        <TabsContent value="members">
          <MembersTable />
        </TabsContent>

        <TabsContent value="billing">
          <LoadingSuspense>
            <BillingsTab user={session.user} />
          </LoadingSuspense>
        </TabsContent>

        <TabsContent value="danger">
          <Card>
            <CardHeader>
              <CardTitle className="">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <OrganizationDeletion />
              <AccountDeletion />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LoadingSuspense({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<Loader2Icon className="size-20 animate-spin" />}>
      {children}
    </Suspense>
  );
}
