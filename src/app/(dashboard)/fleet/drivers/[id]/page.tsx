import DriverProfile from "@/components/fleet/drivers/driver-profile";
import { Suspense } from "react";

interface DriverProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function DriverProfilePage({
  params,
}: DriverProfilePageProps) {
  const { id } = await params;
  return (
    <div className="p-6">
      <Suspense
        fallback={
          <div className="p-6 text-center">
            <p className="text-muted-foreground">Loading driver profile...</p>
          </div>
        }
      >
        <DriverProfile driverId={id} />
      </Suspense>
    </div>
  );
}
