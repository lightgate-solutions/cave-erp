import VehicleProfile from "@/components/fleet/vehicles/vehicle-profile";
import { Suspense } from "react";

interface VehicleProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function VehicleProfilePage({
  params,
}: VehicleProfilePageProps) {
  const { id } = await params;
  return (
    <div className="p-6">
      <Suspense
        fallback={
          <div className="p-6 text-center">
            <p className="text-muted-foreground">Loading vehicle profile...</p>
          </div>
        }
      >
        <VehicleProfile vehicleId={id} />
      </Suspense>
    </div>
  );
}
