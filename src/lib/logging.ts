import { prisma } from "@/lib/prisma";
import { getTodayDateString } from "@/lib/dashboard-utils";

export interface LogEntry {
  id?: string;
  reminderId: string;
  action: "completed" | "dismissed" | "snoozed" | "missed";
  timestamp?: Date;
  date?: string;
  notes?: string;
  metadata?: Record<string, any>;
  snoozeCount?: number;
}

export interface LoggingOptions {
  offline?: boolean;
  optimistic?: boolean;
  userId?: string;
}

// Offline storage key
const OFFLINE_LOGS_KEY = "wellness-offline-logs";

/**
 * Create a reminder log entry
 */
export async function createLog(
  entry: LogEntry,
  options: LoggingOptions = {}
): Promise<{ success: boolean; log?: any; error?: string }> {
  const { offline = false, optimistic = true, userId } = options;

  // Prepare log data
  const logData = {
    ...entry,
    timestamp: entry.timestamp || new Date(),
    date: entry.date || getTodayDateString(),
    metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
  };

  // Handle offline mode
  if (offline || !navigator.onLine) {
    return handleOfflineLog(logData);
  }

  // Handle optimistic updates
  if (optimistic) {
    // Store temporarily for optimistic UI
    const tempLog = { ...logData, id: `temp-${Date.now()}` };

    try {
      // Make API call
      const response = await fetch("/api/logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(logData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, log: result.log };
    } catch (error) {
      // If API fails, fall back to offline storage
      console.warn("Log API failed, storing offline:", error);
      return handleOfflineLog(logData);
    }
  }

  // Standard API call without optimistic updates
  try {
    const response = await fetch("/api/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(logData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, log: result.log };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

/**
 * Handle offline log storage
 */
function handleOfflineLog(logData: any): { success: boolean; log: any } {
  try {
    const offlineLogs = getOfflineLogs();
    const newLog = {
      ...logData,
      id: `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      offline: true,
    };

    offlineLogs.push(newLog);
    localStorage.setItem(OFFLINE_LOGS_KEY, JSON.stringify(offlineLogs));

    return { success: true, log: newLog };
  } catch (error) {
    console.error("Failed to store offline log:", error);
    return { success: false, log: null };
  }
}

/**
 * Get offline logs from localStorage
 */
export function getOfflineLogs(): any[] {
  try {
    const stored = localStorage.getItem(OFFLINE_LOGS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to get offline logs:", error);
    return [];
  }
}

/**
 * Sync offline logs to server
 */
export async function syncOfflineLogs(): Promise<{
  synced: number;
  failed: number;
}> {
  const offlineLogs = getOfflineLogs();
  let synced = 0;
  let failed = 0;

  if (offlineLogs.length === 0) {
    return { synced: 0, failed: 0 };
  }

  console.log(`Syncing ${offlineLogs.length} offline logs...`);

  for (const log of offlineLogs) {
    try {
      const { offline, id, ...logData } = log; // Remove offline flag and temp ID

      const response = await fetch("/api/logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(logData),
      });

      if (response.ok) {
        synced++;
      } else {
        failed++;
        console.warn("Failed to sync log:", log, response.statusText);
      }
    } catch (error) {
      failed++;
      console.error("Error syncing log:", log, error);
    }
  }

  // Clear successfully synced logs
  if (synced > 0) {
    const remainingLogs = offlineLogs.slice(synced);
    localStorage.setItem(OFFLINE_LOGS_KEY, JSON.stringify(remainingLogs));
  }

  console.log(`Sync complete: ${synced} synced, ${failed} failed`);
  return { synced, failed };
}

/**
 * Clear all offline logs
 */
export function clearOfflineLogs(): void {
  localStorage.removeItem(OFFLINE_LOGS_KEY);
}

/**
 * Get logs for a specific date
 */
export async function getLogsForDate(
  date: string,
  reminderId?: string
): Promise<{ success: boolean; logs?: any[]; error?: string }> {
  try {
    const params = new URLSearchParams({ date });
    if (reminderId) {
      params.append("reminderId", reminderId);
    }

    const response = await fetch(`/api/logs?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, logs: result.logs };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

/**
 * Get logs for a date range
 */
export async function getLogsForDateRange(
  startDate: string,
  endDate: string,
  reminderId?: string
): Promise<{ success: boolean; logs?: any[]; error?: string }> {
  try {
    const params = new URLSearchParams({
      startDate,
      endDate,
    });

    if (reminderId) {
      params.append("reminderId", reminderId);
    }

    const response = await fetch(`/api/logs/daily?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, logs: result.logs };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: errorMessage };
  }
}

/**
 * Log a reminder completion
 */
export async function logCompletion(
  reminderId: string,
  notes?: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; log?: any; error?: string }> {
  return createLog(
    {
      reminderId,
      action: "completed",
      notes,
      metadata,
    },
    { optimistic: true }
  );
}

/**
 * Log a reminder dismissal
 */
export async function logDismissal(
  reminderId: string,
  notes?: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; log?: any; error?: string }> {
  return createLog(
    {
      reminderId,
      action: "dismissed",
      notes,
      metadata,
    },
    { optimistic: true }
  );
}

/**
 * Log a reminder snooze
 */
export async function logSnooze(
  reminderId: string,
  snoozeMinutes: number,
  currentSnoozeCount: number = 0,
  notes?: string
): Promise<{ success: boolean; log?: any; error?: string }> {
  return createLog(
    {
      reminderId,
      action: "snoozed",
      snoozeCount: currentSnoozeCount + 1,
      notes,
      metadata: { snoozeMinutes },
    },
    { optimistic: true }
  );
}

/**
 * Log a missed reminder
 */
export async function logMissed(
  reminderId: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; log?: any; error?: string }> {
  return createLog(
    {
      reminderId,
      action: "missed",
      metadata,
    },
    { optimistic: true }
  );
}

/**
 * Setup online/offline event listeners for automatic sync
 */
export function setupOfflineSync(): () => void {
  if (typeof window === "undefined") return () => {};

  const handleOnline = () => {
    console.log("Connection restored, syncing offline logs...");
    syncOfflineLogs().catch(console.error);
  };

  const handleOffline = () => {
    console.log("Connection lost, switching to offline mode");
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  // Cleanup function
  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}

/**
 * Get logging statistics
 */
export function getLoggingStats(): {
  offlineLogsCount: number;
  lastSyncAttempt: string | null;
  isOnline: boolean;
} {
  const offlineLogs = getOfflineLogs();
  const lastSync = localStorage.getItem("wellness-last-sync");

  return {
    offlineLogsCount: offlineLogs.length,
    lastSyncAttempt: lastSync,
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  };
}
