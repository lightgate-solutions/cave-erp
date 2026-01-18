import { SupplierForm } from "@/components/finance/payables/supplier-form";

export default function NewSupplierPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Supplier</h1>
        <p className="text-muted-foreground">
          Add a new supplier to your payables system
        </p>
      </div>

      <SupplierForm mode="create" />
    </div>
  );
}
