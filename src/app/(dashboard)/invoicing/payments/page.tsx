import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreditCard, FileText } from "lucide-react";

import { getAllPayments } from "@/actions/invoicing/payments";
import { requireInvoicingViewAccess } from "@/actions/auth/dal-invoicing";

export default async function PaymentsPage() {
  try {
    await requireInvoicingViewAccess();
  } catch {
    redirect("/");
  }

  const payments = await getAllPayments();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">All recorded payments</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            {payments.length} payment{payments.length !== 1 ? "s" : ""} recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No payments recorded yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((item) => (
                <Link
                  key={item.payment.id}
                  href={`/invoicing/invoices/${item.invoice?.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                        <CreditCard className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {item.currency?.currencySymbol}
                            {Number(item.payment.amount).toFixed(2)}
                          </p>
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
                            {item.payment.paymentMethod}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {item.invoice?.invoiceNumber}
                          </span>
                          {item.client?.name && (
                            <>
                              <span>•</span>
                              <span>{item.client.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {new Date(
                          item.payment.paymentDate,
                        ).toLocaleDateString()}
                      </p>
                      {item.payment.referenceNumber && (
                        <p className="text-xs text-muted-foreground">
                          Ref: {item.payment.referenceNumber}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
