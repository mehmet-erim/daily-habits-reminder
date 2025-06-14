"use client";

export interface NotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  sound?: string;
  vibrate?: number[];
}

export interface NotificationPermissionState {
  permission: NotificationPermission;
  supported: boolean;
}

/**
 * Check if notifications are supported in the current environment
 */
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Get current notification permission state
 */
export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) {
    return { permission: "denied", supported: false };
  }

  return {
    permission: Notification.permission,
    supported: true,
  };
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    return "denied";
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return "denied";
  }
}

/**
 * Show a browser notification
 */
export function showNotification(
  options: NotificationOptions
): Notification | null {
  if (!isNotificationSupported()) {
    console.warn("Notifications not supported");
    return null;
  }

  if (Notification.permission !== "granted") {
    console.warn("Notification permission not granted");
    return null;
  }

  try {
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || "/favicon.ico",
      badge: options.badge,
      tag: options.tag,
      requireInteraction: options.requireInteraction || false,
      silent: options.silent || false,
    });

    // Handle vibration if specified and supported
    if (options.vibrate && "vibrate" in navigator) {
      navigator.vibrate(options.vibrate);
    }

    // Handle sound if specified
    if (options.sound && !options.silent) {
      playNotificationSound(options.sound);
    }

    return notification;
  } catch (error) {
    console.error("Error showing notification:", error);
    return null;
  }
}

/**
 * Play notification sound
 */
export function playNotificationSound(soundFile: string): void {
  try {
    const audio = new Audio(soundFile);
    audio.volume = 0.5; // Set to 50% volume by default
    audio.play().catch((error) => {
      console.warn("Could not play notification sound:", error);
    });
  } catch (error) {
    console.warn("Error creating audio for notification:", error);
  }
}

/**
 * Create a reminder notification
 */
export function showReminderNotification(
  title: string,
  description?: string,
  category?: string,
  soundEnabled: boolean = true,
  customSound?: string
): Notification | null {
  const defaultSound = "/sounds/notification.mp3";
  const sound = customSound || defaultSound;

  return showNotification({
    title,
    body: description || "Time for your wellness reminder!",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: `reminder-${Date.now()}`,
    requireInteraction: true,
    silent: !soundEnabled,
    sound: soundEnabled ? sound : undefined,
    vibrate: [200, 100, 200], // Two short vibrations
  });
}

/**
 * Close notification by tag
 */
export function closeNotificationByTag(tag: string): void {
  if (!isNotificationSupported()) return;

  // Note: This is limited by browser APIs - we can only close notifications
  // that were created by the same origin and are still active
  try {
    // This is a workaround as there's no direct way to close notifications by tag
    // The notification will auto-close based on requireInteraction setting
    console.log(`Attempting to close notification with tag: ${tag}`);
  } catch (error) {
    console.warn("Could not close notification:", error);
  }
}

/**
 * Test notification functionality
 */
export async function testNotification(): Promise<boolean> {
  const permission = await requestNotificationPermission();

  if (permission !== "granted") {
    return false;
  }

  const notification = showNotification({
    title: "Test Notification",
    body: "Notifications are working correctly!",
    tag: "test-notification",
  });

  return notification !== null;
}

/**
 * Get default notification settings
 */
export function getDefaultNotificationSettings() {
  return {
    enabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    requireInteraction: true,
    customSound: "/sounds/notification.mp3",
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
  };
}

/**
 * Check if current time is within quiet hours
 */
export function isWithinQuietHours(
  quietHoursStart: string,
  quietHoursEnd: string,
  timezone: string = "UTC"
): boolean {
  try {
    const now = new Date();
    const startTime = new Date();
    const endTime = new Date();

    // Parse time strings (HH:MM format)
    const [startHour, startMinute] = quietHoursStart.split(":").map(Number);
    const [endHour, endMinute] = quietHoursEnd.split(":").map(Number);

    startTime.setHours(startHour, startMinute, 0, 0);
    endTime.setHours(endHour, endMinute, 0, 0);

    // Handle overnight quiet hours (e.g., 22:00 to 07:00)
    if (endTime < startTime) {
      // If current time is after start time, check if it's before midnight
      if (now >= startTime) {
        return true;
      }
      // If current time is before end time, check if it's after midnight
      if (now <= endTime) {
        return true;
      }
      return false;
    }

    // Handle same-day quiet hours (e.g., 13:00 to 14:00)
    return now >= startTime && now <= endTime;
  } catch (error) {
    console.error("Error checking quiet hours:", error);
    return false;
  }
}
