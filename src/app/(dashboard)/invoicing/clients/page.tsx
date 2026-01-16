import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Mail, Building2 } from "lucide-react";

import { getAllClients } from "@/actions/invoicing/clients";
import { redirect } from "next/navigation";
import { requireInvoicingViewAccess } from "@/actions/auth/dal-invoicing";

export default async function ClientsPage() {
  try {
    await requireInvoicingViewAccess();
  } catch {
    redirect("/");
  }

  const clients = await getAllClients();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Manage your client database</p>
        </div>
        <Link href="/invoicing/clients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Client
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
          <CardDescription>
            {clients.length} client{clients.length !== 1 ? "s" : ""} in your
            database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="mb-4">No clients yet</p>
              <Link href="/invoicing/clients/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first client
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {clients.map((client) => (
                <Link
                  key={client.id}
                  href={`/invoicing/clients/${client.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{client.name}</p>
                          {!client.isActive && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {client.companyName && (
                            <span>{client.companyName}</span>
                          )}
                          {client.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {client.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {client.invoiceCount} invoices
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Outstanding:{" "}
                        {Number(client.totalOutstanding).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
