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

interface ValueAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: number;
  currentValue: number;
}

export function ValueAdjustmentDialog({
  open,
  onOpenChange,
  assetId,
  currentValue,
}: ValueAdjustmentDialogProps) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    adjustmentType: "Depreciation",
    adjustmentAmount: "",
    reason: "",
    notes: "",
    adjustmentDate: new Date().toISOString().split("T")[0],
  });

  const calculateNewValue = () => {
    const amount = Number(formData.adjustmentAmount) || 0;
    if (
      formData.adjustmentType === "Depreciation" ||
      formData.adjustmentType === "Impairment"
    ) {
      return Math.max(0, currentValue - amount);
    }
    return currentValue + amount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/assets/${assetId}/adjustments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adjustmentType: formData.adjustmentType,
          adjustmentAmount: formData.adjustmentAmount,
          reason: formData.reason,
          notes: formData.notes || null,
          adjustmentDate: formData.adjustmentDate,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create adjustment");
      }

      toast.success("Value adjustment recorded successfully");
      queryClient.invalidateQueries({ queryKey: ["asset", assetId] });
      queryClient.invalidateQueries({
        queryKey: ["asset-adjustments", assetId],
      });
      onOpenChange(false);
      setFormData({
        adjustmentType: "Depreciation",
        adjustmentAmount: "",
        reason: "",
        notes: "",
        adjustmentDate: new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create adjustment",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-11/12 overflow-auto">
        <DialogHeader>
          <DialogTitle>Record Value Adjustment</DialogTitle>
          <DialogDescription>
            Record a depreciation, appreciation, or other value adjustment for
            this asset.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Current Value</p>
              <p className="text-2xl font-bold">
                ₦{currentValue.toLocaleString()}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjustmentType">Adjustment Type *</Label>
              <Select
                value={formData.adjustmentType}
                onValueChange={(value) =>
                  setFormData({ ...formData, adjustmentType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Depreciation">
                    Depreciation (decrease value)
                  </SelectItem>
                  <SelectItem value="Appreciation">
                    Appreciation (increase value)
                  </SelectItem>
                  <SelectItem value="Impairment">
                    Impairment (decrease due to damage/obsolescence)
                  </SelectItem>
                  <SelectItem value="Revaluation">
                    Revaluation (adjust to fair market value)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjustmentAmount">Adjustment Amount *</Label>
              <Input
                id="adjustmentAmount"
                type="number"
                step="0.01"
                min="0"
                value={formData.adjustmentAmount}
                onChange={(e) =>
                  setFormData({ ...formData, adjustmentAmount: e.target.value })
                }
                placeholder="0.00"
                required
              />
              {formData.adjustmentAmount && (
                <p className="text-sm text-muted-foreground">
                  New value will be:{" "}
                  <span className="font-medium">
                    ₦{calculateNewValue().toLocaleString()}
                  </span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjustmentDate">Adjustment Date *</Label>
              <Input
                id="adjustmentDate"
                type="date"
                value={formData.adjustmentDate}
                onChange={(e) =>
                  setFormData({ ...formData, adjustmentDate: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Input
                id="reason"
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder="e.g., Monthly depreciation, Market revaluation"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Additional notes about this adjustment..."
                rows={3}
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
              {isLoading ? "Recording..." : "Record Adjustment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
