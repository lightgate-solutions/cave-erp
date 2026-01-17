"use client";

import { useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
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

interface MaintenanceRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: number;
}

export function MaintenanceRecordDialog({
  open,
  onOpenChange,
  assetId,
}: MaintenanceRecordDialogProps) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    scheduleId: "none",
    title: "",
    description: "",
    scheduledDate: new Date().toISOString().split("T")[0],
    completedDate: "",
    status: "Scheduled",
    cost: "",
    notes: "",
  });

  // Fetch maintenance schedules for this asset
  const { data: maintenanceData } = useQuery({
    queryKey: ["asset-maintenance", assetId],
    queryFn: async () => {
      const response = await fetch(`/api/assets/${assetId}/maintenance`);
      if (!response.ok) throw new Error("Failed to fetch maintenance data");
      return response.json();
    },
    enabled: open,
  });

  const schedules = maintenanceData?.schedules || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/assets/${assetId}/maintenance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "record",
          scheduleId:
            formData.scheduleId && formData.scheduleId !== "none"
              ? Number(formData.scheduleId)
              : null,
          title: formData.title,
          description: formData.description || null,
          scheduledDate: formData.scheduledDate,
          completedDate: formData.completedDate || null,
          status: formData.status,
          cost: formData.cost ? formData.cost : null,
          notes: formData.notes || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create record");
      }

      toast.success("Maintenance record created successfully");
      queryClient.invalidateQueries({
        queryKey: ["asset-maintenance", assetId],
      });
      queryClient.invalidateQueries({
        queryKey: ["asset-maintenance-overview"],
      });
      onOpenChange(false);
      setFormData({
        scheduleId: "none",
        title: "",
        description: "",
        scheduledDate: new Date().toISOString().split("T")[0],
        completedDate: "",
        status: "Scheduled",
        cost: "",
        notes: "",
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create record",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-11/12 overflow-auto">
        <DialogHeader>
          <DialogTitle>Log Maintenance</DialogTitle>
          <DialogDescription>
            Record a maintenance activity for this asset.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {schedules.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="scheduleId">Related Schedule (Optional)</Label>
                <Select
                  value={formData.scheduleId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, scheduleId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a schedule" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {schedules.map((schedule: { id: number; name: string }) => (
                      <SelectItem
                        key={schedule.id}
                        value={schedule.id.toString()}
                      >
                        {schedule.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g., Quarterly Oil Change"
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
                placeholder="Describe the maintenance performed..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Scheduled Date *</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduledDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="completedDate">Completed Date</Label>
                <Input
                  id="completedDate"
                  type="date"
                  value={formData.completedDate}
                  onChange={(e) =>
                    setFormData({ ...formData, completedDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Cost</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={(e) =>
                    setFormData({ ...formData, cost: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

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
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
