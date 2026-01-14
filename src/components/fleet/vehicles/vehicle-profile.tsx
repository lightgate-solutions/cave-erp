"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { VehicleDetailsTab } from "./vehicle-details-tab";
import { VehicleExpensesTab } from "./vehicle-expenses-tab";
import { VehicleMaintenanceTab } from "./vehicle-maintenance-tab";
import { VehicleIncidentsTab } from "./vehicle-incidents-tab";
import { VehicleAssignmentsTab } from "./vehicle-assignments-tab";
import { VehicleFormDialog } from "./vehicle-form-dialog";

interface VehicleProfileProps {
  vehicleId: string;
}

export default function VehicleProfile({ vehicleId }: VehicleProfileProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  const {
    data: vehicle,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["vehicle", vehicleId],
    queryFn: async () => {
      const response = await fetch(`/api/fleet/vehicles/${vehicleId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch vehicle");
      }
      const data = await response.json();
      return data.vehicle;
    },
  });

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
        <p className="text-muted-foreground">Loading vehicle details...</p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Vehicle not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/fleet/vehicles">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
              <Badge className={getStatusColor(vehicle.status)}>
                {vehicle.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              License Plate:{" "}
              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                {vehicle.licensePlate}
              </code>
            </p>
          </div>
        </div>
        <Button onClick={() => setIsEditOpen(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Vehicle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Information</CardTitle>
          <CardDescription>
            Complete details and history for this vehicle
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="bg-background justify-start w-full rounded-none border-b p-0">
              <TabsTrigger
                value="details"
                className="border-b-border dark:data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5"
              >
                Details
              </TabsTrigger>
              <TabsTrigger
                value="expenses"
                className="border-b-border dark:data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5"
              >
                Expenses
              </TabsTrigger>
              <TabsTrigger
                value="maintenance"
                className="border-b-border dark:data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5"
              >
                Maintenance
              </TabsTrigger>
              <TabsTrigger
                value="incidents"
                className="border-b-border dark:data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5"
              >
                Incidents
              </TabsTrigger>
              <TabsTrigger
                value="assignments"
                className="border-b-border dark:data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5"
              >
                Assignments
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-6">
              <VehicleDetailsTab vehicle={vehicle} />
            </TabsContent>

            <TabsContent value="expenses" className="mt-6">
              <VehicleExpensesTab vehicleId={vehicleId} />
            </TabsContent>

            <TabsContent value="maintenance" className="mt-6">
              <VehicleMaintenanceTab vehicleId={vehicleId} />
            </TabsContent>

            <TabsContent value="incidents" className="mt-6">
              <VehicleIncidentsTab vehicleId={vehicleId} />
            </TabsContent>

            <TabsContent value="assignments" className="mt-6">
              <VehicleAssignmentsTab vehicleId={vehicleId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <VehicleFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        vehicle={vehicle}
        onSuccess={() => {
          setIsEditOpen(false);
          refetch();
        }}
      />
    </div>
  );
}
