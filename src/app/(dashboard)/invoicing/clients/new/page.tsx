import { ClientForm } from "@/components/invoicing/client-form";

export default function NewClientPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Client</h1>
        <p className="text-muted-foreground">
          Add a new client to your invoicing system
        </p>
      </div>

      <ClientForm mode="create" />
    </div>
  );
}
