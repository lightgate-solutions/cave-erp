/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  DollarSign,
  Users,
  FileText,
  AlertCircle,
  Clock,
} from "lucide-react";

import {
  getOverallMetrics,
  getStatusBreakdown,
  getClientAnalytics,
  getOverdueInvoices,
  getPaymentMethodBreakdown,
} from "@/actions/invoicing/analytics";
import { requireInvoicingViewAccess } from "@/actions/auth/dal-invoicing";
import { InvoiceStatusBadge } from "@/components/invoicing/invoice-status-badge";

export default async function AnalyticsPage() {
  try {
    await requireInvoicingViewAccess();
  } catch {
    redirect("/");
  }

  const [
    metrics,
    statusBreakdown,
    clientAnalytics,
    overdueInvoices,
    paymentMethodBreakdown,
  ] = await Promise.all([
    getOverallMetrics(),
    getStatusBreakdown(),
    getClientAnalytics(10),
    getOverdueInvoices(10),
    getPaymentMethodBreakdown(),
  ]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Invoicing insights and performance metrics
        </p>
      </div>

      {/* Overall Metrics */}
      {metrics && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Number(metrics.revenue.total).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics.invoices.total} total invoices
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Paid Revenue
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {Number(metrics.revenue.paid).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics.invoices.paid} paid invoices
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Revenue
                </CardTitle>
                <FileText className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {Number(metrics.revenue.pending).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics.invoices.sent + metrics.invoices.partiallyPaid}{" "}
                  pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Overdue Revenue
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {Number(metrics.revenue.overdue).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics.invoices.overdue} overdue invoices
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Average Payment Time
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.avgPaymentTime}
                </div>
                <p className="text-xs text-muted-foreground">days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Clients
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.clients.total}
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics.clients.active} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Draft Invoices
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.invoices.draft}
                </div>
                <p className="text-xs text-muted-foreground">pending action</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Status Breakdown</CardTitle>
            <CardDescription>Invoice distribution by status</CardDescription>
          </CardHeader>
          <CardContent>
            {statusBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data available</p>
            ) : (
              <div className="space-y-4">
                {statusBreakdown.map((item) => (
                  <div
                    key={item.status}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <InvoiceStatusBadge status={item.status as any} />
                      <span className="text-sm text-muted-foreground">
                        {item.count} invoice{item.count !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {Number(item.totalAmount).toFixed(2)}
                      </p>
                      {item.amountDue !== "0" && (
                        <p className="text-xs text-muted-foreground">
                          Due: {Number(item.amountDue).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Breakdown by payment type</CardDescription>
          </CardHeader>
          <CardContent>
            {paymentMethodBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments yet</p>
            ) : (
              <div className="space-y-4">
                {paymentMethodBreakdown.map((item) => (
                  <div
                    key={item.paymentMethod}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{item.paymentMethod}</span>
                      <span className="text-sm text-muted-foreground">
                        {item.count} payment{item.count !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <p className="font-medium">
                      {Number(item.totalAmount).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Clients */}
      {clientAnalytics && clientAnalytics.topClients.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Clients</CardTitle>
            <CardDescription>
              Clients by total revenue • Average per client:{" "}
              {Number(clientAnalytics.avgRevenuePerClient).toFixed(2)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clientAnalytics.topClients.map((item) => (
                <Link
                  key={item.client.id}
                  href={`/invoicing/clients/${item.client.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors">
                    <div>
                      <p className="font-medium">{item.client.name}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {item.client.companyName && (
                          <span>{item.client.companyName}</span>
                        )}
                        <span>{item.invoiceCount} invoices</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {Number(item.totalRevenue).toFixed(2)}
                      </p>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span className="text-green-600">
                          Paid: {Number(item.paidAmount).toFixed(2)}
                        </span>
                        {Number(item.outstandingAmount) > 0 && (
                          <span className="text-orange-600">
                            Due: {Number(item.outstandingAmount).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overdue Invoices */}
      {overdueInvoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Overdue Invoices</CardTitle>
            <CardDescription>
              {overdueInvoices.length} invoice
              {overdueInvoices.length !== 1 ? "s" : ""} past due date
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueInvoices.map((item) => (
                <Link
                  key={item.invoice.id}
                  href={`/invoicing/invoices/${item.invoice.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors">
                    <div>
                      <p className="font-medium">
                        {item.invoice.invoiceNumber}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.client?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-red-600">
                        {item.currency?.currencySymbol}
                        {Number(item.invoice.amountDue).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.daysOverdue} days overdue
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
