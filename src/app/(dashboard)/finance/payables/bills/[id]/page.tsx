import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

import { getBill } from "@/actions/finance/payables/bills";
import { requireFinanceViewAccess } from "@/actions/auth/dal-finance";
import { RecordPaymentDialog } from "@/components/finance/payables/record-payment-dialog";

export default async function BillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    await requireFinanceViewAccess();
  } catch {
    redirect("/");
  }

  const billId = Number.parseInt(id);
  if (Number.isNaN(billId)) {
    notFound();
  }

  const bill = await getBill(billId);

  if (!bill) {
    notFound();
    return null;
  }

  function getStatusColor(status: string) {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Overdue":
        return "bg-red-100 text-red-800";
      case "Draft":
        return "bg-gray-100 text-gray-800";
      case "Partially Paid":
        return "bg-yellow-100 text-yellow-800";
      case "Void":
        return "bg-gray-100 text-gray-600";
      case "Open":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/payables/bills">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{bill.billNumber}</h1>
          <p className="text-muted-foreground">
            Bill from {bill.supplier.name}
          </p>
        </div>
        <div className="flex gap-2">
          {(bill.status === "Open" ||
            bill.status === "Overdue" ||
            bill.status === "Partially Paid") && (
            <RecordPaymentDialog
              billId={bill.id}
              amountDue={Number(bill.amountDue)}
              currencySymbol={bill.currency.currencySymbol}
            />
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Bill Details */}
        <Card>
          <CardHeader>
            <CardTitle>Bill Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(
                  bill.status,
                )}`}
              >
                {bill.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Bill Date</p>
                <p className="font-medium">
                  {new Date(bill.billDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-medium">
                  {new Date(bill.dueDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Currency</p>
              <p className="font-medium">
                {bill.currency.currencyCode} ({bill.currency.currencySymbol})
              </p>
            </div>

            {bill.attachmentPath && (
              <div>
                <p className="text-sm text-muted-foreground">Attachment</p>
                <p className="font-medium truncate">{bill.attachmentPath}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Supplier Details */}
        <Card>
          <CardHeader>
            <CardTitle>Supplier Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{bill.supplier.name}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{bill.supplier.email || "N/A"}</p>
            </div>

            <Link href={`/finance/payables/suppliers/${bill.supplier.id}`}>
              <Button variant="link" className="p-0">
                View supplier details
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Description</th>
                    <th className="text-right p-3 font-medium">Qty</th>
                    <th className="text-right p-3 font-medium">Unit Price</th>
                    <th className="text-right p-3 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.items.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-3">{item.description}</td>
                      <td className="text-right p-3">{item.quantity}</td>
                      <td className="text-right p-3">
                        {bill.currency.currencySymbol}
                        {Number(item.unitPrice).toFixed(2)}
                      </td>
                      <td className="text-right p-3 font-medium">
                        {bill.currency.currencySymbol}
                        {Number(item.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">
                    {bill.currency.currencySymbol}
                    {Number(bill.subtotal).toFixed(2)}
                  </span>
                </div>

                {/* 
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax:</span>
                    <span className="font-medium">
                    {bill.currency.currencySymbol}
                    {Number(bill.taxAmount).toFixed(2)}
                    </span>
                </div> 
                */}

                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>
                    {bill.currency.currencySymbol}
                    {Number(bill.total).toFixed(2)}
                  </span>
                </div>

                {bill.amountPaid !== "0.00" && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Amount Paid:
                      </span>
                      <span className="font-medium text-green-600">
                        {bill.currency.currencySymbol}
                        {Number(bill.amountPaid).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-orange-600">
                      <span>Amount Due:</span>
                      <span>
                        {bill.currency.currencySymbol}
                        {Number(bill.amountDue).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments */}
      {bill.payments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>
              {bill.payments.length} payment
              {bill.payments.length !== 1 ? "s" : ""} recorded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bill.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {bill.currency.currencySymbol}
                      {Number(payment.amount).toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {payment.paymentMethod}
                      {payment.referenceNumber &&
                        ` - ${payment.referenceNumber}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </p>
                    {payment.notes && (
                      <p className="text-xs text-muted-foreground">
                        {payment.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              No payments recorded yet.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {bill.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">{bill.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
