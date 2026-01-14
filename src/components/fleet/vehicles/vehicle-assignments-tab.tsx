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
import { UserPlus } from "lucide-react";
import { useState } from "react";
import { AssignmentFormDialog } from "../assignments/assignment-form-dialog";

interface VehicleAssignmentsTabProps {
  vehicleId: string;
}

export function VehicleAssignmentsTab({
  vehicleId,
}: VehicleAssignmentsTabProps) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["vehicle-assignments", vehicleId],
    queryFn: async () => {
      const response = await fetch(
        `/api/fleet/assignments?vehicleId=${vehicleId}&limit=100`,
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
          <p>No driver assignments for this vehicle yet.</p>
          <Button
            className="mt-4"
            size="sm"
            onClick={() => setIsFormOpen(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Assign Driver
          </Button>
        </div>
        <AssignmentFormDialog
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
            <UserPlus className="h-4 w-4 mr-2" />
            Assign Driver
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Driver</TableHead>
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
                driver: { name: string; licenseNumber: string };
              }) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{assignment.driver.name}</p>
                      <p className="text-sm text-muted-foreground">
                        License: {assignment.driver.licenseNumber}
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
        vehicleId={Number(vehicleId)}
        onSuccess={() => {
          setIsFormOpen(false);
          refetch();
        }}
      />
    </>
  );
}
