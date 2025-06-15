"use client";

import { useCallback } from "react";

export type HapticPattern =
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "warning"
  | "error"
  | "notification"
  | "selection"
  | "impact"
  | "double"
  | "triple";

interface HapticOptions {
  enabled?: boolean;
  intensity?: number; // 0-1 for intensity (if supported)
}

// Predefined vibration patterns
const VIBRATION_PATTERNS: Record<HapticPattern, number[]> = {
  light: [50],
  medium: [100],
  heavy: [200],
  success: [50, 50, 100],
  warning: [100, 50, 100, 50, 100],
  error: [200, 100, 200],
  notification: [100, 50, 100],
  selection: [25],
  impact: [150],
  double: [50, 50, 50],
  triple: [50, 50, 50, 50, 50],
};

export function useHapticFeedback(options: HapticOptions = {}) {
  const { enabled = true } = options;

  // Check if vibration API is supported
  const isVibrationSupported = useCallback(() => {
    return "vibrate" in navigator;
  }, []);

  // Check if the Vibration API or iOS Haptic Feedback is available
  const isHapticSupported = useCallback(() => {
    return (
      isVibrationSupported() ||
      // iOS Safari has haptic feedback through touch events
      /iPad|iPhone|iPod/.test(navigator.userAgent)
    );
  }, [isVibrationSupported]);

  // Trigger vibration with pattern
  const vibrate = useCallback(
    (pattern: number | number[]) => {
      if (!enabled || !isVibrationSupported()) {
        return false;
      }

      try {
        return navigator.vibrate(pattern);
      } catch (error) {
        console.warn("Vibration failed:", error);
        return false;
      }
    },
    [enabled, isVibrationSupported]
  );

  // Trigger haptic feedback by pattern type
  const triggerHaptic = useCallback(
    (pattern: HapticPattern = "light") => {
      if (!enabled) return false;

      const vibrationPattern = VIBRATION_PATTERNS[pattern];
      return vibrate(vibrationPattern);
    },
    [enabled, vibrate]
  );

  // Cancel any ongoing vibration
  const cancelVibration = useCallback(() => {
    if (isVibrationSupported()) {
      navigator.vibrate(0);
    }
  }, [isVibrationSupported]);

  // Specific feedback for common UI interactions
  const feedback = {
    // Button press feedback
    buttonPress: () => triggerHaptic("light"),

    // Success actions (completing a task, saving, etc.)
    success: () => triggerHaptic("success"),

    // Error actions (failed operation, validation error)
    error: () => triggerHaptic("error"),

    // Warning actions (destructive action confirmation)
    warning: () => triggerHaptic("warning"),

    // Notification received
    notification: () => triggerHaptic("notification"),

    // Selection changed (switches, radio buttons)
    selection: () => triggerHaptic("selection"),

    // Impact feedback (drag and drop, collision)
    impact: () => triggerHaptic("impact"),

    // Swipe actions
    swipeComplete: () => triggerHaptic("medium"),
    swipeDismiss: () => triggerHaptic("light"),
    swipeSnooze: () => triggerHaptic("double"),

    // Long press
    longPress: () => triggerHaptic("heavy"),

    // Pull to refresh
    pullToRefresh: () => triggerHaptic("medium"),

    // Tab switching
    tabSwitch: () => triggerHaptic("selection"),
  };

  // iOS-specific haptic feedback (if available)
  const iosHaptic = useCallback(
    (type: "light" | "medium" | "heavy" = "light") => {
      if (!enabled) return;

      // iOS devices might have specific haptic feedback
      // This is a fallback to regular vibration
      const patterns = {
        light: [50],
        medium: [100],
        heavy: [200],
      };

      vibrate(patterns[type]);
    },
    [enabled, vibrate]
  );

  return {
    // Core functions
    triggerHaptic,
    vibrate,
    cancelVibration,

    // Utility functions
    isSupported: isHapticSupported,
    isVibrationSupported,

    // Predefined feedback patterns
    feedback,

    // iOS-specific
    iosHaptic,

    // Configuration
    enabled,
  };
}

// Hook for specific UI component haptic feedback
export function useUIHaptics(
  componentType: "button" | "card" | "form" | "navigation" = "button"
) {
  const haptic = useHapticFeedback();

  const getHapticForAction = useCallback(
    (action: string) => {
      switch (componentType) {
        case "button":
          switch (action) {
            case "press":
              return haptic.feedback.buttonPress;
            case "success":
              return haptic.feedback.success;
            case "error":
              return haptic.feedback.error;
            case "warning":
              return haptic.feedback.warning;
            default:
              return haptic.feedback.buttonPress;
          }
        case "card":
          switch (action) {
            case "swipe":
              return haptic.feedback.swipeComplete;
            case "tap":
              return haptic.feedback.selection;
            case "longPress":
              return haptic.feedback.longPress;
            default:
              return haptic.feedback.selection;
          }
        case "form":
          switch (action) {
            case "submit":
              return haptic.feedback.success;
            case "error":
              return haptic.feedback.error;
            case "change":
              return haptic.feedback.selection;
            default:
              return haptic.feedback.selection;
          }
        case "navigation":
          switch (action) {
            case "tab":
              return haptic.feedback.tabSwitch;
            case "back":
              return haptic.feedback.buttonPress;
            case "menu":
              return haptic.feedback.buttonPress;
            default:
              return haptic.feedback.buttonPress;
          }
        default:
          return haptic.feedback.buttonPress;
      }
    },
    [componentType, haptic.feedback]
  );

  return {
    ...haptic,
    trigger: getHapticForAction,
  };
}
