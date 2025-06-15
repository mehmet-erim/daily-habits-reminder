import { prisma } from "./prisma";
import {
  format,
  subDays,
  startOfDay,
  endOfDay,
  differenceInDays,
  parseISO,
} from "date-fns";

export interface AnalyticsData {
  completionRate: CompletionRateData[];
  streaks: StreakData;
  habitPatterns: HabitPatternData[];
  goalProgress: GoalProgressData[];
  dailyActivity: DailyActivityData[];
  weeklyComparison: WeeklyComparisonData;
}

export interface CompletionRateData {
  date: string;
  completed: number;
  total: number;
  rate: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  streakHistory: { date: string; streak: number }[];
}

export interface HabitPatternData {
  reminderId: string;
  title: string;
  category: string;
  completionRate: number;
  totalReminders: number;
  completedReminders: number;
  bestDay: string;
  worstDay: string;
  averageCompletionTime?: string;
}

export interface GoalProgressData {
  name: string;
  current: number;
  goal: number;
  percentage: number;
  trend: "up" | "down" | "stable";
  daysToGoal?: number;
}

export interface DailyActivityData {
  date: string;
  totalReminders: number;
  completed: number;
  dismissed: number;
  snoozed: number;
  missed: number;
}

export interface WeeklyComparisonData {
  currentWeek: {
    completed: number;
    total: number;
    rate: number;
  };
  previousWeek: {
    completed: number;
    total: number;
    rate: number;
  };
  improvement: number;
}

/**
 * Calculate completion rate over time
 */
export async function calculateCompletionRate(
  userId: string,
  days: number = 30
): Promise<CompletionRateData[]> {
  const endDate = new Date();
  const startDate = subDays(endDate, days - 1);

  const logs = await prisma.reminderLog.findMany({
    where: {
      userId,
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      reminder: true,
    },
  });

  // Group logs by date
  const dailyData: { [key: string]: { completed: number; total: number } } = {};

  // Initialize all dates with 0 values
  for (let i = 0; i < days; i++) {
    const date = format(subDays(endDate, i), "yyyy-MM-dd");
    dailyData[date] = { completed: 0, total: 0 };
  }

  // Count logs by date and action
  logs.forEach((log) => {
    const date = format(log.timestamp, "yyyy-MM-dd");
    if (dailyData[date]) {
      dailyData[date].total += 1;
      if (log.action === "completed") {
        dailyData[date].completed += 1;
      }
    }
  });

  return Object.entries(dailyData)
    .map(([date, data]) => ({
      date,
      completed: data.completed,
      total: data.total,
      rate:
        data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate streak data
 */
export async function calculateStreaks(userId: string): Promise<StreakData> {
  const logs = await prisma.reminderLog.findMany({
    where: {
      userId,
      action: "completed",
    },
    orderBy: {
      date: "desc",
    },
  });

  if (logs.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      streakHistory: [],
    };
  }

  // Group by date and count unique completed reminders per day
  const dailyCompletions: { [key: string]: number } = {};
  logs.forEach((log) => {
    const date = log.date;
    dailyCompletions[date] = (dailyCompletions[date] || 0) + 1;
  });

  const dates = Object.keys(dailyCompletions).sort((a, b) =>
    b.localeCompare(a)
  );

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  const streakHistory: { date: string; streak: number }[] = [];

  // Calculate current streak
  const today = format(new Date(), "yyyy-MM-dd");
  let checkDate = today;

  while (dailyCompletions[checkDate]) {
    currentStreak++;
    const previousDate = format(subDays(parseISO(checkDate), 1), "yyyy-MM-dd");
    checkDate = previousDate;
  }

  // Calculate longest streak and history
  dates.forEach((date, index) => {
    if (dailyCompletions[date] > 0) {
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }

    streakHistory.push({
      date,
      streak: tempStreak,
    });
  });

  return {
    currentStreak,
    longestStreak,
    streakHistory: streakHistory.reverse(),
  };
}

/**
 * Analyze habit patterns for each reminder
 */
export async function analyzeHabitPatterns(
  userId: string,
  days: number = 30
): Promise<HabitPatternData[]> {
  const endDate = new Date();
  const startDate = subDays(endDate, days - 1);

  const reminders = await prisma.reminder.findMany({
    where: {
      userId,
      isActive: true,
    },
    include: {
      reminderLogs: {
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
    },
  });

  return reminders.map((reminder) => {
    const logs = reminder.reminderLogs;
    const totalReminders = logs.length;
    const completedReminders = logs.filter(
      (log) => log.action === "completed"
    ).length;
    const completionRate =
      totalReminders > 0
        ? Math.round((completedReminders / totalReminders) * 100)
        : 0;

    // Analyze by day of week
    const dayStats: { [key: string]: { completed: number; total: number } } = {
      Sunday: { completed: 0, total: 0 },
      Monday: { completed: 0, total: 0 },
      Tuesday: { completed: 0, total: 0 },
      Wednesday: { completed: 0, total: 0 },
      Thursday: { completed: 0, total: 0 },
      Friday: { completed: 0, total: 0 },
      Saturday: { completed: 0, total: 0 },
    };

    logs.forEach((log) => {
      const dayName = format(log.timestamp, "EEEE");
      dayStats[dayName].total += 1;
      if (log.action === "completed") {
        dayStats[dayName].completed += 1;
      }
    });

    let bestDay = "Sunday";
    let worstDay = "Sunday";
    let bestRate = 0;
    let worstRate = 100;

    Object.entries(dayStats).forEach(([day, stats]) => {
      if (stats.total > 0) {
        const rate = (stats.completed / stats.total) * 100;
        if (rate > bestRate) {
          bestRate = rate;
          bestDay = day;
        }
        if (rate < worstRate) {
          worstRate = rate;
          worstDay = day;
        }
      }
    });

    return {
      reminderId: reminder.id,
      title: reminder.title,
      category: reminder.category,
      completionRate,
      totalReminders,
      completedReminders,
      bestDay,
      worstDay,
    };
  });
}

/**
 * Calculate goal progress for counters
 */
export async function calculateGoalProgress(
  userId: string
): Promise<GoalProgressData[]> {
  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

  const todayCounters = await prisma.counter.findMany({
    where: {
      userId,
      date: today,
      dailyGoal: { not: null },
    },
  });

  const yesterdayCounters = await prisma.counter.findMany({
    where: {
      userId,
      date: yesterday,
      dailyGoal: { not: null },
    },
  });

  return todayCounters.map((counter) => {
    const yesterdayCounter = yesterdayCounters.find(
      (c) => c.name === counter.name
    );
    const goal = counter.dailyGoal || 0;
    const current = counter.currentValue;
    const percentage =
      goal > 0 ? Math.min(Math.round((current / goal) * 100), 100) : 0;

    let trend: "up" | "down" | "stable" = "stable";
    if (yesterdayCounter) {
      const yesterdayPercentage = yesterdayCounter.dailyGoal
        ? Math.min(
            Math.round(
              (yesterdayCounter.currentValue / yesterdayCounter.dailyGoal) * 100
            ),
            100
          )
        : 0;

      if (percentage > yesterdayPercentage) trend = "up";
      else if (percentage < yesterdayPercentage) trend = "down";
    }

    const remaining = Math.max(goal - current, 0);
    const daysToGoal =
      remaining > 0 && current > 0
        ? Math.ceil(remaining / (current / 1))
        : undefined;

    return {
      name: counter.name,
      current,
      goal,
      percentage,
      trend,
      daysToGoal,
    };
  });
}

/**
 * Get daily activity breakdown
 */
export async function getDailyActivity(
  userId: string,
  days: number = 7
): Promise<DailyActivityData[]> {
  const endDate = new Date();
  const startDate = subDays(endDate, days - 1);

  const logs = await prisma.reminderLog.findMany({
    where: {
      userId,
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const dailyData: { [key: string]: DailyActivityData } = {};

  // Initialize all dates
  for (let i = 0; i < days; i++) {
    const date = format(subDays(endDate, i), "yyyy-MM-dd");
    dailyData[date] = {
      date,
      totalReminders: 0,
      completed: 0,
      dismissed: 0,
      snoozed: 0,
      missed: 0,
    };
  }

  // Count actions by date
  logs.forEach((log) => {
    const date = format(log.timestamp, "yyyy-MM-dd");
    if (dailyData[date]) {
      dailyData[date].totalReminders += 1;

      switch (log.action) {
        case "completed":
          dailyData[date].completed += 1;
          break;
        case "dismissed":
          dailyData[date].dismissed += 1;
          break;
        case "snoozed":
          dailyData[date].snoozed += 1;
          break;
        case "missed":
          dailyData[date].missed += 1;
          break;
      }
    }
  });

  return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Compare current week vs previous week
 */
export async function getWeeklyComparison(
  userId: string
): Promise<WeeklyComparisonData> {
  const today = new Date();
  const currentWeekStart = subDays(today, 7);
  const previousWeekStart = subDays(today, 14);
  const previousWeekEnd = subDays(today, 8);

  const currentWeekLogs = await prisma.reminderLog.findMany({
    where: {
      userId,
      timestamp: {
        gte: currentWeekStart,
        lte: today,
      },
    },
  });

  const previousWeekLogs = await prisma.reminderLog.findMany({
    where: {
      userId,
      timestamp: {
        gte: previousWeekStart,
        lte: previousWeekEnd,
      },
    },
  });

  const currentCompleted = currentWeekLogs.filter(
    (log) => log.action === "completed"
  ).length;
  const currentTotal = currentWeekLogs.length;
  const currentRate =
    currentTotal > 0 ? Math.round((currentCompleted / currentTotal) * 100) : 0;

  const previousCompleted = previousWeekLogs.filter(
    (log) => log.action === "completed"
  ).length;
  const previousTotal = previousWeekLogs.length;
  const previousRate =
    previousTotal > 0
      ? Math.round((previousCompleted / previousTotal) * 100)
      : 0;

  const improvement = currentRate - previousRate;

  return {
    currentWeek: {
      completed: currentCompleted,
      total: currentTotal,
      rate: currentRate,
    },
    previousWeek: {
      completed: previousCompleted,
      total: previousTotal,
      rate: previousRate,
    },
    improvement,
  };
}

/**
 * Get comprehensive analytics data
 */
export async function getAnalyticsData(userId: string): Promise<AnalyticsData> {
  const [
    completionRate,
    streaks,
    habitPatterns,
    goalProgress,
    dailyActivity,
    weeklyComparison,
  ] = await Promise.all([
    calculateCompletionRate(userId, 30),
    calculateStreaks(userId),
    analyzeHabitPatterns(userId, 30),
    calculateGoalProgress(userId),
    getDailyActivity(userId, 7),
    getWeeklyComparison(userId),
  ]);

  return {
    completionRate,
    streaks,
    habitPatterns,
    goalProgress,
    dailyActivity,
    weeklyComparison,
  };
}
