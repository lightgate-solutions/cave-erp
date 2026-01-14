import IncidentsList from "@/components/fleet/incidents/incidents-list";
import { Suspense } from "react";

export default async function IncidentsPage() {
  return (
    <div className="p-6">
      <Suspense
        fallback={
          <div className="p-6 text-center">
            <p className="text-muted-foreground">Loading incidents...</p>
          </div>
        }
      >
        <IncidentsList />
      </Suspense>
    </div>
  );
}
