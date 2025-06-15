"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { isMobileDevice } from "@/lib/mobile-utils";
import { RefreshCw, ArrowDown } from "lucide-react";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void> | void;
  disabled?: boolean;
  threshold?: number; // Distance needed to trigger refresh
  resistance?: number; // How much resistance when pulling
  className?: string;
  showIndicator?: boolean;
  refreshingText?: string;
  pullText?: string;
  releaseText?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  threshold = 80,
  resistance = 2.5,
  className,
  showIndicator = true,
  refreshingText = "Refreshing...",
  pullText = "Pull to refresh",
  releaseText = "Release to refresh",
}: PullToRefreshProps) {
  const [pullState, setPullState] = useState({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0,
    canRelease: false,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isScrolling = useRef(false);

  const haptic = useHapticFeedback();

  // Check if we're at the top of the scroll container
  const isAtTop = useCallback(() => {
    if (!containerRef.current) return false;
    return containerRef.current.scrollTop === 0;
  }, []);

  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      if (disabled || !isMobileDevice() || !isAtTop()) return;

      startY.current = event.touches[0].clientY;
      currentY.current = startY.current;
      isScrolling.current = false;
    },
    [disabled, isAtTop]
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (disabled || !isMobileDevice() || pullState.isRefreshing) return;

      currentY.current = event.touches[0].clientY;
      const deltaY = currentY.current - startY.current;

      // Only handle downward pulls when at top
      if (deltaY > 0 && isAtTop()) {
        isScrolling.current = false;
        event.preventDefault(); // Prevent default scroll behavior

        const pullDistance = Math.min(deltaY / resistance, threshold * 1.5);
        const canRelease = pullDistance >= threshold;

        setPullState((prev) => ({
          ...prev,
          isPulling: true,
          pullDistance,
          canRelease,
        }));

        // Haptic feedback when reaching threshold
        if (canRelease && !pullState.canRelease) {
          haptic.feedback.impact();
        }
      } else {
        isScrolling.current = true;
        setPullState((prev) => ({
          ...prev,
          isPulling: false,
          pullDistance: 0,
          canRelease: false,
        }));
      }
    },
    [
      disabled,
      pullState.isRefreshing,
      pullState.canRelease,
      isAtTop,
      resistance,
      threshold,
      haptic,
    ]
  );

  const handleTouchEnd = useCallback(async () => {
    if (disabled || !isMobileDevice() || pullState.isRefreshing) return;

    if (pullState.canRelease && pullState.isPulling) {
      setPullState((prev) => ({
        ...prev,
        isRefreshing: true,
        isPulling: false,
      }));

      haptic.feedback.pullToRefresh();

      try {
        await onRefresh();
      } catch (error) {
        console.error("Refresh failed:", error);
        haptic.feedback.error();
      } finally {
        setPullState({
          isPulling: false,
          isRefreshing: false,
          pullDistance: 0,
          canRelease: false,
        });
      }
    } else {
      setPullState({
        isPulling: false,
        isRefreshing: false,
        pullDistance: 0,
        canRelease: false,
      });
    }
  }, [
    disabled,
    pullState.canRelease,
    pullState.isPulling,
    pullState.isRefreshing,
    onRefresh,
    haptic,
  ]);

  // Attach event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  const indicatorOpacity = Math.min(pullState.pullDistance / threshold, 1);
  const indicatorScale = Math.min(pullState.pullDistance / threshold, 1);
  const rotationAngle = pullState.isRefreshing
    ? 360
    : Math.min((pullState.pullDistance / threshold) * 180, 180);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-auto h-full",
        pullState.isPulling && "select-none",
        className
      )}
      style={{
        transform: pullState.isPulling
          ? `translateY(${Math.min(pullState.pullDistance, threshold)}px)`
          : undefined,
        transition: pullState.isPulling ? "none" : "transform 0.3s ease-out",
      }}
    >
      {/* Pull to Refresh Indicator */}
      {showIndicator && (pullState.isPulling || pullState.isRefreshing) && (
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center justify-center min-h-16 p-4"
          style={{
            transform: `translateY(-100%) translateX(-50%) scale(${indicatorScale})`,
            opacity: indicatorOpacity,
          }}
        >
          <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-4 py-2 border border-border shadow-lg">
            {pullState.isRefreshing ? (
              <RefreshCw className="h-5 w-5 text-primary animate-spin" />
            ) : (
              <ArrowDown
                className="h-5 w-5 text-muted-foreground transition-transform duration-200"
                style={{
                  transform: `rotate(${rotationAngle}deg)`,
                }}
              />
            )}
            <span className="text-sm font-medium text-foreground">
              {pullState.isRefreshing
                ? refreshingText
                : pullState.canRelease
                ? releaseText
                : pullText}
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className={cn(
          "min-h-full",
          pullState.isPulling && "pointer-events-none"
        )}
      >
        {children}
      </div>
    </div>
  );
}

// Hook for pull-to-refresh functionality
export function usePullToRefresh(
  onRefresh: () => Promise<void> | void,
  options: {
    disabled?: boolean;
    threshold?: number;
    resistance?: number;
  } = {}
) {
  const { disabled = false, threshold = 80, resistance = 2.5 } = options;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const haptic = useHapticFeedback();

  const refresh = useCallback(async () => {
    if (disabled || isRefreshing) return;

    setIsRefreshing(true);
    haptic.feedback.pullToRefresh();

    try {
      await onRefresh();
    } catch (error) {
      console.error("Refresh failed:", error);
      haptic.feedback.error();
    } finally {
      setIsRefreshing(false);
    }
  }, [disabled, isRefreshing, onRefresh, haptic]);

  return {
    isRefreshing,
    refresh,
    canRefresh: !disabled && !isRefreshing,
  };
}
