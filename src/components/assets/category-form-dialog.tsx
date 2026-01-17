"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Category {
  id: number;
  name: string;
  description: string | null;
  codePrefix: string;
  defaultUsefulLifeYears: number | null;
  defaultResidualValuePercent: string | null;
  isActive: boolean;
}

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
}: CategoryFormDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [codePrefix, setCodePrefix] = useState("");
  const [defaultUsefulLifeYears, setDefaultUsefulLifeYears] = useState("");
  const [defaultResidualValuePercent, setDefaultResidualValuePercent] =
    useState("");
  const [isActive, setIsActive] = useState(true);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;

    if (category) {
      setName(category.name);
      setDescription(category.description || "");
      setCodePrefix(category.codePrefix);
      setDefaultUsefulLifeYears(
        category.defaultUsefulLifeYears?.toString() || "",
      );
      setDefaultResidualValuePercent(
        category.defaultResidualValuePercent || "",
      );
      setIsActive(category.isActive);
    } else {
      setName("");
      setDescription("");
      setCodePrefix("");
      setDefaultUsefulLifeYears("");
      setDefaultResidualValuePercent("");
      setIsActive(true);
    }
  }, [open, category]);

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await fetch("/api/assets/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create category");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-categories"] });
      toast.success("Category created successfully");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await fetch(`/api/assets/categories/${category?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update category");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-categories"] });
      toast.success("Category updated successfully");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!codePrefix.trim()) {
      toast.error("Code prefix is required");
      return;
    }
    if (codePrefix.length > 10) {
      toast.error("Code prefix must be 10 characters or less");
      return;
    }

    const data = {
      name: name.trim(),
      description: description.trim() || null,
      codePrefix: codePrefix.trim().toUpperCase(),
      defaultUsefulLifeYears: defaultUsefulLifeYears
        ? Number(defaultUsefulLifeYears)
        : null,
      defaultResidualValuePercent: defaultResidualValuePercent
        ? Number(defaultResidualValuePercent)
        : null,
      isActive,
    };

    if (category) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {category ? "Edit Category" : "Add New Category"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Computers, Furniture, Vehicles"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="codePrefix">Code Prefix *</Label>
            <Input
              id="codePrefix"
              value={codePrefix}
              onChange={(e) => setCodePrefix(e.target.value.toUpperCase())}
              placeholder="e.g., COMP, FURN, VEH"
              maxLength={10}
            />
            <p className="text-xs text-muted-foreground">
              Used in auto-generated asset codes (e.g., 2026-COMP-0001)
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for this category"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="usefulLife">Default Useful Life (Years)</Label>
              <Input
                id="usefulLife"
                type="number"
                value={defaultUsefulLifeYears}
                onChange={(e) => setDefaultUsefulLifeYears(e.target.value)}
                placeholder="e.g., 5"
                min={1}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="residualValue">Default Residual Value %</Label>
              <Input
                id="residualValue"
                type="number"
                value={defaultResidualValuePercent}
                onChange={(e) => setDefaultResidualValuePercent(e.target.value)}
                placeholder="e.g., 10"
                min={0}
                max={100}
                step={0.01}
              />
            </div>
          </div>

          {category && (
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Active</Label>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending
              ? "Saving..."
              : category
                ? "Save Changes"
                : "Create Category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
