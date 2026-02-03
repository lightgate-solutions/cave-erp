import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PurchaseOrderForm } from "@/components/payables/purchase-order-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getPurchaseOrder } from "@/actions/payables/purchase-orders";

export default async function EditPurchaseOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const po = await getPurchaseOrder(Number(id));

  if (!po) {
    notFound();
  }

  // Check if PO can be edited (only Draft status allowed)
  const canEdit = po.status === "Draft";

  // Transform data for the form
  const formData = {
    ...po,
    poDate: new Date(po.poDate),
    expectedDeliveryDate: po.expectedDeliveryDate
      ? new Date(po.expectedDeliveryDate)
      : undefined,
    notes: po.notes || undefined,
    termsAndConditions: po.termsAndConditions || undefined,
    deliveryAddress: po.deliveryAddress || undefined,
    lineItems: po.lineItems.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      amount: Number(item.amount),
    })),
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/payables/purchase-orders/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Edit Purchase Order
          </h2>
          <p className="text-muted-foreground">
            Update purchase order {po.poNumber}
          </p>
        </div>
      </div>

      {/* Warning if PO cannot be edited */}
      {!canEdit && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Cannot Edit Purchase Order</AlertTitle>
          <AlertDescription>
            This purchase order has status "{po.status}" and cannot be edited.
            Only purchase orders with "Draft" status can be modified. Please
            create a new purchase order or contact your administrator.
          </AlertDescription>
          <div className="mt-4">
            <Button asChild variant="outline">
              <Link href={`/payables/purchase-orders/${id}`}>
                Back to Purchase Order
              </Link>
            </Button>
          </div>
        </Alert>
      )}

      {/* Form - only show if can edit */}
      {canEdit && (
        <PurchaseOrderForm mode="edit" poId={po.id} initialData={formData} />
      )}
    </div>
  );
}
