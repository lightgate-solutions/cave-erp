import { notFound, redirect } from "next/navigation";
import { getSupplier } from "@/actions/finance/payables/suppliers";
import { SupplierForm } from "@/components/finance/payables/supplier-form";
import { requireFinanceWriteAccess } from "@/actions/auth/dal-finance";

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    await requireFinanceWriteAccess();
  } catch {
    redirect("/");
  }

  const supplierId = Number.parseInt(id);
  if (Number.isNaN(supplierId)) {
    notFound();
  }

  const supplier = await getSupplier(supplierId);

  if (!supplier) {
    notFound();
  }

  // Map DB fields which can be null to undefined/empty string to match form schema
  const initialData = {
    ...supplier,
    email: supplier.email || "",
    phone: supplier.phone || undefined,
    taxId: supplier.taxId || undefined,
    address: supplier.address || undefined,
    city: supplier.city || undefined,
    state: supplier.state || undefined,
    postalCode: supplier.postalCode || undefined,
    country: supplier.country || undefined,
    paymentTerms: supplier.paymentTerms || undefined,
    website: supplier.website || "",
    notes: supplier.notes || undefined,
  };

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Supplier</h1>
        <p className="text-muted-foreground">Update supplier details.</p>
      </div>

      <SupplierForm mode="edit" initialData={initialData} />
    </div>
  );
}
