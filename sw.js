/* Daily Digest service worker.
   Strategy: NETWORK-FIRST for all same-origin GET requests, no caching.
   This defeats iOS PWA aggressive shell caching - the whole reason the
   Hard refresh button was fighting a losing battle before this existed.
   Future updates to index.html and lists.js get picked up automatically
   on every app launch, as long as the device is online. */

const SW_VERSION = 'dd-v1';

self.addEventListener('install', (e) => {
  /* Take over immediately instead of waiting for all pages to close. */
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    /* Nuke any caches a prior version may have created. */
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    /* Control the open pages without waiting for a reload. */
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  /* Only intercept this origin - don't mess with Wikipedia/Commons APIs. */
  if (url.origin !== self.location.origin) return;
  /* Always go to the network. Rely on the browser's HTTP cache behaviour
     but bypass any PWA-level long-term cache. */
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' })
      .catch(() => new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } }))
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
