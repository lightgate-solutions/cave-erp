"use client";

import dynamic from "next/dynamic";

/**
 * Session + org switcher only exist on the client. `ssr: false` must live in a
 * Client Component (Next.js 15); the route `page.tsx` stays a Server Component.
 */
const FinancialReportsPage = dynamic(() => import("./financial-reports-page"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 p-6">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      <p className="text-sm text-muted-foreground">
        Loading financial reports…
      </p>
    </div>
  ),
});

export default function FinancialReportsLoader() {
  return <FinancialReportsPage />;
}
