import { PurchaseOrderForm } from "@/components/payables/purchase-order-form";

export const metadata = {
  title: "New Purchase Order | Payables",
  description: "Create a new purchase order",
};

export default function NewPurchaseOrderPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          New Purchase Order
        </h2>
        <p className="text-muted-foreground">
          Create a new purchase order for vendor goods or services
        </p>
      </div>

      <PurchaseOrderForm mode="create" />
    </div>
  );
}
