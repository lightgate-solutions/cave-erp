"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Driver {
  name: string;
  email?: string | null;
  phone?: string | null;
  licenseNumber: string;
  licenseExpiryDate?: Date | string | null;
  licenseClass?: string | null;
  dateOfBirth?: Date | string | null;
  hireDate?: Date | string | null;
  status: string;
  notes?: string | null;
}

interface DriverDetailsTabProps {
  driver: Driver;
}

export function DriverDetailsTab({ driver }: DriverDetailsTabProps) {
  const formatDate = (date?: Date | string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Driver personal details</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Name</p>
            <p className="text-base">{driver.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <p className="text-base">{driver.status}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p className="text-base">{driver.email || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Phone</p>
            <p className="text-base">{driver.phone || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Date of Birth
            </p>
            <p className="text-base">{formatDate(driver.dateOfBirth)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Hire Date
            </p>
            <p className="text-base">{formatDate(driver.hireDate)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>License Information</CardTitle>
          <CardDescription>Driver's license details</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              License Number
            </p>
            <p className="text-base font-mono">{driver.licenseNumber}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              License Class
            </p>
            <p className="text-base">{driver.licenseClass || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Expiry Date
            </p>
            <p className="text-base">{formatDate(driver.licenseExpiryDate)}</p>
          </div>
        </CardContent>
      </Card>

      {driver.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base whitespace-pre-wrap">{driver.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
