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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { MaintenanceFormDialog } from "../maintenance/maintenance-form-dialog";

interface VehicleMaintenanceTabProps {
  vehicleId: string;
}

export function VehicleMaintenanceTab({
  vehicleId,
}: VehicleMaintenanceTabProps) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["vehicle-maintenance", vehicleId],
    queryFn: async () => {
      const response = await fetch(
        `/api/fleet/maintenance?vehicleId=${vehicleId}&limit=100`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch maintenance records");
      }
      return response.json();
    },
  });
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="text-center text-muted-foreground">
        Loading maintenance records...
      </div>
    );
  }

  const maintenanceRecords = data?.maintenance || [];

  if (maintenanceRecords.length === 0) {
    return (
      <>
        <div className="text-center text-muted-foreground py-8">
          <p>No maintenance records for this vehicle yet.</p>
          <Button
            className="mt-4"
            size="sm"
            onClick={() => setIsFormOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Maintenance Record
          </Button>
        </div>
        <MaintenanceFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          vehicleId={Number(vehicleId)}
          onSuccess={() => {
            setIsFormOpen(false);
            refetch();
          }}
        />
      </>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Maintenance Record
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
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
              }) => (
                <TableRow key={record.id}>
                  <TableCell>
                    {new Date(record.maintenanceDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{record.maintenanceType}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="text-sm">{record.description}</p>
                      {record.nextServiceDue && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Next service: {record.nextServiceDue}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    ₦{Number(record.cost).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {record.mileageAtService
                      ? `${Number(record.mileageAtService).toLocaleString()} km`
                      : "N/A"}
                  </TableCell>
                  <TableCell>{record.performedBy || "N/A"}</TableCell>
                </TableRow>
              ),
            )}
          </TableBody>
        </Table>
      </div>
      <MaintenanceFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        vehicleId={Number(vehicleId)}
        onSuccess={() => {
          setIsFormOpen(false);
          refetch();
        }}
      />
    </>
  );
}
