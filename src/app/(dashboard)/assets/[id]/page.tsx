import AssetDetail from "@/components/assets/asset-detail";
import { Suspense } from "react";
import { requireAssetAccess } from "@/actions/auth/dal";

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAssetAccess();
  const { id } = await params;

  return (
    <div className="p-6">
      <Suspense
        fallback={
          <div className="p-6 text-center">
            <p className="text-muted-foreground">Loading asset...</p>
          </div>
        }
      >
        <AssetDetail assetId={Number(id)} />
      </Suspense>
    </div>
  );
}
