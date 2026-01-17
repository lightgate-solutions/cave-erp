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
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface DisposalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: number;
  assetName: string;
  currentValue: number;
}

export function DisposalFormDialog({
  open,
  onOpenChange,
  assetId,
  assetName,
  currentValue,
}: DisposalFormDialogProps) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    status: "Disposed",
    disposalDate: new Date().toISOString().split("T")[0],
    disposalReason: "",
    disposalPrice: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: formData.status,
          disposalDate: formData.disposalDate,
          disposalReason: formData.disposalReason,
          disposalPrice: formData.disposalPrice || null,
          notes: formData.notes || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to dispose asset");
      }

      toast.success(
        formData.status === "Disposed"
          ? "Asset disposed successfully"
          : formData.status === "Retired"
            ? "Asset retired successfully"
            : "Asset marked as lost/stolen",
      );
      queryClient.invalidateQueries({ queryKey: ["asset", assetId] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["asset-stats"] });
      onOpenChange(false);
      setFormData({
        status: "Disposed",
        disposalDate: new Date().toISOString().split("T")[0],
        disposalReason: "",
        disposalPrice: "",
        notes: "",
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to dispose asset",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-11/12 overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Dispose Asset
          </DialogTitle>
          <DialogDescription>
            Mark &quot;{assetName}&quot; as disposed, retired, or lost/stolen.
            This action will remove the asset from active inventory.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Current book value:{" "}
                <span className="font-bold">
                  ₦{currentValue.toLocaleString()}
                </span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Disposal Type *</Label>
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
                  <SelectItem value="Disposed">
                    Disposed (sold, donated, or scrapped)
                  </SelectItem>
                  <SelectItem value="Retired">
                    Retired (no longer in use but kept)
                  </SelectItem>
                  <SelectItem value="Lost/Stolen">
                    Lost/Stolen (missing)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="disposalDate">
                {formData.status === "Lost/Stolen"
                  ? "Date Reported"
                  : "Disposal Date"}{" "}
                *
              </Label>
              <Input
                id="disposalDate"
                type="date"
                value={formData.disposalDate}
                onChange={(e) =>
                  setFormData({ ...formData, disposalDate: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="disposalReason">Reason *</Label>
              <Textarea
                id="disposalReason"
                value={formData.disposalReason}
                onChange={(e) =>
                  setFormData({ ...formData, disposalReason: e.target.value })
                }
                placeholder={
                  formData.status === "Disposed"
                    ? "e.g., End of useful life, sold to employee, donated"
                    : formData.status === "Retired"
                      ? "e.g., Obsolete technology, replaced by newer model"
                      : "e.g., Lost during move, theft reported to authorities"
                }
                rows={3}
                required
              />
            </div>

            {formData.status === "Disposed" && (
              <div className="space-y-2">
                <Label htmlFor="disposalPrice">
                  Sale/Recovery Amount (if any)
                </Label>
                <Input
                  id="disposalPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.disposalPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, disposalPrice: e.target.value })
                  }
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">
                  Enter any amount received from selling or scrapping the asset.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Any additional information about this disposal..."
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
            <Button type="submit" disabled={isLoading} variant="destructive">
              {isLoading
                ? "Processing..."
                : formData.status === "Disposed"
                  ? "Dispose Asset"
                  : formData.status === "Retired"
                    ? "Retire Asset"
                    : "Mark as Lost/Stolen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
