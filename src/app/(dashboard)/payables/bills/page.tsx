import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

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
import { BillsTable } from "@/components/payables/bills-table";
import { getAllBills } from "@/actions/payables/bills";
import type { BillStatus } from "@/types/payables";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Bills | Payables",
  description: "Manage your bills and invoices",
};

interface BillsPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    vendorId?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

function billsListFiltersFromSearchParams(params: {
  search?: string;
  status?: string;
  vendorId?: string;
  startDate?: string;
  endDate?: string;
}) {
  return {
    search: params.search,
    status:
      params.status && params.status !== "all"
        ? (params.status as BillStatus)
        : undefined,
    vendorId: params.vendorId ? Number(params.vendorId) : undefined,
    startDate: params.startDate,
    endDate: params.endDate,
  };
}

export default async function BillsPage({ searchParams }: BillsPageProps) {
  const params = await searchParams;
  const filters = billsListFiltersFromSearchParams(params);

  const session = await auth.api.getSession({ headers: await headers() });
  const activeOrgId = session?.session?.activeOrganizationId ?? "";

  const rawBills = await getAllBills(filters);
  const bills = rawBills.map((b) => ({
    ...b,
    vendorName: b.vendorName ?? "",
  }));

  return (
    <div
      key={activeOrgId || "no-org"}
      className="flex-1 space-y-4 p-4 md:p-8 pt-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Bills</h2>
          <p className="text-muted-foreground">
            Manage vendor bills and invoices
          </p>
        </div>
        <Button asChild>
          <Link href="/payables/bills/new">
            <Plus className="mr-2 h-4 w-4" />
            New Bill
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter bills by search, status, and date
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            method="get"
            className="flex flex-col md:flex-row gap-4"
            action="/payables/bills"
          >
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search bills..."
                  className="pl-8"
                  name="search"
                  defaultValue={params.search}
                />
              </div>
            </div>
            <Select name="status" defaultValue={params.status ?? "all"}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                <SelectItem value="Overdue">Overdue</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">Apply Filters</Button>
          </form>
        </CardContent>
      </Card>

      {/* Bills Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Bills</CardTitle>
          <CardDescription>
            A list of all bills in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BillsTable bills={bills} />
        </CardContent>
      </Card>
    </div>
  );
}
