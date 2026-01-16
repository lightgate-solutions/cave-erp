import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileText,
  Users,
  Plus,
  TrendingUp,
  DollarSign,
  AlertCircle,
} from "lucide-react";

import { getOverallMetrics } from "@/actions/invoicing/analytics";
import { getAllInvoices } from "@/actions/invoicing/invoices";
import { redirect } from "next/navigation";
import { requireInvoicingViewAccess } from "@/actions/auth/dal-invoicing";

export default async function InvoicingDashboardPage() {
  try {
    await requireInvoicingViewAccess();
  } catch {
    redirect("/");
  }

  const metrics = await getOverallMetrics();
  const recentInvoices = await getAllInvoices();

  // Take only the first 5 recent invoices
  const displayInvoices = recentInvoices.slice(0, 5);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoicing</h1>
          <p className="text-muted-foreground">
            Manage invoices, clients, and payments
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/invoicing/clients/new">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              New Client
            </Button>
          </Link>
          <Link href="/invoicing/invoices/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
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
              <CardTitle className="text-sm font-medium">Paid</CardTitle>
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
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {Number(metrics.revenue.pending).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.invoices.sent + metrics.invoices.partiallyPaid} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
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
      )}

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
          <CardDescription>Latest invoices in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {displayInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No invoices yet</p>
              <Link href="/invoicing/invoices/new">
                <Button variant="link">Create your first invoice</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {displayInvoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/invoicing/invoices/${invoice.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {invoice.clientName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">
                          {invoice.currencySymbol}
                          {Number(invoice.total).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Due: {new Date(invoice.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            invoice.status === "Paid"
                              ? "bg-green-100 text-green-800"
                              : invoice.status === "Overdue"
                                ? "bg-red-100 text-red-800"
                                : invoice.status === "Draft"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}

              <div className="text-center pt-4">
                <Link href="/invoicing/invoices">
                  <Button variant="outline">View All Invoices</Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/invoicing/invoices">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoices
              </CardTitle>
              <CardDescription>View and manage all invoices</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/invoicing/clients">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Clients
              </CardTitle>
              <CardDescription>Manage your client database</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/invoicing/analytics">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Analytics
              </CardTitle>
              <CardDescription>View reports and insights</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
