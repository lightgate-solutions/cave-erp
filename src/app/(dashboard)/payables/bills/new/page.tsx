import { BillForm } from "@/components/payables/bill-form";

export const metadata = {
  title: "New Bill | Payables",
  description: "Create a new bill",
};

export default async function NewBillPage({
  searchParams,
}: {
  searchParams: Promise<{ poId?: string }>;
}) {
  const params = await searchParams;
  const poId = params.poId ? Number(params.poId) : undefined;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">New Bill</h2>
        <p className="text-muted-foreground">
          Record a new vendor bill or invoice
        </p>
      </div>

      <BillForm mode="create" initialPoId={poId} />
    </div>
  );
}
