import type { User, Reminder, ReminderLog, Counter } from "../generated/prisma";

// Re-export Prisma types for easier importing
export type { User, Reminder, ReminderLog, Counter };

// Custom types for API and components
export type ReminderAction = "completed" | "dismissed" | "snoozed" | "missed";

export type ReminderCategory =
  | "wellness"
  | "health"
  | "exercise"
  | "mindfulness"
  | "nutrition"
  | "sleep"
  | "other";

export type CounterUnit =
  | "count"
  | "ml"
  | "oz"
  | "steps"
  | "minutes"
  | "hours"
  | "grams"
  | "kg"
  | "lbs";

// Form types
export type CreateReminderInput = Omit<
  Reminder,
  "id" | "userId" | "createdAt" | "updatedAt"
>;

export type UpdateReminderInput = Partial<CreateReminderInput>;

export type CreateReminderLogInput = Omit<ReminderLog, "id" | "timestamp">;

export type CreateCounterInput = Omit<
  Counter,
  "id" | "userId" | "createdAt" | "updatedAt"
>;

export type UpdateCounterInput = Partial<
  Pick<Counter, "currentValue" | "dailyGoal" | "isActive">
>;

// API response types
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// Dashboard types
export type DailyStats = {
  date: string;
  totalReminders: number;
  completedReminders: number;
  missedReminders: number;
  completionRate: number;
  counters: Array<{
    id: string;
    name: string;
    currentValue: number;
    dailyGoal?: number;
    unit: string;
  }>;
};

// Analytics types
export type WeeklyStats = {
  weekStart: string;
  weekEnd: string;
  dailyStats: DailyStats[];
  weeklyAverages: {
    completionRate: number;
    totalReminders: number;
    completedReminders: number;
  };
};

export type MonthlyStats = {
  month: string;
  year: number;
  weeklyStats: WeeklyStats[];
  monthlyAverages: {
    completionRate: number;
    totalReminders: number;
    completedReminders: number;
  };
};
