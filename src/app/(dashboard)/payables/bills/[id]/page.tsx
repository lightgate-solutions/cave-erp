import Link from "next/link";
import { ArrowLeft, DollarSign, FileText } from "lucide-react";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RecordPaymentDialogWrapper } from "@/components/payables/record-payment-dialog-wrapper";
import { getBill } from "@/actions/payables/bills";
import { getBillPayments } from "@/actions/payables/payments";

export default async function BillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch bill data from server
  const bill = await getBill(Number(id));

  if (!bill) {
    return null;
  }

  const payments = await getBillPayments(Number(id));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Approved":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/payables/bills">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {bill.billNumber}
            </h2>
            <p className="text-muted-foreground">
              Vendor Invoice: {bill.vendorInvoiceNumber}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <RecordPaymentDialogWrapper
            billId={bill.id}
            billNumber={bill.billNumber}
            vendorName={bill.vendor.name}
            amountDue={Number(bill.amountDue)}
          />
        </div>
      </div>

      {/* Status and Amounts */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(bill.status)}>{bill.status}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Number(bill.total).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {bill.currency.currencyCode}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${Number(bill.amountPaid).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Due</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${Number(bill.amountDue).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Bill Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Bill Details</CardTitle>
            <CardDescription>Information about this bill</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Bill Date
                </div>
                <div className="text-sm">
                  {new Date(bill.billDate).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Due Date
                </div>
                <div className="text-sm">
                  {new Date(bill.dueDate).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Received Date
                </div>
                <div className="text-sm">
                  {new Date(bill.receivedDate).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Payment Terms
                </div>
                <div className="text-sm">{bill.paymentTerms || "-"}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Purchase Order
                </div>
                <div className="text-sm">
                  {bill.purchaseOrder?.poNumber ? (
                    <Link
                      href={`/payables/purchase-orders/${bill.poId}`}
                      className="text-blue-600 hover:underline"
                    >
                      {bill.purchaseOrder?.poNumber}
                    </Link>
                  ) : (
                    "-"
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  Currency
                </div>
                <div className="text-sm">
                  {bill.currency.currencyCode} - {bill.currency.currencyName}
                </div>
              </div>
            </div>

            {bill.notes && (
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Notes
                </div>
                <div className="text-sm p-3 bg-muted rounded-md">
                  {bill.notes}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vendor Information */}
        <Card>
          <CardHeader>
            <CardTitle>Vendor Information</CardTitle>
            <CardDescription>Contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Vendor Name
              </div>
              <Link
                href={`/payables/vendors/${bill.vendor.id}`}
                className="text-sm text-blue-600 hover:underline"
              >
                {bill.vendor.name}
              </Link>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Email
              </div>
              <div className="text-sm">{bill.vendor.email}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">
                Phone
              </div>
              <div className="text-sm">{bill.vendor.phone || "-"}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
          <CardDescription>Items on this bill</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bill.lineItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    ${Number(item.unitPrice).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${Number(item.amount).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} className="text-right font-medium">
                  Subtotal:
                </TableCell>
                <TableCell className="text-right font-medium">
                  ${Number(bill.subtotal).toLocaleString()}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Taxes */}
      {bill.taxes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Taxes</CardTitle>
            <CardDescription>Tax breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tax Type</TableHead>
                  <TableHead>Tax Name</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>WHT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bill.taxes.map((tax) => (
                  <TableRow key={tax.id}>
                    <TableCell>{tax.taxType}</TableCell>
                    <TableCell>{tax.taxName}</TableCell>
                    <TableCell className="text-right">
                      {tax.taxPercentage}%
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${Number(tax.taxAmount).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {tax.isWithholdingTax ? (
                        <Badge variant="outline">WHT</Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-medium">
                    Total Tax:
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${Number(bill.taxAmount).toLocaleString()}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow className="bg-muted font-bold">
                  <TableCell colSpan={3} className="text-right">
                    Grand Total:
                  </TableCell>
                  <TableCell className="text-right">
                    ${Number(bill.total).toLocaleString()}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      {payments.length === 0 && Number(bill.amountDue) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>No payments recorded yet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-4">
                No payments have been recorded for this bill
              </p>
              <RecordPaymentDialogWrapper
                billId={bill.id}
                billNumber={bill.billNumber}
                vendorName={bill.vendor.name}
                amountDue={Number(bill.amountDue)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History Table - Show if there are payments */}
      {payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>
              {payments.length} payment{payments.length !== 1 ? "s" : ""}{" "}
              recorded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Email Sent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{payment.paymentMethod}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {payment.referenceNumber || "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${Number(payment.amount).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {payment.confirmationEmailSentAt ? (
                        <span className="text-green-600 text-sm">Sent</span>
                      ) : (
                        <span className="text-gray-500 text-sm">Not sent</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
