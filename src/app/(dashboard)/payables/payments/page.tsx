import Link from "next/link";
import { DollarSign } from "lucide-react";

import { Button } from "@/components/ui/button";
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

import { getAllPayments } from "@/actions/payables/payments";
import { PaymentsToolbar } from "@/components/payables/payments-toolbar";
import type { PaymentMethod } from "@/types/payables";

interface PaymentsPageProps {
  searchParams: Promise<{
    paymentMethod?: string;
    dateRange?: string;
    search?: string;
  }>;
}

export default async function PaymentsPage({
  searchParams,
}: PaymentsPageProps) {
  const params = await searchParams;

  // Process date range
  let startDate: string | undefined;
  let endDate: string | undefined;

  if (params.dateRange) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (params.dateRange) {
      case "today":
        startDate = today.toISOString();
        endDate = new Date(today.getTime() + 86400000).toISOString();
        break;
      case "week": {
        // Start of current week (Sunday)
        const day = today.getDay();
        const diff = today.getDate() - day;
        startDate = new Date(today.setDate(diff)).toISOString();
        endDate = new Date().toISOString();
        break;
      }
      case "month":
        startDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          1,
        ).toISOString();
        endDate = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
        ).toISOString();
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1).toISOString();
        endDate = new Date(now.getFullYear(), 11, 31).toISOString();
        break;
    }
  }

  const payments = await getAllPayments({
    paymentMethod: params.paymentMethod as PaymentMethod,
    startDate,
    endDate,
  });

  // Calculate summary statistics
  const totalPayments = payments.length;
  const totalAmount = payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0,
  );
  const emailsSent = payments.filter((p) => p.confirmationEmailSentAt).length;

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case "Bank Transfer":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Wire":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Check":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Cash":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PaymentsToolbar />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Payments
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPayments}</div>
            <p className="text-xs text-muted-foreground">
              {params.dateRange ? `In selected period` : "All time"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₦{totalAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {params.dateRange ? `In selected period` : "All time"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Confirmations Sent
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{emailsSent}</div>
            <p className="text-xs text-muted-foreground">
              {totalPayments > 0
                ? ((emailsSent / totalPayments) * 100).toFixed(0)
                : 0}
              % of payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Records</CardTitle>
          <CardDescription>
            {payments.length} payment
            {payments.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">
                {params.paymentMethod || params.dateRange
                  ? "No payments match your filters"
                  : "No payments recorded yet"}
              </p>
              {!(params.paymentMethod || params.dateRange) && (
                <Button asChild>
                  <Link href="/payables/bills">
                    View Bills to Record Payment
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Bill Number</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Email Sent</TableHead>
                  <TableHead>Recorded By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {payment.paymentDate
                        ? new Date(payment.paymentDate).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/payables/bills/${payment.billId}`}
                        className="font-medium hover:underline"
                      >
                        {payment.billNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/payables/vendors/${payment.vendorId}`}
                        className="hover:underline"
                      >
                        {payment.vendorName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getPaymentMethodColor(payment.paymentMethod)}
                      >
                        {payment.paymentMethod}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {payment.referenceNumber || "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₦{Number(payment.amount).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {payment.confirmationEmailSentAt ? (
                        <Badge className="bg-green-100 text-green-800">
                          Sent
                        </Badge>
                      ) : (
                        <Badge variant="outline">Not Sent</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      -
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
