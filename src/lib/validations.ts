import { z } from "zod";

// Reminder categories enum
export const REMINDER_CATEGORIES = [
  "wellness",
  "health",
  "exercise",
  "nutrition",
  "hydration",
  "meditation",
  "sleep",
  "medication",
  "work",
  "personal",
  "other",
] as const;

export type ReminderCategory = (typeof REMINDER_CATEGORIES)[number];

// Recurring interval options (in minutes)
export const RECURRING_INTERVALS = [
  { value: 15, label: "Every 15 minutes" },
  { value: 30, label: "Every 30 minutes" },
  { value: 45, label: "Every 45 minutes" },
  { value: 60, label: "Every hour" },
  { value: 90, label: "Every 1.5 hours" },
  { value: 120, label: "Every 2 hours" },
  { value: 180, label: "Every 3 hours" },
  { value: 240, label: "Every 4 hours" },
] as const;

// Days of week (0=Sunday, 1=Monday, etc.)
export const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
] as const;

// Time validation helper (HH:MM format)
const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

// Helper function to convert HH:MM to minutes since midnight
const convertTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

// Base reminder schema (without refinements for reusability)
const baseReminderSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be less than 100 characters"),

  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),

  category: z.enum(REMINDER_CATEGORIES, {
    errorMap: () => ({ message: "Please select a valid category" }),
  }),

  reminderTime: z.string().regex(timeRegex, "Time must be in HH:MM format"),

  daysOfWeek: z
    .array(z.number().min(0).max(6))
    .min(1, "Please select at least one day")
    .max(7, "Invalid days selection"),

  timezone: z.string().default("UTC"),

  isActive: z.boolean().default(true),

  // Notification settings
  soundEnabled: z.boolean().default(true),

  soundFile: z.string().optional(),

  vibrationEnabled: z.boolean().default(true),

  // Quiet hours
  quietHoursEnabled: z.boolean().default(false),

  quietHoursStart: z
    .string()
    .regex(timeRegex, "Quiet hours start time must be in HH:MM format")
    .optional(),

  quietHoursEnd: z
    .string()
    .regex(timeRegex, "Quiet hours end time must be in HH:MM format")
    .optional(),

  // Recurring notification settings
  isRecurring: z.boolean().default(false),

  recurringInterval: z
    .number()
    .min(5, "Recurring interval must be at least 5 minutes")
    .max(480, "Recurring interval must be less than 8 hours (480 minutes)")
    .optional(),

  recurringStartTime: z
    .string()
    .regex(timeRegex, "Recurring start time must be in HH:MM format")
    .optional(),

  recurringEndTime: z
    .string()
    .regex(timeRegex, "Recurring end time must be in HH:MM format")
    .optional(),

  // Snooze settings
  snoozeEnabled: z.boolean().default(true),

  snoozeDuration: z
    .number()
    .min(1, "Snooze duration must be at least 1 minute")
    .max(60, "Snooze duration must be less than 60 minutes")
    .default(5),

  maxSnoozes: z
    .number()
    .min(1, "Max snoozes must be at least 1")
    .max(10, "Max snoozes must be less than 10")
    .default(3),
});

// Create reminder schema with refinements
export const createReminderSchema = baseReminderSchema
  .refine(
    (data) => {
      if (data.quietHoursEnabled) {
        return data.quietHoursStart && data.quietHoursEnd;
      }
      return true;
    },
    {
      message:
        "Quiet hours start and end times are required when quiet hours are enabled",
      path: ["quietHoursStart"],
    }
  )
  .refine(
    (data) => {
      if (data.isRecurring) {
        return data.recurringInterval && data.recurringEndTime;
      }
      return true;
    },
    {
      message:
        "Recurring interval and end time are required when recurring notifications are enabled",
      path: ["recurringInterval"],
    }
  )
  .refine(
    (data) => {
      if (
        data.isRecurring &&
        data.recurringStartTime &&
        data.recurringEndTime
      ) {
        // Check that start time is before end time
        const startMinutes = convertTimeToMinutes(data.recurringStartTime);
        const endMinutes = convertTimeToMinutes(data.recurringEndTime);
        return startMinutes < endMinutes;
      }
      return true;
    },
    {
      message: "Recurring start time must be before end time",
      path: ["recurringStartTime"],
    }
  );

// Update reminder schema (makes fields optional for partial updates)
export const updateReminderSchema = baseReminderSchema
  .partial()
  .refine(
    (data) => {
      if (data.quietHoursEnabled) {
        return data.quietHoursStart && data.quietHoursEnd;
      }
      return true;
    },
    {
      message:
        "Quiet hours start and end times are required when quiet hours are enabled",
      path: ["quietHoursStart"],
    }
  )
  .refine(
    (data) => {
      if (data.isRecurring) {
        return data.recurringInterval && data.recurringEndTime;
      }
      return true;
    },
    {
      message:
        "Recurring interval and end time are required when recurring notifications are enabled",
      path: ["recurringInterval"],
    }
  )
  .refine(
    (data) => {
      if (
        data.isRecurring &&
        data.recurringStartTime &&
        data.recurringEndTime
      ) {
        // Check that start time is before end time
        const startMinutes = convertTimeToMinutes(data.recurringStartTime);
        const endMinutes = convertTimeToMinutes(data.recurringEndTime);
        return startMinutes < endMinutes;
      }
      return true;
    },
    {
      message: "Recurring start time must be before end time",
      path: ["recurringStartTime"],
    }
  );

// Form data type for React Hook Form
export type CreateReminderFormData = z.infer<typeof createReminderSchema>;
export type UpdateReminderFormData = z.infer<typeof updateReminderSchema>;

// API response schemas
export const reminderResponseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  category: z.string(),
  isActive: z.boolean(),
  reminderTime: z.string(),
  daysOfWeek: z.string(), // JSON string in database
  timezone: z.string(),
  soundEnabled: z.boolean(),
  soundFile: z.string().nullable(),
  vibrationEnabled: z.boolean(),
  quietHoursEnabled: z.boolean(),
  quietHoursStart: z.string().nullable(),
  quietHoursEnd: z.string().nullable(),
  isRecurring: z.boolean(),
  recurringInterval: z.number().nullable(),
  recurringStartTime: z.string().nullable(),
  recurringEndTime: z.string().nullable(),
  snoozeEnabled: z.boolean(),
  snoozeDuration: z.number(),
  maxSnoozes: z.number(),
  userId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ReminderResponse = z.infer<typeof reminderResponseSchema>;

// Helper functions for days of week
export const formatDaysOfWeek = (days: number[]): string => {
  return JSON.stringify(days.sort());
};

export const parseDaysOfWeek = (daysString: string): number[] => {
  try {
    const parsed = JSON.parse(daysString);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const getDayNames = (days: number[]): string[] => {
  return days.map((day) => {
    const dayObj = DAYS_OF_WEEK.find((d) => d.value === day);
    return dayObj?.label || "Unknown";
  });
};

// Counter validation schemas
export const COUNTER_UNITS = [
  "count",
  "ml",
  "l",
  "cups",
  "glasses",
  "steps",
  "minutes",
  "hours",
  "pages",
  "calories",
  "grams",
  "kg",
  "lbs",
  "reps",
  "sets",
] as const;

export type CounterUnit = (typeof COUNTER_UNITS)[number];

// Create counter schema
export const createCounterSchema = z.object({
  name: z
    .string()
    .min(1, "Counter name is required")
    .max(50, "Counter name must be less than 50 characters")
    .regex(
      /^[a-zA-Z0-9\s\-_]+$/,
      "Counter name can only contain letters, numbers, spaces, hyphens, and underscores"
    ),

  unit: z
    .enum(COUNTER_UNITS, {
      errorMap: () => ({ message: "Please select a valid unit" }),
    })
    .default("count"),

  iconName: z
    .string()
    .max(50, "Icon name must be less than 50 characters")
    .optional(),

  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Color must be a valid hex color code")
    .default("#3b82f6"),

  dailyGoal: z
    .number()
    .min(1, "Daily goal must be at least 1")
    .max(10000, "Daily goal must be less than 10,000")
    .optional(),

  reminderId: z.string().optional(),
});

// Update counter settings schema
export const updateCounterSettingsSchema = z.object({
  name: z
    .string()
    .min(1, "Counter name is required")
    .max(50, "Counter name must be less than 50 characters")
    .regex(
      /^[a-zA-Z0-9\s\-_]+$/,
      "Counter name can only contain letters, numbers, spaces, hyphens, and underscores"
    )
    .optional(),

  unit: z
    .enum(COUNTER_UNITS, {
      errorMap: () => ({ message: "Please select a valid unit" }),
    })
    .optional(),

  iconName: z
    .string()
    .max(50, "Icon name must be less than 50 characters")
    .optional(),

  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Color must be a valid hex color code")
    .optional(),

  dailyGoal: z
    .number()
    .min(1, "Daily goal must be at least 1")
    .max(10000, "Daily goal must be less than 10,000")
    .optional(),

  isActive: z.boolean().optional(),
});

// Counter action schemas
export const incrementCounterSchema = z.object({
  amount: z
    .number()
    .min(-1000, "Amount must be greater than -1000")
    .max(1000, "Amount must be less than 1000")
    .default(1),
});

export const setCounterValueSchema = z.object({
  value: z
    .number()
    .min(0, "Counter value cannot be negative")
    .max(100000, "Counter value must be less than 100,000"),
});

// Counter history query schema
export const counterHistoryQuerySchema = z.object({
  name: z.string().min(1, "Counter name is required"),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format"),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format"),
});

// Type exports for counter schemas
export type CreateCounterFormData = z.infer<typeof createCounterSchema>;
export type UpdateCounterSettingsFormData = z.infer<
  typeof updateCounterSettingsSchema
>;
export type IncrementCounterData = z.infer<typeof incrementCounterSchema>;
export type SetCounterValueData = z.infer<typeof setCounterValueSchema>;
export type CounterHistoryQuery = z.infer<typeof counterHistoryQuerySchema>;

// Counter response schema
export const counterResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  unit: z.string(),
  iconName: z.string().nullable(),
  color: z.string(),
  dailyGoal: z.number().nullable(),
  currentValue: z.number(),
  isActive: z.boolean(),
  date: z.string(),
  reminderId: z.string().nullable(),
  userId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CounterResponse = z.infer<typeof counterResponseSchema>;
