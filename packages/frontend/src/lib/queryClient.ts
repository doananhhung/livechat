// src/lib/queryClient.ts
// QueryClient instance shared across the application.
// Extracted to a separate module to prevent circular dependencies.

import { QueryClient } from "@tanstack/react-query";

/**
 * Global QueryClient instance for React Query.
 * 
 * Configuration:
 * - staleTime: Data is considered fresh for 5 minutes
 * - gcTime: Inactive data stays in cache for 10 minutes
 * - refetchOnWindowFocus: Disabled to prevent unnecessary requests
 * - refetchOnReconnect: Enabled to refresh data when connection is restored
 * - retry: Limited to 1 retry on failure
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});
