import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Card, CardContent } from "../ui/card";
import { AccountLinking } from "./accounts-linking";

export default async function LinkedAccountsTab() {
  const accounts = await auth.api.listUserAccounts({
    headers: await headers(),
  });
  const nonCredentialAccounts = accounts.filter(
    (a) => a.providerId !== "credential",
  );

  return (
    <Card>
      <CardContent>
        <AccountLinking currentAccounts={nonCredentialAccounts} />
      </CardContent>
    </Card>
  );
}
