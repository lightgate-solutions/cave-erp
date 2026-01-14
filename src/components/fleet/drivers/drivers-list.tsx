"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Edit, Eye, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { DriverFormDialog } from "./driver-form-dialog";
import { toast } from "sonner";

interface Driver {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  licenseNumber: string;
  licenseExpiryDate?: Date | string | null;
  status: "Active" | "Inactive" | "Suspended";
}

export default function DriversList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["drivers", page, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { q: search }),
        ...(statusFilter !== "all" && { status: statusFilter }),
      });

      const response = await fetch(`/api/fleet/drivers?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch drivers");
      }
      return response.json();
    },
  });

  const handleDelete = async () => {
    if (!selectedDriver) return;

    try {
      const response = await fetch(`/api/fleet/drivers/${selectedDriver.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete driver");
      }

      toast.success("Driver deleted successfully");

      setIsDeleteDialogOpen(false);
      setSelectedDriver(null);
      refetch();
    } catch (_error) {
      toast.error("Failed to delete driver");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Suspended":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "Inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Loading drivers...</p>
      </div>
    );
  }

  const drivers = data?.drivers || [];
  const totalPages = data?.totalPages || 1;

  return (
    <section className="space-y-4">
      <Card className="p-4 bg-muted shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Fleet Drivers</CardTitle>
              <CardDescription>
                Manage drivers assigned to your fleet
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setSelectedDriver(null);
                setIsFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Driver
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or license number..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {drivers.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No drivers found.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>License Number</TableHead>
                    <TableHead>License Expiry</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map((driver: Driver) => (
                    <TableRow key={driver.id}>
                      <TableCell>
                        <p className="font-medium">{driver.name}</p>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          {driver.licenseNumber}
                        </code>
                      </TableCell>
                      <TableCell>
                        {driver.licenseExpiryDate
                          ? new Date(
                              driver.licenseExpiryDate,
                            ).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {driver.email && <div>{driver.email}</div>}
                          {driver.phone && <div>{driver.phone}</div>}
                          {!driver.email && !driver.phone && "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(driver.status)}>
                          {driver.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Link href={`/fleet/drivers/${driver.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedDriver(driver);
                            setIsFormOpen(true);
                          }}
                          title="Edit Driver"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedDriver(driver);
                            setIsDeleteDialogOpen(true);
                          }}
                          title="Delete Driver"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <DriverFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDriver(null);
          }
          setIsFormOpen(open);
        }}
        driver={selectedDriver}
        onSuccess={() => {
          setIsFormOpen(false);
          setSelectedDriver(null);
          refetch();
        }}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Driver</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this driver? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
