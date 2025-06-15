"use client";

import React, { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useSwipeActions } from "@/hooks/useSwipeGestures";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  X,
  Clock,
  Edit,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface SwipeableCardProps {
  children: React.ReactNode;
  onComplete?: () => void;
  onDismiss?: () => void;
  onSnooze?: () => void;
  onEdit?: () => void;
  disabled?: boolean;
  className?: string;
  enableHapticFeedback?: boolean;
  showSwipeIndicators?: boolean;
  swipeThreshold?: number;
}

interface SwipeIndicatorProps {
  direction: "left" | "right" | "up" | "down";
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  progress: number;
  visible: boolean;
}

function SwipeIndicator({
  direction,
  icon: Icon,
  label,
  color,
  progress,
  visible,
}: SwipeIndicatorProps) {
  const position = {
    left: "left-4 top-1/2 -translate-y-1/2",
    right: "right-4 top-1/2 -translate-y-1/2",
    up: "top-4 left-1/2 -translate-x-1/2",
    down: "bottom-4 left-1/2 -translate-x-1/2",
  };

  return (
    <div
      className={cn(
        "absolute pointer-events-none transition-all duration-300 z-10",
        position[direction],
        visible ? "opacity-100 scale-100" : "opacity-0 scale-90"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium",
          color,
          "backdrop-blur-sm"
        )}
        style={{
          transform: `scale(${Math.min(progress, 1)})`,
        }}
      >
        <Icon className="h-4 w-4" />
        <span className="hidden sm:inline">{label}</span>
      </div>
    </div>
  );
}

export function SwipeableCard({
  children,
  onComplete,
  onDismiss,
  onSnooze,
  onEdit,
  disabled = false,
  className,
  enableHapticFeedback = true,
  showSwipeIndicators = true,
  swipeThreshold = 80,
}: SwipeableCardProps) {
  const [swipeState, setSwipeState] = useState({
    isDragging: false,
    direction: null as "left" | "right" | "up" | "down" | null,
    progress: 0,
  });

  const cardRef = useRef<HTMLDivElement>(null);
  const startPositionRef = useRef({ x: 0, y: 0 });
  const currentPositionRef = useRef({ x: 0, y: 0 });

  const haptic = useHapticFeedback({ enabled: enableHapticFeedback });

  // Handle swipe completion
  const handleSwipeComplete = useCallback(
    (action: "complete" | "dismiss" | "snooze" | "edit") => {
      if (disabled) return;

      setSwipeState((prev) => ({
        ...prev,
        isDragging: false,
        direction: null,
        progress: 0,
      }));

      // Trigger haptic feedback
      switch (action) {
        case "complete":
          haptic.feedback.success();
          onComplete?.();
          break;
        case "dismiss":
          haptic.feedback.swipeDismiss();
          onDismiss?.();
          break;
        case "snooze":
          haptic.feedback.swipeSnooze();
          onSnooze?.();
          break;
        case "edit":
          haptic.feedback.selection();
          onEdit?.();
          break;
      }

      // Reset card position
      if (cardRef.current) {
        cardRef.current.style.transform = "";
        cardRef.current.style.transition = "transform 0.3s ease-out";

        setTimeout(() => {
          if (cardRef.current) {
            cardRef.current.style.transition = "";
          }
        }, 300);
      }
    },
    [disabled, haptic, onComplete, onDismiss, onSnooze, onEdit]
  );

  // Custom touch handling for visual feedback
  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (disabled) return;

      const touch = event.touches[0];
      startPositionRef.current = { x: touch.clientX, y: touch.clientY };
      currentPositionRef.current = { x: touch.clientX, y: touch.clientY };

      setSwipeState((prev) => ({ ...prev, isDragging: true }));

      if (cardRef.current) {
        cardRef.current.style.transition = "";
      }
    },
    [disabled]
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent) => {
      if (disabled || !swipeState.isDragging) return;

      const touch = event.touches[0];
      currentPositionRef.current = { x: touch.clientX, y: touch.clientY };

      const deltaX = touch.clientX - startPositionRef.current.x;
      const deltaY = touch.clientY - startPositionRef.current.y;

      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
      const direction = isHorizontal
        ? deltaX > 0
          ? "right"
          : "left"
        : deltaY > 0
        ? "down"
        : "up";

      const distance = isHorizontal ? Math.abs(deltaX) : Math.abs(deltaY);
      const progress = Math.min(distance / swipeThreshold, 1);

      setSwipeState((prev) => ({
        ...prev,
        direction,
        progress,
      }));

      // Visual feedback - move the card slightly
      if (cardRef.current) {
        const maxTransform = 20; // Maximum pixels to move
        const transformX = isHorizontal
          ? Math.max(-maxTransform, Math.min(maxTransform, deltaX * 0.3))
          : 0;
        const transformY = !isHorizontal
          ? Math.max(-maxTransform, Math.min(maxTransform, deltaY * 0.3))
          : 0;

        cardRef.current.style.transform = `translate(${transformX}px, ${transformY}px) scale(${
          1 - progress * 0.05
        })`;
      }

      // Haptic feedback at threshold
      if (progress >= 0.7 && !swipeState.direction) {
        haptic.feedback.impact();
      }
    },
    [
      disabled,
      swipeState.isDragging,
      swipeState.direction,
      swipeThreshold,
      haptic,
    ]
  );

  const handleTouchEnd = useCallback(() => {
    if (disabled || !swipeState.isDragging) return;

    setSwipeState((prev) => ({
      ...prev,
      isDragging: false,
      direction: null,
      progress: 0,
    }));

    // Reset card position
    if (cardRef.current) {
      cardRef.current.style.transform = "";
      cardRef.current.style.transition = "transform 0.3s ease-out";

      setTimeout(() => {
        if (cardRef.current) {
          cardRef.current.style.transition = "";
        }
      }, 300);
    }
  }, [disabled, swipeState.isDragging]);

  // Use swipe gestures hook
  const { swipeRef } = useSwipeActions({
    onComplete: () => handleSwipeComplete("complete"),
    onDismiss: () => handleSwipeComplete("dismiss"),
    onSnooze: () => handleSwipeComplete("snooze"),
    onEdit: () => handleSwipeComplete("edit"),
    enabled: !disabled,
  });

  // Combine refs
  const combinedRef = useCallback(
    (element: HTMLDivElement | null) => {
      cardRef.current = element;
      swipeRef(element);
    },
    [swipeRef]
  );

  const swipeIndicators = [
    {
      direction: "right" as const,
      icon: CheckCircle2,
      label: "Complete",
      color: "bg-green-400/20 text-green-400 border border-green-400/30",
      visible: onComplete !== undefined,
    },
    {
      direction: "left" as const,
      icon: X,
      label: "Dismiss",
      color: "bg-red-400/20 text-red-400 border border-red-400/30",
      visible: onDismiss !== undefined,
    },
    {
      direction: "up" as const,
      icon: Clock,
      label: "Snooze",
      color: "bg-yellow-400/20 text-yellow-400 border border-yellow-400/30",
      visible: onSnooze !== undefined,
    },
    {
      direction: "down" as const,
      icon: Edit,
      label: "Edit",
      color: "bg-blue-400/20 text-blue-400 border border-blue-400/30",
      visible: onEdit !== undefined,
    },
  ];

  return (
    <div className="relative">
      <Card
        ref={combinedRef}
        className={cn(
          "relative transition-all duration-200 ease-out",
          swipeState.isDragging && "cursor-grabbing",
          !disabled && "cursor-grab",
          disabled && "opacity-50 cursor-not-allowed",
          "touch-pan-y", // Allow vertical scrolling
          className
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <CardContent className="p-4">{children}</CardContent>

        {/* Swipe Indicators */}
        {showSwipeIndicators && !disabled && swipeState.isDragging && (
          <>
            {swipeIndicators
              .filter((indicator) => indicator.visible)
              .map((indicator) => (
                <SwipeIndicator
                  key={indicator.direction}
                  direction={indicator.direction}
                  icon={indicator.icon}
                  label={indicator.label}
                  color={indicator.color}
                  progress={
                    swipeState.direction === indicator.direction
                      ? swipeState.progress
                      : 0
                  }
                  visible={
                    swipeState.direction === indicator.direction &&
                    swipeState.progress > 0.2
                  }
                />
              ))}
          </>
        )}
      </Card>

      {/* Swipe Instructions (only show on first few uses) */}
      {showSwipeIndicators && !disabled && !swipeState.isDragging && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {onComplete && <ArrowRight className="h-3 w-3" />}
            {onDismiss && <ArrowLeft className="h-3 w-3" />}
            {onSnooze && <ArrowUp className="h-3 w-3" />}
            {onEdit && <ArrowDown className="h-3 w-3" />}
            <span className="ml-1">Swipe to interact</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Preset swipeable reminder card
export function SwipeableReminderCard({
  children,
  reminderId,
  onComplete,
  onDismiss,
  onSnooze,
  onEdit,
  disabled = false,
  className,
}: {
  children: React.ReactNode;
  reminderId: string;
  onComplete?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onSnooze?: (id: string) => void;
  onEdit?: (id: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <SwipeableCard
      onComplete={() => onComplete?.(reminderId)}
      onDismiss={() => onDismiss?.(reminderId)}
      onSnooze={() => onSnooze?.(reminderId)}
      onEdit={() => onEdit?.(reminderId)}
      disabled={disabled}
      className={className}
    >
      {children}
    </SwipeableCard>
  );
}
