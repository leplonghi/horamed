import { useState, useEffect, useRef, RefObject } from "react";

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

interface IntersectionObserverResult {
  ref: RefObject<HTMLDivElement>;
  isVisible: boolean;
  entry?: IntersectionObserverEntry;
}

/**
 * Hook to detect when an element enters the viewport.
 * Useful for lazy loading, animations on scroll, infinite scroll, etc.
 */
export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): IntersectionObserverResult {
  const {
    threshold = 0.1,
    root = null,
    rootMargin = "0px",
    freezeOnceVisible = false
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry>();
  const frozen = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (frozen.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;
        
        setIsVisible(isIntersecting);
        setEntry(entry);

        if (isIntersecting && freezeOnceVisible) {
          frozen.current = true;
          observer.disconnect();
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, freezeOnceVisible]);

  return { ref, isVisible, entry };
}

/**
 * Hook for infinite scroll / load more patterns.
 */
export function useInfiniteScroll(
  onLoadMore: () => void,
  options: {
    hasNextPage?: boolean;
    isLoading?: boolean;
    threshold?: number;
    rootMargin?: string;
  } = {}
) {
  const {
    hasNextPage = true,
    isLoading = false,
    threshold = 0.5,
    rootMargin = "100px"
  } = options;

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;
    if (!hasNextPage || isLoading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isLoading) {
          onLoadMore();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [onLoadMore, hasNextPage, isLoading, threshold, rootMargin]);

  return loadMoreRef;
}
