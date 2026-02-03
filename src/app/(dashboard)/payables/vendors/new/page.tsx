import { VendorForm } from "@/components/payables/vendor-form";

export const metadata = {
  title: "New Vendor | Payables",
  description: "Create a new vendor",
};

export default function NewVendorPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">New Vendor</h2>
        <p className="text-muted-foreground">
          Create a new vendor with contacts and bank accounts
        </p>
      </div>

      <VendorForm mode="create" />
    </div>
  );
}
