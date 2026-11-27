self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

const CACHE_NAME = "after-hours-v23";
const BASE_PATH = new URL(".", self.location.href).pathname;
const asset = (path) => `${BASE_PATH}${path}`;

// Keep the runtime cache policy in a separately tested classic worker script.
importScripts(asset("sw-cache-policy.js"));
const { shouldCacheRequest, shouldCacheResponse } = self.AFTER_HOURS_SW_CACHE_POLICY;

const APP_SHELL = [
  asset(""),
  asset("manifest.webmanifest"),
  asset("sw-cache-policy.js"),
  asset("after-hours-brand-logo.svg"),
  asset("after-hours-brand-logo-transparent.svg"),
  asset("visuals/ah-cinematic-hero.svg"),
  asset("visuals/ah-experience-photo.svg"),
  asset("visuals/ah-aftercare-photo.svg"),
  asset("visuals/ah-completion-photo.svg"),
  asset("visuals/ah-horoscope-photo.svg"),
  asset("visuals/ah-profile-photo.svg"),
  asset("visuals/ah-radio-photo.svg"),
  asset("visuals/ah-tarot-photo.svg"),
  asset("visuals/ah-radio-vinyl.svg"),
  asset("visuals/ah-tarot-frame.svg"),
  asset("visuals/ah-cinematic-background.svg"),

  asset("visuals/reference-home.svg"),
  asset("visuals/reference-consent.svg"),
  asset("visuals/reference-experience.svg"),
  asset("visuals/reference-aftercare.svg"),
  asset("visuals/reference-completion.svg"),
  asset("visuals/reference-tarot.svg"),
  asset("visuals/reference-horoscope.svg"),
  asset("visuals/reference-radio.svg"),
  asset("visuals/reference-profile.svg"),
  asset("after-hours-wordmark.svg"),
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

// Only app navigations and immutable Vite bundle files enter the runtime cache.
// Programmatic fetches (including JSON/API calls), query-bearing invite links and
// arbitrary same-origin endpoints bypass Cache API even if headers are misconfigured.
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(BASE_PATH)) return;

  if (!shouldCacheRequest(request, url, BASE_PATH, self.location.origin)) {
    // Remove any older copy before letting the browser handle the request normally.
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.delete(request)));
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(request);
      if (shouldCacheResponse(response)) {
        event.waitUntil(cache.put(request, response.clone()));
      } else {
        event.waitUntil(cache.delete(request));
      }
      return response;
    } catch {
      const cached = await cache.match(request);
      if (cached) return cached;
      if (request.mode === "navigate") return (await cache.match(asset(""))) || Response.error();
      return Response.error();
    }
  })());
});

// Resolve notification destinations only inside this app's GitHub Pages base path.
function safeNotificationPath(value) {
  const fallback = new URL(asset(""), self.location.origin).href;
  if (typeof value !== "string" || value.startsWith("//") || value.includes("\\")) return fallback;
  try {
    const candidate = new URL(
      value.startsWith("/")
        ? (value.startsWith(BASE_PATH) ? value : asset(value.substring(1)))
        : value,
      self.location.origin
    );
    if (candidate.origin !== self.location.origin || !candidate.pathname.startsWith(BASE_PATH)) return fallback;
    return candidate.href;
  } catch {
    return fallback;
  }
}

self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }
  const title = typeof payload.title === "string" ? payload.title : "AFTER HOURS";
  const body = typeof payload.body === "string" ? payload.body : "Je hebt een nieuwe melding.";
  // Haptic patterns are progressive enhancement: supported Android browsers
  // can distinguish safety and check-in alerts; unsupported devices ignore them.
  const vibrate = payload.kind === "safety"
    ? [120, 70, 240, 70, 360]
    : payload.kind === "checkin"
      ? [70, 45, 110]
      : [70, 40, 70];
  const target = safeNotificationPath(payload.url);
  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: asset("after-hours-icon-192.png"),
    badge: asset("after-hours-icon-192.png"),
    tag: typeof payload.tag === "string" ? payload.tag : "after-hours-notification",
    data: { url: target },
    renotify: false,
    vibrate
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = safeNotificationPath(event.notification && event.notification.data && event.notification.data.url);
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
