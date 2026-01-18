import { redirect } from "next/navigation";
import { BillForm } from "@/components/finance/payables/create-bill-form";
import { requireFinanceWriteAccess } from "@/actions/auth/dal-finance";

export default async function NewBillPage({
  searchParams,
}: {
  searchParams: Promise<{ supplierId?: string }>;
}) {
  try {
    await requireFinanceWriteAccess();
  } catch {
    redirect("/");
  }

  // We optionally could pre-select supplier using searchParams,
  // but the form needs logic to handle initial Supplier ID without full BillData.
  // For now, let's keep it simple. If we want to support ?supplierId=X,
  // we should update BillForm to accept partial defaults or just `defaultSupplierId`.
  // I didn't add that to BillForm props, but I can add it if I want to polish.
  // I'll stick to basic new page.

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Record New Bill</h1>
        <p className="text-muted-foreground">
          Enter details for a new bill received from a supplier.
        </p>
      </div>

      <BillForm />
    </div>
  );
}
