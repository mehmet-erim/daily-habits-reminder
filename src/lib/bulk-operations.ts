import { UpdateReminderFormData } from "./validations";

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
  message: string;
}

export interface BulkUpdateData {
  isActive?: boolean;
  category?: string;
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  snoozeEnabled?: boolean;
  snoozeDuration?: number;
  maxSnoozes?: number;
}

export interface BulkOperation {
  id: string;
  label: string;
  description: string;
  icon: string;
  requiresConfirmation: boolean;
  action: string;
}

export const BULK_OPERATIONS: BulkOperation[] = [
  {
    id: "enable",
    label: "Enable Selected",
    description: "Activate all selected reminders",
    icon: "✅",
    requiresConfirmation: false,
    action: "update",
  },
  {
    id: "disable",
    label: "Disable Selected",
    description: "Deactivate all selected reminders",
    icon: "⏸️",
    requiresConfirmation: false,
    action: "update",
  },
  {
    id: "delete",
    label: "Delete Selected",
    description: "Permanently delete all selected reminders",
    icon: "🗑️",
    requiresConfirmation: true,
    action: "delete",
  },
  {
    id: "export",
    label: "Export Selected",
    description: "Export selected reminders to JSON file",
    icon: "📤",
    requiresConfirmation: false,
    action: "export",
  },
  {
    id: "duplicate",
    label: "Duplicate Selected",
    description: "Create copies of selected reminders",
    icon: "📋",
    requiresConfirmation: false,
    action: "duplicate",
  },
  {
    id: "mute-sounds",
    label: "Mute Sounds",
    description: "Disable sound notifications for selected reminders",
    icon: "🔇",
    requiresConfirmation: false,
    action: "update",
  },
  {
    id: "enable-sounds",
    label: "Enable Sounds",
    description: "Enable sound notifications for selected reminders",
    icon: "🔊",
    requiresConfirmation: false,
    action: "update",
  },
  {
    id: "set-quiet-hours",
    label: "Set Quiet Hours",
    description: "Enable quiet hours for selected reminders",
    icon: "🌙",
    requiresConfirmation: false,
    action: "update",
  },
];

export const getBulkUpdateData = (
  operationId: string
): BulkUpdateData | null => {
  switch (operationId) {
    case "enable":
      return { isActive: true };
    case "disable":
      return { isActive: false };
    case "mute-sounds":
      return { soundEnabled: false };
    case "enable-sounds":
      return { soundEnabled: true };
    case "set-quiet-hours":
      return {
        quietHoursEnabled: true,
        quietHoursStart: "22:00",
        quietHoursEnd: "07:00",
      };
    default:
      return null;
  }
};

export const executeBulkUpdate = async (
  reminderIds: string[],
  updateData: BulkUpdateData
): Promise<BulkOperationResult> => {
  const results: BulkOperationResult = {
    success: true,
    processed: 0,
    errors: [],
    message: "",
  };

  for (const id of reminderIds) {
    try {
      const response = await fetch(`/api/reminders/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        results.errors.push({
          id,
          error: errorData.error || "Update failed",
        });
        results.success = false;
      } else {
        results.processed++;
      }
    } catch (error) {
      results.errors.push({
        id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      results.success = false;
    }
  }

  results.message = results.success
    ? `Successfully updated ${results.processed} reminder${
        results.processed !== 1 ? "s" : ""
      }`
    : `Updated ${results.processed} of ${reminderIds.length} reminders. ${results.errors.length} failed.`;

  return results;
};

export const executeBulkDelete = async (
  reminderIds: string[]
): Promise<BulkOperationResult> => {
  const results: BulkOperationResult = {
    success: true,
    processed: 0,
    errors: [],
    message: "",
  };

  for (const id of reminderIds) {
    try {
      const response = await fetch(`/api/reminders/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        results.errors.push({
          id,
          error: errorData.error || "Delete failed",
        });
        results.success = false;
      } else {
        results.processed++;
      }
    } catch (error) {
      results.errors.push({
        id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      results.success = false;
    }
  }

  results.message = results.success
    ? `Successfully deleted ${results.processed} reminder${
        results.processed !== 1 ? "s" : ""
      }`
    : `Deleted ${results.processed} of ${reminderIds.length} reminders. ${results.errors.length} failed.`;

  return results;
};

export const executeBulkDuplicate = async (
  reminderIds: string[]
): Promise<BulkOperationResult> => {
  const results: BulkOperationResult = {
    success: true,
    processed: 0,
    errors: [],
    message: "",
  };

  for (const id of reminderIds) {
    try {
      // First, get the reminder data
      const getResponse = await fetch(`/api/reminders/${id}`);
      if (!getResponse.ok) {
        results.errors.push({
          id,
          error: "Failed to fetch reminder data",
        });
        continue;
      }

      const reminderData = await getResponse.json();

      // Create a copy with modified title
      const duplicateData = {
        ...reminderData,
        title: `${reminderData.title} (Copy)`,
        id: undefined, // Remove ID to create new
        createdAt: undefined,
        updatedAt: undefined,
        userId: undefined,
      };

      // Create the duplicate
      const createResponse = await fetch("/api/reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(duplicateData),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        results.errors.push({
          id,
          error: errorData.error || "Duplicate creation failed",
        });
        results.success = false;
      } else {
        results.processed++;
      }
    } catch (error) {
      results.errors.push({
        id,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      results.success = false;
    }
  }

  results.message = results.success
    ? `Successfully duplicated ${results.processed} reminder${
        results.processed !== 1 ? "s" : ""
      }`
    : `Duplicated ${results.processed} of ${reminderIds.length} reminders. ${results.errors.length} failed.`;

  return results;
};

export const executeBulkExport = async (
  reminderIds: string[]
): Promise<{ success: boolean; data?: any; message: string }> => {
  try {
    const reminders = [];

    for (const id of reminderIds) {
      const response = await fetch(`/api/reminders/${id}`);
      if (response.ok) {
        const reminderData = await response.json();
        // Clean up the data for export
        const cleanData = {
          title: reminderData.title,
          description: reminderData.description,
          category: reminderData.category,
          reminderTime: reminderData.reminderTime,
          daysOfWeek: reminderData.daysOfWeek,
          timezone: reminderData.timezone,
          isActive: reminderData.isActive,
          soundEnabled: reminderData.soundEnabled,
          vibrationEnabled: reminderData.vibrationEnabled,
          quietHoursEnabled: reminderData.quietHoursEnabled,
          quietHoursStart: reminderData.quietHoursStart,
          quietHoursEnd: reminderData.quietHoursEnd,
          snoozeEnabled: reminderData.snoozeEnabled,
          snoozeDuration: reminderData.snoozeDuration,
          maxSnoozes: reminderData.maxSnoozes,
        };
        reminders.push(cleanData);
      }
    }

    const exportData = {
      exportDate: new Date().toISOString(),
      exportVersion: "1.0",
      reminders,
      metadata: {
        totalReminders: reminders.length,
        appName: "Daily Habits Reminder",
      },
    };

    return {
      success: true,
      data: exportData,
      message: `Successfully exported ${reminders.length} reminder${
        reminders.length !== 1 ? "s" : ""
      }`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Export failed",
    };
  }
};

export const downloadExportData = (data: any, filename?: string) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download =
    filename ||
    `reminders-export-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

export const importRemindersFromFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);

        // Validate the import data structure
        if (!data.reminders || !Array.isArray(data.reminders)) {
          reject(new Error("Invalid import file format"));
          return;
        }

        resolve(data.reminders);
      } catch (error) {
        reject(new Error("Failed to parse import file"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read import file"));
    };

    reader.readAsText(file);
  });
};

export const executeBulkImport = async (
  reminders: any[]
): Promise<BulkOperationResult> => {
  const results: BulkOperationResult = {
    success: true,
    processed: 0,
    errors: [],
    message: "",
  };

  for (let i = 0; i < reminders.length; i++) {
    const reminder = reminders[i];

    try {
      const response = await fetch("/api/reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reminder),
      });

      if (!response.ok) {
        const errorData = await response.json();
        results.errors.push({
          id: `import-${i}`,
          error: errorData.error || "Import failed",
        });
        results.success = false;
      } else {
        results.processed++;
      }
    } catch (error) {
      results.errors.push({
        id: `import-${i}`,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      results.success = false;
    }
  }

  results.message = results.success
    ? `Successfully imported ${results.processed} reminder${
        results.processed !== 1 ? "s" : ""
      }`
    : `Imported ${results.processed} of ${reminders.length} reminders. ${results.errors.length} failed.`;

  return results;
};
