// Clubless Collective — Service Worker
// Cache-first for static assets, network-first for API calls

const CACHE_NAME = "clubless-v1";
const STATIC_ASSETS = ["/", "/manifest.json", "/favicon.ico"];

// Install — pre-cache shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network-first for navigation/API, cache-first for assets
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and Supabase/Stripe API calls
  if (
    event.request.method !== "GET" ||
    url.hostname.includes("supabase") ||
    url.hostname.includes("stripe")
  ) {
    return;
  }

  // Navigation requests — network first with offline fallback
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/"))
    );
    return;
  }

  // Static assets (JS, CSS, fonts, images) — cache first
  if (
    url.pathname.match(/\.(js|css|woff2?|ttf|png|jpg|jpeg|svg|ico)$/) ||
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }
});
