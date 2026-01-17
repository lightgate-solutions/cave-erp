"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface AssignmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: number;
  currentAssignment?: {
    targetType: string;
    employeeId: string | null;
    department: string | null;
    projectId: number | null;
  } | null;
}

export function AssignmentFormDialog({
  open,
  onOpenChange,
  assetId,
  currentAssignment,
}: AssignmentFormDialogProps) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    targetType: "Employee",
    employeeId: "",
    department: "",
    projectId: "",
    assignedDate: new Date().toISOString().split("T")[0],
    expectedReturnDate: "",
    reason: "",
    notes: "",
  });

  // Fetch employees for dropdown
  const { data: employeesData } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const response = await fetch("/api/hr/employees/all");
      if (!response.ok) throw new Error("Failed to fetch employees");
      return response.json();
    },
    enabled: open && formData.targetType === "Employee",
  });

  // Fetch projects for dropdown
  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      return response.json();
    },
    enabled: open && formData.targetType === "Project",
  });

  const employees = employeesData?.employees || [];
  const projects = projectsData?.projects || [];

  const departments = [
    "Engineering",
    "Marketing",
    "Sales",
    "Finance",
    "HR",
    "Operations",
    "IT",
    "Legal",
    "Customer Support",
    "Administration",
  ];

  const isTransfer = !!currentAssignment;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/assets/${assetId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: formData.targetType,
          employeeId:
            formData.targetType === "Employee" ? formData.employeeId : null,
          department:
            formData.targetType === "Department" ? formData.department : null,
          projectId:
            formData.targetType === "Project"
              ? Number(formData.projectId)
              : null,
          assignedDate: formData.assignedDate,
          expectedReturnDate: formData.expectedReturnDate || null,
          reason:
            formData.reason ||
            (isTransfer ? "Asset transferred" : "New assignment"),
          notes: formData.notes || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to assign asset");
      }

      toast.success(
        isTransfer
          ? "Asset transferred successfully"
          : "Asset assigned successfully",
      );
      queryClient.invalidateQueries({ queryKey: ["asset", assetId] });
      queryClient.invalidateQueries({
        queryKey: ["asset-assignments", assetId],
      });
      onOpenChange(false);
      setFormData({
        targetType: "Employee",
        employeeId: "",
        department: "",
        projectId: "",
        assignedDate: new Date().toISOString().split("T")[0],
        expectedReturnDate: "",
        reason: "",
        notes: "",
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to assign asset",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturn = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/assets/${assetId}/assignments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: formData.reason || "Asset returned",
          notes: formData.notes || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to return asset");
      }

      toast.success("Asset returned successfully");
      queryClient.invalidateQueries({ queryKey: ["asset", assetId] });
      queryClient.invalidateQueries({
        queryKey: ["asset-assignments", assetId],
      });
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to return asset",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isTransfer ? "Transfer Asset" : "Assign Asset"}
          </DialogTitle>
          <DialogDescription>
            {isTransfer
              ? "Transfer this asset to a new employee, department, or project."
              : "Assign this asset to an employee, department, or project."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="targetType">Assign To *</Label>
              <Select
                value={formData.targetType}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    targetType: value,
                    employeeId: "",
                    department: "",
                    projectId: "",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Employee">Employee</SelectItem>
                  <SelectItem value="Department">Department</SelectItem>
                  <SelectItem value="Project">Project</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.targetType === "Employee" && (
              <div className="space-y-2">
                <Label htmlFor="employeeId">Select Employee *</Label>
                <Select
                  value={formData.employeeId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, employeeId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map(
                      (emp: {
                        authId: string;
                        name: string;
                        email: string;
                      }) => (
                        <SelectItem key={emp.authId} value={emp.authId}>
                          {emp.name} ({emp.email})
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.targetType === "Department" && (
              <div className="space-y-2">
                <Label htmlFor="department">Select Department *</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) =>
                    setFormData({ ...formData, department: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.targetType === "Project" && (
              <div className="space-y-2">
                <Label htmlFor="projectId">Select Project *</Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, projectId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(
                      (proj: { id: number; name: string; code: string }) => (
                        <SelectItem key={proj.id} value={proj.id.toString()}>
                          {proj.name} ({proj.code})
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignedDate">Assignment Date *</Label>
                <Input
                  id="assignedDate"
                  type="date"
                  value={formData.assignedDate}
                  onChange={(e) =>
                    setFormData({ ...formData, assignedDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedReturnDate">Expected Return</Label>
                <Input
                  id="expectedReturnDate"
                  type="date"
                  value={formData.expectedReturnDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expectedReturnDate: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            {isTransfer && (
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Transfer</Label>
                <Input
                  id="reason"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  placeholder="e.g., Project reassignment, department change"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            {isTransfer && (
              <Button
                type="button"
                variant="outline"
                onClick={handleReturn}
                disabled={isLoading}
              >
                Return Asset
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : isTransfer ? "Transfer" : "Assign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
