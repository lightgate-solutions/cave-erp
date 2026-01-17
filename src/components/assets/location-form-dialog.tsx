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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface Location {
  id: number;
  name: string;
  address: string | null;
  type: string | null;
  description: string | null;
  isActive: boolean;
}

interface LocationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location?: Location | null;
}

const locationTypes = [
  "Office",
  "Warehouse",
  "Branch",
  "Factory",
  "Store",
  "Data Center",
  "Other",
];

export function LocationFormDialog({
  open,
  onOpenChange,
  location,
}: LocationFormDialogProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;

    if (location) {
      setName(location.name);
      setAddress(location.address || "");
      setType(location.type || "");
      setDescription(location.description || "");
      setIsActive(location.isActive);
    } else {
      setName("");
      setAddress("");
      setType("");
      setDescription("");
      setIsActive(true);
    }
  }, [open, location]);

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await fetch("/api/assets/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create location");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-locations"] });
      toast.success("Location created successfully");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const response = await fetch(`/api/assets/locations/${location?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update location");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-locations"] });
      toast.success("Location updated successfully");
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

    const data = {
      name: name.trim(),
      address: address.trim() || null,
      type: type || null,
      description: description.trim() || null,
      isActive,
    };

    if (location) {
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
            {location ? "Edit Location" : "Add New Location"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Head Office, Warehouse A"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue placeholder="Select location type" />
              </SelectTrigger>
              <SelectContent>
                {locationTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Physical address of the location"
              rows={2}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for this location"
              rows={2}
            />
          </div>

          {location && (
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
              : location
                ? "Save Changes"
                : "Create Location"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
