"use client";

import { useCallback, useMemo, useRef, useEffect, useState } from "react";
import { debounce, throttle } from "@/lib/mobile-utils";

// Hook for lazy loading with intersection observer
export function useLazyLoading(threshold = 0.1, rootMargin = "50px") {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (!("IntersectionObserver" in window)) {
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.unobserve(element);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin]);

  return { ref, isIntersecting };
}

// Hook for memoized expensive computations
export function useExpensiveComputation<T>(
  computeFn: () => T,
  deps: React.DependencyList
): T {
  return useMemo(computeFn, deps);
}

// Hook for debounced values
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook for throttled callbacks
export function useThrottle<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const throttledFn = useMemo(
    () => throttle(callback, delay),
    [callback, delay]
  );

  return throttledFn as T;
}

// Hook for debounced callbacks
export function useDebounceCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const debouncedFn = useMemo(
    () => debounce(callback, delay),
    [callback, delay]
  );

  return debouncedFn as T;
}

// Hook for virtual scrolling
export function useVirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 3,
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      items.length - 1,
      start + Math.ceil(containerHeight / itemHeight)
    );

    const startIndex = Math.max(0, start - overscan);
    const endIndex = Math.min(items.length - 1, end + overscan);

    return {
      start: startIndex,
      end: endIndex,
      offsetY: startIndex * itemHeight,
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1);
  }, [items, visibleRange.start, visibleRange.end]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY: visibleRange.offsetY,
    onScroll: handleScroll,
  };
}

// Hook for performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const mountTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

  useEffect(() => {
    mountTime.current = performance.now();

    return () => {
      const unmountTime = performance.now();
      const lifespan = unmountTime - mountTime.current;

      if (process.env.NODE_ENV === "development") {
        console.log(
          `${componentName} - Lifespan: ${lifespan.toFixed(2)}ms, Renders: ${
            renderCount.current
          }`
        );
      }
    };
  }, [componentName]);

  useEffect(() => {
    renderCount.current += 1;
  });

  const measureOperation = useCallback(
    <T>(operation: () => T, operationName: string): T => {
      const start = performance.now();
      const result = operation();
      const end = performance.now();

      if (process.env.NODE_ENV === "development") {
        console.log(
          `${componentName}.${operationName} took ${(end - start).toFixed(2)}ms`
        );
      }

      return result;
    },
    [componentName]
  );

  return { measureOperation };
}

// Hook for image lazy loading
export function useImageLazyLoading(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || "");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const { ref, isIntersecting } = useLazyLoading();

  useEffect(() => {
    if (!isIntersecting) return;

    const img = new Image();

    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
    };

    img.onerror = () => {
      setIsError(true);
    };

    img.src = src;
  }, [isIntersecting, src]);

  return {
    ref,
    src: imageSrc,
    isLoaded,
    isError,
    isIntersecting,
  };
}

// Hook for memory usage monitoring
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<{
    used: number;
    total: number;
    limit: number;
  } | null>(null);

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ("memory" in performance) {
        const memory = (performance as any).memory;
        setMemoryInfo({
          used: Math.round(memory.usedJSHeapSize / 1048576), // MB
          total: Math.round(memory.totalJSHeapSize / 1048576), // MB
          limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
        });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const isMemoryPressure = useMemo(() => {
    if (!memoryInfo) return false;
    return memoryInfo.used / memoryInfo.limit > 0.8; // 80% threshold
  }, [memoryInfo]);

  return {
    memoryInfo,
    isMemoryPressure,
  };
}

// Hook for preloading resources
export function useResourcePreloader() {
  const preloadedResources = useRef<Set<string>>(new Set());

  const preloadImage = useCallback((src: string) => {
    if (preloadedResources.current.has(src)) return;

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = src;
    document.head.appendChild(link);

    preloadedResources.current.add(src);
  }, []);

  const preloadScript = useCallback((src: string) => {
    if (preloadedResources.current.has(src)) return;

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "script";
    link.href = src;
    document.head.appendChild(link);

    preloadedResources.current.add(src);
  }, []);

  const preloadFont = useCallback((src: string) => {
    if (preloadedResources.current.has(src)) return;

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "font";
    link.type = "font/woff2";
    link.crossOrigin = "anonymous";
    link.href = src;
    document.head.appendChild(link);

    preloadedResources.current.add(src);
  }, []);

  return {
    preloadImage,
    preloadScript,
    preloadFont,
  };
}

// Hook for optimistic updates
export function useOptimisticUpdate<T>(
  initialValue: T,
  updateFn: (value: T) => Promise<T>
) {
  const [value, setValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const update = useCallback(
    async (optimisticValue: T) => {
      const previousValue = value;

      // Apply optimistic update immediately
      setValue(optimisticValue);
      setIsLoading(true);
      setError(null);

      try {
        const newValue = await updateFn(optimisticValue);
        setValue(newValue);
      } catch (err) {
        // Revert to previous value on error
        setValue(previousValue);
        setError(err instanceof Error ? err : new Error("Update failed"));
      } finally {
        setIsLoading(false);
      }
    },
    [value, updateFn]
  );

  return {
    value,
    update,
    isLoading,
    error,
  };
}

// Hook for batch updates
export function useBatchUpdates<T>(delay = 100) {
  const [items, setItems] = useState<T[]>([]);
  const batchRef = useRef<T[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const addToBatch = useCallback(
    (item: T) => {
      batchRef.current.push(item);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setItems((prev) => [...prev, ...batchRef.current]);
        batchRef.current = [];
        timeoutRef.current = null;
      }, delay);
    },
    [delay]
  );

  const flushBatch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (batchRef.current.length > 0) {
      setItems((prev) => [...prev, ...batchRef.current]);
      batchRef.current = [];
    }
  }, []);

  const clearBatch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    batchRef.current = [];
    setItems([]);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    items,
    addToBatch,
    flushBatch,
    clearBatch,
  };
}
