// Caching strategies and utilities for performance optimization

// Cache configuration types
export interface CacheConfig {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items
  persistent?: boolean; // Whether to persist to localStorage
}

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl?: number;
  size?: number;
}

// In-memory cache implementation
export class MemoryCache<T = any> {
  private cache = new Map<string, CacheItem<T>>();
  private config: Required<CacheConfig>;

  constructor(config: CacheConfig = {}) {
    this.config = {
      ttl: config.ttl || 5 * 60 * 1000, // 5 minutes default
      maxSize: config.maxSize || 100,
      persistent: config.persistent || false,
    };

    // Load from localStorage if persistent
    if (this.config.persistent && typeof window !== "undefined") {
      this.loadFromStorage();
    }
  }

  set(key: string, value: T, customTtl?: number): void {
    // Remove oldest items if at capacity
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.getOldestKey();
      if (oldestKey) {
        this.delete(oldestKey);
      }
    }

    const item: CacheItem<T> = {
      data: value,
      timestamp: Date.now(),
      ttl: customTtl || this.config.ttl,
      size: this.estimateSize(value),
    };

    this.cache.set(key, item);

    // Persist to localStorage if configured
    if (this.config.persistent) {
      this.persistToStorage();
    }
  }

  get(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Check if item has expired
    if (this.isExpired(item)) {
      this.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    return item !== undefined && !this.isExpired(item);
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);

    if (deleted && this.config.persistent) {
      this.persistToStorage();
    }

    return deleted;
  }

  clear(): void {
    this.cache.clear();

    if (this.config.persistent && typeof window !== "undefined") {
      localStorage.removeItem(this.getStorageKey());
    }
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Clean up expired items
  cleanup(): number {
    let removedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0 && this.config.persistent) {
      this.persistToStorage();
    }

    return removedCount;
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let totalSize = 0;
    let expiredCount = 0;

    for (const item of this.cache.values()) {
      totalSize += item.size || 0;
      if (this.isExpired(item)) {
        expiredCount++;
      }
    }

    return {
      size: this.cache.size,
      totalSizeBytes: totalSize,
      expiredCount,
      hitRate: this.calculateHitRate(),
      oldestTimestamp: this.getOldestTimestamp(),
    };
  }

  private isExpired(item: CacheItem<T>): boolean {
    const ttl = item.ttl || this.config.ttl;
    return Date.now() - item.timestamp > ttl;
  }

  private getOldestKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  private getOldestTimestamp(): number | null {
    let oldest = null;

    for (const item of this.cache.values()) {
      if (oldest === null || item.timestamp < oldest) {
        oldest = item.timestamp;
      }
    }

    return oldest;
  }

  private estimateSize(value: T): number {
    try {
      return JSON.stringify(value).length * 2; // Rough estimate
    } catch {
      return 0;
    }
  }

  private calculateHitRate(): number {
    // This would need hit/miss tracking for accurate calculation
    return 0; // Placeholder
  }

  private getStorageKey(): string {
    return "cache_" + this.constructor.name;
  }

  private loadFromStorage(): void {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(this.getStorageKey());
      if (stored) {
        const data = JSON.parse(stored);
        for (const [key, item] of Object.entries(data)) {
          this.cache.set(key, item as CacheItem<T>);
        }
      }
    } catch (error) {
      console.warn("Failed to load cache from storage:", error);
    }
  }

  private persistToStorage(): void {
    if (typeof window === "undefined") return;

    try {
      const data = Object.fromEntries(this.cache.entries());
      localStorage.setItem(this.getStorageKey(), JSON.stringify(data));
    } catch (error) {
      console.warn("Failed to persist cache to storage:", error);
    }
  }
}

// API response cache with automatic invalidation
export class APICache {
  private memoryCache: MemoryCache<any>;

  constructor(config: CacheConfig = {}) {
    this.memoryCache = new MemoryCache(config);
  }

  async get<T>(url: string, options?: RequestInit): Promise<T | null> {
    const cacheKey = this.generateCacheKey(url, options);
    return this.memoryCache.get(cacheKey);
  }

  async set<T>(
    url: string,
    data: T,
    options?: RequestInit,
    customTtl?: number
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(url, options);
    this.memoryCache.set(cacheKey, data, customTtl);
  }

  invalidate(pattern: string | RegExp): void {
    const keys = this.memoryCache.keys();

    for (const key of keys) {
      if (this.keyMatches(key, pattern)) {
        this.memoryCache.delete(key);
      }
    }
  }

  private generateCacheKey(url: string, options?: RequestInit): string {
    const method = options?.method || "GET";
    const body = options?.body ? JSON.stringify(options.body) : "";
    const headers = options?.headers ? JSON.stringify(options.headers) : "";

    return `${method}:${url}:${body}:${headers}`;
  }

  private keyMatches(key: string, pattern: string | RegExp): boolean {
    if (typeof pattern === "string") {
      return key.includes(pattern);
    } else {
      return pattern.test(key);
    }
  }
}

// Cache wrapper for React Query or SWR
export function createCacheWrapper<T>(
  cache: MemoryCache<T>,
  fetcher: (key: string) => Promise<T>
) {
  return async (key: string): Promise<T> => {
    // Check cache first
    const cached = cache.get(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch and cache
    const data = await fetcher(key);
    cache.set(key, data);

    return data;
  };
}

// Cache utility functions
export const cacheUtils = {
  // Create cache key from object
  createKey: (obj: any): string => {
    return JSON.stringify(obj, Object.keys(obj).sort());
  },

  // Get cache size in bytes
  getSize: (cache: MemoryCache<any>): number => {
    return cache.getStats().totalSizeBytes;
  },

  // Schedule periodic cleanup
  scheduleCleanup: (
    cache: MemoryCache<any>,
    intervalMs = 60000 // 1 minute
  ): (() => void) => {
    const interval = setInterval(() => {
      cache.cleanup();
    }, intervalMs);

    return () => clearInterval(interval);
  },

  // Warm up cache with predefined data
  warmUp: async <T>(
    cache: MemoryCache<T>,
    entries: Array<{ key: string; value: T; ttl?: number }>
  ): Promise<void> => {
    for (const entry of entries) {
      cache.set(entry.key, entry.value, entry.ttl);
    }
  },
};

// Export default cache instances
export const defaultMemoryCache = new MemoryCache({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
  persistent: false,
});

export const defaultAPICache = new APICache({
  ttl: 10 * 60 * 1000, // 10 minutes
  maxSize: 50,
});
