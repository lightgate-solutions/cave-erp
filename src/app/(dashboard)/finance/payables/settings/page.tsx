import { redirect } from "next/navigation";
import { CurrencySettings } from "@/components/invoicing/currency-settings";
import { getAllOrganizationCurrencies } from "@/actions/invoicing/currencies";
import { requireFinanceWriteAccess } from "@/actions/auth/dal-finance";

export default async function PayablesSettingsPage() {
  try {
    await requireFinanceWriteAccess();
  } catch {
    redirect("/");
  }

  const currencies = await getAllOrganizationCurrencies();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payables Settings</h1>
        <p className="text-muted-foreground">
          Configure currencies and payables preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <CurrencySettings initialCurrencies={currencies} />
      </div>
    </div>
  );
}
