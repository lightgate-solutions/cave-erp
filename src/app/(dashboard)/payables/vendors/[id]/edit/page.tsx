import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VendorForm } from "@/components/payables/vendor-form";
import { getVendor } from "@/actions/payables/vendors";
import { getVendorContacts } from "@/actions/payables/vendor-contacts";
import { getVendorBankAccounts } from "@/actions/payables/vendor-bank-accounts";

export default async function EditVendorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // Fetch vendor data from server
  const vendor = await getVendor(Number(id));

  if (!vendor) {
    return null;
  }

  const [contacts, bankAccounts] = await Promise.all([
    getVendorContacts(Number(id)),
    getVendorBankAccounts(Number(id)),
  ]);

  const vendorWithRelations = {
    ...vendor,
    phone: vendor.phone || undefined,
    companyName: vendor.companyName || undefined,
    taxId: vendor.taxId || undefined,
    cacNumber: vendor.cacNumber || undefined,
    customCategory: vendor.customCategory || undefined,
    billingAddress: vendor.billingAddress || undefined,
    billingCity: vendor.billingCity || undefined,
    billingState: vendor.billingState || undefined,
    billingPostalCode: vendor.billingPostalCode || undefined,
    billingCountry: vendor.billingCountry || undefined,
    website: vendor.website || undefined,
    notes: vendor.notes || undefined,
    defaultPaymentTerms: vendor.defaultPaymentTerms || undefined,
    defaultPaymentMethod: vendor.defaultPaymentMethod || undefined,
    contacts: contacts.map((c) => ({
      ...c,
      phone: c.phone || undefined,
      role: c.role || undefined,
    })),
    bankAccounts: bankAccounts.map((b) => ({
      ...b,
      routingNumber: b.routingNumber || undefined,
      swiftCode: b.swiftCode || undefined,
      iban: b.iban || undefined,
    })),
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/payables/vendors/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Edit Vendor</h2>
          <p className="text-muted-foreground">
            Update vendor information for {vendor.name}
          </p>
        </div>
      </div>

      {/* Form */}
      <VendorForm
        mode="edit"
        vendorId={vendor.id}
        initialData={vendorWithRelations}
      />
    </div>
  );
}
