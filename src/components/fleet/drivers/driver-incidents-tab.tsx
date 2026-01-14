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

interface DriverIncidentsTabProps {
  driverId: string;
}

export function DriverIncidentsTab({ driverId }: DriverIncidentsTabProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["driver-incidents", driverId],
    queryFn: async () => {
      const response = await fetch(
        `/api/fleet/incidents?driverId=${driverId}&limit=100`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch incidents");
      }
      return response.json();
    },
  });

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
      <div className="text-center text-muted-foreground py-8">
        No incidents involving this driver.
      </div>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Vehicle</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Description</TableHead>
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
              resolutionStatus: string;
              vehicle: {
                year: number;
                make: string;
                model: string;
                licensePlate: string;
              };
            }) => (
              <TableRow key={incident.id}>
                <TableCell>
                  {new Date(incident.incidentDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm font-medium">
                      {incident.vehicle.year} {incident.vehicle.make}{" "}
                      {incident.vehicle.model}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {incident.vehicle.licensePlate}
                    </p>
                  </div>
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
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(incident.resolutionStatus)}>
                    {incident.resolutionStatus}
                  </Badge>
                </TableCell>
              </TableRow>
            ),
          )}
        </TableBody>
      </Table>
    </div>
  );
}
