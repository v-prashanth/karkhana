'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,       // 5 minutes cache before considering stale
            gcTime: 1000 * 60 * 60 * 24,    // Keep cache in memory for 24 hours
            retry: 1,                       // Fast 1-retry fallback
            refetchOnWindowFocus: false,    // Prevent laggy refetch freezes on window focus
            refetchOnReconnect: false,      // Prevent refetch lag on network reconnect
            networkMode: 'offlineFirst',    // Return cached data instantly
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
