"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Vehicle {
  make: string;
  model: string;
  year: number;
  vin?: string | null;
  licensePlate: string;
  color?: string | null;
  currentMileage: string;
  fuelType: string;
  status: string;
  purchaseDate?: Date | string | null;
  purchasePrice?: string | null;
  currentValue?: string | null;
  depreciationRate?: string | null;
  insurancePolicyNumber?: string | null;
  insuranceProvider?: string | null;
  insuranceExpiryDate?: Date | string | null;
  insurancePremiumAmount?: string | null;
  registrationNumber?: string | null;
  registrationExpiryDate?: Date | string | null;
  notes?: string | null;
}

interface VehicleDetailsTabProps {
  vehicle: Vehicle;
}

export function VehicleDetailsTab({ vehicle }: VehicleDetailsTabProps) {
  const formatDate = (date?: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  const formatCurrency = (amount?: string | null) => {
    if (!amount) return "N/A";
    return `₦${Number(amount).toLocaleString()}`;
  };

  const formatNumber = (num?: string | null) => {
    if (!num) return "N/A";
    return Number(num).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Core vehicle details</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Make</p>
            <p className="text-base">{vehicle.make}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Model</p>
            <p className="text-base">{vehicle.model}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Year</p>
            <p className="text-base">{vehicle.year}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              License Plate
            </p>
            <p className="text-base font-mono">{vehicle.licensePlate}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">VIN</p>
            <p className="text-base font-mono">{vehicle.vin || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Color</p>
            <p className="text-base">{vehicle.color || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Fuel Type
            </p>
            <p className="text-base">{vehicle.fuelType}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <p className="text-base">{vehicle.status}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Operational Details</CardTitle>
          <CardDescription>Current operational information</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Current Mileage
            </p>
            <p className="text-base">
              {formatNumber(vehicle.currentMileage)} km
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ownership Information</CardTitle>
          <CardDescription>Purchase and depreciation details</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Purchase Date
            </p>
            <p className="text-base">{formatDate(vehicle.purchaseDate)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Purchase Price
            </p>
            <p className="text-base">{formatCurrency(vehicle.purchasePrice)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Current Value
            </p>
            <p className="text-base">{formatCurrency(vehicle.currentValue)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Depreciation Rate
            </p>
            <p className="text-base">
              {vehicle.depreciationRate
                ? `${vehicle.depreciationRate}%`
                : "N/A"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Insurance Details</CardTitle>
          <CardDescription>Insurance coverage information</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Policy Number
            </p>
            <p className="text-base font-mono">
              {vehicle.insurancePolicyNumber || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Provider
            </p>
            <p className="text-base">{vehicle.insuranceProvider || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Expiry Date
            </p>
            <p className="text-base">
              {formatDate(vehicle.insuranceExpiryDate)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Premium Amount
            </p>
            <p className="text-base">
              {formatCurrency(vehicle.insurancePremiumAmount)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registration Details</CardTitle>
          <CardDescription>Vehicle registration information</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Registration Number
            </p>
            <p className="text-base font-mono">
              {vehicle.registrationNumber || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Expiry Date
            </p>
            <p className="text-base">
              {formatDate(vehicle.registrationExpiryDate)}
            </p>
          </div>
        </CardContent>
      </Card>

      {vehicle.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base whitespace-pre-wrap">{vehicle.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
