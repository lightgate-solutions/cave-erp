"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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

interface MaintenanceScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: number;
}

export function MaintenanceScheduleDialog({
  open,
  onOpenChange,
  assetId,
}: MaintenanceScheduleDialogProps) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    intervalValue: "1",
    intervalUnit: "Months",
    startDate: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/assets/${assetId}/maintenance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "schedule",
          name: formData.name,
          description: formData.description || null,
          intervalValue: Number(formData.intervalValue),
          intervalUnit: formData.intervalUnit,
          startDate: formData.startDate,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create schedule");
      }

      toast.success("Maintenance schedule created successfully");
      queryClient.invalidateQueries({
        queryKey: ["asset-maintenance", assetId],
      });
      queryClient.invalidateQueries({
        queryKey: ["asset-maintenance-overview"],
      });
      onOpenChange(false);
      setFormData({
        name: "",
        description: "",
        intervalValue: "1",
        intervalUnit: "Months",
        startDate: new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create schedule",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Maintenance Schedule</DialogTitle>
          <DialogDescription>
            Set up a recurring maintenance schedule for this asset.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Schedule Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Oil Change, Safety Inspection"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe the maintenance tasks..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="intervalValue">Interval *</Label>
                <Input
                  id="intervalValue"
                  type="number"
                  min="1"
                  value={formData.intervalValue}
                  onChange={(e) =>
                    setFormData({ ...formData, intervalValue: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="intervalUnit">Unit *</Label>
                <Select
                  value={formData.intervalUnit}
                  onValueChange={(value) =>
                    setFormData({ ...formData, intervalUnit: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Days">Days</SelectItem>
                    <SelectItem value="Weeks">Weeks</SelectItem>
                    <SelectItem value="Months">Months</SelectItem>
                    <SelectItem value="Years">Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                First maintenance will be due after this date plus the interval.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
