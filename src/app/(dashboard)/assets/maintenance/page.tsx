import MaintenanceOverview from "@/components/assets/maintenance-overview";
import { Suspense } from "react";
import { requireAssetAccess } from "@/actions/auth/dal";

export default async function AssetMaintenancePage() {
  await requireAssetAccess();

  return (
    <div className="p-6">
      <Suspense
        fallback={
          <div className="p-6 text-center">
            <p className="text-muted-foreground">Loading maintenance...</p>
          </div>
        }
      >
        <MaintenanceOverview />
      </Suspense>
    </div>
  );
}
