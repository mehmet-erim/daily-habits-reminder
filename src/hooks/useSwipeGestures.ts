"use client";

import { useCallback, useRef, useEffect } from "react";

export interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum distance for a swipe
  velocity?: number; // Minimum velocity for a swipe
  preventDefaultTouchmoveEvent?: boolean;
  deltaHorizontal?: number; // Horizontal distance threshold
  deltaVertical?: number; // Vertical distance threshold
  enabled?: boolean;
}

interface TouchData {
  startX: number;
  startY: number;
  startTime: number;
}

export function useSwipeGestures(options: SwipeGestureOptions = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    velocity = 0.3,
    preventDefaultTouchmoveEvent = false,
    deltaHorizontal = 50,
    deltaVertical = 50,
    enabled = true,
  } = options;

  const touchDataRef = useRef<TouchData | null>(null);

  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      if (!enabled) return;

      const touch = event.touches[0];
      touchDataRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now(),
      };
    },
    [enabled]
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (!enabled || !touchDataRef.current) return;

      if (preventDefaultTouchmoveEvent) {
        event.preventDefault();
      }
    },
    [enabled, preventDefaultTouchmoveEvent]
  );

  const handleTouchEnd = useCallback(
    (event: TouchEvent) => {
      if (!enabled || !touchDataRef.current) return;

      const touch = event.changedTouches[0];
      const touchData = touchDataRef.current;

      const deltaX = touch.clientX - touchData.startX;
      const deltaY = touch.clientY - touchData.startY;
      const deltaTime = Date.now() - touchData.startTime;

      const velocityX = Math.abs(deltaX) / deltaTime;
      const velocityY = Math.abs(deltaY) / deltaTime;

      // Check if the swipe meets the minimum requirements
      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
      const isVerticalSwipe = Math.abs(deltaY) > Math.abs(deltaX);

      if (
        isHorizontalSwipe &&
        Math.abs(deltaX) > deltaHorizontal &&
        velocityX > velocity
      ) {
        if (deltaX > threshold && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < -threshold && onSwipeLeft) {
          onSwipeLeft();
        }
      } else if (
        isVerticalSwipe &&
        Math.abs(deltaY) > deltaVertical &&
        velocityY > velocity
      ) {
        if (deltaY > threshold && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < -threshold && onSwipeUp) {
          onSwipeUp();
        }
      }

      touchDataRef.current = null;
    },
    [
      enabled,
      threshold,
      velocity,
      deltaHorizontal,
      deltaVertical,
      onSwipeLeft,
      onSwipeRight,
      onSwipeUp,
      onSwipeDown,
    ]
  );

  // Mouse events for desktop testing
  const mouseDataRef = useRef<{
    startX: number;
    startY: number;
    startTime: number;
  } | null>(null);

  const handleMouseDown = useCallback(
    (event: MouseEvent) => {
      if (!enabled) return;

      mouseDataRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        startTime: Date.now(),
      };
    },
    [enabled]
  );

  const handleMouseUp = useCallback(
    (event: MouseEvent) => {
      if (!enabled || !mouseDataRef.current) return;

      const mouseData = mouseDataRef.current;
      const deltaX = event.clientX - mouseData.startX;
      const deltaY = event.clientY - mouseData.startY;
      const deltaTime = Date.now() - mouseData.startTime;

      const velocityX = Math.abs(deltaX) / deltaTime;
      const velocityY = Math.abs(deltaY) / deltaTime;

      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
      const isVerticalSwipe = Math.abs(deltaY) > Math.abs(deltaX);

      if (
        isHorizontalSwipe &&
        Math.abs(deltaX) > deltaHorizontal &&
        velocityX > velocity
      ) {
        if (deltaX > threshold && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < -threshold && onSwipeLeft) {
          onSwipeLeft();
        }
      } else if (
        isVerticalSwipe &&
        Math.abs(deltaY) > deltaVertical &&
        velocityY > velocity
      ) {
        if (deltaY > threshold && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < -threshold && onSwipeUp) {
          onSwipeUp();
        }
      }

      mouseDataRef.current = null;
    },
    [
      enabled,
      threshold,
      velocity,
      deltaHorizontal,
      deltaVertical,
      onSwipeLeft,
      onSwipeRight,
      onSwipeUp,
      onSwipeDown,
    ]
  );

  const handlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
  };

  // Ref function to attach to DOM element
  const swipeRef = useCallback(
    (element: HTMLElement | null) => {
      if (!element || !enabled) return;

      element.addEventListener("touchstart", handleTouchStart, {
        passive: true,
      });
      element.addEventListener("touchmove", handleTouchMove, {
        passive: !preventDefaultTouchmoveEvent,
      });
      element.addEventListener("touchend", handleTouchEnd, { passive: true });
      element.addEventListener("mousedown", handleMouseDown);
      element.addEventListener("mouseup", handleMouseUp);

      return () => {
        element.removeEventListener("touchstart", handleTouchStart);
        element.removeEventListener("touchmove", handleTouchMove);
        element.removeEventListener("touchend", handleTouchEnd);
        element.removeEventListener("mousedown", handleMouseDown);
        element.removeEventListener("mouseup", handleMouseUp);
      };
    },
    [
      enabled,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
      handleMouseDown,
      handleMouseUp,
      preventDefaultTouchmoveEvent,
    ]
  );

  return {
    handlers,
    swipeRef,
  };
}

// Utility hook for common swipe patterns
export function useSwipeActions(actions: {
  onComplete?: () => void;
  onDismiss?: () => void;
  onSnooze?: () => void;
  onEdit?: () => void;
  enabled?: boolean;
}) {
  const { onComplete, onDismiss, onSnooze, onEdit, enabled = true } = actions;

  return useSwipeGestures({
    onSwipeRight: onComplete, // Swipe right to complete
    onSwipeLeft: onDismiss, // Swipe left to dismiss
    onSwipeUp: onSnooze, // Swipe up to snooze
    onSwipeDown: onEdit, // Swipe down to edit
    threshold: 60,
    velocity: 0.3,
    enabled,
  });
}
