self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Biarkan request tetap mengalir ke jaringan (network-first)
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
