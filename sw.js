/* Form Builder Service Worker
   Caches the app for offline use */

const CACHE_NAME = 'formbuilder-v1';
const ASSETS = [
  '/formbuilder/formbuilder.html',
  '/formbuilder/index.html',
  '/formbuilder/manifest.json'
];

/* Install — cache core assets */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

/* Activate — clean up old caches */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

/* Fetch — serve from cache, fall back to network */
self.addEventListener('fetch', event => {
  /* Always go to network for API calls */
  if(event.request.url.includes('api.anthropic.com') ||
     event.request.url.includes('api.github.com') ||
     event.request.url.includes('script.google.com') ||
     event.request.url.includes('maps.googleapis.com')){
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        /* Cache new HTML/JS/JSON files */
        if(response.ok && (
          event.request.url.endsWith('.html') ||
          event.request.url.endsWith('.js') ||
          event.request.url.endsWith('.json') ||
          event.request.url.endsWith('.css')
        )){
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
