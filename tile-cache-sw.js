const CACHE_VERSION = "brouter-demo-v1";
const APP_CACHE = `${CACHE_VERSION}-app`;
const TILE_CACHE = `${CACHE_VERSION}-tiles`;

const APP_FILES = [
  "./",
  "./brouter-demo.html",
  "./brouter-demo-bright.html",
  "./brouter-demo-gpx.html",
];

const TILE_HOST_RE = /(^|\.)basemaps\.cartocdn\.com$/;
const CDN_HOSTS = new Set([
  "unpkg.com",
  "fonts.googleapis.com",
  "fonts.gstatic.com",
]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_CACHE)
      .then((cache) => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names
          .filter((name) => ![APP_CACHE, TILE_CACHE].includes(name))
          .map((name) => caches.delete(name)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== "GET") return;

  if (TILE_HOST_RE.test(url.hostname)) {
    event.respondWith(cacheFirst(event.request, TILE_CACHE));
    return;
  }

  if (url.origin === self.location.origin || CDN_HOSTS.has(url.hostname)) {
    event.respondWith(staleWhileRevalidate(event.request, APP_CACHE));
  }
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (isCacheable(response)) {
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (isCacheable(response)) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || network;
}

function isCacheable(response) {
  return response && (response.ok || response.type === "opaque");
}
