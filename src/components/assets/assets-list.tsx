"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { AssetFormDialog } from "./asset-form-dialog";
import { AssetStatusBadge } from "./asset-status-badge";

interface Asset {
  id: number;
  assetCode: string;
  name: string;
  description: string | null;
  status: string;
  currentValue: string | null;
  purchasePrice: string | null;
  serialNumber: string | null;
  model: string | null;
  manufacturer: string | null;
  warrantyEndDate: string | null;
  category: {
    id: number;
    name: string;
    codePrefix: string;
  } | null;
  location: {
    id: number;
    name: string;
  } | null;
  currentAssignment: {
    targetType: string;
    employeeName: string | null;
    department: string | null;
    projectId: number | null;
  } | null;
}

interface Category {
  id: number;
  name: string;
  codePrefix: string;
}

interface Location {
  id: number;
  name: string;
}

const assetStatuses = [
  "Active",
  "In Maintenance",
  "Retired",
  "Disposed",
  "Lost/Stolen",
];

export default function AssetsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  const queryClient = useQueryClient();
  const limit = 20;

  const { data: assetsData, isLoading } = useQuery({
    queryKey: [
      "assets",
      {
        page,
        search,
        status: statusFilter,
        categoryId: categoryFilter,
        locationId: locationFilter,
      },
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.set("q", search);
      if (statusFilter) params.set("status", statusFilter);
      if (categoryFilter) params.set("categoryId", categoryFilter);
      if (locationFilter) params.set("locationId", locationFilter);

      const response = await fetch(`/api/assets?${params}`);
      if (!response.ok) throw new Error("Failed to fetch assets");
      return response.json();
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["asset-categories"],
    queryFn: async () => {
      const response = await fetch("/api/assets/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  const { data: locationsData } = useQuery({
    queryKey: ["asset-locations"],
    queryFn: async () => {
      const response = await fetch("/api/assets/locations");
      if (!response.ok) throw new Error("Failed to fetch locations");
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/assets/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete asset");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["asset-stats"] });
      toast.success("Asset deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this asset?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingAsset(null);
  };

  const assets: Asset[] = assetsData?.assets || [];
  const total = assetsData?.total || 0;
  const totalPages = assetsData?.totalPages || 1;
  const categories: Category[] = categoriesData?.categories || [];
  const locations: Location[] = locationsData?.locations || [];

  const getAssignmentDisplay = (assignment: Asset["currentAssignment"]) => {
    if (!assignment)
      return <span className="text-muted-foreground">Unassigned</span>;

    if (assignment.targetType === "Employee" && assignment.employeeName) {
      return assignment.employeeName;
    }
    if (assignment.targetType === "Department" && assignment.department) {
      return `Dept: ${assignment.department}`;
    }
    if (assignment.targetType === "Project" && assignment.projectId) {
      return `Project #${assignment.projectId}`;
    }
    return <span className="text-muted-foreground">Unassigned</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/assets/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Assets</h1>
            <p className="text-muted-foreground">
              Manage your organization&apos;s assets
            </p>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Asset
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Assets</CardTitle>
          <CardDescription>{total} total assets</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, code, serial..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v === "all" ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {assetStatuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={categoryFilter}
              onValueChange={(v) => {
                setCategoryFilter(v === "all" ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={locationFilter}
              onValueChange={(v) => {
                setLocationFilter(v === "all" ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {locations.map((l) => (
                  <SelectItem key={l.id} value={l.id.toString()}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading assets...
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No assets found. Create your first asset to get started.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {asset.assetCode}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{asset.name}</p>
                          {asset.serialNumber && (
                            <p className="text-xs text-muted-foreground">
                              S/N: {asset.serialNumber}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{asset.category?.name || "-"}</TableCell>
                      <TableCell>{asset.location?.name || "-"}</TableCell>
                      <TableCell>
                        {getAssignmentDisplay(asset.currentAssignment)}
                      </TableCell>
                      <TableCell>
                        {asset.currentValue
                          ? `₦${Number(asset.currentValue).toLocaleString()}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <AssetStatusBadge status={asset.status} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/assets/${asset.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(asset)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(asset.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * limit + 1} to{" "}
                    {Math.min(page * limit, total)} of {total} assets
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AssetFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        asset={editingAsset}
        categories={categories}
        locations={locations}
      />
    </div>
  );
}
