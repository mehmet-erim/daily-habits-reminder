const CACHE_NAME = "wellness-tracker-v1";
const DYNAMIC_CACHE_NAME = "wellness-tracker-dynamic-v1";
const OFFLINE_CACHE_NAME = "wellness-tracker-offline-v1";

// Static assets to cache immediately
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/reminders",
  "/history",
  "/analytics",
  "/settings",
  "/login",
  "/manifest.json",
  "/sounds/notification.mp3",
  "/sounds/alarm.mp3",
  "/sounds/bell.mp3",
];

// API routes that should be cached
const CACHE_API_ROUTES = [
  "/api/reminders",
  "/api/dashboard/today-reminders",
  "/api/dashboard/daily-stats",
  "/api/counters",
  "/api/history/daily",
  "/api/analytics",
];

// Background sync tags
const SYNC_TAGS = {
  REMINDER_LOG: "reminder-log-sync",
  COUNTER_UPDATE: "counter-update-sync",
  REMINDER_UPDATE: "reminder-update-sync",
};

self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAME).then((cache) => {
        console.log("Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      }),
      // Create offline cache
      caches.open(OFFLINE_CACHE_NAME).then((cache) => {
        console.log("Creating offline cache");
        return cache.put(
          "/offline",
          new Response(
            JSON.stringify({
              message: "You are offline. Please check your connection.",
              timestamp: new Date().toISOString(),
            }),
            {
              headers: { "Content-Type": "application/json" },
            }
          )
        );
      }),
    ])
  );

  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName !== OFFLINE_CACHE_NAME
            ) {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim all clients
      self.clients.claim(),
    ])
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching
  if (request.method !== "GET") {
    // Handle POST/PUT/DELETE for offline queue
    if (url.pathname.startsWith("/api/")) {
      event.respondWith(handleApiRequest(request));
    }
    return;
  }

  // Handle different types of requests
  if (url.pathname.startsWith("/api/")) {
    // API requests - cache with network first strategy
    event.respondWith(handleApiRequest(request));
  } else if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2)$/)
  ) {
    // Static assets - cache first strategy
    event.respondWith(handleStaticAssets(request));
  } else {
    // HTML pages - network first with cache fallback
    event.respondWith(handlePageRequest(request));
  }
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const cacheKey = url.pathname + url.search;

  try {
    // Try network first
    const networkResponse = await fetch(request.clone());

    if (networkResponse.ok && request.method === "GET") {
      // Cache successful GET responses
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(cacheKey, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log("Network failed, trying cache for:", cacheKey);

    if (request.method === "GET") {
      // For GET requests, try cache
      const cachedResponse = await caches.match(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }

      // Return offline response for failed API calls
      return new Response(
        JSON.stringify({
          error: "Offline - data unavailable",
          timestamp: new Date().toISOString(),
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      // For POST/PUT/DELETE, queue for background sync
      await queueOfflineRequest(request);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Request queued for when connection is restored",
          queued: true,
        }),
        {
          status: 202,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAssets(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log("Failed to fetch static asset:", request.url);
    return new Response("", { status: 404 });
  }
}

// Handle page requests with network-first strategy
async function handlePageRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log("Network failed for page:", request.url);

    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fallback to dashboard for app routes
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) {
      const dashboardCache = await caches.match("/dashboard");
      if (dashboardCache) {
        return dashboardCache;
      }
    }

    // Final fallback
    return new Response("Offline - Page not available", {
      status: 503,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

// Queue offline requests for background sync
async function queueOfflineRequest(request) {
  const requestData = {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    body: request.method !== "GET" ? await request.text() : null,
    timestamp: Date.now(),
  };

  // Store in IndexedDB for persistence
  const db = await openOfflineDB();
  await addToOfflineQueue(db, requestData);

  // Register background sync
  if (
    "serviceWorker" in navigator &&
    "sync" in window.ServiceWorkerRegistration.prototype
  ) {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register(getSyncTag(request.url));
  }
}

// Background sync event
self.addEventListener("sync", (event) => {
  console.log("Background sync triggered:", event.tag);

  if (Object.values(SYNC_TAGS).includes(event.tag)) {
    event.waitUntil(processOfflineQueue());
  }
});

// Process queued offline requests
async function processOfflineQueue() {
  try {
    const db = await openOfflineDB();
    const queuedRequests = await getOfflineQueue(db);

    for (const requestData of queuedRequests) {
      try {
        const request = new Request(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body,
        });

        const response = await fetch(request);

        if (response.ok) {
          // Remove from queue on success
          await removeFromOfflineQueue(db, requestData.timestamp);
          console.log("Successfully synced queued request:", requestData.url);
        }
      } catch (error) {
        console.log("Failed to sync request:", requestData.url, error);
        // Keep in queue for next sync attempt
      }
    }
  } catch (error) {
    console.log("Error processing offline queue:", error);
  }
}

// IndexedDB helper functions
function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("wellness-tracker-offline", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("offline-queue")) {
        const store = db.createObjectStore("offline-queue", {
          keyPath: "timestamp",
        });
        store.createIndex("url", "url", { unique: false });
      }
    };
  });
}

function addToOfflineQueue(db, requestData) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["offline-queue"], "readwrite");
    const store = transaction.objectStore("offline-queue");
    const request = store.add(requestData);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function getOfflineQueue(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["offline-queue"], "readonly");
    const store = transaction.objectStore("offline-queue");
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removeFromOfflineQueue(db, timestamp) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["offline-queue"], "readwrite");
    const store = transaction.objectStore("offline-queue");
    const request = store.delete(timestamp);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Get appropriate sync tag based on URL
function getSyncTag(url) {
  if (url.includes("/api/logs")) return SYNC_TAGS.REMINDER_LOG;
  if (url.includes("/api/counters")) return SYNC_TAGS.COUNTER_UPDATE;
  if (url.includes("/api/reminders")) return SYNC_TAGS.REMINDER_UPDATE;
  return "general-sync";
}

// Push notification handling
self.addEventListener("push", (event) => {
  console.log("Push notification received:", event);

  const options = {
    body: "You have a wellness reminder!",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    tag: "wellness-reminder",
    requireInteraction: true,
    actions: [
      {
        action: "complete",
        title: "Mark as Done",
        icon: "/icons/action-complete.png",
      },
      {
        action: "snooze",
        title: "Snooze 5min",
        icon: "/icons/action-snooze.png",
      },
    ],
  };

  if (event.data) {
    const data = event.data.json();
    options.body = data.message || options.body;
    options.data = data;
  }

  event.waitUntil(
    self.registration.showNotification("Wellness Tracker", options)
  );
});

// Notification click handling
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event);

  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  if (action === "complete") {
    // Handle completion action
    event.waitUntil(handleNotificationAction("complete", data));
  } else if (action === "snooze") {
    // Handle snooze action
    event.waitUntil(handleNotificationAction("snooze", data));
  } else {
    // Default action - open app
    event.waitUntil(clients.openWindow("/dashboard"));
  }
});

async function handleNotificationAction(action, data) {
  try {
    // Try to send action to server
    const response = await fetch("/api/notifications/action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        reminderId: data?.reminderId,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send action");
    }
  } catch (error) {
    console.log("Failed to send notification action, queuing for sync:", error);

    // Queue for background sync if network fails
    const request = new Request("/api/notifications/action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        reminderId: data?.reminderId,
        timestamp: new Date().toISOString(),
      }),
    });

    await queueOfflineRequest(request);
  }
}

console.log("Service Worker loaded successfully");
