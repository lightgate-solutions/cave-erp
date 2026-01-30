"use client";

import { useEffect, useState } from "react";

/**
 * Deferred Analytics Component
 * Loads Vercel Analytics and Speed Insights after hydration to avoid blocking initial render
 * Performance optimization: bundle-defer-third-party
 */
export function DeferredAnalytics() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Mark as mounted after hydration
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Dynamically import analytics components after hydration
  return (
    <>
      <LazyAnalytics />
      <LazySpeedInsights />
    </>
  );
}

function LazyAnalytics() {
  const [Analytics, setAnalytics] = useState<React.ComponentType<{
    mode?: string;
  }> | null>(null);

  useEffect(() => {
    import("@vercel/analytics/next")
      .then((mod) => {
        setAnalytics(() => mod.Analytics);
      })
      .catch((err) => {
        console.error("Failed to load Analytics:", err);
      });
  }, []);

  if (!Analytics) return null;

  return <Analytics mode="production" />;
}

function LazySpeedInsights() {
  const [SpeedInsights, setSpeedInsights] = useState<React.ComponentType<
    Record<string, never>
  > | null>(null);

  useEffect(() => {
    import("@vercel/speed-insights/next")
      .then((mod) => {
        setSpeedInsights(() => mod.SpeedInsights);
      })
      .catch((err) => {
        console.error("Failed to load SpeedInsights:", err);
      });
  }, []);

  if (!SpeedInsights) return null;

  return <SpeedInsights />;
}
