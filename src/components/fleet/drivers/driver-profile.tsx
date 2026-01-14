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
import { DriverDetailsTab } from "./driver-details-tab";
import { DriverAssignmentsTab } from "./driver-assignments-tab";
import { DriverIncidentsTab } from "./driver-incidents-tab";
import { DriverFormDialog } from "./driver-form-dialog";

interface DriverProfileProps {
  driverId: string;
}

export default function DriverProfile({ driverId }: DriverProfileProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  const {
    data: driver,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["driver", driverId],
    queryFn: async () => {
      const response = await fetch(`/api/fleet/drivers/${driverId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch driver");
      }
      const data = await response.json();
      return data.driver;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Suspended":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "Inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Loading driver details...</p>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Driver not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/fleet/drivers">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{driver.name}</h1>
              <Badge className={getStatusColor(driver.status)}>
                {driver.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              License:{" "}
              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                {driver.licenseNumber}
              </code>
            </p>
          </div>
        </div>
        <Button onClick={() => setIsEditOpen(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Driver
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Driver Information</CardTitle>
          <CardDescription>
            Complete details and history for this driver
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
                value="assignments"
                className="border-b-border dark:data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5"
              >
                Assignments
              </TabsTrigger>
              <TabsTrigger
                value="incidents"
                className="border-b-border dark:data-[state=active]:bg-background data-[state=active]:border-border data-[state=active]:border-b-background h-full rounded-none rounded-t border border-transparent data-[state=active]:-mb-0.5 data-[state=active]:shadow-none dark:border-b-0 dark:data-[state=active]:-mb-0.5"
              >
                Incidents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-6">
              <DriverDetailsTab driver={driver} />
            </TabsContent>

            <TabsContent value="assignments" className="mt-6">
              <DriverAssignmentsTab driverId={driverId} />
            </TabsContent>

            <TabsContent value="incidents" className="mt-6">
              <DriverIncidentsTab driverId={driverId} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <DriverFormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        driver={driver}
        onSuccess={() => {
          setIsEditOpen(false);
          refetch();
        }}
      />
    </div>
  );
}
