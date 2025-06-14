"use client";

import { useState, useEffect, useCallback } from "react";
import {
  createLog,
  logCompletion,
  logDismissal,
  logSnooze,
  logMissed,
  getLogsForDate,
  syncOfflineLogs,
  setupOfflineSync,
  getLoggingStats,
  LogEntry,
} from "@/lib/logging";

export interface UseLoggingReturn {
  // Actions
  logAction: (
    reminderId: string,
    action: "completed" | "dismissed" | "snoozed" | "missed",
    options?: {
      notes?: string;
      metadata?: Record<string, any>;
      snoozeMinutes?: number;
      currentSnoozeCount?: number;
    }
  ) => Promise<{ success: boolean; error?: string }>;

  // Convenience methods
  markCompleted: (
    reminderId: string,
    notes?: string
  ) => Promise<{ success: boolean; error?: string }>;
  markDismissed: (
    reminderId: string,
    notes?: string
  ) => Promise<{ success: boolean; error?: string }>;
  markSnoozed: (
    reminderId: string,
    snoozeMinutes: number,
    currentSnoozeCount?: number,
    notes?: string
  ) => Promise<{ success: boolean; error?: string }>;
  markMissed: (
    reminderId: string
  ) => Promise<{ success: boolean; error?: string }>;

  // Data fetching
  getLogsForDate: (date: string, reminderId?: string) => Promise<any[]>;

  // Sync management
  syncLogs: () => Promise<{ synced: number; failed: number }>;

  // State
  isLogging: boolean;
  lastError: string | null;
  offlineLogsCount: number;
  isOnline: boolean;

  // Stats
  stats: {
    offlineLogsCount: number;
    lastSyncAttempt: string | null;
    isOnline: boolean;
  };
}

export function useLogging(): UseLoggingReturn {
  const [isLogging, setIsLogging] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    offlineLogsCount: 0,
    lastSyncAttempt: null as string | null,
    isOnline: true,
  });

  // Update stats periodically
  const updateStats = useCallback(() => {
    const currentStats = getLoggingStats();
    setStats(currentStats);
  }, []);

  // Setup offline sync and periodic stats updates
  useEffect(() => {
    updateStats();

    // Setup offline sync listeners
    const cleanup = setupOfflineSync();

    // Update stats every 30 seconds
    const interval = setInterval(updateStats, 30000);

    // Listen for online/offline events to update stats
    const handleOnline = () => updateStats();
    const handleOffline = () => updateStats();

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      cleanup();
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [updateStats]);

  const logAction = useCallback(
    async (
      reminderId: string,
      action: "completed" | "dismissed" | "snoozed" | "missed",
      options: {
        notes?: string;
        metadata?: Record<string, any>;
        snoozeMinutes?: number;
        currentSnoozeCount?: number;
      } = {}
    ): Promise<{ success: boolean; error?: string }> => {
      setIsLogging(true);
      setLastError(null);

      try {
        let result;

        switch (action) {
          case "completed":
            result = await logCompletion(
              reminderId,
              options.notes,
              options.metadata
            );
            break;
          case "dismissed":
            result = await logDismissal(
              reminderId,
              options.notes,
              options.metadata
            );
            break;
          case "snoozed":
            result = await logSnooze(
              reminderId,
              options.snoozeMinutes || 5,
              options.currentSnoozeCount || 0,
              options.notes
            );
            break;
          case "missed":
            result = await logMissed(reminderId, options.metadata);
            break;
          default:
            throw new Error(`Unknown action: ${action}`);
        }

        if (!result.success) {
          setLastError(result.error || "Unknown error occurred");
          return { success: false, error: result.error };
        }

        // Update stats after successful log
        updateStats();

        return { success: true };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setLastError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLogging(false);
      }
    },
    [updateStats]
  );

  const markCompleted = useCallback(
    async (
      reminderId: string,
      notes?: string
    ): Promise<{ success: boolean; error?: string }> => {
      return logAction(reminderId, "completed", { notes });
    },
    [logAction]
  );

  const markDismissed = useCallback(
    async (
      reminderId: string,
      notes?: string
    ): Promise<{ success: boolean; error?: string }> => {
      return logAction(reminderId, "dismissed", { notes });
    },
    [logAction]
  );

  const markSnoozed = useCallback(
    async (
      reminderId: string,
      snoozeMinutes: number,
      currentSnoozeCount: number = 0,
      notes?: string
    ): Promise<{ success: boolean; error?: string }> => {
      return logAction(reminderId, "snoozed", {
        snoozeMinutes,
        currentSnoozeCount,
        notes,
      });
    },
    [logAction]
  );

  const markMissed = useCallback(
    async (
      reminderId: string
    ): Promise<{ success: boolean; error?: string }> => {
      return logAction(reminderId, "missed");
    },
    [logAction]
  );

  const getLogsForDateCallback = useCallback(
    async (date: string, reminderId?: string): Promise<any[]> => {
      try {
        const result = await getLogsForDate(date, reminderId);
        if (result.success) {
          return result.logs || [];
        }
        throw new Error(result.error || "Failed to fetch logs");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setLastError(errorMessage);
        return [];
      }
    },
    []
  );

  const syncLogs = useCallback(async (): Promise<{
    synced: number;
    failed: number;
  }> => {
    setIsLogging(true);
    setLastError(null);

    try {
      const result = await syncOfflineLogs();
      updateStats();
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Sync failed";
      setLastError(errorMessage);
      return { synced: 0, failed: 0 };
    } finally {
      setIsLogging(false);
    }
  }, [updateStats]);

  return {
    logAction,
    markCompleted,
    markDismissed,
    markSnoozed,
    markMissed,
    getLogsForDate: getLogsForDateCallback,
    syncLogs,
    isLogging,
    lastError,
    offlineLogsCount: stats.offlineLogsCount,
    isOnline: stats.isOnline,
    stats,
  };
}
