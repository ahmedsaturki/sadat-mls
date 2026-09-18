const STATIC_CACHE = "sadat-static-v4";
const DYNAMIC_CACHE = "sadat-dynamic-v4";

const LOCALES = ["ar", "en"];
const STATIC_ASSETS = [
  "/",
  ...LOCALES.flatMap((locale) => [
    `/${locale}`,
    `/${locale}/login`,
    `/${locale}/forgot-password`,
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

function isHttpGet(request, url) {
  return request.method === "GET" && url.protocol.startsWith("http");
}

function isNextPrefetch(url) {
  return url.searchParams.has("_rsc");
}

function isProtectedOrApiPath(pathname) {
  return (
    pathname.startsWith("/api") ||
    pathname.includes("/login") ||
    pathname.includes("/logout") ||
    pathname.includes("/dashboard") ||
    pathname.includes("/admin")
  );
}

function isStaticAsset(pathname) {
  return (
    pathname.startsWith("/_next/static") ||
    /\.(?:js|css|png|jpg|jpeg|webp|avif|svg|ico|woff2)$/.test(pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (!isHttpGet(request, url) || isNextPrefetch(url) || isProtectedOrApiPath(url.pathname)) {
    return;
  }

  // HTML/navigation requests are network-first so availability and listing
  // state do not remain stale indefinitely. A cached page is the offline fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;

        return fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached);
      })
    );
  }
});

self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  const title = data.title || "Sadat MLS";
  const options = {
    body: data.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-96.png",
    data: { url: data.url || "/ar" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/ar";

  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
