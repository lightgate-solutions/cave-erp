import { Suspense } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PurchaseOrdersTable } from "@/components/payables/purchase-orders-table";
import { getAllPurchaseOrders } from "@/actions/payables/purchase-orders";
import type { POStatus } from "@/types/payables";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Purchase Orders | Payables",
  description: "Manage your purchase orders",
};

interface PurchaseOrdersPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    vendorId?: string;
  }>;
}

async function PurchaseOrdersContent({
  searchParams,
}: {
  searchParams: {
    search?: string;
    status?: string;
    vendorId?: string;
  };
}) {
  const purchaseOrders = await getAllPurchaseOrders({
    search: searchParams.search,
    status: searchParams.status as POStatus | undefined,
    vendorId: searchParams.vendorId ? Number(searchParams.vendorId) : undefined,
  });

  return <PurchaseOrdersTable purchaseOrders={purchaseOrders} />;
}

export default async function PurchaseOrdersPage({
  searchParams,
}: PurchaseOrdersPageProps) {
  const params = await searchParams;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Purchase Orders</h2>
          <p className="text-muted-foreground">
            Create and manage purchase orders
          </p>
        </div>
        <Button asChild>
          <Link href="/payables/purchase-orders/new">
            <Plus className="mr-2 h-4 w-4" />
            New Purchase Order
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter purchase orders by search and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search purchase orders..."
                  className="pl-8"
                  name="search"
                  defaultValue={params.search}
                />
              </div>
            </div>
            <Select name="status" defaultValue={params.status}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Pending Approval">
                  Pending Approval
                </SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Sent">Sent</SelectItem>
                <SelectItem value="Partially Received">
                  Partially Received
                </SelectItem>
                <SelectItem value="Received">Received</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">Apply Filters</Button>
          </form>
        </CardContent>
      </Card>

      {/* Purchase Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Purchase Orders</CardTitle>
          <CardDescription>
            A list of all purchase orders in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading purchase orders...</div>}>
            <PurchaseOrdersContent searchParams={params} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
