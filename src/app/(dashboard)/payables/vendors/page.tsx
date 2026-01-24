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
import { VendorsTable } from "@/components/payables/vendors-table";
import { getAllVendors } from "@/actions/payables/vendors";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Vendors | Payables",
  description: "Manage your vendors",
};

interface VendorsPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    status?: string;
  }>;
}

async function VendorsContent({
  searchParams,
}: {
  searchParams: {
    search?: string;
    category?: string;
    status?: string;
  };
}) {
  const vendors = await getAllVendors({
    search: searchParams.search,
    category: searchParams.category,
    status: searchParams.status as any,
  });

  return <VendorsTable vendors={vendors as any} />;
}

export default async function VendorsPage({ searchParams }: VendorsPageProps) {
  const params = await searchParams;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Vendors</h2>
          <p className="text-muted-foreground">
            Manage your vendor information and relationships
          </p>
        </div>
        <Button asChild>
          <Link href="/payables/vendors/new">
            <Plus className="mr-2 h-4 w-4" />
            New Vendor
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter vendors by search, category, and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search vendors..."
                  className="pl-8"
                  name="search"
                  defaultValue={params.search}
                />
              </div>
            </div>
            <Select name="category" defaultValue={params.category}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Services">Services</SelectItem>
                <SelectItem value="Goods">Goods</SelectItem>
                <SelectItem value="Utilities">Utilities</SelectItem>
                <SelectItem value="Custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            <Select name="status" defaultValue={params.status}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
                <SelectItem value="Archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">Apply Filters</Button>
          </form>
        </CardContent>
      </Card>

      {/* Vendors Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Vendors</CardTitle>
          <CardDescription>
            A list of all vendors in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading vendors...</div>}>
            <VendorsContent searchParams={params} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
