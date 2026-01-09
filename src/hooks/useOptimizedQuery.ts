import { useQuery, UseQueryOptions, QueryKey } from "@tanstack/react-query";
import { useMemo, useCallback } from "react";

/**
 * Optimized query hook with built-in performance patterns:
 * - Configurable stale times for different data freshness needs
 * - Background refetch on window focus (configurable)
 * - Automatic retry with exponential backoff
 * - Query key memoization
 */

type QueryFreshness = "realtime" | "fresh" | "stable" | "static";

const STALE_TIMES: Record<QueryFreshness, number> = {
  realtime: 0,           // Always refetch
  fresh: 30 * 1000,      // 30 seconds - for frequently changing data
  stable: 5 * 60 * 1000, // 5 minutes - for moderately stable data
  static: 30 * 60 * 1000 // 30 minutes - for rarely changing data
};

const GC_TIMES: Record<QueryFreshness, number> = {
  realtime: 5 * 60 * 1000,
  fresh: 10 * 60 * 1000,
  stable: 30 * 60 * 1000,
  static: 60 * 60 * 1000
};

interface UseOptimizedQueryOptions<TData, TError = Error> 
  extends Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> {
  freshness?: QueryFreshness;
  refetchOnWindowFocus?: boolean;
  backgroundRefetch?: boolean;
}

export function useOptimizedQuery<TData, TError = Error>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options: UseOptimizedQueryOptions<TData, TError> = {}
) {
  const {
    freshness = "stable",
    refetchOnWindowFocus = true,
    backgroundRefetch = true,
    ...restOptions
  } = options;

  // Memoize query key to prevent unnecessary refetches
  const memoizedKey = useMemo(() => queryKey, [JSON.stringify(queryKey)]);
  
  // Memoize query function
  const memoizedFn = useCallback(queryFn, []);

  return useQuery({
    queryKey: memoizedKey,
    queryFn: memoizedFn,
    staleTime: STALE_TIMES[freshness],
    gcTime: GC_TIMES[freshness],
    refetchOnWindowFocus: refetchOnWindowFocus,
    refetchOnMount: backgroundRefetch ? "always" : false,
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error instanceof Error && 'status' in error) {
        const status = (error as { status: number }).status;
        if (status >= 400 && status < 500) return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...restOptions
  });
}

/**
 * Prefetch helper for route-based prefetching
 */
export function createPrefetchConfig<TData>(
  queryFn: () => Promise<TData>,
  freshness: QueryFreshness = "stable"
) {
  return {
    queryFn,
    staleTime: STALE_TIMES[freshness],
    gcTime: GC_TIMES[freshness]
  };
}
