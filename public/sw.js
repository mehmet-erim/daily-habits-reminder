// Basic service worker for push notifications only
// No caching - let Next.js handle all caching

// Background sync tags
const SYNC_TAGS = {
  REMINDER_LOG: "reminder-log-sync",
  COUNTER_UPDATE: "counter-update-sync",
  REMINDER_UPDATE: "reminder-update-sync",
};

self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");
  event.waitUntil(
    // Clean up any old caches
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log("Deleting cache:", cacheName);
            return caches.delete(cacheName);
          })
        );
      })
      .then(() => {
        // Claim all clients
        return self.clients.claim();
      })
  );
});

// No fetch event handling - let Next.js handle everything
// self.addEventListener("fetch", (event) => {
//   // All requests go through normally without service worker interference
// });

// Keep background sync functionality for offline scenarios
async function queueOfflineRequest(request) {
  if (
    "serviceWorker" in navigator &&
    "sync" in window.ServiceWorkerRegistration.prototype
  ) {
    try {
      const requestData = {
        url: request.url,
        method: request.method,
        headers: [...request.headers.entries()],
        body: request.method !== "GET" ? await request.text() : null,
        timestamp: Date.now(),
      };

      // Store in IndexedDB for background sync
      const db = await openDB();
      const tx = db.transaction("offline-requests", "readwrite");
      await tx.store.add(requestData);

      // Register background sync
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(SYNC_TAGS.REMINDER_LOG);
    } catch (error) {
      console.error("Failed to queue offline request:", error);
    }
  }
}

// Background sync handler
self.addEventListener("sync", (event) => {
  console.log("Background sync triggered:", event.tag);

  if (Object.values(SYNC_TAGS).includes(event.tag)) {
    event.waitUntil(processOfflineRequests());
  }
});

async function processOfflineRequests() {
  try {
    const db = await openDB();
    const tx = db.transaction("offline-requests", "readwrite");
    const requests = await tx.store.getAll();

    for (const requestData of requests) {
      try {
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: new Headers(requestData.headers),
          body: requestData.body,
        });

        if (response.ok) {
          // Remove successful request from queue
          await tx.store.delete(requestData.id);
          console.log("Successfully synced offline request:", requestData.url);
        }
      } catch (error) {
        console.error("Failed to sync request:", error);
      }
    }
  } catch (error) {
    console.error("Background sync failed:", error);
  }
}

// IndexedDB helper
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("wellness-tracker-sync", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("offline-requests")) {
        const store = db.createObjectStore("offline-requests", {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("timestamp", "timestamp");
      }
    };
  });
}

// Push notification handling
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey || "default",
      },
      actions: [
        {
          action: "complete",
          title: "Mark Complete",
          icon: "/icons/check-icon.png",
        },
        {
          action: "snooze",
          title: "Snooze 5min",
          icon: "/icons/snooze-icon.png",
        },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "Reminder", options)
    );
  }
});

// Notification click handling
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "complete") {
    // Handle completion
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        if (clientList.length > 0) {
          clientList[0].postMessage({
            type: "REMINDER_COMPLETE",
            data: event.notification.data,
          });
          return clientList[0].focus();
        }
        return clients.openWindow("/dashboard");
      })
    );
  } else if (event.action === "snooze") {
    // Handle snooze
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        if (clientList.length > 0) {
          clientList[0].postMessage({
            type: "REMINDER_SNOOZE",
            data: event.notification.data,
          });
          return clientList[0].focus();
        }
        return clients.openWindow("/dashboard");
      })
    );
  } else {
    // Default action - open app
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow("/dashboard");
      })
    );
  }
});

console.log("Service Worker loaded successfully");
