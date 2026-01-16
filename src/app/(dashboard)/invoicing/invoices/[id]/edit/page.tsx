import { notFound, redirect } from "next/navigation";
import { InvoiceForm } from "@/components/invoicing/invoice-form";
import { getInvoice } from "@/actions/invoicing/invoices";
import { requireInvoicingWriteAccess } from "@/actions/auth/dal-invoicing";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    await requireInvoicingWriteAccess();
  } catch {
    redirect("/");
  }

  const invoiceId = Number.parseInt(id);
  if (Number.isNaN(invoiceId)) {
    notFound();
  }

  const invoice = await getInvoice(invoiceId);

  if (!invoice) {
    notFound();
    return null;
  }

  // Only allow editing draft invoices
  if (invoice.status !== "Draft") {
    redirect(`/invoicing/invoices/${invoiceId}`);
  }

  // Transform data for form
  const initialData = {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    clientId: invoice.clientId,
    currencyId: invoice.currencyId,
    invoiceDate: new Date(invoice.invoiceDate),
    dueDate: new Date(invoice.dueDate),
    lineItems: invoice.lineItems.map((item) => ({
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      amount: Number(item.amount),
    })),
    taxes:
      invoice.taxes?.map((t) => ({
        taxName: t.taxName,
        taxPercentage: Number(t.taxPercentage),
      })) || [],
    notes: invoice.notes || "",
    termsAndConditions: invoice.termsAndConditions || "",
    footerNote: invoice.footerNote || "",
    template: invoice.template as
      | "Modern"
      | "Classic"
      | "Minimal"
      | "Detailed"
      | "Professional",
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Invoice</h1>
        <p className="text-muted-foreground">
          Update invoice {invoice.invoiceNumber}
        </p>
      </div>

      <InvoiceForm mode="edit" initialData={initialData} />
    </div>
  );
}
