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
import { Car } from "lucide-react";
import { useState } from "react";
import { AssignmentFormDialog } from "../assignments/assignment-form-dialog";

interface DriverAssignmentsTabProps {
  driverId: string;
}

export function DriverAssignmentsTab({ driverId }: DriverAssignmentsTabProps) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["driver-assignments", driverId],
    queryFn: async () => {
      const response = await fetch(
        `/api/fleet/assignments?driverId=${driverId}&limit=100`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch assignments");
      }
      return response.json();
    },
  });
  const [isFormOpen, setIsFormOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="text-center text-muted-foreground">
        Loading assignment history...
      </div>
    );
  }

  const assignments = data?.assignments || [];

  if (assignments.length === 0) {
    return (
      <>
        <div className="text-center text-muted-foreground py-8">
          <p>No vehicle assignments for this driver yet.</p>
          <Button
            className="mt-4"
            size="sm"
            onClick={() => setIsFormOpen(true)}
          >
            <Car className="h-4 w-4 mr-2" />
            Assign Vehicle
          </Button>
        </div>
        <AssignmentFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          driverId={Number(driverId)}
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
            <Car className="h-4 w-4 mr-2" />
            Assign Vehicle
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vehicle</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assignments.map(
              (assignment: {
                id: number;
                startDate: string;
                endDate: string | null;
                notes: string | null;
                vehicle: {
                  year: number;
                  make: string;
                  model: string;
                  licensePlate: string;
                };
              }) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {assignment.vehicle.year} {assignment.vehicle.make}{" "}
                        {assignment.vehicle.model}
                      </p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {assignment.vehicle.licensePlate}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(assignment.startDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {assignment.endDate
                      ? new Date(assignment.endDate).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {assignment.endDate ? (
                      <Badge variant="outline">Ended</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{assignment.notes || "N/A"}</p>
                  </TableCell>
                </TableRow>
              ),
            )}
          </TableBody>
        </Table>
      </div>
      <AssignmentFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        driverId={Number(driverId)}
        onSuccess={() => {
          setIsFormOpen(false);
          refetch();
        }}
      />
    </>
  );
}
