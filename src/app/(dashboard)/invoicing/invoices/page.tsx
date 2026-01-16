import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, FileText } from "lucide-react";

import {
  getAllInvoices,
  type InvoiceStatus,
} from "@/actions/invoicing/invoices";
import { requireInvoicingViewAccess } from "@/actions/auth/dal-invoicing";
import { InvoiceFilters } from "@/components/invoicing/invoice-filters";
import { ExportButton } from "@/components/invoicing/export-button";

interface InvoicesPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

export default async function InvoicesPage({
  searchParams,
}: InvoicesPageProps) {
  const access = await requireInvoicingViewAccess();
  if (!access) return null;

  const params = await searchParams;
  const invoices = await getAllInvoices({
    search: params.search,
    status: params.status as InvoiceStatus,
    startDate: params.startDate,
    endDate: params.endDate,
  });

  function getStatusColor(status: string) {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Overdue":
        return "bg-red-100 text-red-800";
      case "Draft":
        return "bg-gray-100 text-gray-800";
      case "Partially Paid":
        return "bg-yellow-100 text-yellow-800";
      case "Cancelled":
        return "bg-gray-100 text-gray-600";
      case "Sent":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">Manage all your invoices</p>
        </div>
        <div className="flex gap-2">
          <ExportButton invoices={invoices} />
          <Link href="/invoicing/invoices/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Invoice
            </Button>
          </Link>
        </div>
      </div>

      <InvoiceFilters />

      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>
            {invoices.length} invoice{invoices.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="mb-4">No invoices found</p>
              {!params.search && !params.status && (
                <Link href="/invoicing/invoices/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create your first invoice
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/invoicing/invoices/${invoice.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {invoice.clientName}
                          {invoice.clientCompanyName &&
                            ` (${invoice.clientCompanyName})`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-medium">
                          {invoice.currencySymbol}
                          {Number(invoice.total).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Due: {new Date(invoice.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                            invoice.status,
                          )}`}
                        >
                          {invoice.status}
                        </span>
                        {invoice.status === "Partially Paid" && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Paid: {invoice.currencySymbol}
                            {Number(invoice.amountPaid).toFixed(2)}
                          </p>
                        )}
                      </div>
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
