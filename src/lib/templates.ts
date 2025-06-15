import { CreateReminderFormData } from "./validations";

export interface ReminderTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  template: Partial<CreateReminderFormData>;
  tags: string[];
}

export const WELLNESS_TEMPLATES: ReminderTemplate[] = [
  {
    id: "water-intake",
    name: "Water Intake",
    description: "Stay hydrated throughout the day",
    category: "hydration",
    icon: "💧",
    template: {
      title: "Drink Water",
      description: "Stay hydrated for better health",
      category: "hydration",
      reminderTime: "09:00",
      daysOfWeek: [1, 2, 3, 4, 5, 6, 0], // All days
      soundEnabled: true,
      vibrationEnabled: true,
      snoozeEnabled: true,
      snoozeDuration: 10,
      maxSnoozes: 2,
    },
    tags: ["health", "hydration", "daily"],
  },
  {
    id: "morning-medication",
    name: "Morning Medication",
    description: "Take your morning medication",
    category: "medication",
    icon: "💊",
    template: {
      title: "Take Morning Medication",
      description: "Don't forget your morning pills",
      category: "medication",
      reminderTime: "08:00",
      daysOfWeek: [1, 2, 3, 4, 5, 6, 0], // All days
      soundEnabled: true,
      vibrationEnabled: true,
      snoozeEnabled: true,
      snoozeDuration: 5,
      maxSnoozes: 3,
      quietHoursEnabled: false,
    },
    tags: ["health", "medication", "morning"],
  },
  {
    id: "evening-meditation",
    name: "Evening Meditation",
    description: "Wind down with evening meditation",
    category: "meditation",
    icon: "🧘",
    template: {
      title: "Evening Meditation",
      description: "Take 10 minutes to meditate and relax",
      category: "meditation",
      reminderTime: "20:00",
      daysOfWeek: [1, 2, 3, 4, 5, 6, 0], // All days
      soundEnabled: true,
      vibrationEnabled: false,
      snoozeEnabled: true,
      snoozeDuration: 15,
      maxSnoozes: 1,
    },
    tags: ["wellness", "meditation", "evening", "relaxation"],
  },
  {
    id: "workout-reminder",
    name: "Workout Time",
    description: "Daily exercise reminder",
    category: "exercise",
    icon: "💪",
    template: {
      title: "Workout Time",
      description: "Time for your daily exercise session",
      category: "exercise",
      reminderTime: "07:00",
      daysOfWeek: [1, 2, 3, 4, 5], // Weekdays only
      soundEnabled: true,
      vibrationEnabled: true,
      snoozeEnabled: true,
      snoozeDuration: 15,
      maxSnoozes: 2,
    },
    tags: ["fitness", "exercise", "morning", "strength"],
  },
  {
    id: "sleep-reminder",
    name: "Bedtime Reminder",
    description: "Get ready for bed",
    category: "sleep",
    icon: "🛌",
    template: {
      title: "Time for Bed",
      description: "Wind down and prepare for sleep",
      category: "sleep",
      reminderTime: "22:00",
      daysOfWeek: [1, 2, 3, 4, 5, 6, 0], // All days
      soundEnabled: true,
      vibrationEnabled: false,
      snoozeEnabled: true,
      snoozeDuration: 10,
      maxSnoozes: 1,
    },
    tags: ["sleep", "evening", "bedtime", "routine"],
  },
  {
    id: "healthy-lunch",
    name: "Healthy Lunch",
    description: "Eat a nutritious lunch",
    category: "nutrition",
    icon: "🥗",
    template: {
      title: "Healthy Lunch Time",
      description: "Remember to eat a balanced, nutritious lunch",
      category: "nutrition",
      reminderTime: "12:00",
      daysOfWeek: [1, 2, 3, 4, 5], // Weekdays
      soundEnabled: true,
      vibrationEnabled: true,
      snoozeEnabled: true,
      snoozeDuration: 30,
      maxSnoozes: 1,
    },
    tags: ["nutrition", "lunch", "healthy-eating", "midday"],
  },
  {
    id: "posture-check",
    name: "Posture Check",
    description: "Check and correct your posture",
    category: "wellness",
    icon: "🪑",
    template: {
      title: "Posture Check",
      description: "Sit up straight and check your posture",
      category: "wellness",
      reminderTime: "14:00",
      daysOfWeek: [1, 2, 3, 4, 5], // Work days
      soundEnabled: true,
      vibrationEnabled: true,
      snoozeEnabled: true,
      snoozeDuration: 60, // 1 hour
      maxSnoozes: 3,
    },
    tags: ["posture", "work", "health", "ergonomics"],
  },
  {
    id: "vitamin-d",
    name: "Vitamin D",
    description: "Take your daily vitamin D supplement",
    category: "medication",
    icon: "☀️",
    template: {
      title: "Take Vitamin D",
      description: "Daily vitamin D supplement for bone health",
      category: "medication",
      reminderTime: "08:30",
      daysOfWeek: [1, 2, 3, 4, 5, 6, 0], // Daily
      soundEnabled: true,
      vibrationEnabled: true,
      snoozeEnabled: true,
      snoozeDuration: 30,
      maxSnoozes: 2,
    },
    tags: ["vitamins", "supplements", "health", "morning"],
  },
];

export const getTemplatesByCategory = (
  category?: string
): ReminderTemplate[] => {
  if (!category) return WELLNESS_TEMPLATES;
  return WELLNESS_TEMPLATES.filter(
    (template) => template.category === category
  );
};

export const getTemplatesByTag = (tag: string): ReminderTemplate[] => {
  return WELLNESS_TEMPLATES.filter((template) =>
    template.tags.some((t) => t.toLowerCase().includes(tag.toLowerCase()))
  );
};

export const searchTemplates = (query: string): ReminderTemplate[] => {
  const lowercaseQuery = query.toLowerCase();
  return WELLNESS_TEMPLATES.filter(
    (template) =>
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description.toLowerCase().includes(lowercaseQuery) ||
      template.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
  );
};

export const getTemplateById = (id: string): ReminderTemplate | undefined => {
  return WELLNESS_TEMPLATES.find((template) => template.id === id);
};

export const applyTemplateToForm = (
  templateId: string,
  customizations?: Partial<CreateReminderFormData>
): CreateReminderFormData | null => {
  const template = getTemplateById(templateId);
  if (!template) return null;

  return {
    ...template.template,
    ...customizations,
  } as CreateReminderFormData;
};

// Template categories for filtering
export const TEMPLATE_CATEGORIES = [
  { value: "hydration", label: "Hydration", icon: "💧" },
  { value: "medication", label: "Medication", icon: "💊" },
  { value: "meditation", label: "Meditation", icon: "🧘" },
  { value: "exercise", label: "Exercise", icon: "💪" },
  { value: "sleep", label: "Sleep", icon: "🛌" },
  { value: "nutrition", label: "Nutrition", icon: "🥗" },
  { value: "wellness", label: "Wellness", icon: "🌟" },
] as const;

// Popular tags for template discovery
export const POPULAR_TAGS = [
  "daily",
  "morning",
  "evening",
  "health",
  "fitness",
  "relaxation",
  "work",
  "routine",
  "hydration",
  "nutrition",
  "sleep",
  "meditation",
] as const;
