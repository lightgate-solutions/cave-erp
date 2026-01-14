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

interface Driver {
  id?: number;
  name?: string;
  email?: string | null;
  phone?: string | null;
  licenseNumber?: string;
  licenseExpiryDate?: Date | string | null;
  licenseClass?: string | null;
  dateOfBirth?: Date | string | null;
  hireDate?: Date | string | null;
  status?: string;
  notes?: string | null;
}

interface DriverFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver?: Driver | null;
  onSuccess?: () => void;
}

const driverStatuses = ["Active", "Inactive", "Suspended"];

export function DriverFormDialog({
  open,
  onOpenChange,
  driver,
  onSuccess,
}: DriverFormDialogProps) {
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseExpiryDate, setLicenseExpiryDate] = useState("");
  const [licenseClass, setLicenseClass] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [hireDate, setHireDate] = useState("");
  const [status, setStatus] = useState("Active");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;

    if (driver) {
      setName(driver.name || "");
      setEmail(driver.email || "");
      setPhone(driver.phone || "");
      setLicenseNumber(driver.licenseNumber || "");
      setLicenseExpiryDate(
        driver.licenseExpiryDate
          ? new Date(driver.licenseExpiryDate).toISOString().split("T")[0]
          : "",
      );
      setLicenseClass(driver.licenseClass || "");
      setDateOfBirth(
        driver.dateOfBirth
          ? new Date(driver.dateOfBirth).toISOString().split("T")[0]
          : "",
      );
      setHireDate(
        driver.hireDate
          ? new Date(driver.hireDate).toISOString().split("T")[0]
          : "",
      );
      setStatus(driver.status || "Active");
      setNotes(driver.notes || "");
    } else {
      // Reset form
      setName("");
      setEmail("");
      setPhone("");
      setLicenseNumber("");
      setLicenseExpiryDate("");
      setLicenseClass("");
      setDateOfBirth("");
      setHireDate("");
      setStatus("Active");
      setNotes("");
    }
  }, [open, driver]);

  async function onSubmit() {
    // Validation
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!licenseNumber.trim()) {
      toast.error("License number is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        licenseNumber: licenseNumber.trim(),
        licenseExpiryDate: licenseExpiryDate || null,
        licenseClass: licenseClass.trim() || null,
        dateOfBirth: dateOfBirth || null,
        hireDate: hireDate || null,
        status,
        notes: notes.trim() || null,
      };

      const url = driver?.id
        ? `/api/fleet/drivers/${driver.id}`
        : "/api/fleet/drivers";
      const method = driver?.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save driver");
      }

      toast.success(
        `Driver ${driver?.id ? "updated" : "created"} successfully`,
      );

      onSuccess?.();
    } catch (_error) {
      toast.error("Failed to save driver");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {driver?.id ? "Edit Driver" : "Add New Driver"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {driverStatuses.map((s) => (
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="licenseNumber">License Number *</Label>
              <Input
                id="licenseNumber"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value.toUpperCase())}
                placeholder="License number"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="licenseClass">License Class</Label>
              <Input
                id="licenseClass"
                value={licenseClass}
                onChange={(e) => setLicenseClass(e.target.value)}
                placeholder="A, B, C, etc."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="licenseExpiryDate">License Expiry Date</Label>
              <Input
                id="licenseExpiryDate"
                type="date"
                value={licenseExpiryDate}
                onChange={(e) => setLicenseExpiryDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="hireDate">Hire Date</Label>
            <Input
              id="hireDate"
              type="date"
              value={hireDate}
              onChange={(e) => setHireDate(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this driver..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={saving}>
            {saving
              ? "Saving..."
              : driver?.id
                ? "Save Changes"
                : "Create Driver"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
