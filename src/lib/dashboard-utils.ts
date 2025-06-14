import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

// Types for better type safety
interface ReminderWithLogs {
  id: string;
  title: string;
  description: string | null;
  category: string;
  isActive: boolean;
  reminderTime: string;
  daysOfWeek: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ReminderLog {
  id: string;
  action: string;
  timestamp: Date;
  snoozeCount: number;
  notes: string | null;
  metadata: string | null;
  userId: string;
  reminderId: string;
  date: string;
}

// Get today's date in YYYY-MM-DD format
export function getTodayDateString(): string {
  return format(new Date(), "yyyy-MM-dd");
}

// Get current day of week (0 = Sunday, 6 = Saturday)
export function getCurrentDayOfWeek(): number {
  return new Date().getDay();
}

// Parse days of week JSON string to array
export function parseDaysOfWeek(daysOfWeekJson: string): number[] {
  try {
    return JSON.parse(daysOfWeekJson);
  } catch {
    return [];
  }
}

// Check if reminder is scheduled for today
export function isReminderScheduledForToday(
  reminder: ReminderWithLogs
): boolean {
  const today = getCurrentDayOfWeek();
  const scheduledDays = parseDaysOfWeek(reminder.daysOfWeek);
  return scheduledDays.includes(today);
}

// Get today's reminders for a user
export async function getTodayReminders(userId: string) {
  const reminders = await prisma.reminder.findMany({
    where: {
      userId,
      isActive: true,
    },
    orderBy: {
      reminderTime: "asc",
    },
  });

  // Filter reminders that are scheduled for today
  const todayReminders = reminders.filter(isReminderScheduledForToday);

  // Get today's logs for these reminders
  const todayDate = getTodayDateString();
  const reminderIds = todayReminders.map((r) => r.id);

  const todayLogs = await prisma.reminderLog.findMany({
    where: {
      userId,
      reminderId: { in: reminderIds },
      date: todayDate,
    },
  });

  // Create a map of reminder logs by reminder ID
  const logsMap = new Map<string, ReminderLog[]>();
  todayLogs.forEach((log) => {
    if (!logsMap.has(log.reminderId)) {
      logsMap.set(log.reminderId, []);
    }
    logsMap.get(log.reminderId)?.push(log);
  });

  // Add status to each reminder
  return todayReminders.map((reminder) => {
    const logs = logsMap.get(reminder.id) || [];
    const completedLog = logs.find((log) => log.action === "completed");
    const dismissedLog = logs.find((log) => log.action === "dismissed");
    const snoozedLogs = logs.filter((log) => log.action === "snoozed");

    let status: "pending" | "completed" | "dismissed" | "snoozed" = "pending";

    if (completedLog) {
      status = "completed";
    } else if (dismissedLog) {
      status = "dismissed";
    } else if (snoozedLogs.length > 0) {
      status = "snoozed";
    }

    return {
      ...reminder,
      status,
      logs,
      snoozeCount: snoozedLogs.length,
    };
  });
}

// Get daily statistics for a user
export async function getDailyStats(userId: string, date?: string) {
  const targetDate = date || getTodayDateString();

  // Get all reminders for the user that were scheduled for this date
  const allReminders = await prisma.reminder.findMany({
    where: {
      userId,
      isActive: true,
    },
  });

  // Filter reminders that were scheduled for the target date
  const targetDayOfWeek = new Date(targetDate).getDay();
  const scheduledReminders = allReminders.filter((reminder) => {
    const scheduledDays = parseDaysOfWeek(reminder.daysOfWeek);
    return scheduledDays.includes(targetDayOfWeek);
  });

  const reminderIds = scheduledReminders.map((r) => r.id);

  // Get logs for the target date
  const logs = await prisma.reminderLog.findMany({
    where: {
      userId,
      reminderId: { in: reminderIds },
      date: targetDate,
    },
  });

  // Calculate statistics
  const totalScheduled = scheduledReminders.length;
  const completedCount = logs.filter(
    (log) => log.action === "completed"
  ).length;
  const dismissedCount = logs.filter(
    (log) => log.action === "dismissed"
  ).length;
  const snoozedCount = logs.filter((log) => log.action === "snoozed").length;
  const missedCount = Math.max(
    0,
    totalScheduled - completedCount - dismissedCount
  );

  const completionRate =
    totalScheduled > 0 ? (completedCount / totalScheduled) * 100 : 0;

  return {
    totalScheduled,
    completed: completedCount,
    dismissed: dismissedCount,
    snoozed: snoozedCount,
    missed: missedCount,
    completionRate: Math.round(completionRate),
  };
}

// Get weekly statistics for a user
export async function getWeeklyStats(userId: string) {
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)

  const weekStats = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    const dateString = format(date, "yyyy-MM-dd");

    const dayStats = await getDailyStats(userId, dateString);
    weekStats.push({
      date: dateString,
      dayName: format(date, "EEE"),
      ...dayStats,
    });
  }

  return weekStats;
}

// Get active counters for today
export async function getTodayCounters(userId: string) {
  const todayDate = getTodayDateString();

  const counters = await prisma.counter.findMany({
    where: {
      userId,
      date: todayDate,
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return counters;
}

// Helper function to format time for display
export function formatReminderTime(timeString: string): string {
  const [hours, minutes] = timeString.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Helper function to get next reminder time
export function getNextReminderTime(
  reminders: ReminderWithLogs[]
): Date | null {
  const now = new Date();
  const today = getCurrentDayOfWeek();

  for (const reminder of reminders) {
    if (!reminder.isActive) continue;

    const scheduledDays = parseDaysOfWeek(reminder.daysOfWeek);
    if (!scheduledDays.includes(today)) continue;

    const [hours, minutes] = reminder.reminderTime.split(":").map(Number);
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);

    if (reminderTime > now) {
      return reminderTime;
    }
  }

  return null;
}
