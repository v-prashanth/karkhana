'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,    // 5 minutes before considering data stale
            gcTime: 1000 * 60 * 60 * 24, // Keep cache in memory for 24 hours!
            retry: 3,                    // Retry 3 times for flaky warehouse connections
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
            refetchOnWindowFocus: true,  // Important: Since we have long stale times, we want fresh data when they reopen the app
            networkMode: 'offlineFirst', // CRITICAL: Always return cache immediately, even if offline
          },
          mutations: {
            networkMode: 'offlineFirst',
          }
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
