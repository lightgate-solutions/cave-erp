import LocationsList from "@/components/assets/locations-list";
import { Suspense } from "react";
import { requireAssetAccess } from "@/actions/auth/dal";

export default async function AssetLocationsPage() {
  await requireAssetAccess();

  return (
    <div className="p-6">
      <Suspense
        fallback={
          <div className="p-6 text-center">
            <p className="text-muted-foreground">Loading locations...</p>
          </div>
        }
      >
        <LocationsList />
      </Suspense>
    </div>
  );
}
