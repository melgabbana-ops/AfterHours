self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

const CACHE_NAME = "after-hours-v13";
const BASE_PATH = new URL(".", self.location.href).pathname;
const asset = (path) => `${BASE_PATH}${path}`;
const APP_SHELL = [
  asset(""),
  asset("manifest.webmanifest"),
  asset("after-hours-brand-logo.svg"),
  asset("after-hours-icon-192.png"),
  asset("after-hours-icon-180.png"),
  asset("after-hours-icon-512.png"),
  asset("after-hours-icon-512.svg"),
  asset("icons/after-hours-master.svg")
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.all(APP_SHELL.map(async (file) => {
        try { await cache.add(file); } catch { /* Optional shell assets must not block installation. */ }
      })))
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
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE_PATH)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(request);
      if (response && response.ok) event.waitUntil(cache.put(request, response.clone()));
      return response;
    } catch {
      const cached = await cache.match(request);
      if (cached) return cached;
      if (request.mode === "navigate") return (await cache.match(asset(""))) || Response.error();
      return Response.error();
    }
  })());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }
  const title = typeof payload.title === "string" ? payload.title : "AFTER HOURS";
  const body = typeof payload.body === "string" ? payload.body : "Je hebt een nieuwe melding.";
  const requested = typeof payload.url === "string" && payload.url.startsWith("/") ? payload.url : "";
  let target = asset("");
  if (requested) {
    try {
      const candidate = new URL(requested.startsWith(BASE_PATH) ? requested : asset(requested.substring(1)), self.location.origin);
      if (candidate.origin === self.location.origin && candidate.pathname.startsWith(BASE_PATH)) target = candidate.href;
    } catch {
      // Invalid notification destinations safely fall back to the app home.
    }
  }
  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: asset("after-hours-icon-192.png"),
    badge: asset("after-hours-icon-192.png"),
    tag: typeof payload.tag === "string" ? payload.tag : "after-hours-notification",
    data: { url: target },
    renotify: false
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification && event.notification.data && typeof event.notification.data.url === "string"
    ? event.notification.data.url
    : asset("");
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if ("focus" in client) {
        await client.focus();
        if ("navigate" in client) await client.navigate(target);
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(target);
  })());
});
