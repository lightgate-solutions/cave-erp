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
import { Plus } from "lucide-react";
import { useState } from "react";

import { MaintenanceFormDialog } from "./maintenance-form-dialog";

export default function MaintenanceList() {
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["maintenance", page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      const response = await fetch(`/api/fleet/maintenance?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch maintenance records");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Loading maintenance records...</p>
      </div>
    );
  }

  const maintenanceRecords = data?.maintenance || [];
  const totalPages = data?.totalPages || 1;

  return (
    <>
      <section className="space-y-4">
        <Card className="p-4 bg-muted shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Maintenance Records</CardTitle>
                <CardDescription>
                  Track all vehicle maintenance and service history
                </CardDescription>
              </div>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Maintenance Record
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {maintenanceRecords.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                No maintenance records found.
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Mileage</TableHead>
                      <TableHead>Performed By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenanceRecords.map(
                      (record: {
                        id: number;
                        maintenanceDate: string;
                        maintenanceType: string;
                        description: string;
                        cost: string;
                        mileageAtService: string | null;
                        performedBy: string | null;
                        nextServiceDue: string | null;
                        vehicle: {
                          year: number;
                          make: string;
                          model: string;
                          licensePlate: string;
                        };
                      }) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            {new Date(
                              record.maintenanceDate,
                            ).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {record.vehicle.year} {record.vehicle.make}{" "}
                                {record.vehicle.model}
                              </p>
                              <p className="text-sm text-muted-foreground font-mono">
                                {record.vehicle.licensePlate}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {record.maintenanceType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <p className="text-sm">{record.description}</p>
                              {record.nextServiceDue && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Next: {record.nextServiceDue}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            ₦{Number(record.cost).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {record.mileageAtService
                              ? `${Number(
                                  record.mileageAtService,
                                ).toLocaleString()} km`
                              : "N/A"}
                          </TableCell>
                          <TableCell>{record.performedBy || "N/A"}</TableCell>
                        </TableRow>
                      ),
                    )}
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
      </section>
      <MaintenanceFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={() => {
          setIsFormOpen(false);
          refetch();
        }}
      />
    </>
  );
}
