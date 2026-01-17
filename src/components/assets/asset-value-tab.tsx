"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { ValueAdjustmentDialog } from "./value-adjustment-dialog";

interface AssetValueTabProps {
  assetId: number;
  purchasePrice: number;
  currentValue: number;
  accumulatedDepreciation: number;
  depreciationMethod: string | null;
  usefulLifeYears: number | null;
  residualValue: number | null;
  depreciationStartDate: string | null;
}

export function AssetValueTab({
  assetId,
  purchasePrice,
  currentValue,
  accumulatedDepreciation,
  depreciationMethod,
  usefulLifeYears,
  residualValue,
  depreciationStartDate,
}: AssetValueTabProps) {
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["asset-adjustments", assetId],
    queryFn: async () => {
      const response = await fetch(`/api/assets/${assetId}/adjustments`);
      if (!response.ok) throw new Error("Failed to fetch adjustments");
      return response.json();
    },
  });

  const adjustments = data?.adjustments || [];

  const getAdjustmentIcon = (type: string) => {
    switch (type) {
      case "Depreciation":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "Appreciation":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "Impairment":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "Revaluation":
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const getAdjustmentBadge = (type: string) => {
    const colors: Record<string, string> = {
      Depreciation: "bg-red-100 text-red-700",
      Appreciation: "bg-green-100 text-green-700",
      Impairment: "bg-orange-100 text-orange-700",
      Revaluation: "bg-blue-100 text-blue-700",
    };

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${colors[type] || "bg-gray-100 text-gray-700"}`}
      >
        {getAdjustmentIcon(type)}
        {type}
      </span>
    );
  };

  // Calculate annual depreciation for straight-line method
  const calculateAnnualDepreciation = () => {
    if (!usefulLifeYears || usefulLifeYears <= 0) return null;
    const depreciableAmount = purchasePrice - (residualValue || 0);
    return depreciableAmount / usefulLifeYears;
  };

  const annualDepreciation = calculateAnnualDepreciation();

  return (
    <div className="space-y-6">
      {/* Value Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Purchase Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{purchasePrice.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₦{currentValue.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Accumulated Depreciation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₦{accumulatedDepreciation.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Book Value Percentage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {purchasePrice > 0
                ? ((currentValue / purchasePrice) * 100).toFixed(1)
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Depreciation Details */}
      {usefulLifeYears && (
        <Card>
          <CardHeader>
            <CardTitle>Depreciation Schedule</CardTitle>
            <CardDescription>
              {depreciationMethod || "Straight-Line"} depreciation method
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Useful Life</p>
                <p className="font-medium">{usefulLifeYears} years</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Residual Value</p>
                <p className="font-medium">
                  ₦{(residualValue || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Annual Depreciation
                </p>
                <p className="font-medium">
                  {annualDepreciation
                    ? `₦${annualDepreciation.toLocaleString()}`
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Monthly Depreciation
                </p>
                <p className="font-medium">
                  {annualDepreciation
                    ? `₦${(annualDepreciation / 12).toLocaleString()}`
                    : "-"}
                </p>
              </div>
            </div>
            {depreciationStartDate && (
              <p className="text-sm text-muted-foreground mt-4">
                Depreciation started:{" "}
                {new Date(depreciationStartDate).toLocaleDateString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Value Adjustments History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Value Adjustment History</CardTitle>
            <CardDescription>
              Record of all value changes for this asset
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setAdjustmentDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Record Adjustment
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground py-4 text-center">
              Loading adjustments...
            </p>
          ) : adjustments.length === 0 ? (
            <p className="text-muted-foreground py-4">
              No value adjustments recorded yet. Record depreciation or other
              value changes to maintain accurate asset valuation.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Previous Value</TableHead>
                  <TableHead>Adjustment</TableHead>
                  <TableHead>New Value</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map(
                  (adj: {
                    id: number;
                    adjustmentDate: string;
                    adjustmentType: string;
                    previousValue: string;
                    adjustmentAmount: string;
                    newValue: string;
                    reason: string;
                  }) => (
                    <TableRow key={adj.id}>
                      <TableCell>
                        {new Date(adj.adjustmentDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {getAdjustmentBadge(adj.adjustmentType)}
                      </TableCell>
                      <TableCell>
                        ₦{Number(adj.previousValue).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            adj.adjustmentType === "Depreciation" ||
                            adj.adjustmentType === "Impairment"
                              ? "text-red-600"
                              : "text-green-600"
                          }
                        >
                          {adj.adjustmentType === "Depreciation" ||
                          adj.adjustmentType === "Impairment"
                            ? "-"
                            : "+"}
                          ₦{Number(adj.adjustmentAmount).toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        ₦{Number(adj.newValue).toLocaleString()}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {adj.reason}
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Adjustment Dialog */}
      <ValueAdjustmentDialog
        open={adjustmentDialogOpen}
        onOpenChange={setAdjustmentDialogOpen}
        assetId={assetId}
        currentValue={currentValue}
      />
    </div>
  );
}
