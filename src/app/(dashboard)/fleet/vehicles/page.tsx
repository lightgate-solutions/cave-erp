import VehiclesList from "@/components/fleet/vehicles/vehicles-list";
import { Suspense } from "react";

export default async function VehiclesPage() {
  return (
    <div className="p-6">
      <Suspense
        fallback={
          <div className="p-6 text-center">
            <p className="text-muted-foreground">Loading vehicles...</p>
          </div>
        }
      >
        <VehiclesList />
      </Suspense>
    </div>
  );
}
