import { requireHROrAdmin } from "@/actions/auth/dal";
import { getAllOffers } from "@/actions/recruitment/offers";
import { OffersList } from "@/components/recruitment/offers-list";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default async function OffersPage() {
  await requireHROrAdmin();

  const offers = await getAllOffers();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Job Offers</h1>
        <p className="text-muted-foreground">View and manage all job offers</p>
      </div>

      <Suspense fallback={<OffersSkeleton />}>
        <OffersList offers={offers} />
      </Suspense>
    </div>
  );
}

function OffersSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-40 w-full" />
      ))}
    </div>
  );
}
