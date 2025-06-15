interface BackupData {
  version: string;
  timestamp: string;
  appVersion: string;
  data: {
    reminders: any[];
    counters: any[];
    settings: UserSettings;
    logs?: any[];
  };
  metadata: {
    totalReminders: number;
    totalCounters: number;
    activeReminders: number;
    exportedBy: string;
  };
}

interface UserSettings {
  theme: "dark" | "light" | "system";
  notifications: {
    enabled: boolean;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    quietHoursEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
  };
  sounds: {
    defaultSound: string;
    customSounds: string[];
    volume: number;
  };
  general: {
    timezone: string;
    language: string;
    dateFormat: string;
    timeFormat: "12h" | "24h";
  };
  privacy: {
    analytics: boolean;
    crashReporting: boolean;
  };
}

export interface BackupOptions {
  includeReminders: boolean;
  includeCounters: boolean;
  includeSettings: boolean;
  includeLogs: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface RestoreOptions {
  restoreReminders: boolean;
  restoreCounters: boolean;
  restoreSettings: boolean;
  restoreLogs: boolean;
  mergeMode: "replace" | "merge" | "skip-existing";
}

export interface BackupResult {
  success: boolean;
  message: string;
  filename?: string;
  size?: number;
  data?: BackupData;
}

export interface RestoreResult {
  success: boolean;
  message: string;
  imported: {
    reminders: number;
    counters: number;
    settings: boolean;
    logs: number;
  };
  errors: string[];
}

// Default user settings
export const getDefaultSettings = (): UserSettings => ({
  theme: "dark",
  notifications: {
    enabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
  },
  sounds: {
    defaultSound: "default",
    customSounds: [],
    volume: 0.8,
  },
  general: {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    language: "en",
    dateFormat: "yyyy-MM-dd",
    timeFormat: "12h",
  },
  privacy: {
    analytics: false,
    crashReporting: false,
  },
});

// Storage keys
const STORAGE_KEYS = {
  SETTINGS: "wellness-tracker-settings",
  BACKUP_HISTORY: "wellness-tracker-backup-history",
} as const;

// Settings management
export const getUserSettings = (): UserSettings => {
  if (typeof window === "undefined") return getDefaultSettings();

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure all properties exist
      return { ...getDefaultSettings(), ...parsed };
    }
  } catch (error) {
    console.warn("Failed to load user settings:", error);
  }

  return getDefaultSettings();
};

export const saveUserSettings = (settings: Partial<UserSettings>): void => {
  if (typeof window === "undefined") return;

  try {
    const currentSettings = getUserSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    localStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify(updatedSettings)
    );
  } catch (error) {
    console.warn("Failed to save user settings:", error);
  }
};

export const updateSettingsPartial = (path: string, value: any): void => {
  const settings = getUserSettings();
  const keys = path.split(".");

  let current = settings as any;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }

  current[keys[keys.length - 1]] = value;
  saveUserSettings(settings);
};

// Backup functionality
export const createBackup = async (
  options: BackupOptions
): Promise<BackupResult> => {
  try {
    const backupData: BackupData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      appVersion: "1.0.0", // Could be from package.json
      data: {
        reminders: [],
        counters: [],
        settings: getUserSettings(),
        logs: [],
      },
      metadata: {
        totalReminders: 0,
        totalCounters: 0,
        activeReminders: 0,
        exportedBy: "Daily Habits Reminder",
      },
    };

    // Fetch reminders if requested
    if (options.includeReminders) {
      try {
        const response = await fetch("/api/reminders");
        if (response.ok) {
          const data = await response.json();
          backupData.data.reminders = data.reminders || [];
          backupData.metadata.totalReminders = backupData.data.reminders.length;
          backupData.metadata.activeReminders =
            backupData.data.reminders.filter((r: any) => r.isActive).length;
        }
      } catch (error) {
        console.warn("Failed to fetch reminders for backup:", error);
      }
    }

    // Fetch counters if requested
    if (options.includeCounters) {
      try {
        const response = await fetch("/api/counters");
        if (response.ok) {
          const data = await response.json();
          backupData.data.counters = data.counters || [];
          backupData.metadata.totalCounters = backupData.data.counters.length;
        }
      } catch (error) {
        console.warn("Failed to fetch counters for backup:", error);
      }
    }

    // Fetch logs if requested
    if (options.includeLogs && options.dateRange) {
      try {
        const fromDate = options.dateRange.from.toISOString().split("T")[0];
        const toDate = options.dateRange.to.toISOString().split("T")[0];
        const response = await fetch(`/api/logs?from=${fromDate}&to=${toDate}`);
        if (response.ok) {
          const data = await response.json();
          backupData.data.logs = data.logs || [];
        }
      } catch (error) {
        console.warn("Failed to fetch logs for backup:", error);
      }
    }

    if (!options.includeSettings) {
      backupData.data.settings = undefined as any;
    }

    // Store backup in history
    storeBackupHistory(backupData);

    const jsonString = JSON.stringify(backupData, null, 2);
    const size = new Blob([jsonString]).size;

    return {
      success: true,
      message: `Backup created successfully (${formatFileSize(size)})`,
      data: backupData,
      size,
    };
  } catch (error) {
    console.error("Backup creation failed:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Backup creation failed",
    };
  }
};

export const downloadBackup = (
  backupData: BackupData,
  filename?: string
): void => {
  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download =
    filename ||
    `wellness-backup-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

export const restoreFromBackup = async (
  file: File,
  options: RestoreOptions
): Promise<RestoreResult> => {
  try {
    const fileContent = await readFileAsText(file);
    const backupData: BackupData = JSON.parse(fileContent);

    // Validate backup format
    if (!backupData.version || !backupData.data) {
      throw new Error("Invalid backup file format");
    }

    const result: RestoreResult = {
      success: true,
      message: "",
      imported: {
        reminders: 0,
        counters: 0,
        settings: false,
        logs: 0,
      },
      errors: [],
    };

    // Restore settings
    if (options.restoreSettings && backupData.data.settings) {
      try {
        saveUserSettings(backupData.data.settings);
        result.imported.settings = true;
      } catch (error) {
        result.errors.push("Failed to restore settings");
      }
    }

    // Restore reminders
    if (options.restoreReminders && backupData.data.reminders) {
      for (const reminder of backupData.data.reminders) {
        try {
          // Remove ID for new creation or handle merge mode
          const reminderData = { ...reminder };
          if (options.mergeMode === "replace" || !reminderData.id) {
            delete reminderData.id;
            delete reminderData.createdAt;
            delete reminderData.updatedAt;
            delete reminderData.userId;
          }

          const response = await fetch("/api/reminders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reminderData),
          });

          if (response.ok) {
            result.imported.reminders++;
          } else {
            result.errors.push(`Failed to restore reminder: ${reminder.title}`);
          }
        } catch (error) {
          result.errors.push(`Error restoring reminder: ${reminder.title}`);
        }
      }
    }

    // Restore counters
    if (options.restoreCounters && backupData.data.counters) {
      for (const counter of backupData.data.counters) {
        try {
          const counterData = { ...counter };
          if (options.mergeMode === "replace" || !counterData.id) {
            delete counterData.id;
            delete counterData.createdAt;
            delete counterData.updatedAt;
            delete counterData.userId;
          }

          const response = await fetch("/api/counters", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(counterData),
          });

          if (response.ok) {
            result.imported.counters++;
          } else {
            result.errors.push(`Failed to restore counter: ${counter.name}`);
          }
        } catch (error) {
          result.errors.push(`Error restoring counter: ${counter.name}`);
        }
      }
    }

    // Restore logs (if API exists)
    if (options.restoreLogs && backupData.data.logs) {
      // Note: This would require a logs import API endpoint
      result.imported.logs = 0; // Placeholder
    }

    result.message = `Restore completed. Imported ${result.imported.reminders} reminders, ${result.imported.counters} counters`;

    if (result.errors.length > 0) {
      result.success = false;
      result.message += `. ${result.errors.length} errors occurred.`;
    }

    return result;
  } catch (error) {
    console.error("Restore failed:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Restore failed",
      imported: { reminders: 0, counters: 0, settings: false, logs: 0 },
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
};

// Utility functions
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const storeBackupHistory = (backupData: BackupData): void => {
  if (typeof window === "undefined") return;

  try {
    const history = getBackupHistory();
    const entry = {
      timestamp: backupData.timestamp,
      metadata: backupData.metadata,
      size: new Blob([JSON.stringify(backupData)]).size,
    };

    // Keep only last 10 backups in history
    const updatedHistory = [entry, ...history].slice(0, 10);
    localStorage.setItem(
      STORAGE_KEYS.BACKUP_HISTORY,
      JSON.stringify(updatedHistory)
    );
  } catch (error) {
    console.warn("Failed to store backup history:", error);
  }
};

export const getBackupHistory = () => {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.BACKUP_HISTORY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn("Failed to load backup history:", error);
    return [];
  }
};

export const clearBackupHistory = (): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEYS.BACKUP_HISTORY);
  } catch (error) {
    console.warn("Failed to clear backup history:", error);
  }
};

// Export all settings for external backup
export const exportAllSettings = (): UserSettings => {
  return getUserSettings();
};

// Import settings from external source
export const importSettings = (settings: Partial<UserSettings>): boolean => {
  try {
    const currentSettings = getUserSettings();
    const mergedSettings = { ...currentSettings, ...settings };
    saveUserSettings(mergedSettings);
    return true;
  } catch (error) {
    console.error("Failed to import settings:", error);
    return false;
  }
};

// Reset all settings to default
export const resetAllSettings = (): void => {
  saveUserSettings(getDefaultSettings());
};

// Validate backup file
export const validateBackupFile = async (
  file: File
): Promise<{ valid: boolean; error?: string }> => {
  try {
    if (!file.name.endsWith(".json")) {
      return { valid: false, error: "File must be a JSON file" };
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      return { valid: false, error: "File size too large (max 10MB)" };
    }

    const content = await readFileAsText(file);
    const data = JSON.parse(content);

    if (!data.version || !data.data) {
      return { valid: false, error: "Invalid backup file format" };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: "Failed to parse backup file" };
  }
};
