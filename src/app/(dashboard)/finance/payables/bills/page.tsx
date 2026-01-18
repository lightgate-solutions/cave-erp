import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, FileText, Pencil } from "lucide-react";

import { getAllBills, type BillStatus } from "@/actions/finance/payables/bills";
import { redirect } from "next/navigation";
import { requireFinanceViewAccess } from "@/actions/auth/dal-finance";

interface BillsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
  }>;
}

export default async function BillsPage({ searchParams }: BillsPageProps) {
  try {
    await requireFinanceViewAccess();
  } catch {
    redirect("/");
  }

  const params = await searchParams;
  const bills = await getAllBills({
    search: params.search,
    status: params.status as BillStatus,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bills</h1>
          <p className="text-muted-foreground">
            Manage your bills and payables
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/finance/payables/bills/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Bill
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Bills</CardTitle>
          <CardDescription>
            {bills.length} bill{bills.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bills.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="mb-4">No bills found</p>
              {!params.search && !params.status && (
                <Link href="/finance/payables/bills/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Record your first bill
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {bills.map((bill) => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <Link
                    href={`/finance/payables/bills/${bill.id}`}
                    className="flex flex-1 items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{bill.billNumber}</p>
                        <p className="text-sm text-muted-foreground">
                          {bill.supplierName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-medium">
                          {bill.currencySymbol}
                          {Number(bill.total).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Due: {new Date(bill.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right min-w-[100px]">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(
                            bill.status,
                          )}`}
                        >
                          {bill.status}
                        </span>
                        {bill.status === "Partially Paid" && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Paid: {bill.currencySymbol}
                            {Number(bill.amountPaid).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center border-l pl-4 ml-4">
                    <Link href={`/finance/payables/bills/${bill.id}/edit`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        title="Edit Bill"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
