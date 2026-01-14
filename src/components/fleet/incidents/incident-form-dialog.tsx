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

interface Incident {
  id?: number;
  // Define incident properties based on schema
}

interface IncidentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incident?: Incident | null;
  vehicleId?: number;
  driverId?: number;
  onSuccess?: () => void;
}

const incidentTypes = ["Accident", "Damage", "Theft", "Breakdown", "Other"];
const severities = ["Minor", "Major", "Critical"];
const resolutionStatuses = [
  "Reported",
  "Under Investigation",
  "Resolved",
  "Closed",
];

export function IncidentFormDialog({
  open,
  onOpenChange,
  incident,
  vehicleId,
  driverId,
  onSuccess,
}: IncidentFormDialogProps) {
  const [saving, setSaving] = useState(false);

  // Form State
  const [selectedVehicleId, setSelectedVehicleId] = useState<
    string | undefined
  >(vehicleId?.toString());
  const [selectedDriverId, setSelectedDriverId] = useState<string | undefined>(
    driverId?.toString(),
  );
  const [incidentType, setIncidentType] = useState("");
  const [severity, setSeverity] = useState("Minor");
  const [incidentDate, setIncidentDate] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [resolutionStatus, setResolutionStatus] = useState("Reported");

  const { data: vehiclesData } = useQuery({
    queryKey: ["vehicles-list"],
    queryFn: async () =>
      fetch("/api/fleet/vehicles?limit=999").then((res) => res.json()),
    enabled: open && !vehicleId,
  });
  const vehicles = vehiclesData?.vehicles || [];

  const { data: driversData } = useQuery({
    queryKey: ["drivers-list"],
    queryFn: async () =>
      fetch("/api/fleet/drivers?limit=999").then((res) => res.json()),
    enabled: open,
  });
  const drivers = driversData?.drivers || [];

  useEffect(() => {
    if (!open) return;

    if (incident) {
      // Populate form for editing
    } else {
      // Reset form
      setSelectedVehicleId(vehicleId?.toString());
      setSelectedDriverId(driverId?.toString());
      setIncidentType("");
      setSeverity("Minor");
      setIncidentDate("");
      setLocation("");
      setDescription("");
      setEstimatedCost("");
      setResolutionStatus("Reported");
    }
  }, [open, incident, vehicleId, driverId]);

  async function onSubmit() {
    if (!selectedVehicleId) {
      toast.error("Vehicle is required");
      return;
    }
    if (!incidentType) {
      toast.error("Incident type is required");
      return;
    }
    if (!severity) {
      toast.error("Severity is required");
      return;
    }
    if (!incidentDate) {
      toast.error("Incident date is required");
      return;
    }
    if (!description) {
      toast.error("Description is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        vehicleId: Number(selectedVehicleId),
        driverId: selectedDriverId ? Number(selectedDriverId) : null,
        incidentType,
        severity,
        incidentDate,
        location: location.trim() || null,
        description,
        estimatedCost: estimatedCost ? Number(estimatedCost) : null,
        resolutionStatus,
      };

      const url = incident?.id
        ? `/api/fleet/incidents/${incident.id}`
        : "/api/fleet/incidents";
      const method = incident?.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save incident report");
      }

      toast.success(
        `Incident report ${incident?.id ? "updated" : "created"} successfully`,
      );

      onSuccess?.();
    } catch (_error) {
      toast.error("Failed to save incident report");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {incident?.id ? "Edit Incident Report" : "Report New Incident"}
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

          <div className="grid gap-2">
            <Label htmlFor="driver">Driver (if applicable)</Label>
            <Select
              value={selectedDriverId}
              onValueChange={setSelectedDriverId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a driver" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {drivers.map(
                  (d: { id: number; name: string; licenseNumber: string }) => (
                    <SelectItem key={d.id} value={d.id.toString()}>
                      {d.name} ({d.licenseNumber})
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="incidentType">Incident Type *</Label>
              <Select value={incidentType} onValueChange={setIncidentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {incidentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="severity">Severity *</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  {severities.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="incidentDate">Incident Date & Time *</Label>
              <Input
                id="incidentDate"
                type="datetime-local"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., 'I-95 North, Mile Marker 42'"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of what happened..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="estimatedCost">Estimated Cost (NGN)</Label>
              <Input
                id="estimatedCost"
                type="number"
                step="0.01"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Resolution Status</Label>
              <Select
                value={resolutionStatus}
                onValueChange={setResolutionStatus}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {resolutionStatuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={saving}>
            {saving ? "Saving..." : "Save Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
