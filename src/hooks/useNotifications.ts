"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getNotificationPermission,
  requestNotificationPermission,
  showReminderNotification,
  testNotification,
  isWithinQuietHours,
  NotificationPermissionState,
} from "@/lib/notifications";

export interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  requireInteraction: boolean;
  customSound: string;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export interface UseNotificationsReturn {
  // Permission state
  permissionState: NotificationPermissionState;

  // Actions
  requestPermission: () => Promise<NotificationPermission>;
  showReminder: (
    title: string,
    description?: string,
    category?: string
  ) => void;
  testNotifications: () => Promise<boolean>;

  // Settings
  settings: NotificationSettings;
  updateSettings: (newSettings: Partial<NotificationSettings>) => void;

  // State
  isLoading: boolean;
  error: string | null;
}

const STORAGE_KEY = "wellness-notification-settings";

const defaultSettings: NotificationSettings = {
  enabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  requireInteraction: true,
  customSound: "/sounds/notification.mp3",
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
};

export function useNotifications(): UseNotificationsReturn {
  const [permissionState, setPermissionState] =
    useState<NotificationPermissionState>({
      permission: "default",
      supported: false,
    });
  const [settings, setSettings] =
    useState<NotificationSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize permission state and settings
  useEffect(() => {
    const initializeNotifications = () => {
      // Get current permission state
      const currentPermission = getNotificationPermission();
      setPermissionState(currentPermission);

      // Load settings from localStorage
      const savedSettings = localStorage.getItem(STORAGE_KEY);
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          setSettings({ ...defaultSettings, ...parsedSettings });
        } catch (error) {
          console.error("Error parsing notification settings:", error);
          setSettings(defaultSettings);
        }
      }
    };

    initializeNotifications();
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const requestPermission =
    useCallback(async (): Promise<NotificationPermission> => {
      setIsLoading(true);
      setError(null);

      try {
        const permission = await requestNotificationPermission();
        setPermissionState({
          permission,
          supported: true,
        });
        return permission;
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to request permission";
        setError(errorMessage);
        return "denied";
      } finally {
        setIsLoading(false);
      }
    }, []);

  const showReminder = useCallback(
    (title: string, description?: string, category?: string) => {
      // Check if notifications are enabled
      if (!settings.enabled) {
        console.log("Notifications are disabled");
        return;
      }

      // Check permission
      if (permissionState.permission !== "granted") {
        console.warn("Notification permission not granted");
        return;
      }

      // Check quiet hours
      if (settings.quietHoursEnabled) {
        const isQuietTime = isWithinQuietHours(
          settings.quietHoursStart,
          settings.quietHoursEnd
        );
        if (isQuietTime) {
          console.log("Notification suppressed due to quiet hours");
          return;
        }
      }

      try {
        showReminderNotification(
          title,
          description,
          category,
          settings.soundEnabled,
          settings.customSound
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to show notification";
        setError(errorMessage);
      }
    },
    [settings, permissionState.permission]
  );

  const testNotifications = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await testNotification();
      if (!success) {
        setError("Test notification failed");
      }
      return success;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Test notification failed";
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSettings = useCallback(
    (newSettings: Partial<NotificationSettings>) => {
      setSettings((current) => ({ ...current, ...newSettings }));
      setError(null);
    },
    []
  );

  return {
    permissionState,
    requestPermission,
    showReminder,
    testNotifications,
    settings,
    updateSettings,
    isLoading,
    error,
  };
}
