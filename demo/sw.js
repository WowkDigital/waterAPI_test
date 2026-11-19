const CACHE_VERSION = "wodostraznik-v2";
const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./fields.js",
  "./terrain.js",
  "./satellite.js",
  "./manifest.webmanifest",
  "./icon.svg"
];

const API_CACHE_HOSTS = new Set([
  "api.open-meteo.com",
  "danepubliczne.imgw.pl",
  "uldk.gugik.gov.pl",
  "earth-search.aws.element84.com",
  "planetarycomputer.microsoft.com"
]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  // Never intercept HTTP Range Requests (206 Partial Content for Cloud Optimized GeoTIFFs).
  if (request.headers.has("range")) return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (isSameOrigin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request).then((response) => {
          if (response.ok && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  if (API_CACHE_HOSTS.has(url.hostname)) {
    event.respondWith(
      fetch(request).then((response) => {
        if (response.ok && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => caches.match(request))
    );
  }
});

self.addEventListener("push", (event) => {
  const payload = (() => {
    try {
      return event.data ? event.data.json() : {};
    } catch {
      return { title: "WodoStrażnik Pola", body: event.data?.text() ?? "Nowy alert wodny lub termiczny." };
    }
  })();

  event.waitUntil(
    self.registration.showNotification(payload.title || "WodoStrażnik Pola", {
      body: payload.body || "Sprawdź stan wody i stresu cieplnego na swoich polach.",
      icon: "./icon.svg",
      badge: "./icon.svg",
      tag: payload.tag || "wodostraznik-alert",
      data: { url: "./index.html#satelita" }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "./index.html";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => client.url.includes("index.html"));
      if (existing) return existing.focus();
      return self.clients.openWindow(target);
    })
  );
});
