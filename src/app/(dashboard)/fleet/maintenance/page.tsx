import MaintenanceList from "@/components/fleet/maintenance/maintenance-list";
import { Suspense } from "react";

export default async function MaintenancePage() {
  return (
    <div className="p-6">
      <Suspense
        fallback={
          <div className="p-6 text-center">
            <p className="text-muted-foreground">
              Loading maintenance records...
            </p>
          </div>
        }
      >
        <MaintenanceList />
      </Suspense>
    </div>
  );
}
