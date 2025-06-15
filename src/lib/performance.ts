// Performance monitoring and optimization utilities
import React from "react";

// Performance metrics tracking
export interface PerformanceMetrics {
  navigationStart: number;
  domContentLoaded: number;
  loadComplete: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
  memoryUsage?: MemoryInfo;
  connectionType?: string;
}

// Performance observer for tracking metrics
class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window !== "undefined") {
      this.initializeObservers();
    }
  }

  private initializeObservers() {
    this.trackNavigationTiming();
    this.trackPaintTiming();
    this.trackLayoutShift();
    this.trackFirstInputDelay();
    this.trackMemoryUsage();
    this.trackConnectionInfo();
  }

  private trackNavigationTiming() {
    const navigation = performance.getEntriesByType(
      "navigation"
    )[0] as PerformanceNavigationTiming;
    if (navigation) {
      this.metrics.navigationStart = navigation.fetchStart;
      this.metrics.domContentLoaded =
        navigation.domContentLoadedEventEnd - navigation.fetchStart;
      this.metrics.loadComplete =
        navigation.loadEventEnd - navigation.fetchStart;
    }
  }

  private trackPaintTiming() {
    const paintEntries = performance.getEntriesByType("paint");
    paintEntries.forEach((entry) => {
      if (entry.name === "first-paint") {
        this.metrics.firstPaint = entry.startTime;
      } else if (entry.name === "first-contentful-paint") {
        this.metrics.firstContentfulPaint = entry.startTime;
      }
    });

    if ("PerformanceObserver" in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.largestContentfulPaint = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
        this.observers.push(lcpObserver);
      } catch (e) {
        console.warn("LCP observer not supported");
      }
    }
  }

  private trackLayoutShift() {
    if ("PerformanceObserver" in window) {
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          this.metrics.cumulativeLayoutShift = clsValue;
        });
        clsObserver.observe({ entryTypes: ["layout-shift"] });
        this.observers.push(clsObserver);
      } catch (e) {
        console.warn("CLS observer not supported");
      }
    }
  }

  private trackFirstInputDelay() {
    if ("PerformanceObserver" in window) {
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.metrics.firstInputDelay =
              (entry as any).processingStart - entry.startTime;
          }
        });
        fidObserver.observe({ entryTypes: ["first-input"] });
        this.observers.push(fidObserver);
      } catch (e) {
        console.warn("FID observer not supported");
      }
    }
  }

  private trackMemoryUsage() {
    if ("memory" in performance) {
      this.metrics.memoryUsage = (performance as any).memory;
    }
  }

  private trackConnectionInfo() {
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;
      this.metrics.connectionType = connection.effectiveType;
    }
  }

  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  dispose() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

// Global performance monitor instance
let performanceMonitor: PerformanceMonitor | null = null;

export function initializePerformanceMonitoring() {
  if (typeof window !== "undefined" && !performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
}

export function getPerformanceMetrics(): Partial<PerformanceMetrics> {
  return performanceMonitor?.getMetrics() || {};
}

// Performance optimization utilities

// Debounce function for performance-critical events
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Throttle function for high-frequency events
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Intersection Observer for lazy loading
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null {
  if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
    return null;
  }

  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: "50px",
    threshold: 0.1,
    ...options,
  };

  return new IntersectionObserver(callback, defaultOptions);
}

// Virtual scrolling helper
export interface VirtualScrollConfig {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function calculateVirtualScrollRange(
  scrollTop: number,
  totalItems: number,
  config: VirtualScrollConfig
) {
  const { itemHeight, containerHeight, overscan = 3 } = config;

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    totalItems - 1,
    visibleStart + Math.ceil(containerHeight / itemHeight)
  );

  const start = Math.max(0, visibleStart - overscan);
  const end = Math.min(totalItems - 1, visibleEnd + overscan);

  return {
    start,
    end,
    offsetY: start * itemHeight,
    visibleItems: end - start + 1,
  };
}

// Memory management utilities
export function createMemoryMonitor() {
  const getMemoryUsage = () => {
    if ("memory" in performance) {
      const memoryInfo = (performance as any).memory;
      return {
        used: Math.round(memoryInfo.usedJSHeapSize / 1048576), // MB
        total: Math.round(memoryInfo.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memoryInfo.jsHeapSizeLimit / 1048576), // MB
      };
    }
    return null;
  };

  const isMemoryPressure = () => {
    const memory = getMemoryUsage();
    if (!memory) return false;

    return memory.used / memory.limit > 0.8; // 80% threshold
  };

  return {
    getMemoryUsage,
    isMemoryPressure,
  };
}

// Performance timing decorator
export function measurePerformance(name: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = performance.now();
      const result = await originalMethod.apply(this, args);
      const end = performance.now();

      console.log(`${name} took ${(end - start).toFixed(2)}ms`);

      return result;
    };

    return descriptor;
  };
}

// Request animation frame utilities
export function rafScheduler(callback: () => void): number {
  return requestAnimationFrame(callback);
}

export function rafThrottle<T extends (...args: any[]) => void>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;

  return (...args: Parameters<T>) => {
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        func(...args);
        rafId = null;
      });
    }
  };
}

// Image optimization utilities
export interface ImageOptimizationOptions {
  quality?: number;
  format?: "webp" | "avif" | "jpeg" | "png";
  width?: number;
  height?: number;
  priority?: boolean;
}

export function getOptimizedImageUrl(
  src: string,
  options: ImageOptimizationOptions = {}
): string {
  const { quality = 75, format = "webp", width, height } = options;

  const params = new URLSearchParams();

  if (width) params.append("w", width.toString());
  if (height) params.append("h", height.toString());
  if (quality !== 75) params.append("q", quality.toString());
  if (format !== "webp") params.append("f", format);

  const query = params.toString();
  return query ? `${src}?${query}` : src;
}

// Resource preloading
export function preloadResource(href: string, as: string, type?: string) {
  if (typeof document === "undefined") return;

  const link = document.createElement("link");
  link.rel = "preload";
  link.href = href;
  link.as = as;
  if (type) link.type = type;

  document.head.appendChild(link);
}

// Critical resource hints
export function addResourceHints() {
  if (typeof document === "undefined") return;

  const domains = ["//fonts.googleapis.com", "//fonts.gstatic.com"];

  domains.forEach((domain) => {
    const link = document.createElement("link");
    link.rel = "dns-prefetch";
    link.href = domain;
    document.head.appendChild(link);
  });
}

// Performance budget checker
export interface PerformanceBudget {
  fcp?: number; // First Contentful Paint (ms)
  lcp?: number; // Largest Contentful Paint (ms)
  fid?: number; // First Input Delay (ms)
  cls?: number; // Cumulative Layout Shift
  bundleSize?: number; // Bundle size (KB)
}

export function checkPerformanceBudget(
  metrics: Partial<PerformanceMetrics>,
  budget: PerformanceBudget
): { passed: boolean; violations: string[] } {
  const violations: string[] = [];

  if (
    budget.fcp &&
    metrics.firstContentfulPaint &&
    metrics.firstContentfulPaint > budget.fcp
  ) {
    violations.push(
      `FCP: ${metrics.firstContentfulPaint}ms (budget: ${budget.fcp}ms)`
    );
  }

  if (
    budget.lcp &&
    metrics.largestContentfulPaint &&
    metrics.largestContentfulPaint > budget.lcp
  ) {
    violations.push(
      `LCP: ${metrics.largestContentfulPaint}ms (budget: ${budget.lcp}ms)`
    );
  }

  if (
    budget.fid &&
    metrics.firstInputDelay &&
    metrics.firstInputDelay > budget.fid
  ) {
    violations.push(
      `FID: ${metrics.firstInputDelay}ms (budget: ${budget.fid}ms)`
    );
  }

  if (
    budget.cls &&
    metrics.cumulativeLayoutShift &&
    metrics.cumulativeLayoutShift > budget.cls
  ) {
    violations.push(
      `CLS: ${metrics.cumulativeLayoutShift} (budget: ${budget.cls})`
    );
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}

// React performance utilities
export const PerformanceProfiler: React.FC<{
  id: string;
  children: React.ReactNode;
  onRender?: (id: string, phase: string, actualDuration: number) => void;
}> = ({ id, children, onRender }) => {
  const handleRender = React.useCallback(
    (profilerId: string, phase: "mount" | "update", actualDuration: number) => {
      if (onRender) {
        onRender(profilerId, phase, actualDuration);
      } else if (process.env.NODE_ENV === "development") {
        console.log(`${profilerId} (${phase}): ${actualDuration.toFixed(2)}ms`);
      }
    },
    [onRender]
  );

  return (
    <React.Profiler id={id} onRender={handleRender}>
      {children}
    </React.Profiler>
  );
};
