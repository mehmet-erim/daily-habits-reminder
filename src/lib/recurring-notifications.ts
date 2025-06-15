import { isWithinQuietHours } from "@/lib/notifications";
import { showReminderNotification } from "@/lib/notifications";

export interface RecurringReminderConfig {
  id: string;
  title: string;
  description?: string;
  category?: string;
  isRecurring: boolean;
  recurringInterval: number; // in minutes
  recurringStartTime: string; // HH:MM format
  recurringEndTime: string; // HH:MM format
  soundEnabled: boolean;
  soundFile?: string;
  quietHoursEnabled: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone: string;
  daysOfWeek: number[]; // Array of day numbers (0-6, 0=Sunday)
}

/**
 * Convert HH:MM time string to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to HH:MM format
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Calculate all notification times for a recurring reminder within a day
 */
export function calculateRecurringTimes(
  startTime: string,
  endTime: string,
  interval: number
): string[] {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const times: string[] = [];

  // Handle case where end time is before start time (next day)
  const actualEndMinutes =
    endMinutes < startMinutes ? endMinutes + 24 * 60 : endMinutes;

  for (
    let currentMinutes = startMinutes;
    currentMinutes < actualEndMinutes;
    currentMinutes += interval
  ) {
    // Handle overflow to next day
    const timeMinutes =
      currentMinutes >= 24 * 60 ? currentMinutes - 24 * 60 : currentMinutes;
    times.push(minutesToTime(timeMinutes));
  }

  return times;
}

/**
 * Check if a notification should be sent now based on recurring settings
 */
export function shouldSendRecurringNotification(
  reminder: RecurringReminderConfig,
  currentTime: Date = new Date()
): boolean {
  if (!reminder.isRecurring) {
    return false;
  }

  // Check if today is in the allowed days
  const currentDay = currentTime.getDay();
  if (!reminder.daysOfWeek.includes(currentDay)) {
    return false;
  }

  // Check quiet hours
  if (
    reminder.quietHoursEnabled &&
    reminder.quietHoursStart &&
    reminder.quietHoursEnd &&
    isWithinQuietHours(
      reminder.quietHoursStart,
      reminder.quietHoursEnd,
      reminder.timezone
    )
  ) {
    return false;
  }

  // Get current time in HH:MM format
  const currentTimeString = `${currentTime
    .getHours()
    .toString()
    .padStart(2, "0")}:${currentTime.getMinutes().toString().padStart(2, "0")}`;
  const currentMinutes = timeToMinutes(currentTimeString);

  // Calculate all notification times for today
  const notificationTimes = calculateRecurringTimes(
    reminder.recurringStartTime,
    reminder.recurringEndTime,
    reminder.recurringInterval
  );

  // Check if current time matches any of the scheduled times (within 1 minute tolerance)
  return notificationTimes.some((time) => {
    const scheduledMinutes = timeToMinutes(time);
    return Math.abs(currentMinutes - scheduledMinutes) <= 1;
  });
}

/**
 * Send a recurring notification if conditions are met
 */
export function processRecurringNotification(
  reminder: RecurringReminderConfig
): boolean {
  if (shouldSendRecurringNotification(reminder)) {
    showReminderNotification(
      reminder.title,
      reminder.description,
      reminder.category,
      reminder.soundEnabled,
      reminder.soundFile
    );
    return true;
  }
  return false;
}

/**
 * Get the next notification time for a recurring reminder
 */
export function getNextRecurringNotification(
  reminder: RecurringReminderConfig,
  currentTime: Date = new Date()
): Date | null {
  if (!reminder.isRecurring) {
    return null;
  }

  const currentTimeString = `${currentTime
    .getHours()
    .toString()
    .padStart(2, "0")}:${currentTime.getMinutes().toString().padStart(2, "0")}`;
  const currentMinutes = timeToMinutes(currentTimeString);

  // Calculate all notification times for today
  const notificationTimes = calculateRecurringTimes(
    reminder.recurringStartTime,
    reminder.recurringEndTime,
    reminder.recurringInterval
  );

  // Find the next notification time today
  for (const time of notificationTimes) {
    const scheduledMinutes = timeToMinutes(time);
    if (scheduledMinutes > currentMinutes) {
      const nextTime = new Date(currentTime);
      nextTime.setHours(Math.floor(scheduledMinutes / 60));
      nextTime.setMinutes(scheduledMinutes % 60);
      nextTime.setSeconds(0);
      nextTime.setMilliseconds(0);
      return nextTime;
    }
  }

  // If no more notifications today, check next valid day
  const tomorrow = new Date(currentTime);
  tomorrow.setDate(tomorrow.getDate() + 1);

  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(tomorrow);
    checkDate.setDate(checkDate.getDate() + i);

    if (reminder.daysOfWeek.includes(checkDate.getDay())) {
      const firstTimeMinutes = timeToMinutes(reminder.recurringStartTime);
      checkDate.setHours(Math.floor(firstTimeMinutes / 60));
      checkDate.setMinutes(firstTimeMinutes % 60);
      checkDate.setSeconds(0);
      checkDate.setMilliseconds(0);
      return checkDate;
    }
  }

  return null;
}

/**
 * Get all scheduled notification times for a recurring reminder on a specific date
 */
export function getRecurringScheduleForDate(
  reminder: RecurringReminderConfig,
  date: Date
): string[] {
  if (!reminder.isRecurring) {
    return [];
  }

  const dayOfWeek = date.getDay();
  if (!reminder.daysOfWeek.includes(dayOfWeek)) {
    return [];
  }

  return calculateRecurringTimes(
    reminder.recurringStartTime,
    reminder.recurringEndTime,
    reminder.recurringInterval
  );
}

/**
 * Calculate total number of notifications per day for a recurring reminder
 */
export function calculateDailyNotificationCount(
  startTime: string,
  endTime: string,
  interval: number
): number {
  const times = calculateRecurringTimes(startTime, endTime, interval);
  return times.length;
}
