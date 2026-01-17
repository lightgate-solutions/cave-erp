import AssetDashboard from "@/components/assets/asset-dashboard";
import { Suspense } from "react";
import { requireAssetAccess } from "@/actions/auth/dal";

export default async function AssetDashboardPage() {
  await requireAssetAccess();

  return (
    <div className="p-6">
      <Suspense
        fallback={
          <div className="p-6 text-center">
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        }
      >
        <AssetDashboard />
      </Suspense>
    </div>
  );
}
