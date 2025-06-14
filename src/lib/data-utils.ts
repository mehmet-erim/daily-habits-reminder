import { prisma } from "@/lib/prisma";
import {
  format,
  parseISO,
  differenceInDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  subDays,
} from "date-fns";
import { getDailyStats, parseDaysOfWeek } from "@/lib/dashboard-utils";

// Types for historical data
export interface HistoricalDayData {
  date: string;
  dayName: string;
  totalScheduled: number;
  completed: number;
  dismissed: number;
  snoozed: number;
  missed: number;
  completionRate: number;
  counters: CounterData[];
}

export interface CounterData {
  id: string;
  name: string;
  unit: string;
  iconName: string | null;
  color: string;
  currentValue: number;
  dailyGoal: number | null;
  goalMet: boolean;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  streakDates: string[];
}

export interface WeeklyComparisonData {
  thisWeek: HistoricalDayData[];
  lastWeek: HistoricalDayData[];
  improvement: number; // percentage change in completion rate
}

export interface MonthlyTrendData {
  month: string;
  totalCompleted: number;
  totalScheduled: number;
  completionRate: number;
  averageDailyCompletions: number;
}

// Get historical data for a specific date
export async function getHistoricalDataForDate(
  userId: string,
  date: string
): Promise<HistoricalDayData> {
  const dailyStats = await getDailyStats(userId, date);
  const counters = await getCountersForDate(userId, date);

  const parsedDate = parseISO(date);

  return {
    date,
    dayName: format(parsedDate, "EEEE"),
    ...dailyStats,
    counters,
  };
}

// Get historical data for a date range
export async function getHistoricalDataForRange(
  userId: string,
  startDate: string,
  endDate: string
): Promise<HistoricalDayData[]> {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const dates = eachDayOfInterval({ start, end });

  const historicalData = await Promise.all(
    dates.map(async (date) => {
      const dateString = format(date, "yyyy-MM-dd");
      return getHistoricalDataForDate(userId, dateString);
    })
  );

  return historicalData;
}

// Get counters for a specific date
export async function getCountersForDate(
  userId: string,
  date: string
): Promise<CounterData[]> {
  const counters = await prisma.counter.findMany({
    where: {
      userId,
      date,
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return counters.map((counter) => ({
    id: counter.id,
    name: counter.name,
    unit: counter.unit,
    iconName: counter.iconName,
    color: counter.color,
    currentValue: counter.currentValue,
    dailyGoal: counter.dailyGoal,
    goalMet: counter.dailyGoal
      ? counter.currentValue >= counter.dailyGoal
      : false,
  }));
}

// Calculate completion streaks
export async function calculateCompletionStreak(
  userId: string,
  endDate?: string
): Promise<StreakData> {
  const targetDate = endDate || format(new Date(), "yyyy-MM-dd");
  const maxDaysToCheck = 365; // Check up to a year back

  // Get the last year of daily stats
  const startDate = format(
    subDays(parseISO(targetDate), maxDaysToCheck),
    "yyyy-MM-dd"
  );
  const historicalData = await getHistoricalDataForRange(
    userId,
    startDate,
    targetDate
  );

  // Sort by date (newest first)
  const sortedData = historicalData.sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  const streakDates: string[] = [];

  // Calculate current streak (from most recent date backwards)
  for (const dayData of sortedData) {
    const hasCompletions = dayData.completed > 0 && dayData.totalScheduled > 0;
    const completionRate =
      dayData.totalScheduled > 0
        ? (dayData.completed / dayData.totalScheduled) * 100
        : 0;

    // Consider a day successful if completion rate is >= 50% or if there were no scheduled reminders
    const isSuccessfulDay =
      completionRate >= 50 || dayData.totalScheduled === 0;

    if (isSuccessfulDay) {
      if (currentStreak === tempStreak) {
        currentStreak++;
        streakDates.unshift(dayData.date);
      }
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  return {
    currentStreak,
    longestStreak,
    streakDates,
  };
}

// Get weekly comparison data
export async function getWeeklyComparison(
  userId: string,
  weekStartDate?: string
): Promise<WeeklyComparisonData> {
  const targetWeekStart = weekStartDate
    ? startOfWeek(parseISO(weekStartDate), { weekStartsOn: 0 })
    : startOfWeek(new Date(), { weekStartsOn: 0 });

  const thisWeekStart = format(targetWeekStart, "yyyy-MM-dd");
  const thisWeekEnd = format(
    endOfWeek(targetWeekStart, { weekStartsOn: 0 }),
    "yyyy-MM-dd"
  );

  const lastWeekStart = format(subDays(targetWeekStart, 7), "yyyy-MM-dd");
  const lastWeekEnd = format(subDays(parseISO(thisWeekEnd), 7), "yyyy-MM-dd");

  const [thisWeek, lastWeek] = await Promise.all([
    getHistoricalDataForRange(userId, thisWeekStart, thisWeekEnd),
    getHistoricalDataForRange(userId, lastWeekStart, lastWeekEnd),
  ]);

  // Calculate average completion rates
  const thisWeekAvg =
    thisWeek.reduce((sum, day) => sum + day.completionRate, 0) /
    thisWeek.length;
  const lastWeekAvg =
    lastWeek.reduce((sum, day) => sum + day.completionRate, 0) /
    lastWeek.length;

  const improvement =
    lastWeekAvg > 0 ? ((thisWeekAvg - lastWeekAvg) / lastWeekAvg) * 100 : 0;

  return {
    thisWeek,
    lastWeek,
    improvement,
  };
}

// Get monthly trend data
export async function getMonthlyTrends(
  userId: string,
  monthsBack: number = 6
): Promise<MonthlyTrendData[]> {
  const trends: MonthlyTrendData[] = [];
  const today = new Date();

  for (let i = 0; i < monthsBack; i++) {
    const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthStart = format(monthDate, "yyyy-MM-01");
    const monthEnd = format(
      new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0),
      "yyyy-MM-dd"
    );

    const monthData = await getHistoricalDataForRange(
      userId,
      monthStart,
      monthEnd
    );

    const totalCompleted = monthData.reduce(
      (sum, day) => sum + day.completed,
      0
    );
    const totalScheduled = monthData.reduce(
      (sum, day) => sum + day.totalScheduled,
      0
    );
    const completionRate =
      totalScheduled > 0 ? (totalCompleted / totalScheduled) * 100 : 0;
    const averageDailyCompletions =
      monthData.length > 0 ? totalCompleted / monthData.length : 0;

    trends.unshift({
      month: format(monthDate, "MMM yyyy"),
      totalCompleted,
      totalScheduled,
      completionRate,
      averageDailyCompletions,
    });
  }

  return trends;
}

// Export data to CSV format
export function exportToCSV(data: HistoricalDayData[]): string {
  const headers = [
    "Date",
    "Day",
    "Total Scheduled",
    "Completed",
    "Dismissed",
    "Snoozed",
    "Missed",
    "Completion Rate (%)",
    "Counters",
  ];

  const rows = data.map((day) => [
    day.date,
    day.dayName,
    day.totalScheduled.toString(),
    day.completed.toString(),
    day.dismissed.toString(),
    day.snoozed.toString(),
    day.missed.toString(),
    day.completionRate.toFixed(1),
    day.counters
      .map(
        (c) =>
          `${c.name}: ${c.currentValue}${
            c.unit !== "count" ? ` ${c.unit}` : ""
          }`
      )
      .join("; "),
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");

  return csvContent;
}

// Export data to JSON format
export function exportToJSON(data: HistoricalDayData[]): string {
  return JSON.stringify(data, null, 2);
}

// Get summary statistics for a date range
export async function getSummaryStats(
  userId: string,
  startDate: string,
  endDate: string
): Promise<{
  totalDays: number;
  totalScheduled: number;
  totalCompleted: number;
  totalDismissed: number;
  totalSnoozed: number;
  totalMissed: number;
  overallCompletionRate: number;
  bestDay: { date: string; completionRate: number } | null;
  worstDay: { date: string; completionRate: number } | null;
  streak: StreakData;
}> {
  const data = await getHistoricalDataForRange(userId, startDate, endDate);
  const streak = await calculateCompletionStreak(userId, endDate);

  const totalDays = data.length;
  const totalScheduled = data.reduce((sum, day) => sum + day.totalScheduled, 0);
  const totalCompleted = data.reduce((sum, day) => sum + day.completed, 0);
  const totalDismissed = data.reduce((sum, day) => sum + day.dismissed, 0);
  const totalSnoozed = data.reduce((sum, day) => sum + day.snoozed, 0);
  const totalMissed = data.reduce((sum, day) => sum + day.missed, 0);

  const overallCompletionRate =
    totalScheduled > 0 ? (totalCompleted / totalScheduled) * 100 : 0;

  // Find best and worst days (only considering days with scheduled reminders)
  const daysWithReminders = data.filter((day) => day.totalScheduled > 0);
  const bestDay =
    daysWithReminders.length > 0
      ? daysWithReminders.reduce((best, day) =>
          day.completionRate > best.completionRate ? day : best
        )
      : null;

  const worstDay =
    daysWithReminders.length > 0
      ? daysWithReminders.reduce((worst, day) =>
          day.completionRate < worst.completionRate ? day : worst
        )
      : null;

  return {
    totalDays,
    totalScheduled,
    totalCompleted,
    totalDismissed,
    totalSnoozed,
    totalMissed,
    overallCompletionRate,
    bestDay: bestDay
      ? { date: bestDay.date, completionRate: bestDay.completionRate }
      : null,
    worstDay: worstDay
      ? { date: worstDay.date, completionRate: worstDay.completionRate }
      : null,
    streak,
  };
}

// Get available date range for user's data
export async function getAvailableDateRange(userId: string): Promise<{
  startDate: string | null;
  endDate: string | null;
  totalDays: number;
}> {
  const [oldestLog, newestLog] = await Promise.all([
    prisma.reminderLog.findFirst({
      where: { userId },
      orderBy: { date: "asc" },
      select: { date: true },
    }),
    prisma.reminderLog.findFirst({
      where: { userId },
      orderBy: { date: "desc" },
      select: { date: true },
    }),
  ]);

  if (!oldestLog || !newestLog) {
    return { startDate: null, endDate: null, totalDays: 0 };
  }

  const totalDays =
    differenceInDays(parseISO(newestLog.date), parseISO(oldestLog.date)) + 1;

  return {
    startDate: oldestLog.date,
    endDate: newestLog.date,
    totalDays,
  };
}
