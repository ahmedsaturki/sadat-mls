const STATIC_CACHE = "sadat-static-v2";
const DYNAMIC_CACHE = "sadat-dynamic-v2";

const STATIC_ASSETS = [
  "/",
  "/ar",
  "/en",
  "/ar/explore",
  "/en/explore",
  "/manifest.json",
  "/robots.txt",
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
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response && response.status === 200 && url.protocol.startsWith("http")) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise;
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
