import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Plus, Mail, Phone, Globe, FileText } from "lucide-react";

import { getSupplier } from "@/actions/finance/payables/suppliers";
import { getAllBills } from "@/actions/finance/payables/bills";
import { requireFinanceViewAccess } from "@/actions/auth/dal-finance";

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    await requireFinanceViewAccess();
  } catch {
    redirect("/");
  }

  const supplierId = Number.parseInt(id);
  if (Number.isNaN(supplierId)) {
    notFound();
  }

  const [supplier, bills] = await Promise.all([
    getSupplier(supplierId),
    getAllBills({ supplierId }),
  ]);

  if (!supplier) {
    notFound();
    return null;
  }

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
      case "Void":
        return "bg-gray-100 text-gray-600";
      case "Open":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/payables/suppliers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{supplier.name}</h1>
            {!supplier.isActive && (
              <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800">
                Inactive
              </span>
            )}
          </div>
          {/* <p className="text-muted-foreground"></p> */}
        </div>
        <div className="flex gap-2">
          {/* Edit page not implemented yet, reusing this path if we make it later, 
              or we can link to a future edit page. 
              Actually, let's implement the edit page too. 
              Usually passing query params or separate route. 
              For now I'll just skip Edit button or link to edit page that reuses form.
          */}
          {/* If I implement edit page later: */}
          {/* <Link href={`/finance/payables/suppliers/${supplier.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link> */}
          <Link href={`/finance/payables/bills/new?supplierId=${supplier.id}`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Bill
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Bills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{supplier.stats.totalBills}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Recorded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {Number(supplier.stats.totalAmount).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {Number(supplier.stats.paidAmount).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {Number(supplier.stats.outstandingAmount).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{supplier.email || "N/A"}</p>
              </div>
            </div>

            {supplier.phone && (
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{supplier.phone}</p>
                </div>
              </div>
            )}

            {supplier.website && (
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Website</p>
                  <a
                    href={supplier.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    {supplier.website}
                  </a>
                </div>
              </div>
            )}

            {supplier.taxId && (
              <div>
                <p className="text-sm text-muted-foreground">Tax ID</p>
                <p className="font-medium">{supplier.taxId}</p>
              </div>
            )}
            {supplier.paymentTerms && (
              <div>
                <p className="text-sm text-muted-foreground">Payment Terms</p>
                <p className="font-medium">{supplier.paymentTerms}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle>Address</CardTitle>
          </CardHeader>
          <CardContent>
            {supplier.address || supplier.city || supplier.country ? (
              <div className="space-y-1">
                <p>{supplier.address}</p>
                <p>
                  {[supplier.city, supplier.state, supplier.postalCode]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                {supplier.country && <p>{supplier.country}</p>}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No address provided
              </p>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        {supplier.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{supplier.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bills */}
      <Card>
        <CardHeader>
          <CardTitle>Bills History</CardTitle>
          <CardDescription>
            {bills.length} bill{bills.length !== 1 ? "s" : ""} from this
            supplier
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bills.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="mb-4">No bills recorded yet</p>
              <Link
                href={`/finance/payables/bills/new?supplierId=${supplier.id}`}
              >
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Record first bill
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {bills.map((bill) => (
                <Link
                  key={bill.id}
                  href={`/finance/payables/bills/${bill.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div>
                      <p className="font-medium">{bill.billNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        Date: {new Date(bill.billDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">
                          {bill.currencySymbol}
                          {Number(bill.total).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Due: {new Date(bill.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                          bill.status,
                        )}`}
                      >
                        {bill.status}
                      </span>
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
