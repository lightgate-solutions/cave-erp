"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Package,
  MapPin,
  DollarSign,
  Shield,
  Wrench,
  User,
  FileText,
  History,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { AssetStatusBadge } from "./asset-status-badge";
import { useState } from "react";
import { AssetFormDialog } from "./asset-form-dialog";
import { AssetMaintenanceTab } from "./asset-maintenance-tab";
import { AssetValueTab } from "./asset-value-tab";
import { AssetDocumentsTab } from "./asset-documents-tab";
import { AssetHistoryTab } from "./asset-history-tab";
import { AssignmentFormDialog } from "./assignment-form-dialog";
import { DisposalFormDialog } from "./disposal-form-dialog";

interface AssetDetailProps {
  assetId: number;
}

export default function AssetDetail({ assetId }: AssetDetailProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [disposalDialogOpen, setDisposalDialogOpen] = useState(false);

  const { data: asset, isLoading } = useQuery({
    queryKey: ["asset", assetId],
    queryFn: async () => {
      const response = await fetch(`/api/assets/${assetId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch asset");
      }
      return response.json();
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["asset-categories"],
    queryFn: async () => {
      const response = await fetch("/api/assets/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  const { data: locationsData } = useQuery({
    queryKey: ["asset-locations"],
    queryFn: async () => {
      const response = await fetch("/api/assets/locations");
      if (!response.ok) throw new Error("Failed to fetch locations");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Loading asset...</p>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Asset not found</p>
        <Link href="/assets/list">
          <Button variant="link">Back to Assets</Button>
        </Link>
      </div>
    );
  }

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  const formatCurrency = (value: string | null) => {
    if (!value) return "-";
    return `₦${Number(value).toLocaleString()}`;
  };

  const getAssignmentDisplay = () => {
    if (!asset.currentAssignment) return "Unassigned";

    const { targetType, employeeName, department, projectId } =
      asset.currentAssignment;

    if (targetType === "Employee" && employeeName) {
      return employeeName;
    }
    if (targetType === "Department" && department) {
      return `Department: ${department}`;
    }
    if (targetType === "Project" && projectId) {
      return `Project #${projectId}`;
    }
    return "Unassigned";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/assets/list">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{asset.name}</h1>
              <AssetStatusBadge status={asset.status} />
            </div>
            <p className="text-muted-foreground">
              <code className="bg-muted px-2 py-1 rounded text-sm mr-2">
                {asset.assetCode}
              </code>
              {asset.category?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {asset.status === "Active" && (
            <>
              <Button
                variant="outline"
                onClick={() => setAssignmentDialogOpen(true)}
              >
                <User className="h-4 w-4 mr-2" />
                {asset.currentAssignment ? "Transfer" : "Assign"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setDisposalDialogOpen(true)}
              >
                Dispose
              </Button>
            </>
          )}
          <Button onClick={() => setEditDialogOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Asset
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(asset.currentValue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Location</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {asset.location?.name || "Not assigned"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned To</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">{getAssignmentDisplay()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warranty</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {asset.warrantyEndDate
                ? new Date(asset.warrantyEndDate) > new Date()
                  ? "Active"
                  : "Expired"
                : "No warranty"}
            </div>
            {asset.warrantyEndDate && (
              <p className="text-xs text-muted-foreground">
                Ends: {formatDate(asset.warrantyEndDate)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">
            <Package className="h-4 w-4 mr-2" />
            Details
          </TabsTrigger>
          <TabsTrigger value="financial">
            <DollarSign className="h-4 w-4 mr-2" />
            Financial
          </TabsTrigger>
          <TabsTrigger value="warranty">
            <Shield className="h-4 w-4 mr-2" />
            Warranty
          </TabsTrigger>
          <TabsTrigger value="maintenance">
            <Wrench className="h-4 w-4 mr-2" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-2" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Asset Details</CardTitle>
              <CardDescription>
                Basic information about this asset
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{asset.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Asset Code</p>
                  <p className="font-medium">{asset.assetCode}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{asset.category?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{asset.location?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Serial Number</p>
                  <p className="font-medium">{asset.serialNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Barcode</p>
                  <p className="font-medium">{asset.barcode || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Manufacturer</p>
                  <p className="font-medium">{asset.manufacturer || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Model</p>
                  <p className="font-medium">{asset.model || "-"}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{asset.description || "-"}</p>
                </div>
                {asset.notes && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="font-medium">{asset.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="mt-4">
          <AssetValueTab
            assetId={assetId}
            purchasePrice={Number(asset.purchasePrice) || 0}
            currentValue={Number(asset.currentValue) || 0}
            accumulatedDepreciation={Number(asset.accumulatedDepreciation) || 0}
            depreciationMethod={asset.depreciationMethod}
            usefulLifeYears={asset.usefulLifeYears}
            residualValue={Number(asset.residualValue) || 0}
            depreciationStartDate={asset.depreciationStartDate}
          />
        </TabsContent>

        <TabsContent value="warranty" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Warranty Information</CardTitle>
              <CardDescription>
                Warranty coverage details for this asset
              </CardDescription>
            </CardHeader>
            <CardContent>
              {asset.warrantyEndDate ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Warranty Start
                    </p>
                    <p className="font-medium">
                      {formatDate(asset.warrantyStartDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Warranty End
                    </p>
                    <p className="font-medium">
                      {formatDate(asset.warrantyEndDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Provider</p>
                    <p className="font-medium">
                      {asset.warrantyProvider || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium">
                      {new Date(asset.warrantyEndDate) > new Date() ? (
                        <span className="text-green-600">Active</span>
                      ) : (
                        <span className="text-red-600">Expired</span>
                      )}
                    </p>
                  </div>
                  {asset.warrantyTerms && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground">Terms</p>
                      <p className="font-medium">{asset.warrantyTerms}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  No warranty information available for this asset.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="mt-4">
          <AssetMaintenanceTab
            assetId={assetId}
            requiresMaintenance={asset.requiresMaintenance}
          />
        </TabsContent>

        <TabsContent value="documents" className="mt-4">
          <AssetDocumentsTab assetId={assetId} />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <AssetHistoryTab assetId={assetId} />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <AssetFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        asset={asset}
        categories={categoriesData?.categories || []}
        locations={locationsData?.locations || []}
      />

      {/* Assignment Dialog */}
      <AssignmentFormDialog
        open={assignmentDialogOpen}
        onOpenChange={setAssignmentDialogOpen}
        assetId={assetId}
        currentAssignment={asset.currentAssignment}
      />

      {/* Disposal Dialog */}
      <DisposalFormDialog
        open={disposalDialogOpen}
        onOpenChange={setDisposalDialogOpen}
        assetId={assetId}
        assetName={asset.name}
        currentValue={Number(asset.currentValue) || 0}
      />
    </div>
  );
}
