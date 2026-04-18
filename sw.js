const CACHE_NAME = 'cot-dynasty-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
];

// Install — cache core assets
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k)   { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch — network first, fall back to cache
self.addEventListener('fetch', function(e) {
  // Skip Sleeper API calls — always need live data
  if (e.request.url.includes('sleeper.app') || 
      e.request.url.includes('sleepercdn.com') ||
      e.request.url.includes('kraken.com')) {
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(function(response) {
        // Cache fresh copy
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
        return response;
      })
      .catch(function() {
        // Network failed — serve from cache
        return caches.match(e.request);
      })
  );
});
