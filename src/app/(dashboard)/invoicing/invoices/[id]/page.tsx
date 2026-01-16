/** biome-ignore-all lint/suspicious/noExplicitAny: <> */
/** biome-ignore-all lint/suspicious/noArrayIndexKey: <> */

import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Edit, ArrowLeft, Download } from "lucide-react";

import { getInvoice } from "@/actions/invoicing/invoices";
import { getInvoicePayments } from "@/actions/invoicing/payments";
import { getInvoiceActivityLog } from "@/actions/invoicing/activity-log";
import { requireInvoicingViewAccess } from "@/actions/auth/dal-invoicing";
import { RecordPaymentDialog } from "@/components/invoicing/record-payment-dialog";
import { InvoiceStatusBadge } from "@/components/invoicing/invoice-status-badge";
import { RemindButton } from "@/components/invoicing/remind-button";
import { SendInvoiceButton } from "@/components/invoicing/send-invoice-button";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    await requireInvoicingViewAccess();
  } catch {
    redirect("/");
  }

  const invoiceId = Number.parseInt(id);
  if (Number.isNaN(invoiceId)) {
    return null;
  }

  const [invoice, payments, activityLog] = await Promise.all([
    getInvoice(invoiceId),
    getInvoicePayments(invoiceId),
    getInvoiceActivityLog(invoiceId),
  ]);

  if (!invoice) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/invoicing/invoices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{invoice.invoiceNumber}</h1>
          <p className="text-muted-foreground">
            Invoice for {invoice.client.name}
            {invoice.client.companyName && ` (${invoice.client.companyName})`}
          </p>
        </div>
        <div className="flex gap-2">
          {invoice.pdfPath && (
            <a href={invoice.pdfPath} target="_blank" rel="noopener noreferrer">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </a>
          )}
          {invoice.status === "Draft" && (
            <Link href={`/invoicing/invoices/${invoice.id}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </Link>
          )}
          {(invoice.status === "Sent" ||
            invoice.status === "Overdue" ||
            invoice.status === "Partially Paid") && (
            <>
              <RemindButton id={invoice.id} />
              <RecordPaymentDialog
                invoiceId={invoice.id}
                amountDue={Number(invoice.amountDue)}
                currencySymbol={invoice.currency.currencySymbol}
              />
            </>
          )}
          {invoice.status === "Draft" && <SendInvoiceButton id={invoice.id} />}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <InvoiceStatusBadge
                status={invoice.status as any}
                className="text-sm px-3 py-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Invoice Date</p>
                <p className="font-medium">
                  {new Date(invoice.invoiceDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="font-medium">
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Currency</p>
              <p className="font-medium">
                {invoice.currency.currencyCode} (
                {invoice.currency.currencySymbol})
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Template</p>
              <p className="font-medium">{invoice.template}</p>
            </div>

            {invoice.sentAt && (
              <div>
                <p className="text-sm text-muted-foreground">Sent On</p>
                <p className="font-medium">
                  {new Date(invoice.sentAt).toLocaleString()}
                </p>
              </div>
            )}

            {invoice.paidAt && (
              <div>
                <p className="text-sm text-muted-foreground">Paid On</p>
                <p className="font-medium">
                  {new Date(invoice.paidAt).toLocaleString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Details */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Client Code</p>
              <p className="font-medium">{invoice.client.clientCode}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{invoice.client.name}</p>
            </div>

            {invoice.client.companyName && (
              <div>
                <p className="text-sm text-muted-foreground">Company</p>
                <p className="font-medium">{invoice.client.companyName}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{invoice.client.email}</p>
            </div>

            {invoice.client.phone && (
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{invoice.client.phone}</p>
              </div>
            )}

            <Link href={`/invoicing/clients/${invoice.client.id}`}>
              <Button variant="link" className="p-0">
                View full client details
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
                  {invoice.lineItems.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-3">{item.description}</td>
                      <td className="text-right p-3">{item.quantity}</td>
                      <td className="text-right p-3">
                        {invoice.currency.currencySymbol}
                        {Number(item.unitPrice).toFixed(2)}
                      </td>
                      <td className="text-right p-3 font-medium">
                        {invoice.currency.currencySymbol}
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
                    {invoice.currency.currencySymbol}
                    {Number(invoice.subtotal).toFixed(2)}
                  </span>
                </div>

                {invoice.taxes && invoice.taxes.length > 0 ? (
                  invoice.taxes.map((tax, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {tax.taxName} ({Number(tax.taxPercentage)}%):
                      </span>
                      <span className="font-medium">
                        {invoice.currency.currencySymbol}
                        {Number(tax.taxAmount).toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : Number(invoice.taxAmount) > 0 ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax:</span>
                    <span className="font-medium">
                      {invoice.currency.currencySymbol}
                      {Number(invoice.taxAmount).toFixed(2)}
                    </span>
                  </div>
                ) : null}

                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>
                    {invoice.currency.currencySymbol}
                    {Number(invoice.total).toFixed(2)}
                  </span>
                </div>

                {invoice.amountPaid !== "0.00" && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Amount Paid:
                      </span>
                      <span className="font-medium text-green-600">
                        {invoice.currency.currencySymbol}
                        {Number(invoice.amountPaid).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-orange-600">
                      <span>Amount Due:</span>
                      <span>
                        {invoice.currency.currencySymbol}
                        {Number(invoice.amountDue).toFixed(2)}
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
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {invoice.currency.currencySymbol}
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
      )}

      {/* Notes */}
      {(invoice.notes || invoice.termsAndConditions || invoice.footerNote) && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {invoice.notes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Internal Notes
                </p>
                <p className="text-sm">{invoice.notes}</p>
              </div>
            )}

            {invoice.termsAndConditions && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Terms and Conditions
                </p>
                <p className="text-sm">{invoice.termsAndConditions}</p>
              </div>
            )}

            {invoice.footerNote && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Footer Note
                </p>
                <p className="text-sm">{invoice.footerNote}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Activity Log */}
      {activityLog.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
            <CardDescription>History of changes and actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activityLog.map((activity) => (
                <div key={activity.activity.id} className="flex gap-4">
                  <div className="flex-1">
                    <p className="font-medium">
                      {activity.activity.activityType}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.user?.name || "System"} •{" "}
                      {new Date(activity.activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
