import { InvoiceForm } from "@/components/invoicing/invoice-form";

export default function NewInvoicePage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Invoice</h1>
        <p className="text-muted-foreground">
          Generate a new invoice for your client
        </p>
      </div>

      <InvoiceForm mode="create" />
    </div>
  );
}
