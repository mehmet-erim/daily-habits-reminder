import { useState, useEffect, useCallback, useRef } from "react";
import {
  offlineSync,
  SyncStatus,
  QueuedRequest,
  isOnline,
  waitForOnline,
  executeWithOfflineSupport,
} from "@/lib/offline-sync";

export interface UseOfflineSyncOptions {
  autoSync?: boolean;
  syncInterval?: number;
  onSyncComplete?: () => void;
  onSyncError?: (error: Error) => void;
}

export interface UseOfflineSyncReturn {
  // Status
  syncStatus: SyncStatus;
  isOnline: boolean;

  // Actions
  queueRequest: (
    url: string,
    options: RequestInit,
    priority?: "high" | "medium" | "low",
    type?: QueuedRequest["type"]
  ) => Promise<boolean>;
  syncAll: () => Promise<void>;
  clearQueue: () => Promise<void>;

  // Enhanced fetch with offline support
  fetchWithOfflineSupport: <T>(
    url: string,
    options?: RequestInit,
    fallbackData?: T
  ) => Promise<T>;

  // Connection utilities
  waitForConnection: () => Promise<void>;
  executeWhenOnline: <T>(operation: () => Promise<T>) => Promise<T>;
}

export const useOfflineSync = (
  options: UseOfflineSyncOptions = {}
): UseOfflineSyncReturn => {
  const {
    autoSync = true,
    syncInterval = 30000, // 30 seconds
    onSyncComplete,
    onSyncError,
  } = options;

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : false,
    isSyncing: false,
    queuedRequests: 0,
    syncErrors: [],
  });

  const [connectionStatus, setConnectionStatus] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : false
  );
  const syncIntervalRef = useRef<NodeJS.Timeout>();
  const statusUpdateRef = useRef<number>();

  // Update sync status
  const updateSyncStatus = useCallback(async () => {
    try {
      const status = await offlineSync.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error("Failed to get sync status:", error);
    }
  }, []);

  // Setup offline sync listener
  useEffect(() => {
    const handleStatusChange = (status: SyncStatus) => {
      setSyncStatus(status);
    };

    offlineSync.addListener(handleStatusChange);

    // Initial status update
    updateSyncStatus();

    return () => {
      offlineSync.removeListener(handleStatusChange);
    };
  }, [updateSyncStatus]);

  // Setup connection listeners
  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus(true);
      updateSyncStatus();

      if (autoSync) {
        offlineSync
          .syncAll()
          .then(() => {
            onSyncComplete?.();
          })
          .catch((error) => {
            onSyncError?.(error);
          });
      }
    };

    const handleOffline = () => {
      setConnectionStatus(false);
      updateSyncStatus();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [autoSync, updateSyncStatus, onSyncComplete, onSyncError]);

  // Setup periodic sync
  useEffect(() => {
    if (autoSync && syncInterval > 0) {
      syncIntervalRef.current = setInterval(async () => {
        if (
          typeof navigator !== "undefined" &&
          navigator.onLine &&
          !syncStatus.isSyncing
        ) {
          try {
            await offlineSync.syncAll();
          } catch (error) {
            console.error("Periodic sync failed:", error);
            onSyncError?.(error as Error);
          }
        }
      }, syncInterval);
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [autoSync, syncInterval, syncStatus.isSyncing, onSyncError]);

  // Setup periodic status updates
  useEffect(() => {
    statusUpdateRef.current = window.setInterval(updateSyncStatus, 5000);

    return () => {
      if (statusUpdateRef.current) {
        clearInterval(statusUpdateRef.current);
      }
    };
  }, [updateSyncStatus]);

  // Queue request function
  const queueRequest = useCallback(
    async (
      url: string,
      options: RequestInit,
      priority: "high" | "medium" | "low" = "medium",
      type: QueuedRequest["type"] = "general"
    ): Promise<boolean> => {
      try {
        return await offlineSync.queueRequest(url, options, priority, type);
      } catch (error) {
        console.error("Failed to queue request:", error);
        onSyncError?.(error as Error);
        return false;
      }
    },
    [onSyncError]
  );

  // Sync all function
  const syncAll = useCallback(async (): Promise<void> => {
    try {
      await offlineSync.syncAll();
      onSyncComplete?.();
    } catch (error) {
      console.error("Sync failed:", error);
      onSyncError?.(error as Error);
      throw error;
    }
  }, [onSyncComplete, onSyncError]);

  // Clear queue function
  const clearQueue = useCallback(async (): Promise<void> => {
    try {
      await offlineSync.clearQueue();
    } catch (error) {
      console.error("Failed to clear queue:", error);
      onSyncError?.(error as Error);
      throw error;
    }
  }, [onSyncError]);

  // Enhanced fetch with offline support
  const fetchWithOfflineSupport = useCallback(
    async <T>(
      url: string,
      options: RequestInit = {},
      fallbackData?: T
    ): Promise<T> => {
      try {
        const response = await fetch(url, options);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error(`Fetch failed for ${url}:`, error);

        // If offline and we have fallback data, return it
        if (
          typeof navigator !== "undefined" &&
          !navigator.onLine &&
          fallbackData !== undefined
        ) {
          return fallbackData;
        }

        // If it's a write operation and we're offline, queue it
        if (
          typeof navigator !== "undefined" &&
          !navigator.onLine &&
          options.method &&
          options.method !== "GET"
        ) {
          await queueRequest(url, options);

          // Return a success response for queued operations
          return {
            success: true,
            message: "Request queued for sync when connection is restored",
            queued: true,
          } as T;
        }

        throw error;
      }
    },
    [queueRequest]
  );

  // Wait for connection
  const waitForConnection = useCallback((): Promise<void> => {
    return waitForOnline();
  }, []);

  // Execute when online
  const executeWhenOnline = useCallback(
    async <T>(operation: () => Promise<T>): Promise<T> => {
      if (!navigator.onLine) {
        await waitForConnection();
      }
      return await operation();
    },
    [waitForConnection]
  );

  return {
    // Status
    syncStatus,
    isOnline: connectionStatus,

    // Actions
    queueRequest,
    syncAll,
    clearQueue,

    // Enhanced utilities
    fetchWithOfflineSupport,
    waitForConnection,
    executeWhenOnline,
  };
};

// Specialized hooks for common use cases
export const useReminderSync = () => {
  const { queueRequest, fetchWithOfflineSupport, isOnline } = useOfflineSync({
    autoSync: true,
    syncInterval: 15000, // More frequent sync for reminders
  });

  const logReminderAction = useCallback(
    async (
      reminderId: string,
      action: string,
      timestamp: string = new Date().toISOString()
    ) => {
      return await fetchWithOfflineSupport("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminderId, action, timestamp }),
      });
    },
    [fetchWithOfflineSupport]
  );

  const updateReminder = useCallback(
    async (reminderId: string, data: any) => {
      return await fetchWithOfflineSupport(`/api/reminders/${reminderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    [fetchWithOfflineSupport]
  );

  return {
    logReminderAction,
    updateReminder,
    isOnline,
    queueRequest,
  };
};

export const useCounterSync = () => {
  const { fetchWithOfflineSupport, isOnline } = useOfflineSync();

  const updateCounter = useCallback(
    async (counterId: string, increment: number) => {
      return await fetchWithOfflineSupport(`/api/counters/${counterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ increment }),
      });
    },
    [fetchWithOfflineSupport]
  );

  const resetCounter = useCallback(
    async (counterId: string) => {
      return await fetchWithOfflineSupport(`/api/counters/${counterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset: true }),
      });
    },
    [fetchWithOfflineSupport]
  );

  return {
    updateCounter,
    resetCounter,
    isOnline,
  };
};

// Service Worker registration hook
export const useServiceWorker = () => {
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("Service Worker registered:", reg);
          setRegistration(reg);

          // Check for updates
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (
                  newWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const updateApp = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
      window.location.reload();
    }
  }, [registration]);

  return {
    registration,
    updateAvailable,
    isLoading,
    updateApp,
    isSupported: "serviceWorker" in navigator,
  };
};
