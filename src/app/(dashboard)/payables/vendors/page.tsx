import { Suspense } from "react";
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VendorsTable } from "@/components/payables/vendors-table";
import { VendorsFiltersForm } from "@/components/payables/vendors-filters-form";
import { getAllVendors } from "@/actions/payables/vendors";
import type { VendorStatus } from "@/types/payables";

function vendorListFiltersFromSearchParams(params: {
  search?: string;
  category?: string;
  status?: string;
}) {
  return {
    search: params.search,
    category:
      params.category && params.category !== "all"
        ? params.category
        : undefined,
    status:
      params.status && params.status !== "all"
        ? (params.status as VendorStatus)
        : undefined,
  };
}

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
    /** Cache-bust only; ignored for filtering */
    _refresh?: string;
  }>;
}

async function VendorsContent({
  searchParams,
}: {
  searchParams: {
    search?: string;
    category?: string;
    status?: string;
    _refresh?: string;
  };
}) {
  const filters = vendorListFiltersFromSearchParams(searchParams);
  const vendors = await getAllVendors(filters);

  return <VendorsTable vendors={vendors} />;
}

export default async function VendorsPage({ searchParams }: VendorsPageProps) {
  const params = await searchParams;

  const session = await auth.api.getSession({ headers: await headers() });
  const activeOrgId = session?.session?.activeOrganizationId ?? "";

  return (
    <div
      key={activeOrgId || "no-org"}
      className="flex-1 space-y-4 p-4 md:p-8 pt-6"
    >
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
          <VendorsFiltersForm
            initialSearch={params.search ?? ""}
            initialCategory={params.category ?? "all"}
            initialStatus={params.status ?? "all"}
          />
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
