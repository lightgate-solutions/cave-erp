import { Suspense } from "react";
import { headers } from "next/headers";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Briefcase,
  AlertCircle,
  Landmark,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { getOverallMetrics as getPayablesMetrics } from "@/actions/payables/analytics";
import { getOverallMetrics as getReceivablesMetrics } from "@/actions/invoicing/analytics";
import {
  getBalanceSheet,
  getIncomeStatement,
} from "@/actions/finance/gl/reports";
import { CashFlowChart } from "./cash-flow-chart";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "General Ledger Dashboard",
  description: "Overview of financial health, payables, and receivables.",
};

async function FinancialStats({
  organizationId,
}: {
  organizationId: string | null;
}) {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  if (!organizationId) {
    return (
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="min-w-0">
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground leading-snug sm:text-sm">
              Select an organization to view financial stats.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Parallel data fetching
  const [bsData, plData] = await Promise.all([
    getBalanceSheet(organizationId, today),
    getIncomeStatement(organizationId, startOfMonth, today),
  ]);

  const assets = bsData.success && bsData.data ? bsData.data.totalAssets : 0;
  const liabilities =
    bsData.success && bsData.data ? bsData.data.totalLiabilities : 0;
  const equity = bsData.success && bsData.data ? bsData.data.totalEquity : 0;
  const netIncome = plData.success && plData.data ? plData.data.netIncome : 0;

  const currency = (n: number) =>
    `$${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  return (
    <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="min-w-0 text-xs font-medium leading-snug sm:text-sm">
            Total Assets
          </CardTitle>
          <Landmark className="h-4 w-4 shrink-0 text-muted-foreground" />
        </CardHeader>
        <CardContent className="min-w-0">
          <div className="break-words text-lg font-bold tabular-nums tracking-tight sm:text-xl md:text-2xl">
            {currency(assets)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground leading-snug">
            As of{" "}
            <span className="whitespace-nowrap">
              {today.toLocaleDateString()}
            </span>
          </p>
        </CardContent>
      </Card>
      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="min-w-0 text-xs font-medium leading-snug sm:text-sm">
            Total Liabilities
          </CardTitle>
          <TrendingDown className="h-4 w-4 shrink-0 text-red-500" />
        </CardHeader>
        <CardContent className="min-w-0">
          <div className="break-words text-lg font-bold tabular-nums tracking-tight sm:text-xl md:text-2xl">
            {currency(liabilities)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground leading-snug">
            Outstanding debts
          </p>
        </CardContent>
      </Card>
      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="min-w-0 text-xs font-medium leading-snug sm:text-sm">
            Total Equity
          </CardTitle>
          <Briefcase className="h-4 w-4 shrink-0 text-blue-500" />
        </CardHeader>
        <CardContent className="min-w-0">
          <div className="break-words text-lg font-bold tabular-nums tracking-tight sm:text-xl md:text-2xl">
            {currency(equity)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground leading-snug">
            Net worth
          </p>
        </CardContent>
      </Card>
      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="min-w-0 text-xs font-medium leading-snug sm:text-sm">
            Net Income (MTD)
          </CardTitle>
          <DollarSign className="h-4 w-4 shrink-0 text-green-500" />
        </CardHeader>
        <CardContent className="min-w-0">
          <div className="break-words text-lg font-bold tabular-nums tracking-tight sm:text-xl md:text-2xl">
            {currency(netIncome)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground leading-snug">
            Month to Date
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

async function OperationalOverview({
  organizationId,
}: {
  organizationId: string | null;
}) {
  if (!organizationId) {
    return (
      <p className="text-sm text-muted-foreground">
        Select an organization to view receivables and payables snapshot.
      </p>
    );
  }

  const [payables, receivables] = await Promise.all([
    getPayablesMetrics(),
    getReceivablesMetrics(),
  ]);

  const payablesOutstanding = Number(payables.payables.outstanding);
  const payablesOverdue = Number(payables.payables.overdue);
  const payablesCount = payables.bills.approved + payables.bills.overdue;

  const receivablesPending =
    (receivables?.revenue?.pending ? Number(receivables.revenue.pending) : 0) +
    (receivables?.revenue?.overdue ? Number(receivables.revenue.overdue) : 0);
  const receivablesOverdue = receivables?.revenue?.overdue
    ? Number(receivables.revenue.overdue)
    : 0;
  const receivablesCount =
    (receivables?.invoices?.sent || 0) +
    (receivables?.invoices?.partiallyPaid || 0) +
    (receivables?.invoices?.overdue || 0);

  // Prepare chart data
  const chartData = [
    {
      name: "Money In (Receivables)",
      amount: receivablesPending,
      fill: "#22c55e", // Green
    },
    {
      name: "Money Out (Payables)",
      amount: payablesOutstanding,
      fill: "#ef4444", // Red
    },
  ];

  const money = (n: number) =>
    `$${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-7 lg:gap-4">
      <Card className="min-w-0 overflow-hidden lg:col-span-4">
        <CardHeader className="space-y-1 sm:space-y-1.5">
          <CardTitle className="text-lg font-semibold leading-tight sm:text-xl">
            Cash Flow Forecast
          </CardTitle>
          <CardDescription className="text-xs leading-snug sm:text-sm">
            Comparison of expected receivables vs payables
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-0 sm:px-4 sm:pt-2">
          <CashFlowChart data={chartData} />
        </CardContent>
      </Card>

      <Card className="min-w-0 overflow-hidden lg:col-span-3">
        <CardHeader className="space-y-1 sm:space-y-1.5">
          <CardTitle className="text-lg font-semibold leading-tight sm:text-xl">
            Pending Transactions
          </CardTitle>
          <CardDescription className="text-xs leading-snug sm:text-sm">
            Summary of what you owe and what is owed to you
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="space-y-6 sm:space-y-8">
            <div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-green-100 dark:bg-green-950/50">
                    <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-medium leading-snug">
                      Expecting to Receive
                    </p>
                    <p className="text-xs text-muted-foreground leading-snug sm:text-sm">
                      {receivablesCount} invoices pending
                    </p>
                  </div>
                </div>
                <div className="shrink-0 pl-12 text-base font-semibold tabular-nums sm:ml-auto sm:pl-0 sm:text-right sm:text-lg">
                  {money(receivablesPending)}
                </div>
              </div>
              {receivablesOverdue > 0 && (
                <div className="mt-3 flex items-start gap-1.5 pl-12 text-xs leading-relaxed text-red-600 sm:pl-12 sm:text-sm dark:text-red-400">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="min-w-0 break-words">
                    Of which {money(receivablesOverdue)} is overdue
                  </span>
                </div>
              )}
            </div>

            <div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-red-100 dark:bg-red-950/50">
                    <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-medium leading-snug">
                      Expect to Pay
                    </p>
                    <p className="text-xs text-muted-foreground leading-snug sm:text-sm">
                      {payablesCount} bills outstanding
                    </p>
                  </div>
                </div>
                <div className="shrink-0 pl-12 text-base font-semibold tabular-nums sm:ml-auto sm:pl-0 sm:text-right sm:text-lg">
                  {money(payablesOutstanding)}
                </div>
              </div>
              {payablesOverdue > 0 && (
                <div className="mt-3 flex items-start gap-1.5 pl-12 text-xs leading-relaxed text-red-600 sm:pl-12 sm:text-sm dark:text-red-400">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="min-w-0 break-words">
                    Of which {money(payablesOverdue)} is overdue
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function GLDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const organizationId = session?.session?.activeOrganizationId ?? null;
  /** Remount dashboard chunks when active org changes (client navigation can reuse the route). */
  const orgKey = organizationId ?? "none";

  return (
    <div className="flex-1 space-y-4 p-3 pt-4 sm:p-4 md:p-8 md:pt-6">
      <div className="min-w-0">
        <h2 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">
          General Ledger Dashboard
        </h2>
      </div>

      <Suspense
        key={`gl-stats-${orgKey}`}
        fallback={
          <div className="text-sm text-muted-foreground animate-pulse">
            Loading financial stats…
          </div>
        }
      >
        <FinancialStats organizationId={organizationId} />
      </Suspense>

      <Suspense
        key={`gl-ops-${orgKey}`}
        fallback={
          <div className="text-sm text-muted-foreground animate-pulse">
            Loading operational overview…
          </div>
        }
      >
        <OperationalOverview organizationId={organizationId} />
      </Suspense>
    </div>
  );
}
