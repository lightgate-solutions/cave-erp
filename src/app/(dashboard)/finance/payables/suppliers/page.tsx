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

import { getAllSuppliers } from "@/actions/finance/payables/suppliers";
import { redirect } from "next/navigation";
import { requireFinanceViewAccess } from "@/actions/auth/dal-finance";

export default async function SuppliersPage() {
  try {
    await requireFinanceViewAccess();
  } catch {
    redirect("/");
  }

  const suppliers = await getAllSuppliers();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Suppliers</h1>
          <p className="text-muted-foreground">Manage your supplier database</p>
        </div>
        <Link href="/finance/payables/suppliers/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Supplier
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Suppliers</CardTitle>
          <CardDescription>
            {suppliers.length} supplier{suppliers.length !== 1 ? "s" : ""} in
            your database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {suppliers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="mb-4">No suppliers yet</p>
              <Link href="/finance/payables/suppliers/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add your first supplier
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {suppliers.map((supplier) => (
                <Link
                  key={supplier.id}
                  href={`/finance/payables/suppliers/${supplier.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{supplier.name}</p>
                          {!supplier.isActive && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {supplier.city && supplier.country && (
                            <span>
                              {supplier.city}, {supplier.country}
                            </span>
                          )}
                          {supplier.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {supplier.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{supplier.billCount} bills</p>
                      <p className="text-sm text-muted-foreground">
                        Outstanding:{" "}
                        {Number(supplier.totalOutstanding).toFixed(2)}
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
