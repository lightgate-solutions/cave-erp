"use client";

import { useEffect, useState } from "react";
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
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

interface Assignment {
  id?: number;
}

interface AssignmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment?: Assignment | null;
  vehicleId?: number;
  driverId?: number;
  onSuccess?: () => void;
}

export function AssignmentFormDialog({
  open,
  onOpenChange,
  assignment,
  vehicleId,
  driverId,
  onSuccess,
}: AssignmentFormDialogProps) {
  const [saving, setSaving] = useState(false);

  // Form State
  const [selectedVehicleId, setSelectedVehicleId] = useState<
    string | undefined
  >(vehicleId?.toString());
  const [selectedDriverId, setSelectedDriverId] = useState<string | undefined>(
    driverId?.toString(),
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  const { data: vehiclesData, isLoading: vehiclesLoading } = useQuery({
    queryKey: ["vehicles-list"],
    queryFn: async () =>
      fetch("/api/fleet/vehicles?limit=999").then((res) => res.json()),
    enabled: open && !vehicleId, // Only fetch if no specific vehicle is passed
  });
  const vehicles = vehiclesData?.vehicles || [];

  const { data: driversData, isLoading: driversLoading } = useQuery({
    queryKey: ["drivers-list"],
    queryFn: async () =>
      fetch("/api/fleet/drivers?limit=999").then((res) => res.json()),
    enabled: open && !driverId, // Only fetch if no specific driver is passed
  });
  const drivers = driversData?.drivers || [];

  useEffect(() => {
    if (!open) return;

    if (assignment) {
      // Populate form for editing
    } else {
      // Reset form
      setSelectedVehicleId(vehicleId?.toString());
      setSelectedDriverId(driverId?.toString());
      setStartDate(new Date().toISOString().split("T")[0]);
      setEndDate("");
      setNotes("");
    }
  }, [open, assignment, vehicleId, driverId]);

  async function onSubmit() {
    if (!selectedVehicleId) {
      toast.error("Vehicle is required");
      return;
    }
    if (!selectedDriverId) {
      toast.error("Driver is required");
      return;
    }
    if (!startDate) {
      toast.error("Start date is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        vehicleId: Number(selectedVehicleId),
        driverId: Number(selectedDriverId),
        startDate,
        endDate: endDate || null,
        notes: notes.trim() || null,
      };

      const url = assignment?.id
        ? `/api/fleet/assignments/${assignment.id}`
        : "/api/fleet/assignments";
      const method = assignment?.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save assignment");
      }

      toast.success(
        `Assignment ${assignment?.id ? "updated" : "created"} successfully`,
      );

      onSuccess?.();
    } catch (_error) {
      toast.error("Failed to save assignment");
    } finally {
      setSaving(false);
    }
  }

  const title = driverId ? "Assign Vehicle" : "Assign Driver";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {!vehicleId && (
            <div className="grid gap-2">
              <Label htmlFor="vehicle">Vehicle *</Label>
              <Select
                value={selectedVehicleId}
                onValueChange={setSelectedVehicleId}
                disabled={vehiclesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map(
                    (v: {
                      id: number;
                      year: number;
                      make: string;
                      model: string;
                      licensePlate: string;
                    }) => (
                      <SelectItem key={v.id} value={v.id.toString()}>
                        {v.year} {v.make} {v.model} ({v.licensePlate})
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {!driverId && (
            <div className="grid gap-2">
              <Label htmlFor="driver">Driver *</Label>
              <Select
                value={selectedDriverId}
                onValueChange={setSelectedDriverId}
                disabled={driversLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map(
                    (d: {
                      id: number;
                      name: string;
                      licenseNumber: string;
                    }) => (
                      <SelectItem key={d.id} value={d.id.toString()}>
                        {d.name} ({d.licenseNumber})
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDate">End Date (optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., 'Primary driver', 'Temporary assignment'"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={saving}>
            {saving ? "Saving..." : "Save Assignment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
