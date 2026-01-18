import { notFound, redirect } from "next/navigation";
import { getBill } from "@/actions/finance/payables/bills";
import { BillForm } from "@/components/finance/payables/create-bill-form";
import { requireFinanceWriteAccess } from "@/actions/auth/dal-finance";

export default async function EditBillPage({
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

  const billId = Number.parseInt(id);
  if (Number.isNaN(billId)) {
    notFound();
  }

  const bill = await getBill(billId);

  if (!bill) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Bill</h1>
        <p className="text-muted-foreground">{bill.billNumber}</p>
      </div>

      <BillForm initialData={bill} />
    </div>
  );
}
