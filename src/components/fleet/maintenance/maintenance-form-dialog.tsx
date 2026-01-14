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

interface Maintenance {
  id?: number;
  // Define maintenance properties based on schema
}

interface MaintenanceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maintenance?: Maintenance | null;
  vehicleId?: number;
  onSuccess?: () => void;
}

const maintenanceTypes = [
  "Oil Change",
  "Tire Rotation",
  "Inspection",
  "Repair",
  "Brake Service",
  "Battery Replacement",
  "Transmission Service",
  "Other",
];

export function MaintenanceFormDialog({
  open,
  onOpenChange,
  maintenance,
  vehicleId,
  onSuccess,
}: MaintenanceFormDialogProps) {
  const [saving, setSaving] = useState(false);

  const [maintenanceType, setMaintenanceType] = useState("");
  const [maintenanceDate, setMaintenanceDate] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [mileageAtService, setMileageAtService] = useState("");
  const [performedBy, setPerformedBy] = useState("");
  const [nextServiceDue, setNextServiceDue] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<
    string | undefined
  >(vehicleId?.toString());

  const { data: vehiclesData } = useQuery({
    queryKey: ["vehicles-list"],
    queryFn: async () => {
      const response = await fetch("/api/fleet/vehicles?limit=999");
      if (!response.ok) {
        throw new Error("Failed to fetch vehicles");
      }
      return response.json();
    },
    enabled: open, // Only fetch when the dialog is open
  });

  const vehicles = vehiclesData?.vehicles || [];

  useEffect(() => {
    if (!open) return;

    if (maintenance) {
      // Populate form for editing
    } else {
      // Reset form
      setMaintenanceType("");
      setMaintenanceDate("");
      setDescription("");
      setCost("");
      setMileageAtService("");
      setPerformedBy("");
      setNextServiceDue("");
      setNotes("");
      setSelectedVehicleId(vehicleId?.toString());
    }
  }, [open, maintenance, vehicleId]);

  async function onSubmit() {
    if (!selectedVehicleId) {
      toast.error("Vehicle is required");
      return;
    }
    if (!maintenanceType) {
      toast.error("Maintenance type is required");
      return;
    }
    if (!maintenanceDate) {
      toast.error("Maintenance date is required");
      return;
    }
    if (!description) {
      toast.error("Description is required");
      return;
    }
    if (!cost) {
      toast.error("Cost is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        vehicleId: Number(selectedVehicleId),
        maintenanceType,
        maintenanceDate,
        description,
        cost: Number(cost),
        mileageAtService: mileageAtService ? Number(mileageAtService) : null,
        performedBy: performedBy.trim() || null,
        nextServiceDue: nextServiceDue.trim() || null,
        notes: notes.trim() || null,
      };

      const url = maintenance?.id
        ? `/api/fleet/maintenance/${maintenance.id}`
        : "/api/fleet/maintenance";
      const method = maintenance?.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save maintenance record");
      }

      toast.success(
        `Maintenance record ${
          maintenance?.id ? "updated" : "created"
        } successfully`,
      );

      onSuccess?.();
    } catch (_error) {
      toast.error("Failed to save maintenance record");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {maintenance?.id
              ? "Edit Maintenance Record"
              : "Add Maintenance Record"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {!vehicleId && (
            <div className="grid gap-2">
              <Label htmlFor="vehicle">Vehicle *</Label>
              <Select
                value={selectedVehicleId}
                onValueChange={setSelectedVehicleId}
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
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="maintenanceType">Maintenance Type *</Label>
              <Select
                value={maintenanceType}
                onValueChange={setMaintenanceType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {maintenanceTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="maintenanceDate">Maintenance Date *</Label>
              <Input
                id="maintenanceDate"
                type="date"
                value={maintenanceDate}
                onChange={(e) => setMaintenanceDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the maintenance performed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cost">Cost (NGN) *</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mileageAtService">Mileage at Service (km)</Label>
              <Input
                id="mileageAtService"
                type="number"
                step="0.01"
                value={mileageAtService}
                onChange={(e) => setMileageAtService(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="performedBy">Performed By</Label>
              <Input
                id="performedBy"
                value={performedBy}
                onChange={(e) => setPerformedBy(e.target.value)}
                placeholder="e.g., 'In-house', 'ABC Mechanics'"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nextServiceDue">Next Service Due</Label>
              <Input
                id="nextServiceDue"
                value={nextServiceDue}
                onChange={(e) => setNextServiceDue(e.target.value)}
                placeholder="e.g., '10,000 km' or '3 months'"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={saving}>
            {saving ? "Saving..." : "Save Record"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
