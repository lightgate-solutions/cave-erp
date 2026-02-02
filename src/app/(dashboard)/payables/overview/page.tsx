import { Suspense } from "react";
import { AlertCircle, TrendingDown, TrendingUp } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { APAgingTable } from "@/components/payables/ap-aging-table";
import {
  getAPAgingSummary,
  getOverallMetrics,
} from "@/actions/payables/analytics";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "AP Overview | Payables",
  description: "Accounts Payable aging analysis and overview",
};

async function AgingAnalysis() {
  const agingData = await getAPAgingSummary();
  return <APAgingTable agingData={agingData} />;
}

async function OverdueAlert() {
  const metrics = await getOverallMetrics();
  const overdueAmount = Number(metrics.payables.overdue);
  const overdueCount = metrics.bills.overdue;

  if (overdueAmount === 0) {
    return null;
  }

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Overdue Bills Alert</AlertTitle>
      <AlertDescription>
        You have {overdueCount} overdue bill{overdueCount !== 1 ? "s" : ""}{" "}
        totaling ${overdueAmount.toLocaleString()}. Please review and process
        payments immediately.
      </AlertDescription>
    </Alert>
  );
}

async function QuickMetrics() {
  const metrics = await getOverallMetrics();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Outstanding
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${Number(metrics.payables.outstanding).toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {metrics.bills.approved + metrics.bills.overdue} unpaid bills
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            ${Number(metrics.payables.overdue).toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {metrics.bills.overdue} overdue bill
            {metrics.bills.overdue !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Avg Payment Time
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.avgPaymentTime} days
          </div>
          <p className="text-xs text-muted-foreground">
            Average days to pay vendors
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function APOverviewPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Accounts Payable Overview
        </h2>
        <p className="text-muted-foreground">
          Aging analysis and outstanding payables summary
        </p>
      </div>

      {/* Overdue Alert */}
      <Suspense fallback={null}>
        <OverdueAlert />
      </Suspense>

      {/* Quick Metrics */}
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(["s1", "s2", "s3"] as const).map((id) => (
              <Card key={id} className="animate-pulse">
                <CardHeader className="space-y-0 pb-2">
                  <div className="h-4 bg-muted rounded w-20" />
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-24 mb-2" />
                  <div className="h-3 bg-muted rounded w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        }
      >
        <QuickMetrics />
      </Suspense>

      {/* Aging Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Aging Analysis</CardTitle>
          <CardDescription>
            Breakdown of outstanding payables by aging buckets (30-60-90 days)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading aging analysis...</div>}>
            <AgingAnalysis />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
