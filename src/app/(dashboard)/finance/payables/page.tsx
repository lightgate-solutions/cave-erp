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

import {
  getPayablesMetrics,
  getRecentBills,
} from "@/actions/finance/payables/analytics";
import { redirect } from "next/navigation";
import { requireFinanceViewAccess } from "@/actions/auth/dal-finance";

export default async function PayablesDashboardPage() {
  try {
    await requireFinanceViewAccess();
  } catch {
    redirect("/");
  }

  const metrics = await getPayablesMetrics();
  const recentBills = await getRecentBills();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accounts Payable</h1>
          <p className="text-muted-foreground">
            Manage bills, suppliers, and outgoing payments
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/finance/payables/suppliers/new">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              New Supplier
            </Button>
          </Link>
          <Link href="/finance/payables/bills/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Bill
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
                Total Payables
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Number(metrics.amounts.total).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.bills.total} total bills
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
                {Number(metrics.amounts.pending).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.bills.open + metrics.bills.partiallyPaid} pending bills
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
                {Number(metrics.amounts.overdue).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.bills.overdue} overdue bills
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
                {Number(metrics.amounts.paid).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.bills.paid} paid bills
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Bills */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bills</CardTitle>
          <CardDescription>Latest bills recorded in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {recentBills.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No bills yet</p>
              <Link href="/finance/payables/bills/new">
                <Button variant="link">Record your first bill</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentBills.map((bill) => (
                <Link
                  key={bill.id}
                  href={`/finance/payables/bills/${bill.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{bill.billNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {bill.supplierName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">
                          {bill.currencySymbol}
                          {Number(bill.total).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Due: {new Date(bill.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            bill.status === "Paid"
                              ? "bg-green-100 text-green-800"
                              : bill.status === "Overdue"
                                ? "bg-red-100 text-red-800"
                                : bill.status === "Draft"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {bill.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}

              <div className="text-center pt-4">
                <Link href="/finance/payables/bills">
                  <Button variant="outline">View All Bills</Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/finance/payables/bills">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Bills
              </CardTitle>
              <CardDescription>View and manage all bills</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/finance/payables/suppliers">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Suppliers
              </CardTitle>
              <CardDescription>Manage your supplier database</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/finance/payables/report">
          <Card className="hover:bg-accent transition-colors cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Aging Report
              </CardTitle>
              <CardDescription>View payables aging report</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
