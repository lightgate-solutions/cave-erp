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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface Vehicle {
  id?: number;
  make?: string;
  model?: string;
  year?: number;
  vin?: string | null;
  licensePlate?: string;
  color?: string | null;
  currentMileage?: string;
  fuelType?: string;
  status?: string;
  purchaseDate?: Date | null;
  purchasePrice?: string | null;
  currentValue?: string | null;
  depreciationRate?: string | null;
  insurancePolicyNumber?: string | null;
  insuranceProvider?: string | null;
  insuranceExpiryDate?: Date | null;
  insurancePremiumAmount?: string | null;
  registrationNumber?: string | null;
  registrationExpiryDate?: Date | null;
  notes?: string | null;
}

interface VehicleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: Vehicle | null;
  onSuccess?: () => void;
}

const fuelTypes = ["Petrol", "Diesel", "Electric", "Hybrid", "CNG", "Other"];
const vehicleStatuses = ["Active", "Inactive", "Maintenance"];

export function VehicleFormDialog({
  open,
  onOpenChange,
  vehicle,
  onSuccess,
}: VehicleFormDialogProps) {
  const [saving, setSaving] = useState(false);

  // Basic Information
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [vin, setVin] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [color, setColor] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [status, setStatus] = useState("Active");

  // Operational Details
  const [currentMileage, setCurrentMileage] = useState("0");

  // Ownership
  const [purchaseDate, setPurchaseDate] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [depreciationRate, setDepreciationRate] = useState("");

  // Insurance
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState("");
  const [insuranceProvider, setInsuranceProvider] = useState("");
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState("");
  const [insurancePremiumAmount, setInsurancePremiumAmount] = useState("");

  // Registration
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [registrationExpiryDate, setRegistrationExpiryDate] = useState("");

  // Notes
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;

    if (vehicle) {
      setMake(vehicle.make || "");
      setModel(vehicle.model || "");
      setYear(vehicle.year?.toString() || "");
      setVin(vehicle.vin || "");
      setLicensePlate(vehicle.licensePlate || "");
      setColor(vehicle.color || "");
      setFuelType(vehicle.fuelType || "");
      setStatus(vehicle.status || "Active");
      setCurrentMileage(vehicle.currentMileage || "0");
      setPurchaseDate(
        vehicle.purchaseDate
          ? new Date(vehicle.purchaseDate).toISOString().split("T")[0]
          : "",
      );
      setPurchasePrice(vehicle.purchasePrice || "");
      setCurrentValue(vehicle.currentValue || "");
      setDepreciationRate(vehicle.depreciationRate || "");
      setInsurancePolicyNumber(vehicle.insurancePolicyNumber || "");
      setInsuranceProvider(vehicle.insuranceProvider || "");
      setInsuranceExpiryDate(
        vehicle.insuranceExpiryDate
          ? new Date(vehicle.insuranceExpiryDate).toISOString().split("T")[0]
          : "",
      );
      setInsurancePremiumAmount(vehicle.insurancePremiumAmount || "");
      setRegistrationNumber(vehicle.registrationNumber || "");
      setRegistrationExpiryDate(
        vehicle.registrationExpiryDate
          ? new Date(vehicle.registrationExpiryDate).toISOString().split("T")[0]
          : "",
      );
      setNotes(vehicle.notes || "");
    } else {
      // Reset form
      setMake("");
      setModel("");
      setYear("");
      setVin("");
      setLicensePlate("");
      setColor("");
      setFuelType("");
      setStatus("Active");
      setCurrentMileage("0");
      setPurchaseDate("");
      setPurchasePrice("");
      setCurrentValue("");
      setDepreciationRate("");
      setInsurancePolicyNumber("");
      setInsuranceProvider("");
      setInsuranceExpiryDate("");
      setInsurancePremiumAmount("");
      setRegistrationNumber("");
      setRegistrationExpiryDate("");
      setNotes("");
    }
  }, [open, vehicle]);

  async function onSubmit() {
    // Validation
    if (!make.trim()) {
      toast.error("Make is required");
      return;
    }
    if (!model.trim()) {
      toast.error("Model is required");
      return;
    }
    if (
      !year ||
      Number(year) < 1900 ||
      Number(year) > new Date().getFullYear() + 1
    ) {
      toast.error("Valid year is required");
      return;
    }
    if (!licensePlate.trim()) {
      toast.error("License plate is required");
      return;
    }
    if (!fuelType) {
      toast.error("Fuel type is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        make: make.trim(),
        model: model.trim(),
        year: Number(year),
        vin: vin.trim() || null,
        licensePlate: licensePlate.trim(),
        color: color.trim() || null,
        currentMileage: currentMileage ? Number(currentMileage) : 0,
        fuelType,
        status,
        purchaseDate: purchaseDate || null,
        purchasePrice: purchasePrice ? Number(purchasePrice) : null,
        currentValue: currentValue ? Number(currentValue) : null,
        depreciationRate: depreciationRate ? Number(depreciationRate) : null,
        insurancePolicyNumber: insurancePolicyNumber.trim() || null,
        insuranceProvider: insuranceProvider.trim() || null,
        insuranceExpiryDate: insuranceExpiryDate || null,
        insurancePremiumAmount: insurancePremiumAmount
          ? Number(insurancePremiumAmount)
          : null,
        registrationNumber: registrationNumber.trim() || null,
        registrationExpiryDate: registrationExpiryDate || null,
        notes: notes.trim() || null,
      };

      const url = vehicle?.id
        ? `/api/fleet/vehicles/${vehicle.id}`
        : "/api/fleet/vehicles";
      const method = vehicle?.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save vehicle");
      }

      toast.success(
        `Vehicle ${vehicle?.id ? "updated" : "created"} successfully`,
      );

      onSuccess?.();
    } catch (_error) {
      toast.error("Failed to save vehicle");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {vehicle?.id ? "Edit Vehicle" : "Add New Vehicle"}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="operational">Operational</TabsTrigger>
            <TabsTrigger value="ownership">Ownership</TabsTrigger>
            <TabsTrigger value="insurance">Insurance</TabsTrigger>
            <TabsTrigger value="registration">Registration</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="make">Make *</Label>
                <Input
                  id="make"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  placeholder="Toyota, Ford, etc."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Camry, F-150, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="year">Year *</Label>
                <Input
                  id="year"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="2024"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="licensePlate">License Plate *</Label>
                <Input
                  id="licensePlate"
                  value={licensePlate}
                  onChange={(e) =>
                    setLicensePlate(e.target.value.toUpperCase())
                  }
                  placeholder="ABC-1234"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="vin">VIN</Label>
                <Input
                  id="vin"
                  value={vin}
                  onChange={(e) => setVin(e.target.value.toUpperCase())}
                  placeholder="Vehicle Identification Number"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="White, Black, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fuelType">Fuel Type *</Label>
                <Select value={fuelType} onValueChange={setFuelType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    {fuelTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status *</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleStatuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="operational" className="space-y-4 mt-4">
            <div className="grid gap-2">
              <Label htmlFor="currentMileage">Current Mileage (km)</Label>
              <Input
                id="currentMileage"
                type="number"
                step="0.01"
                value={currentMileage}
                onChange={(e) => setCurrentMileage(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about this vehicle..."
                rows={4}
              />
            </div>
          </TabsContent>

          <TabsContent value="ownership" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="purchasePrice">Purchase Price (NGN)</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  step="0.01"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="currentValue">Current Value (NGN)</Label>
                <Input
                  id="currentValue"
                  type="number"
                  step="0.01"
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="depreciationRate">Depreciation Rate (%)</Label>
                <Input
                  id="depreciationRate"
                  type="number"
                  step="0.01"
                  value={depreciationRate}
                  onChange={(e) => setDepreciationRate(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="insurance" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="insurancePolicyNumber">Policy Number</Label>
                <Input
                  id="insurancePolicyNumber"
                  value={insurancePolicyNumber}
                  onChange={(e) => setInsurancePolicyNumber(e.target.value)}
                  placeholder="Policy number"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="insuranceProvider">Insurance Provider</Label>
                <Input
                  id="insuranceProvider"
                  value={insuranceProvider}
                  onChange={(e) => setInsuranceProvider(e.target.value)}
                  placeholder="Provider name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="insuranceExpiryDate">Expiry Date</Label>
                <Input
                  id="insuranceExpiryDate"
                  type="date"
                  value={insuranceExpiryDate}
                  onChange={(e) => setInsuranceExpiryDate(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="insurancePremiumAmount">
                  Premium Amount (NGN)
                </Label>
                <Input
                  id="insurancePremiumAmount"
                  type="number"
                  step="0.01"
                  value={insurancePremiumAmount}
                  onChange={(e) => setInsurancePremiumAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="registration" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="registrationNumber">Registration Number</Label>
                <Input
                  id="registrationNumber"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="Registration number"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="registrationExpiryDate">Expiry Date</Label>
                <Input
                  id="registrationExpiryDate"
                  type="date"
                  value={registrationExpiryDate}
                  onChange={(e) => setRegistrationExpiryDate(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={saving}>
            {saving
              ? "Saving..."
              : vehicle?.id
                ? "Save Changes"
                : "Create Vehicle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
