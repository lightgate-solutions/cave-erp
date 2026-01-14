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
import { IncidentFormDialog } from "../incidents/incident-form-dialog";

interface VehicleIncidentsTabProps {
  vehicleId: string;
}

export function VehicleIncidentsTab({ vehicleId }: VehicleIncidentsTabProps) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["vehicle-incidents", vehicleId],
    queryFn: async () => {
      const response = await fetch(
        `/api/fleet/incidents?vehicleId=${vehicleId}&limit=100`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch incidents");
      }
      return response.json();
    },
  });
  const [isFormOpen, setIsFormOpen] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Minor":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Major":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "Critical":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resolved":
      case "Closed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Under Investigation":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Reported":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "";
    }
  };

  if (isLoading) {
    return (
      <div className="text-center text-muted-foreground">
        Loading incidents...
      </div>
    );
  }

  const incidents = data?.incidents || [];

  if (incidents.length === 0) {
    return (
      <>
        <div className="text-center text-muted-foreground py-8">
          <p>No incidents recorded for this vehicle.</p>
          <Button
            className="mt-4"
            size="sm"
            onClick={() => setIsFormOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Report Incident
          </Button>
        </div>
        <IncidentFormDialog
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
            Report Incident
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Estimated Cost</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {incidents.map(
              (incident: {
                id: number;
                incidentDate: string;
                incidentType: string;
                severity: string;
                description: string;
                location: string | null;
                estimatedCost: string | null;
                resolutionStatus: string;
                driver: { name: string } | null;
              }) => (
                <TableRow key={incident.id}>
                  <TableCell>
                    {new Date(incident.incidentDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{incident.incidentType}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getSeverityColor(incident.severity)}>
                      {incident.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="text-sm">{incident.description}</p>
                      {incident.location && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Location: {incident.location}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {incident.driver ? incident.driver.name : "N/A"}
                  </TableCell>
                  <TableCell>
                    {incident.estimatedCost
                      ? `₦${Number(incident.estimatedCost).toLocaleString()}`
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={getStatusColor(incident.resolutionStatus)}
                    >
                      {incident.resolutionStatus}
                    </Badge>
                  </TableCell>
                </TableRow>
              ),
            )}
          </TableBody>
        </Table>
      </div>
      <IncidentFormDialog
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
