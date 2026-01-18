import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, FileText, Calendar, DollarSign } from "lucide-react";
import { requireFinanceViewAccess } from "@/actions/auth/dal-finance";
import { getAllBillPayments } from "@/actions/finance/payables/payments";
import { redirect } from "next/navigation";

export default async function PaymentsPage() {
  try {
    await requireFinanceViewAccess();
  } catch {
    redirect("/");
  }

  const payments = await getAllBillPayments();

  // Calculate totals
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const paymentMethods = [...new Set(payments.map((p) => p.paymentMethod))];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">
            Manage outgoing payments to suppliers.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Payments
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalPaid.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {payments.length} payment{payments.length !== 1 ? "s" : ""}{" "}
              recorded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Payment Methods
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentMethods.length}</div>
            <p className="text-xs text-muted-foreground">
              Different methods used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                payments.filter((p) => {
                  const paymentDate = new Date(p.paymentDate);
                  const now = new Date();
                  return (
                    paymentDate.getMonth() === now.getMonth() &&
                    paymentDate.getFullYear() === now.getFullYear()
                  );
                }).length
              }
            </div>
            <p className="text-xs text-muted-foreground">Payments this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bills Paid</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(payments.map((p) => p.billId)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Unique bills with payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>All recorded payments to suppliers</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No payments recorded yet</p>
              <p className="text-sm mt-2">
                Payments are recorded when you pay a bill.
              </p>
              <Link href="/finance/payables/bills">
                <Button variant="link">View Bills</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Bill</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/finance/payables/bills/${payment.billId}`}
                          className="text-primary hover:underline"
                        >
                          {payment.bill?.billNumber ||
                            `Bill #${payment.billId}`}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {payment.bill?.supplier?.name || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{payment.paymentMethod}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {payment.referenceNumber || "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {payment.bill?.currency?.currencySymbol || ""}
                        {Number(payment.amount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
