"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Pencil, Trash2, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { LocationFormDialog } from "./location-form-dialog";

interface Location {
  id: number;
  name: string;
  address: string | null;
  type: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  assetCount: number;
}

export default function LocationsList() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["asset-locations"],
    queryFn: async () => {
      const response = await fetch("/api/assets/locations");
      if (!response.ok) {
        throw new Error("Failed to fetch locations");
      }
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/assets/locations/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete location");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-locations"] });
      toast.success("Location deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this location?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingLocation(null);
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Loading locations...</p>
      </div>
    );
  }

  const locations: Location[] = data?.locations || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/assets/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Asset Locations</h1>
            <p className="text-muted-foreground">
              Manage physical locations where assets are stored
            </p>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Locations</CardTitle>
          <CardDescription>
            Track where your assets are located across your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {locations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No locations found. Create your first location to track asset
              placement.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Assets</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{location.name}</p>
                        {location.description && (
                          <p className="text-sm text-muted-foreground">
                            {location.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {location.type ? (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                          {location.type}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {location.address || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{location.assetCount}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          location.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {location.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEdit(location)}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(location.id)}
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
          )}
        </CardContent>
      </Card>

      <LocationFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        location={editingLocation}
      />
    </div>
  );
}
