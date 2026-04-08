"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for 5 seconds (prevents unnecessary refetches)
            staleTime: 5 * 1000,
            // Keep unused data in cache for 10 minutes
            gcTime: 10 * 60 * 1000,
            // Don't refetch on window focus by default (can be overridden per query)
            refetchOnWindowFocus: false,
            // Retry failed requests once
            retry: 1,
            // Deduplicate identical requests within 2 seconds
            refetchOnMount: false,
          },
          mutations: {
            // Retry mutations once on failure
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
