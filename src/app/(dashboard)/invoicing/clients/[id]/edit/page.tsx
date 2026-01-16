import { notFound, redirect } from "next/navigation";
import { ClientForm } from "@/components/invoicing/client-form";
import { getClient } from "@/actions/invoicing/clients";
import { requireInvoicingWriteAccess } from "@/actions/auth/dal-invoicing";

export default async function EditClientPage({
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

  const clientId = Number.parseInt(id);
  if (Number.isNaN(clientId)) {
    notFound();
  }

  const client = await getClient(clientId);

  if (!client) {
    notFound();
    return null;
  }

  // Transform data for form
  const initialData = {
    id: client.id,
    clientCode: client.clientCode,
    name: client.name,
    email: client.email,
    phone: client.phone || "",
    companyName: client.companyName || "",
    taxId: client.taxId || "",
    billingAddress: client.billingAddress || "",
    billingCity: client.billingCity || "",
    billingState: client.billingState || "",
    billingPostalCode: client.billingPostalCode || "",
    billingCountry: client.billingCountry || "",
    shippingAddress: client.shippingAddress || "",
    shippingCity: client.shippingCity || "",
    shippingState: client.shippingState || "",
    shippingPostalCode: client.shippingPostalCode || "",
    shippingCountry: client.shippingCountry || "",
    website: client.website || "",
    notes: client.notes || "",
    isActive: client.isActive,
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Client</h1>
        <p className="text-muted-foreground">
          Update {client.name}'s information
        </p>
      </div>

      <ClientForm mode="edit" initialData={initialData} />
    </div>
  );
}
