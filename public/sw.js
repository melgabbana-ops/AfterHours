const CACHE_NAME = "after-hours-v3";
const APP_SHELL = ["/", "/manifest.webmanifest", "/after-hours-logo.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.all(APP_SHELL.map(async (asset) => {
        try { await cache.add(asset); } catch { /* Keep install resilient if an optional asset is unavailable. */ }
      })))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("after-hours-") && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Network-first keeps app updates fresh, with a cached shell as an offline fallback.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(request);
      if (response && response.ok) {
        event.waitUntil(cache.put(request, response.clone()));
      }
      return response;
    } catch {
      const cached = await cache.match(request);
      if (cached) return cached;

      // Deep links should still open the cached single-page app when offline.
      if (request.mode === "navigate") {
        return (await cache.match("/")) || Response.error();
      }
      return Response.error();
    }
  })());
});

// Push is displayed only when a server sends a push event. A push provider and
// user permission are still required; this handler does not create subscriptions.
self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }

  const title = typeof payload.title === "string" ? payload.title : "AFTER HOURS";
  const body = typeof payload.body === "string" ? payload.body : "Je hebt een nieuwe melding.";
  const target = typeof payload.url === "string" && payload.url.startsWith("/") ? payload.url : "/";

  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: "/after-hours-logo.svg",
    badge: "/after-hours-logo.svg",
    tag: typeof payload.tag === "string" ? payload.tag : "after-hours-notification",
    data: { url: target },
    renotify: false
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification && event.notification.data && typeof event.notification.data.url === "string"
    ? event.notification.data.url
    : "/";

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if ("focus" in client) {
        await client.focus();
        if ("navigate" in client && target !== "/") await client.navigate(target);
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(target);
  })());
});
