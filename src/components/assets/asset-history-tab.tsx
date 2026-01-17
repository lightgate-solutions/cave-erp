"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  User,
  Building2,
  FolderKanban,
  RotateCcw,
} from "lucide-react";

interface AssetHistoryTabProps {
  assetId: number;
}

export function AssetHistoryTab({ assetId }: AssetHistoryTabProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["asset-assignments", assetId],
    queryFn: async () => {
      const response = await fetch(`/api/assets/${assetId}/assignments`);
      if (!response.ok) throw new Error("Failed to fetch assignment history");
      return response.json();
    },
  });

  const history = data?.history || [];
  const currentAssignment = data?.currentAssignment;

  const getTargetIcon = (targetType: string | null) => {
    switch (targetType) {
      case "Employee":
        return <User className="h-4 w-4" />;
      case "Department":
        return <Building2 className="h-4 w-4" />;
      case "Project":
        return <FolderKanban className="h-4 w-4" />;
      default:
        return <RotateCcw className="h-4 w-4" />;
    }
  };

  const getTargetDisplay = (
    targetType: string | null,
    employeeId: string | null,
    department: string | null,
    projectId: number | null,
  ) => {
    if (!targetType) return "Unassigned (Returned)";

    switch (targetType) {
      case "Employee":
        return employeeId ? `Employee #${employeeId}` : "Employee";
      case "Department":
        return department ? `${department}` : "Department";
      case "Project":
        return projectId ? `Project #${projectId}` : "Project";
      default:
        return targetType;
    }
  };

  const getTargetBadgeColor = (targetType: string | null) => {
    switch (targetType) {
      case "Employee":
        return "bg-blue-100 text-blue-700";
      case "Department":
        return "bg-purple-100 text-purple-700";
      case "Project":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Assignment */}
      <Card>
        <CardHeader>
          <CardTitle>Current Assignment</CardTitle>
          <CardDescription>
            Where this asset is currently assigned
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentAssignment ? (
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <div
                className={`p-3 rounded-full ${getTargetBadgeColor(currentAssignment.targetType)}`}
              >
                {getTargetIcon(currentAssignment.targetType)}
              </div>
              <div>
                <p className="font-medium">
                  {getTargetDisplay(
                    currentAssignment.targetType,
                    currentAssignment.employeeId,
                    currentAssignment.department,
                    currentAssignment.projectId,
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  Assigned on{" "}
                  {new Date(
                    currentAssignment.assignedDate,
                  ).toLocaleDateString()}
                </p>
                {currentAssignment.notes && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentAssignment.notes}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              This asset is not currently assigned to anyone.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Assignment History */}
      <Card>
        <CardHeader>
          <CardTitle>Transfer History</CardTitle>
          <CardDescription>
            Complete history of assignments and transfers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground py-4 text-center">
              Loading history...
            </p>
          ) : history.length === 0 ? (
            <p className="text-muted-foreground py-4">
              No transfer history available for this asset.
            </p>
          ) : (
            <div className="space-y-4">
              {history.map(
                (
                  item: {
                    id: number;
                    transferDate: string;
                    fromTargetType: string | null;
                    fromEmployeeId: string | null;
                    fromDepartment: string | null;
                    fromProjectId: number | null;
                    toTargetType: string | null;
                    toEmployeeId: string | null;
                    toDepartment: string | null;
                    toProjectId: number | null;
                    reason: string | null;
                    notes: string | null;
                  },
                  index: number,
                ) => (
                  <div
                    key={item.id}
                    className="relative flex items-start gap-4 pb-4"
                  >
                    {/* Timeline connector */}
                    {index < history.length - 1 && (
                      <div className="absolute left-[19px] top-10 h-full w-0.5 bg-border" />
                    )}

                    {/* Timeline dot */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <ArrowRight className="h-4 w-4 text-primary" />
                    </div>

                    {/* Content */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* From */}
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${getTargetBadgeColor(item.fromTargetType)}`}
                        >
                          {getTargetIcon(item.fromTargetType)}
                          {getTargetDisplay(
                            item.fromTargetType,
                            item.fromEmployeeId,
                            item.fromDepartment,
                            item.fromProjectId,
                          )}
                        </span>

                        <ArrowRight className="h-4 w-4 text-muted-foreground" />

                        {/* To */}
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${getTargetBadgeColor(item.toTargetType)}`}
                        >
                          {getTargetIcon(item.toTargetType)}
                          {getTargetDisplay(
                            item.toTargetType,
                            item.toEmployeeId,
                            item.toDepartment,
                            item.toProjectId,
                          )}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(item.transferDate).toLocaleDateString()} at{" "}
                        {new Date(item.transferDate).toLocaleTimeString()}
                      </p>

                      {item.reason && (
                        <p className="text-sm mt-1">
                          <span className="font-medium">Reason:</span>{" "}
                          {item.reason}
                        </p>
                      )}

                      {item.notes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
