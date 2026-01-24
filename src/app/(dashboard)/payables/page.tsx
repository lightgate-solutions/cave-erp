import { Suspense } from "react";
import Link from "next/link";
import {
  DollarSign,
  FileText,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { getOverallMetrics } from "@/actions/payables/analytics";
import { getAllBills } from "@/actions/payables/bills";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Payables Dashboard",
  description: "Accounts Payable overview and metrics",
};

async function DashboardMetrics() {
  const metrics = await getOverallMetrics();

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Payables</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${Number(metrics.payables.total).toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">All-time payables</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
          <AlertCircle className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
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
          <Clock className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            ${Number(metrics.payables.overdue).toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {metrics.bills.overdue} overdue bills
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Paid</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            ${Number(metrics.payables.paid).toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {metrics.bills.paid} paid bills
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

async function RecentBills() {
  const bills = await getAllBills();
  const recentBills = bills.slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "Approved":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Partially Paid":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Recent Bills</CardTitle>
        <CardDescription>Latest bills in the system</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentBills.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No bills found</p>
              <Button asChild className="mt-4">
                <Link href="/payables/bills/new">Create Your First Bill</Link>
              </Button>
            </div>
          ) : (
            recentBills.map((bill) => (
              <div
                key={bill.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/payables/bills/${bill.id}`}
                      className="font-medium hover:underline"
                    >
                      {bill.billNumber}
                    </Link>
                    <Badge className={getStatusColor(bill.status)}>
                      {bill.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {bill.vendorName} • Due:{" "}
                    {new Date(bill.dueDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">
                    ${Number(bill.total).toLocaleString()}
                  </div>
                  {Number(bill.amountDue) > 0 && (
                    <div className="text-sm text-orange-600">
                      ${Number(bill.amountDue).toLocaleString()} due
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        {recentBills.length > 0 && (
          <div className="mt-4">
            <Button variant="outline" asChild className="w-full">
              <Link href="/payables/bills">View All Bills</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

async function QuickStats() {
  const metrics = await getOverallMetrics();

  return (
    <Card className="col-span-4 lg:col-span-2">
      <CardHeader>
        <CardTitle>Quick Stats</CardTitle>
        <CardDescription>At-a-glance metrics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-blue-500" />
            <span className="font-medium">Active Vendors</span>
          </div>
          <span className="text-2xl font-bold">{metrics.vendors.active}</span>
        </div>

        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-purple-500" />
            <span className="font-medium">Total Bills</span>
          </div>
          <span className="text-2xl font-bold">{metrics.bills.total}</span>
        </div>

        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-green-500" />
            <span className="font-medium">Avg Payment Time</span>
          </div>
          <span className="text-2xl font-bold">
            {metrics.avgPaymentTime} days
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function PayablesDashboard() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Payables Dashboard
          </h2>
          <p className="text-muted-foreground">
            Overview of your accounts payable
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <Suspense
        fallback={
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
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
        <DashboardMetrics />
      </Suspense>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button asChild variant="outline" className="h-auto py-4">
              <Link href="/payables/vendors/new">
                <div className="flex flex-col items-center gap-2">
                  <Users className="h-6 w-6" />
                  <span>New Vendor</span>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4">
              <Link href="/payables/purchase-orders/new">
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-6 w-6" />
                  <span>New PO</span>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4">
              <Link href="/payables/bills/new">
                <div className="flex flex-col items-center gap-2">
                  <DollarSign className="h-6 w-6" />
                  <span>New Bill</span>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4">
              <Link href="/payables/overview">
                <div className="flex flex-col items-center gap-2">
                  <TrendingUp className="h-6 w-6" />
                  <span>AP Overview</span>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Bills and Quick Stats */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-6">
        <Suspense fallback={<div className="col-span-4">Loading...</div>}>
          <RecentBills />
        </Suspense>
        <Suspense fallback={<div className="col-span-2">Loading...</div>}>
          <QuickStats />
        </Suspense>
      </div>
    </div>
  );
}
