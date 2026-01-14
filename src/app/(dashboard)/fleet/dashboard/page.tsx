import FleetDashboard from "@/components/fleet/fleet-dashboard";
import { Suspense } from "react";

export default async function FleetDashboardPage() {
  return (
    <div className="p-6">
      <Suspense
        fallback={
          <div className="p-6 text-center">
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        }
      >
        <FleetDashboard />
      </Suspense>
    </div>
  );
}
