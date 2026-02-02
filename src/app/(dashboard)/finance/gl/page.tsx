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

async function FinancialStats() {
  const session = await auth.api.getSession({ headers: await headers() });
  const organizationId = session?.session?.activeOrganizationId;
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  if (!organizationId) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">
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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
          <Landmark className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${assets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">
            As of {today.toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Liabilities
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            $
            {liabilities.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </div>
          <p className="text-xs text-muted-foreground">Outstanding debts</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Equity</CardTitle>
          <Briefcase className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">Net worth</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Net Income (MTD)
          </CardTitle>
          <DollarSign className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground">Month to Date</p>
        </CardContent>
      </Card>
    </div>
  );
}

async function OperationalOverview() {
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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Cash Flow Forecast</CardTitle>
          <CardDescription>
            Comparison of expected receivables vs payables
          </CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <CashFlowChart data={chartData} />
        </CardContent>
      </Card>

      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Pending Transactions</CardTitle>
          <CardDescription>
            Summary of what you owe and what is owed to you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            <div className="flex items-center">
              <span className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full mr-4 bg-green-100 items-center justify-center">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Expecting to Receive
                </p>
                <p className="text-sm text-muted-foreground">
                  {receivablesCount} invoices pending
                </p>
              </div>
              <div className="ml-auto font-medium">
                $
                {receivablesPending.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
            {receivablesOverdue > 0 && (
              <div className="flex items-center pl-14 text-sm text-red-500">
                <AlertCircle className="mr-1 h-3 w-3" />
                Of which $
                {receivablesOverdue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}{" "}
                is overdue
              </div>
            )}

            <div className="flex items-center">
              <span className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full mr-4 bg-red-100 items-center justify-center">
                <TrendingDown className="h-4 w-4 text-red-600" />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  Expect to Pay
                </p>
                <p className="text-sm text-muted-foreground">
                  {payablesCount} bills outstanding
                </p>
              </div>
              <div className="ml-auto font-medium">
                $
                {payablesOutstanding.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </div>
            </div>
            {payablesOverdue > 0 && (
              <div className="flex items-center pl-14 text-sm text-red-500">
                <AlertCircle className="mr-1 h-3 w-3" />
                Of which $
                {payablesOverdue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}{" "}
                is overdue
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function GLDashboardPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          General Ledger Dashboard
        </h2>
      </div>

      <Suspense fallback={<div>Loading financial stats...</div>}>
        <FinancialStats />
      </Suspense>

      <Suspense fallback={<div>Loading operational overview...</div>}>
        <OperationalOverview />
      </Suspense>
    </div>
  );
}
