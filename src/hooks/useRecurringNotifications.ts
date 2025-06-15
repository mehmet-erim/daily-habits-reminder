"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RecurringReminderConfig,
  shouldSendRecurringNotification,
  processRecurringNotification,
  getNextRecurringNotification,
} from "@/lib/recurring-notifications";
import { parseDaysOfWeek } from "@/lib/validations";

interface UseRecurringNotificationsProps {
  reminders: RecurringReminderConfig[];
  checkInterval?: number; // in milliseconds, default 60000 (1 minute)
}

interface UseRecurringNotificationsReturn {
  isActive: boolean;
  nextNotifications: Array<{
    reminderId: string;
    nextTime: Date;
    title: string;
  }>;
  startScheduler: () => void;
  stopScheduler: () => void;
  processReminder: (reminderId: string) => boolean;
}

export function useRecurringNotifications({
  reminders,
  checkInterval = 60000, // Check every minute
}: UseRecurringNotificationsProps): UseRecurringNotificationsReturn {
  const [isActive, setIsActive] = useState(false);
  const [nextNotifications, setNextNotifications] = useState<
    Array<{
      reminderId: string;
      nextTime: Date;
      title: string;
    }>
  >([]);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  // Calculate next notifications for all reminders
  const updateNextNotifications = useCallback(() => {
    const next = reminders
      .filter((reminder) => reminder.isRecurring)
      .map((reminder) => {
        const nextTime = getNextRecurringNotification(reminder);
        return nextTime
          ? {
              reminderId: reminder.id,
              nextTime,
              title: reminder.title,
            }
          : null;
      })
      .filter(Boolean) as Array<{
      reminderId: string;
      nextTime: Date;
      title: string;
    }>;

    setNextNotifications(
      next.sort((a, b) => a.nextTime.getTime() - b.nextTime.getTime())
    );
  }, [reminders]);

  // Process all reminders and send notifications if needed
  const processAllReminders = useCallback(() => {
    const now = new Date();
    let sentCount = 0;

    reminders.forEach((reminder) => {
      if (reminder.isRecurring && processRecurringNotification(reminder)) {
        sentCount++;
        console.log(`Sent recurring notification for: ${reminder.title}`);
      }
    });

    if (sentCount > 0) {
      updateNextNotifications();
    }
  }, [reminders, updateNextNotifications]);

  // Process a specific reminder
  const processReminder = useCallback(
    (reminderId: string): boolean => {
      const reminder = reminders.find((r) => r.id === reminderId);
      if (!reminder) return false;

      const sent = processRecurringNotification(reminder);
      if (sent) {
        updateNextNotifications();
      }
      return sent;
    },
    [reminders, updateNextNotifications]
  );

  // Start the scheduler
  const startScheduler = useCallback(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }

    const id = setInterval(processAllReminders, checkInterval);
    setIntervalId(id);
    setIsActive(true);
    updateNextNotifications();
  }, [processAllReminders, checkInterval, intervalId, updateNextNotifications]);

  // Stop the scheduler
  const stopScheduler = useCallback(() => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setIsActive(false);
  }, [intervalId]);

  // Update next notifications when reminders change
  useEffect(() => {
    updateNextNotifications();
  }, [updateNextNotifications]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  return {
    isActive,
    nextNotifications,
    startScheduler,
    stopScheduler,
    processReminder,
  };
}

// Helper function to convert database reminder to RecurringReminderConfig
export function convertDbReminderToConfig(
  dbReminder: any
): RecurringReminderConfig {
  return {
    id: dbReminder.id,
    title: dbReminder.title,
    description: dbReminder.description,
    category: dbReminder.category,
    isRecurring: dbReminder.isRecurring || false,
    recurringInterval: dbReminder.recurringInterval || 30,
    recurringStartTime:
      dbReminder.recurringStartTime || dbReminder.reminderTime,
    recurringEndTime: dbReminder.recurringEndTime || "17:00",
    soundEnabled: dbReminder.soundEnabled,
    soundFile: dbReminder.soundFile,
    quietHoursEnabled: dbReminder.quietHoursEnabled,
    quietHoursStart: dbReminder.quietHoursStart,
    quietHoursEnd: dbReminder.quietHoursEnd,
    timezone: dbReminder.timezone,
    daysOfWeek: parseDaysOfWeek(dbReminder.daysOfWeek),
  };
}

// Helper function to get active recurring reminders
export async function fetchActiveRecurringReminders(): Promise<
  RecurringReminderConfig[]
> {
  try {
    const response = await fetch("/api/reminders?active=true");
    if (!response.ok) {
      throw new Error("Failed to fetch reminders");
    }

    const data = await response.json();
    return data.reminders
      .filter((reminder: any) => reminder.isRecurring)
      .map(convertDbReminderToConfig);
  } catch (error) {
    console.error("Error fetching recurring reminders:", error);
    return [];
  }
}
