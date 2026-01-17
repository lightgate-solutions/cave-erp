import CategoriesList from "@/components/assets/categories-list";
import { Suspense } from "react";
import { requireAssetAccess } from "@/actions/auth/dal";

export default async function AssetCategoriesPage() {
  await requireAssetAccess();

  return (
    <div className="p-6">
      <Suspense
        fallback={
          <div className="p-6 text-center">
            <p className="text-muted-foreground">Loading categories...</p>
          </div>
        }
      >
        <CategoriesList />
      </Suspense>
    </div>
  );
}
