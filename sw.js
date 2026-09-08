// sw.js — minimal service worker skeleton (caching could be added)
self.addEventListener('install', event => {
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  self.clients.claim();
});
self.addEventListener('fetch', function(event) {
  // Default: let network handle it. Extend later to cache assets.
});
