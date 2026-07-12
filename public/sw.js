const STATIC_CACHE = "sadat-static-v3";
const DYNAMIC_CACHE = "sadat-dynamic-v3";

const LOCALES = ["ar", "en"];
const STATIC_ASSETS = [
  "/",
  ...LOCALES.flatMap((loc) => [
    `/${loc}`,
    `/${loc}/login`,
    `/${loc}/forgot-password`,
    `/${loc}/manifest.json`,
  ]),
  "/manifest.json",
  "/robots.txt",
  "/og-image.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip RSC prefetch requests (let Next.js handle them natively)
  if (url.searchParams.has("_rsc")) return;

  // Skip unsupported schemes (chrome-extension, extension, etc.)
  if (!url.protocol.startsWith("http")) return;

  // Skip API routes, auth, and admin
  if (
    url.pathname.startsWith("/api") ||
    url.pathname.includes("/login") ||
    url.pathname.includes("/logout") ||
    url.pathname.includes("/dashboard") ||
    url.pathname.includes("/admin")
  ) {
    return;
  }

  // Network-first for dynamic content (explore, property pages)
  if (
    url.pathname.includes("/explore") ||
    url.pathname.includes("/offices/") ||
    url.pathname.includes("/agents/")
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200 && url.protocol.startsWith("http")) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for static assets
  if (
    url.pathname.startsWith("/_next/static") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".woff2")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const responseClone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(() => cached);
      })
    );
    return;
  }

// Stale-while-revalidate for landing page and other pages
  // Skip RSC prefetch requests (let Next.js handle them natively)
  if (url.searchParams.has("_rsc")) return;

  // Detect locale from pathname
  const pathLocale = LOCALES.find((loc) => url.pathname.startsWith(`/${loc}/`)) || "ar";
  const fallbackPath = `/${pathLocale}${url.pathname.replace(/^\/(ar|en)/, "")}`;

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && url.protocol.startsWith("http")) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => cached || caches.match(fallbackPath) || caches.match("/offline.html"));

      return cached || fetchPromise;
    })
  );
});

// Handle push notifications
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  const title = data.title || "Sadat MLS";
  const options = {
    body: data.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-96.png",
    data: { url: data.url || "/ar" },
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/ar";

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      // Focus existing window if open
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      // Open new window
      return self.clients.openWindow(url);
    })
  );
});

// Handle background sync for offline form submissions
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-contact-forms") {
    event.waitUntil(syncContactForms());
  }
});

async function syncContactForms() {
  // Future: implement IndexedDB storage for offline form submissions
}
