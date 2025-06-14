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
export const createReminderSchema = baseReminderSchema.refine(
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
);

// Update reminder schema (makes fields optional for partial updates)
export const updateReminderSchema = baseReminderSchema.partial().refine(
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
