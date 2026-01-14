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
import { VehicleFormDialog } from "./vehicle-form-dialog";
import { toast } from "sonner";

interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  status: "Active" | "Inactive" | "Maintenance";
  currentMileage: string;
  fuelType: string;
  currentDriver?: {
    driverId: number;
    driverName: string;
  } | null;
}

export default function VehiclesList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["vehicles", page, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { q: search }),
        ...(statusFilter !== "all" && { status: statusFilter }),
      });

      const response = await fetch(`/api/fleet/vehicles?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch vehicles");
      }
      return response.json();
    },
  });

  const handleDelete = async () => {
    if (!selectedVehicle) return;

    try {
      const response = await fetch(
        `/api/fleet/vehicles/${selectedVehicle.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete vehicle");
      }

      toast.success("Vehicle deleted successfully");

      setIsDeleteDialogOpen(false);
      setSelectedVehicle(null);
      refetch();
    } catch (_error) {
      toast.error("Failed to delete vehicle");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Loading vehicles...</p>
      </div>
    );
  }

  const vehicles = data?.vehicles || [];
  const totalPages = data?.totalPages || 1;

  return (
    <section className="space-y-4">
      <Card className="p-4 bg-muted shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Fleet Vehicles</CardTitle>
              <CardDescription>
                Manage your organization's vehicle fleet
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setSelectedVehicle(null);
                setIsFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by make, model, license plate, or VIN..."
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
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {vehicles.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No vehicles found.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>License Plate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mileage (km)</TableHead>
                    <TableHead>Current Driver</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((vehicle: Vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {vehicle.fuelType}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                          {vehicle.licensePlate}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(vehicle.status)}>
                          {vehicle.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {Number(vehicle.currentMileage).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {vehicle.currentDriver ? (
                          <span className="text-sm">
                            {vehicle.currentDriver.driverName}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Unassigned
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Link href={`/fleet/vehicles/${vehicle.id}`}>
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
                            setSelectedVehicle(vehicle);
                            setIsFormOpen(true);
                          }}
                          title="Edit Vehicle"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedVehicle(vehicle);
                            setIsDeleteDialogOpen(true);
                          }}
                          title="Delete Vehicle"
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

      <VehicleFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedVehicle(null);
          }
          setIsFormOpen(open);
        }}
        vehicle={selectedVehicle}
        onSuccess={() => {
          setIsFormOpen(false);
          setSelectedVehicle(null);
          refetch();
        }}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Vehicle</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this vehicle? This action cannot
              be undone.
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
