import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BillForm } from "@/components/payables/bill-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getBill } from "@/actions/payables/bills";

export default async function EditBillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bill = await getBill(Number(id));

  if (!bill) {
    notFound();
  }

  // Check if bill can be edited (only Draft status allowed)
  const canEdit = bill.status === "Draft";

  // Transform dates to Date objects for the form
  // And handle null -> undefined conversions
  const formData = {
    ...bill,
    poId: bill.poId || undefined,
    bankAccountId: bill.bankAccountId || undefined,
    notes: bill.notes || undefined,
    paymentTerms: bill.paymentTerms || undefined,
    recurringFrequency: bill.recurringFrequency || undefined,

    billDate: new Date(bill.billDate),
    dueDate: new Date(bill.dueDate),
    receivedDate: new Date(bill.receivedDate),
    recurringEndDate: bill.recurringEndDate
      ? new Date(bill.recurringEndDate)
      : undefined,
    // Ensure numeric values are numbers
    lineItems: bill.lineItems.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      amount: Number(item.amount),
      poLineItemId: item.poLineItemId || undefined,
      poUnitPrice: item.poUnitPrice ? Number(item.poUnitPrice) : undefined,
      poAmount: item.poAmount ? Number(item.poAmount) : undefined,
    })),
    taxes: bill.taxes.map((tax) => ({
      ...tax,
      taxPercentage: Number(tax.taxPercentage),
      taxAmount: Number(tax.taxAmount),
      whtCertificateNumber: tax.whtCertificateNumber || undefined,
    })),
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/payables/bills/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Edit Bill</h2>
          <p className="text-muted-foreground">Update bill {bill.billNumber}</p>
        </div>
      </div>

      {/* Warning if bill cannot be edited */}
      {!canEdit && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Cannot Edit Bill</AlertTitle>
          <AlertDescription>
            This bill has status "{bill.status}" and cannot be edited. Only
            bills with "Draft" status can be modified. Once a bill is approved
            or paid, it cannot be changed to maintain audit integrity.
          </AlertDescription>
          <div className="mt-4 flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/payables/bills/${id}`}>Back to Bill</Link>
            </Button>
            <Button asChild>
              <Link href="/payables/bills/new">Create New Bill</Link>
            </Button>
          </div>
        </Alert>
      )}

      {/* Form - only show if can edit */}
      {canEdit && (
        <BillForm mode="edit" billId={bill.id} initialData={formData} />
      )}
    </div>
  );
}
