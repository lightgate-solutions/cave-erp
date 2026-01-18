import { db } from "@/db";
import { member } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { Loader2Icon } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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
import { BrandingTab } from "@/components/branding/branding-tab";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from "@/lib/auth";

const validTabs = [
  "profile",
  "security",
  "sessions",
  "accounts",
  "organizations",
  "members",
  "billing",
  "branding",
  "danger",
] as const;

const adminOnlyTabs = [
  "organizations",
  "members",
  "billing",
  "branding",
] as const;

type ValidTab = (typeof validTabs)[number];

function isValidTab(tab: string): tab is ValidTab {
  return validTabs.includes(tab as ValidTab);
}

function isAdminOnlyTab(tab: string): boolean {
  return adminOnlyTabs.includes(tab as (typeof adminOnlyTabs)[number]);
}

export default async function Page({
  params,
}: {
  params: Promise<{ tab: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session == null) return redirect("/auth/login");

  const { tab } = await params;

  if (!isValidTab(tab)) {
    notFound();
  }

  const activeOrgId = session.session.activeOrganizationId;
  let isOrgAdmin = false;

  if (activeOrgId) {
    const membership = await db.query.member.findFirst({
      where: and(
        eq(member.userId, session.user.id),
        eq(member.organizationId, activeOrgId),
      ),
    });
    if (
      membership &&
      (membership.role === "owner" || membership.role === "admin")
    ) {
      isOrgAdmin = true;
    }
  }

  const isAdmin = session.user.role === "admin";
  const hasAdminAccess = isAdmin || isOrgAdmin;

  // Redirect non-admin users trying to access admin-only tabs
  if (isAdminOnlyTab(tab) && !hasAdminAccess) {
    redirect("/settings/profile");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl">Settings</h1>
      <Tabs id="settings-tabs" value={tab} className="gap-4">
        <TabsList className="bg-background justify-start w-full rounded-none border-b p-0">
          <TabsTrigger
            value="profile"
            asChild
            className="border-b-border dark:data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5"
          >
            <Link href="/settings/profile">Profile</Link>
          </TabsTrigger>
          <TabsTrigger
            value="security"
            asChild
            className="border-b-border dark:data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5"
          >
            <Link href="/settings/security">Security</Link>
          </TabsTrigger>
          <TabsTrigger
            value="sessions"
            asChild
            className="border-b-border dark:data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5"
          >
            <Link href="/settings/sessions">Sessions</Link>
          </TabsTrigger>
          <TabsTrigger
            value="accounts"
            asChild
            className="border-b-border dark:data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5"
          >
            <Link href="/settings/accounts">Accounts</Link>
          </TabsTrigger>
          {hasAdminAccess && (
            <>
              <TabsTrigger
                value="organizations"
                asChild
                className="border-b-border dark:data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5"
              >
                <Link href="/settings/organizations">Organizations</Link>
              </TabsTrigger>
              <TabsTrigger
                value="members"
                asChild
                className="border-b-border dark:data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5"
              >
                <Link href="/settings/members">Members</Link>
              </TabsTrigger>
              <TabsTrigger
                value="billing"
                asChild
                className="border-b-border dark:data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5"
              >
                <Link href="/settings/billing">Billing</Link>
              </TabsTrigger>
              <TabsTrigger
                value="branding"
                asChild
                className="border-b-border dark:data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5"
              >
                <Link href="/settings/branding">Branding</Link>
              </TabsTrigger>
            </>
          )}
          <TabsTrigger
            value="danger"
            asChild
            className="border-b-border dark:data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5"
          >
            <Link href="/settings/danger">Danger</Link>
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

        {hasAdminAccess && (
          <>
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

            <TabsContent value="branding">
              <LoadingSuspense>
                <BrandingTab />
              </LoadingSuspense>
            </TabsContent>
          </>
        )}

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
