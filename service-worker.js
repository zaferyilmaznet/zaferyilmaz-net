// ===========================================
// service-worker.js — Basic Offline Caching
// ===========================================
//
// Handles caching of core app files for offline use.
// - Caches shell on install
// - Serves from cache first (offline ready)
// - Auto-cleans old cache versions

// Strategy: Network-First with Cache Fallback for main resources.
// Pre-caching ensures the core app shell is always available offline.
// ===========================================

// 💡 Enhancement 1: Use a clear naming convention for the cache and assets
const CACHE_NAME = 'zaferyilmaz-net-cache-v1-0-0-alpha-4'; // ➡️ Increment version on every code change to force update
const ASSETS = [
  '/', // The root (index.html)
  '/index.html',
  '/manifest.json',
  '/css/style.css',
  '/js/main.js',

  '/assets/linkedin-logo.png',
  '/assets/social-card.png',
  '/assets/wechat-qr.png',
  '/assets/zaf.jpg',

  '/assets/zy-icon-72.png',
  '/assets/zy-icon-96.png',
  '/assets/zy-icon-192.png',
  '/assets/zy-icon-512.png',
];

// --- INSTALL EVENT ---
// Caches the application shell assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing and caching App Shell.');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // 💡 Enhancement 2: Catch errors here to prevent total installation failure
      return cache.addAll(ASSETS).catch((error) => {
        console.error('[SW ERROR] Failed to cache one or more assets:', error);
        // Installation will still fail, but logging helps debug which asset is missing
        throw error;
      });
    }),
  );
  // 💡 Best Practice: Forces the new service worker to activate immediately,
  // skipping the 'waiting' phase. Useful for development/simple PWAs.
  self.skipWaiting();
});

// --- ACTIVATE EVENT ---
// Cleans up old caches from previous versions
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating and cleaning old caches.');
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        // Delete any cache key that does NOT match the current CACHE_NAME
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW Cleanup] Deleting old cache:', key);
            return caches.delete(key);
          }
        }),
      ),
    ),
  );
  // 💡 Best Practice: Takes control of any clients (tabs) loaded with the previous Service Worker.
  self.clients.claim();
});

// --- FETCH EVENT ---
// Network-First with Cache Fallback + CRITICAL Error Fix
self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests (e.g., POST, PUT)
  if (event.request.method !== 'GET') return;

  // 💡 CRITICAL FIX: Prevents "Request scheme 'chrome-extension' is unsupported" error
  const url = new URL(event.request.url);

  // 1. Filter out non-http/https schemes (like chrome-extension:// or data://)
  if (!url.protocol.startsWith('http')) return;

  // 2. Filter out cross-origin requests unless explicitly needed (Good practice for PWA shell)
  // This prevents caching external resources that don't pass CORS checks.
  if (url.origin !== location.origin) {
    // Just let the network handle it, do not intercept or cache
    return event.respondWith(fetch(event.request));
  }

  // Handle same-origin GET requests using Network-First, Cache Fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Check for valid response (e.g., status 200, not 404 or opaque) before caching
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const cloned = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        return response;
      })
      // If network fetch fails (e.g., user is offline)
      .catch(() => {
        console.log(`[SW Fetch] Network failed for ${event.request.url}. Serving from cache.`);
        return caches.match(event.request);
      }),
  );
});

/* ==========================================================
   SERVICE WORKER UPDATE PROMPT
   ----------------------------------------------------------
   Former behavior was:
   - The Service Worker updates silently in the background.
   - A new version only activates when all tabs using the old
     version are closed.

   Enhancement added:
   - Detect when a new Service Worker is waiting.
   - Prompt the user: "A new version is available — refresh?"
   - On confirmation, call:
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();

   This ensures users always get the latest version instantly,
   providing a smoother, app-like update experience.
   ========================================================== */

// --- MESSAGE EVENT ---
// Allows the page to tell the SW to activate immediately
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Skip waiting requested.');
    self.skipWaiting();
  }
});
