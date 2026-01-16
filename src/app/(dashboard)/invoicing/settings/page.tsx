import { redirect } from "next/navigation";
import { CurrencySettings } from "@/components/invoicing/currency-settings";
import { BankAccountsSettings } from "@/components/invoicing/bank-accounts-settings";
import { getAllOrganizationCurrencies } from "@/actions/invoicing/currencies";
import { getBankAccounts } from "@/actions/invoicing/bank-accounts";
import { requireInvoicingWriteAccess } from "@/actions/auth/dal-invoicing";

export default async function InvoicingSettingsPage() {
  try {
    await requireInvoicingWriteAccess();
  } catch {
    redirect("/");
  }

  const currencies = await getAllOrganizationCurrencies();
  const bankAccounts = await getBankAccounts();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Invoicing Settings</h1>
        <p className="text-muted-foreground">
          Configure currencies, bank accounts, and invoicing preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <CurrencySettings initialCurrencies={currencies} />
        <BankAccountsSettings initialAccounts={bankAccounts} />
      </div>
    </div>
  );
}
