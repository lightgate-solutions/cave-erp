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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useState } from "react";
import { IncidentFormDialog } from "./incident-form-dialog";

export default function IncidentsList() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["incidents", page, statusFilter, severityFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(statusFilter !== "all" && { resolutionStatus: statusFilter }),
        ...(severityFilter !== "all" && { severity: severityFilter }),
      });

      const response = await fetch(`/api/fleet/incidents?${params}`);
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
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Loading incidents...</p>
      </div>
    );
  }

  const incidents = data?.incidents || [];
  const totalPages = data?.totalPages || 1;

  return (
    <>
      <section className="space-y-4">
        <Card className="p-4 bg-muted shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Fleet Incidents</CardTitle>
                <CardDescription>
                  Track and manage all fleet incident reports
                </CardDescription>
              </div>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Report Incident
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Reported">Reported</SelectItem>
                  <SelectItem value="Under Investigation">
                    Under Investigation
                  </SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={severityFilter}
                onValueChange={(value) => {
                  setSeverityFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="Minor">Minor</SelectItem>
                  <SelectItem value="Major">Major</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {incidents.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                No incidents found.
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Cost</TableHead>
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
                        vehicle: {
                          year: number;
                          make: string;
                          model: string;
                          licensePlate: string;
                        };
                        driver: { name: string } | null;
                      }) => (
                        <TableRow key={incident.id}>
                          <TableCell>
                            {new Date(
                              incident.incidentDate,
                            ).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {incident.vehicle.year} {incident.vehicle.make}{" "}
                                {incident.vehicle.model}
                              </p>
                              <p className="text-sm text-muted-foreground font-mono">
                                {incident.vehicle.licensePlate}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {incident.driver ? incident.driver.name : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {incident.incidentType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={getSeverityColor(incident.severity)}
                            >
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
                            {incident.estimatedCost
                              ? `₦${Number(
                                  incident.estimatedCost,
                                ).toLocaleString()}`
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={getStatusColor(
                                incident.resolutionStatus,
                              )}
                            >
                              {incident.resolutionStatus}
                            </Badge>
                          </TableCell>
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
      <IncidentFormDialog
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
