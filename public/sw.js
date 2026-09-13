const CACHE_NAME = 'tawseel-v31-fast-launch';

// Helper to get GitHub Pages base path if deployed under a subpath
const getBasePath = () => {
  if (typeof self !== 'undefined' && self.location) {
    if (self.location.pathname.includes('/Tawseel-app')) {
      return '/Tawseel-app';
    }
  }
  return '';
};

// Core Shell Assets to pre-cache on install
const getCoreAssets = () => {
  const base = getBasePath();
  const list = [
    './',
    './index.html',
    './manifest.json',
    './favicon.png',
    './apple-touch-icon.png',
    './icon.png',
    './icon.svg',
    './icon-192.png',
    './icon-512.png',
    './icon-maskable-192.png',
    './icon-maskable-512.png'
  ];

  if (base) {
    list.push(
      `${base}/`,
      `${base}/index.html`,
      `${base}/manifest.json`,
      `${base}/favicon.png`,
      `${base}/apple-touch-icon.png`,
      `${base}/icon-192.png`,
      `${base}/icon-512.png`
    );
  }

  return list;
};

// 1. Install Event: Precache core assets and activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      const assets = getCoreAssets();
      return Promise.all(
        assets.map((url) => {
          return cache.add(url).catch((err) => {
            console.warn(`[SW] Precache item note: ${url}`, err);
          });
        })
      );
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// 2. Activate Event: Clean old caches and claim all clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Cleared outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 3. Fetch Event: Instant-Launch caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle HTTP/HTTPS GET requests
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  const url = new URL(request.url);

  // Bypass Vite dev server internal assets during development
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.includes('/src/') ||
    url.pathname.includes('node_modules') ||
    url.search.includes('v=') ||
    url.search.includes('t=')
  ) {
    return;
  }

  // A. Navigation / Document Requests (Opening the app from Home Screen / Launcher)
  // STRATEGY: Instant Cache First + Background Revalidate
  // This eliminates the Android / iOS splash screen delay completely (< 30ms launch)
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const base = getBasePath();

        // 1. Check cache immediately for index.html or root
        let cached = await cache.match(request);
        if (!cached && base) {
          cached = await cache.match(`${base}/index.html`) || await cache.match(`${base}/`);
        }
        if (!cached) {
          cached = await cache.match('./index.html') ||
                   await cache.match('/index.html') ||
                   await cache.match('./') ||
                   await cache.match('/');
        }

        // 2. In parallel, fetch the freshest copy from network to keep cache updated
        const networkFetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const copy = networkResponse.clone();
              cache.put(request, copy);
              cache.put('./index.html', networkResponse.clone());
              cache.put('./', networkResponse.clone());
              if (base) {
                cache.put(`${base}/index.html`, networkResponse.clone());
                cache.put(`${base}/`, networkResponse.clone());
              }
            }
            return networkResponse;
          })
          .catch(() => null);

        // 3. If we have a cached version, return it INSTANTLY without waiting for network!
        if (cached) {
          return cached;
        }

        // 4. First time ever opening: wait for network response
        const networkResponse = await networkFetchPromise;
        if (networkResponse) {
          return networkResponse;
        }

        // 5. Fallback offline UI if completely disconnected and not cached
        return new Response(
          `<!DOCTYPE html>
          <html lang="ar" dir="rtl">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>توصيل - وضع عدم الاتصال</title>
              <style>
                body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
                .card { background: #1e293b; padding: 32px 24px; border-radius: 24px; max-width: 380px; width: 100%; border: 1px solid #334155; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.5); }
                .icon { font-size: 48px; margin-bottom: 16px; }
                h1 { font-size: 20px; font-weight: 800; margin: 0 0 8px; color: #f97316; }
                p { font-size: 14px; color: #94a3b8; line-height: 1.6; margin: 0 0 24px; }
                .btn { background: #f97316; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; text-decoration: none; display: inline-block; width: 100%; box-sizing: border-box; }
                .btn:hover { background: #ea580c; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="icon">📶</div>
                <h1>تطبيق توصيل (أوفلاين)</h1>
                <p>أنت حالياً غير متصل بالإنترنت. يرجى التأكد من تشغيل البيانات أو شبكة Wi-Fi وإعادة المحاولة.</p>
                <button class="btn" onclick="window.location.reload()">إعادة المحاولة 🔄</button>
              </div>
            </body>
          </html>`,
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      })
    );
    return;
  }

  // B. Static Assets: JS bundles, CSS files, Web Fonts, and Images
  // STRATEGY: Cache First with Background Update (Stale-While-Revalidate)
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    request.destination === 'image' ||
    url.pathname.includes('/assets/') ||
    url.pathname.includes('/fonts/') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('images.unsplash.com') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        // Fetch from network to update cache in background
        const networkFetch = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
              const copy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return networkResponse;
          })
          .catch(() => null);

        // Return cached immediately if available, otherwise wait for network
        return cachedResponse || networkFetch;
      })
    );
    return;
  }

  // C. API Requests (/api/*): Network First with 3.5s timeout
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      new Promise((resolve) => {
        let timedOut = false;
        const timer = setTimeout(() => {
          timedOut = true;
          caches.match(request).then((cached) => {
            if (cached) resolve(cached);
          });
        }, 3500);

        fetch(request)
          .then((response) => {
            clearTimeout(timer);
            if (!timedOut) {
              if (response && response.status === 200) {
                const copy = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
              }
              resolve(response);
            }
          })
          .catch(async () => {
            clearTimeout(timer);
            const cached = await caches.match(request);
            if (cached) {
              resolve(cached);
            } else {
              resolve(
                new Response(JSON.stringify({ error: 'offline', offline: true }), {
                  headers: { 'Content-Type': 'application/json' },
                  status: 503,
                })
              );
            }
          });
      })
    );
    return;
  }

  // D. Default Fallback: Network First with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
