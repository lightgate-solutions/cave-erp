import AssetsList from "@/components/assets/assets-list";
import { Suspense } from "react";
import { requireAssetAccess } from "@/actions/auth/dal";

export default async function AssetsListPage() {
  await requireAssetAccess();

  return (
    <div className="p-6">
      <Suspense
        fallback={
          <div className="p-6 text-center">
            <p className="text-muted-foreground">Loading assets...</p>
          </div>
        }
      >
        <AssetsList />
      </Suspense>
    </div>
  );
}
