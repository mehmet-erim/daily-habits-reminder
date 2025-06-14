import { prisma } from "@/lib/prisma";

// Helper to get today's date in YYYY-MM-DD format
export const getTodayDate = (): string => {
  return new Date().toISOString().split("T")[0];
};

// Helper to format date to YYYY-MM-DD
export const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

// Helper to get date range for queries
export const getDateRange = (startDate: Date, endDate: Date): string[] => {
  const dates: string[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

// Get or create counter for today
export const getOrCreateCounter = async (
  userId: string,
  name: string,
  unit: string = "count",
  iconName?: string,
  color: string = "#3b82f6",
  dailyGoal?: number,
  reminderId?: string
) => {
  const today = getTodayDate();

  // Try to find existing counter for today
  let counter = await prisma.counter.findUnique({
    where: {
      userId_name_date: {
        userId,
        name,
        date: today,
      },
    },
  });

  // If not found, create new counter for today
  if (!counter) {
    counter = await prisma.counter.create({
      data: {
        name,
        unit,
        iconName,
        color,
        dailyGoal,
        currentValue: 0,
        date: today,
        userId,
        reminderId,
      },
    });
  }

  return counter;
};

// Get counter for specific date
export const getCounterForDate = async (
  userId: string,
  name: string,
  date: string
) => {
  return await prisma.counter.findUnique({
    where: {
      userId_name_date: {
        userId,
        name,
        date,
      },
    },
  });
};

// Get all counters for today
export const getTodayCounters = async (userId: string) => {
  const today = getTodayDate();

  return await prisma.counter.findMany({
    where: {
      userId,
      date: today,
      isActive: true,
    },
    include: {
      reminder: {
        select: {
          id: true,
          title: true,
          category: true,
        },
      },
    },
    orderBy: [{ name: "asc" }],
  });
};

// Get counter history for a date range
export const getCounterHistory = async (
  userId: string,
  name: string,
  startDate: string,
  endDate: string
) => {
  return await prisma.counter.findMany({
    where: {
      userId,
      name,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      date: "desc",
    },
  });
};

// Get all counter names for a user (for management)
export const getUserCounterNames = async (userId: string) => {
  const counters = await prisma.counter.findMany({
    where: {
      userId,
      isActive: true,
    },
    select: {
      name: true,
      unit: true,
      iconName: true,
      color: true,
      dailyGoal: true,
    },
    distinct: ["name"],
    orderBy: {
      name: "asc",
    },
  });

  return counters;
};

// Increment counter value
export const incrementCounter = async (
  userId: string,
  counterId: string,
  amount: number = 1
) => {
  const counter = await prisma.counter.findFirst({
    where: {
      id: counterId,
      userId,
    },
  });

  if (!counter) {
    throw new Error("Counter not found");
  }

  const newValue = Math.max(0, counter.currentValue + amount);

  return await prisma.counter.update({
    where: {
      id: counterId,
    },
    data: {
      currentValue: newValue,
      updatedAt: new Date(),
    },
  });
};

// Set counter value directly
export const setCounterValue = async (
  userId: string,
  counterId: string,
  value: number
) => {
  const counter = await prisma.counter.findFirst({
    where: {
      id: counterId,
      userId,
    },
  });

  if (!counter) {
    throw new Error("Counter not found");
  }

  return await prisma.counter.update({
    where: {
      id: counterId,
    },
    data: {
      currentValue: Math.max(0, value),
      updatedAt: new Date(),
    },
  });
};

// Reset counter to 0
export const resetCounter = async (userId: string, counterId: string) => {
  return await setCounterValue(userId, counterId, 0);
};

// Get counter statistics
export const getCounterStats = async (
  userId: string,
  name: string,
  days: number = 7
) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days + 1);

  const counters = await getCounterHistory(
    userId,
    name,
    formatDate(startDate),
    formatDate(endDate)
  );

  const total = counters.reduce(
    (sum, counter) => sum + counter.currentValue,
    0
  );
  const average = counters.length > 0 ? total / counters.length : 0;
  const max =
    counters.length > 0 ? Math.max(...counters.map((c) => c.currentValue)) : 0;
  const min =
    counters.length > 0 ? Math.min(...counters.map((c) => c.currentValue)) : 0;

  // Calculate streak (consecutive days with non-zero values)
  let streak = 0;
  const sortedCounters = counters.sort((a, b) => b.date.localeCompare(a.date));

  for (const counter of sortedCounters) {
    if (counter.currentValue > 0) {
      streak++;
    } else {
      break;
    }
  }

  return {
    total,
    average: Math.round(average * 100) / 100,
    max,
    min,
    streak,
    daysTracked: counters.length,
  };
};

// Clean up old counters (optional utility for maintenance)
export const cleanupOldCounters = async (
  userId: string,
  daysToKeep: number = 90
) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  return await prisma.counter.deleteMany({
    where: {
      userId,
      date: {
        lt: formatDate(cutoffDate),
      },
    },
  });
};

// Update counter settings (name, unit, icon, color, goal)
export const updateCounterSettings = async (
  userId: string,
  oldName: string,
  newSettings: {
    name?: string;
    unit?: string;
    iconName?: string;
    color?: string;
    dailyGoal?: number;
    isActive?: boolean;
  }
) => {
  const updates: any = {};

  if (newSettings.name !== undefined) updates.name = newSettings.name;
  if (newSettings.unit !== undefined) updates.unit = newSettings.unit;
  if (newSettings.iconName !== undefined)
    updates.iconName = newSettings.iconName;
  if (newSettings.color !== undefined) updates.color = newSettings.color;
  if (newSettings.dailyGoal !== undefined)
    updates.dailyGoal = newSettings.dailyGoal;
  if (newSettings.isActive !== undefined)
    updates.isActive = newSettings.isActive;

  return await prisma.counter.updateMany({
    where: {
      userId,
      name: oldName,
    },
    data: updates,
  });
};
