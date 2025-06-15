/**
 * @jest-environment jsdom
 */

import {
  debounce,
  throttle,
  measurePerformance,
  createIntersectionObserver,
  calculateVirtualScrollRange,
  initializePerformanceMonitoring,
  getPerformanceMetrics,
} from "@/lib/performance";

describe("Performance Utilities", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe("debounce", () => {
    it("should debounce function calls", () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      // Call multiple times rapidly
      debouncedFn();
      debouncedFn();
      debouncedFn();

      // Function should not be called yet
      expect(mockFn).not.toHaveBeenCalled();

      // Fast forward time
      jest.advanceTimersByTime(100);

      // Now function should be called once
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it("should pass arguments to debounced function", () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn("arg1", "arg2");
      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith("arg1", "arg2");
    });

    it("should reset timer on subsequent calls", () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      jest.advanceTimersByTime(50);
      debouncedFn(); // This should reset the timer

      jest.advanceTimersByTime(50);
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("throttle", () => {
    it("should throttle function calls", () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      // First call should execute immediately
      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(1);

      // Subsequent calls should be throttled
      throttledFn();
      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(1);

      // After throttle period, next call should execute
      jest.advanceTimersByTime(100);
      throttledFn();
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it("should pass arguments to throttled function", () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      throttledFn("arg1", "arg2");
      expect(mockFn).toHaveBeenCalledWith("arg1", "arg2");
    });
  });

  describe("measurePerformance", () => {
    it("should measure performance of a function", () => {
      const performanceSpy = jest
        .spyOn(performance, "now")
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(100);

      const decorator = measurePerformance("testFunction");
      const result = decorator();

      expect(performanceSpy).toHaveBeenCalledTimes(2);
      expect(result).toBeUndefined();
    });
  });

  describe("createIntersectionObserver", () => {
    it("should create intersection observer when supported", () => {
      const mockCallback = jest.fn();
      const observer = createIntersectionObserver(mockCallback);

      expect(observer).toBeInstanceOf(IntersectionObserver);
    });

    it("should return null when IntersectionObserver is not supported", () => {
      // Mock environment without IntersectionObserver
      const originalIntersectionObserver = global.IntersectionObserver;
      delete (global as any).IntersectionObserver;

      const mockCallback = jest.fn();
      const observer = createIntersectionObserver(mockCallback);

      expect(observer).toBeNull();

      // Restore
      global.IntersectionObserver = originalIntersectionObserver;
    });

    it("should use default options", () => {
      const mockCallback = jest.fn();
      const observer = createIntersectionObserver(mockCallback);

      expect(observer).toBeDefined();
    });
  });

  describe("calculateVirtualScrollRange", () => {
    const config = {
      itemHeight: 50,
      containerHeight: 300,
      overscan: 2,
    };

    it("should calculate visible range correctly", () => {
      const result = calculateVirtualScrollRange(100, 100, config);

      expect(result).toEqual({
        start: 0, // Math.max(0, 2 - 2) = 0
        end: 7, // Math.min(99, 8 + 2) = 7
        offsetY: 0,
      });
    });

    it("should handle scrolling", () => {
      const result = calculateVirtualScrollRange(250, 100, config);

      expect(result.start).toBeGreaterThanOrEqual(0);
      expect(result.end).toBeLessThanOrEqual(99);
      expect(result.offsetY).toBeGreaterThanOrEqual(0);
    });

    it("should respect overscan parameter", () => {
      const configWithLargeOverscan = { ...config, overscan: 5 };
      const result = calculateVirtualScrollRange(
        100,
        100,
        configWithLargeOverscan
      );

      // Should include more items due to larger overscan
      expect(result.end - result.start).toBeGreaterThanOrEqual(10);
    });
  });

  describe("Performance Monitoring", () => {
    it("should initialize performance monitoring", () => {
      const monitor = initializePerformanceMonitoring();
      expect(monitor).toBeDefined();
    });

    it("should get performance metrics", () => {
      initializePerformanceMonitoring();
      const metrics = getPerformanceMetrics();

      expect(typeof metrics).toBe("object");
    });

    it("should handle server-side environment", () => {
      // Mock server environment
      const originalWindow = global.window;
      delete (global as any).window;

      const monitor = initializePerformanceMonitoring();
      expect(monitor).toBeNull();

      // Restore
      global.window = originalWindow;
    });
  });
});
