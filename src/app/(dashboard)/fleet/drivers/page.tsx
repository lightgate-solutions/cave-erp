import DriversList from "@/components/fleet/drivers/drivers-list";
import { Suspense } from "react";

export default async function DriversPage() {
  return (
    <div className="p-6">
      <Suspense
        fallback={
          <div className="p-6 text-center">
            <p className="text-muted-foreground">Loading drivers...</p>
          </div>
        }
      >
        <DriversList />
      </Suspense>
    </div>
  );
}
