import { toast } from "sonner";

export interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
  retryCount: number;
  priority: "high" | "medium" | "low";
  type: "reminder_log" | "counter_update" | "reminder_update" | "general";
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  queuedRequests: number;
  lastSyncTime?: Date;
  syncErrors: string[];
}

class OfflineSync {
  private db: IDBDatabase | null = null;
  private readonly dbName = "wellness-tracker-offline";
  private readonly dbVersion = 1;
  private readonly storeName = "sync-queue";
  private isInitialized = false;
  private syncInProgress = false;
  private listeners: Set<(status: SyncStatus) => void> = new Set();
  private retryTimeouts: Map<string, number> = new Map();

  // Maximum retry attempts and delays
  private readonly maxRetries = 3;
  private readonly retryDelays = [1000, 5000, 15000]; // 1s, 5s, 15s

  constructor() {
    this.initializeDB();
    this.setupOnlineListener();
    this.setupServiceWorkerListener();
  }

  private async initializeDB(): Promise<void> {
    try {
      this.db = await this.openDB();
      this.isInitialized = true;
      console.log("Offline sync database initialized");
    } catch (error) {
      console.error("Failed to initialize offline sync database:", error);
    }
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: "id" });
          store.createIndex("timestamp", "timestamp", { unique: false });
          store.createIndex("priority", "priority", { unique: false });
          store.createIndex("type", "type", { unique: false });
        }
      };
    });
  }

  private setupOnlineListener(): void {
    window.addEventListener("online", () => {
      console.log("Connection restored, starting sync...");
      this.syncAll();
    });

    window.addEventListener("offline", () => {
      console.log("Connection lost, queuing mode activated");
      this.notifyListeners();
    });
  }

  private setupServiceWorkerListener(): void {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.type === "SYNC_COMPLETE") {
          this.handleSyncComplete();
        }
      });
    }
  }

  // Public API
  async queueRequest(
    url: string,
    options: RequestInit,
    priority: "high" | "medium" | "low" = "medium",
    type: QueuedRequest["type"] = "general"
  ): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initializeDB();
    }

    const request: QueuedRequest = {
      id: this.generateId(),
      url,
      method: options.method || "GET",
      headers: this.serializeHeaders(options.headers),
      body: options.body ? String(options.body) : undefined,
      timestamp: Date.now(),
      retryCount: 0,
      priority,
      type,
    };

    try {
      await this.addToQueue(request);
      this.notifyListeners();

      toast.info("Request queued for sync", {
        description: "Will sync when connection is restored",
      });

      return true;
    } catch (error) {
      console.error("Failed to queue request:", error);
      toast.error("Failed to queue request");
      return false;
    }
  }

  async syncAll(): Promise<void> {
    if (this.syncInProgress || !navigator.onLine) {
      return;
    }

    this.syncInProgress = true;
    this.notifyListeners();

    try {
      const queuedRequests = await this.getQueuedRequests();

      if (queuedRequests.length === 0) {
        console.log("No requests to sync");
        return;
      }

      console.log(`Starting sync of ${queuedRequests.length} requests`);

      // Sort by priority and timestamp
      const sortedRequests = this.sortRequestsByPriority(queuedRequests);

      for (const request of sortedRequests) {
        await this.syncRequest(request);
      }

      toast.success("All requests synced successfully");
    } catch (error) {
      console.error("Sync failed:", error);
      toast.error("Sync failed", {
        description: "Some requests may not have been synced",
      });
    } finally {
      this.syncInProgress = false;
      this.notifyListeners();
    }
  }

  async clearQueue(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([this.storeName], "readwrite");
    const store = transaction.objectStore(this.storeName);
    await store.clear();

    this.notifyListeners();
    toast.info("Sync queue cleared");
  }

  async getQueuedRequests(): Promise<QueuedRequest[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], "readonly");
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getSyncStatus(): Promise<SyncStatus> {
    const queuedRequests = await this.getQueuedRequests();

    return {
      isOnline: navigator.onLine,
      isSyncing: this.syncInProgress,
      queuedRequests: queuedRequests.length,
      lastSyncTime: this.getLastSyncTime(),
      syncErrors: this.getSyncErrors(),
    };
  }

  // Event listeners
  addListener(listener: (status: SyncStatus) => void): void {
    this.listeners.add(listener);
  }

  removeListener(listener: (status: SyncStatus) => void): void {
    this.listeners.delete(listener);
  }

  // Private methods
  private async addToQueue(request: QueuedRequest): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const dbRequest = store.add(request);

      dbRequest.onerror = () => reject(dbRequest.error);
      dbRequest.onsuccess = () => resolve();
    });
  }

  private async removeFromQueue(id: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async updateRequest(request: QueuedRequest): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], "readwrite");
      const store = transaction.objectStore(this.storeName);
      const dbRequest = store.put(request);

      dbRequest.onerror = () => reject(dbRequest.error);
      dbRequest.onsuccess = () => resolve();
    });
  }

  private async syncRequest(request: QueuedRequest): Promise<void> {
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });

      if (response.ok) {
        await this.removeFromQueue(request.id);
        console.log(`Successfully synced request: ${request.url}`);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Failed to sync request ${request.url}:`, error);
      await this.handleSyncError(request, error as Error);
    }
  }

  private async handleSyncError(
    request: QueuedRequest,
    error: Error
  ): Promise<void> {
    request.retryCount++;

    if (request.retryCount >= this.maxRetries) {
      console.error(`Max retries exceeded for request: ${request.url}`);
      await this.removeFromQueue(request.id);

      toast.error("Sync failed permanently", {
        description: `Request to ${
          new URL(request.url).pathname
        } failed after ${this.maxRetries} attempts`,
      });

      return;
    }

    // Schedule retry with exponential backoff
    const delay = this.retryDelays[request.retryCount - 1] || 15000;

    setTimeout(async () => {
      try {
        await this.updateRequest(request);
        await this.syncRequest(request);
      } catch (retryError) {
        console.error("Retry failed:", retryError);
      }
    }, delay);
  }

  private sortRequestsByPriority(requests: QueuedRequest[]): QueuedRequest[] {
    const priorityOrder = { high: 0, medium: 1, low: 2 };

    return requests.sort((a, b) => {
      // First by priority
      const priorityDiff =
        priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by timestamp (older first)
      return a.timestamp - b.timestamp;
    });
  }

  private serializeHeaders(headers?: HeadersInit): Record<string, string> {
    const result: Record<string, string> = {};

    if (headers) {
      if (headers instanceof Headers) {
        headers.forEach((value, key) => {
          result[key] = value;
        });
      } else if (Array.isArray(headers)) {
        headers.forEach(([key, value]) => {
          result[key] = value;
        });
      } else {
        Object.assign(result, headers);
      }
    }

    return result;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async notifyListeners(): Promise<void> {
    const status = await this.getSyncStatus();
    this.listeners.forEach((listener) => listener(status));
  }

  private handleSyncComplete(): void {
    this.syncInProgress = false;
    this.notifyListeners();
  }

  private getLastSyncTime(): Date | undefined {
    const lastSync = localStorage.getItem("wellness-tracker-last-sync");
    return lastSync ? new Date(lastSync) : undefined;
  }

  private getSyncErrors(): string[] {
    const errors = localStorage.getItem("wellness-tracker-sync-errors");
    return errors ? JSON.parse(errors) : [];
  }

  private saveLastSyncTime(): void {
    localStorage.setItem(
      "wellness-tracker-last-sync",
      new Date().toISOString()
    );
  }

  private saveSyncError(error: string): void {
    const errors = this.getSyncErrors();
    errors.push(error);

    // Keep only last 10 errors
    if (errors.length > 10) {
      errors.splice(0, errors.length - 10);
    }

    localStorage.setItem(
      "wellness-tracker-sync-errors",
      JSON.stringify(errors)
    );
  }
}

// Singleton instance
export const offlineSync = new OfflineSync();

// Helper functions for common operations
export const queueReminderLog = (
  reminderId: string,
  action: string,
  timestamp: string
) => {
  return offlineSync.queueRequest(
    "/api/logs",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reminderId, action, timestamp }),
    },
    "high",
    "reminder_log"
  );
};

export const queueCounterUpdate = (counterId: string, increment: number) => {
  return offlineSync.queueRequest(
    `/api/counters/${counterId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ increment }),
    },
    "medium",
    "counter_update"
  );
};

export const queueReminderUpdate = (reminderId: string, data: any) => {
  return offlineSync.queueRequest(
    `/api/reminders/${reminderId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    "medium",
    "reminder_update"
  );
};

// Utility functions
export const isOnline = (): boolean => navigator.onLine;

export const waitForOnline = (): Promise<void> => {
  return new Promise((resolve) => {
    if (navigator.onLine) {
      resolve();
      return;
    }

    const handleOnline = () => {
      window.removeEventListener("online", handleOnline);
      resolve();
    };

    window.addEventListener("online", handleOnline);
  });
};

export const executeWithOfflineSupport = async <T>(
  operation: () => Promise<T>,
  fallbackData?: T
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (!navigator.onLine && fallbackData !== undefined) {
      console.log("Offline: returning fallback data");
      return fallbackData;
    }
    throw error;
  }
};
