import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getGLAccount,
  getGLAccountActivity,
} from "@/actions/finance/gl/accounts";
import { AccountActivityCard } from "@/components/finance/account-activity-card";
import { notFound } from "next/navigation";

export default async function GLAccountDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const { id } = await params;
  const { start, end } = await searchParams;
  const accountId = Number.parseInt(id, 10);
  if (Number.isNaN(accountId)) {
    notFound();
  }

  const [accountResult, activityResult] = await Promise.all([
    getGLAccount(accountId),
    getGLAccountActivity(accountId, undefined, 500, start, end),
  ]);

  if (!accountResult.success || !accountResult.data) {
    notFound();
  }

  const account = accountResult.data;
  const activity = activityResult.success ? activityResult.data : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/finance/gl/accounts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {account.code} - {account.name}
          </h1>
          <p className="text-muted-foreground">
            Account details and transaction history
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>General Ledger account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Code</p>
                <p className="font-medium font-mono">{account.code}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Name</p>
                <p className="font-medium">{account.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Type</p>
                <p className="font-medium">{account.type}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Account Class</p>
                <p className="font-medium">{account.accountClass ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Current Balance</p>
                <p className="font-medium font-mono">
                  {Number(account.currentBalance).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge
                  variant={account.isActive ? "default" : "secondary"}
                  className={
                    account.isActive
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : ""
                  }
                >
                  {account.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Currency</p>
                <p className="font-medium">{account.currency}</p>
              </div>
              <div>
                <p className="text-muted-foreground">System Account</p>
                <p className="font-medium">
                  {account.isSystem ? "Yes (protected)" : "No"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Description</p>
                <p className="font-medium">{account.description ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Allow Manual Journals</p>
                <p className="font-medium">
                  {account.allowManualJournals ? "Yes" : "No"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium text-muted-foreground text-xs">
                  {new Date(account.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p className="font-medium text-muted-foreground text-xs">
                  {new Date(account.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Suspense
          fallback={
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>Loading…</CardDescription>
              </CardHeader>
              <CardContent className="py-8 text-center text-muted-foreground">
                Loading…
              </CardContent>
            </Card>
          }
        >
          <AccountActivityCard
            accountCode={account.code}
            accountName={account.name}
            activity={activity}
            startParam={start}
            endParam={end}
          />
        </Suspense>
      </div>
    </div>
  );
}
