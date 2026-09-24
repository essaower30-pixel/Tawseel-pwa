// ==============================================================================
// Tawseel Progressive Web App (PWA) - Service Worker
// Version: tawseel-v41-reliable-push-badge
// Designed for instant startup and automatic freshness for all customers & staff
// ==============================================================================

const CACHE_NAME = 'tawseel-v42-clean-dismiss-badge';

// Dynamically determine the base path (e.g. '/Tawseel-pwa' on GitHub Pages or '' on root domain)
const getBasePath = () => {
  if (typeof self !== 'undefined' && self.location) {
    const path = self.location.pathname;
    const idx = path.lastIndexOf('/');
    if (idx > 0) {
      return path.substring(0, idx);
    }
  }
  return '';
};

// Core Shell Assets
const getCoreAssets = () => {
  const base = getBasePath();
  const list = [
    './',
    './index.html',
    './manifest.json',
    './precache-manifest.json',
    './favicon.png',
    './apple-touch-icon.png',
    './icon.png',
    './icon.svg',
    './icon-192.png',
    './icon-512.png',
    './icon-maskable-192.png',
    './icon-maskable-512.png',
    './sounds/ringtone.wav',
    './sounds/chime.wav',
    './sounds/cashier.wav'
  ];

  if (base) {
    list.push(
      `${base}/`,
      `${base}/index.html`,
      `${base}/manifest.json`,
      `${base}/precache-manifest.json`,
      `${base}/favicon.png`,
      `${base}/apple-touch-icon.png`,
      `${base}/icon-192.png`,
      `${base}/icon-512.png`,
      `${base}/sounds/ringtone.wav`,
      `${base}/sounds/chime.wav`,
      `${base}/sounds/cashier.wav`
    );
  }

  return Array.from(new Set(list));
};

// Extract asset URLs (<script src="...">, <link href="...">) from index.html content
const extractAssetsFromHtml = (htmlText) => {
  const assets = [];
  const scriptRegex = /<script[^>]+src=["']([^"']+)["']/gi;
  const linkRegex = /<link[^>]+href=["']([^"']+)["']/gi;
  let match;

  while ((match = scriptRegex.exec(htmlText)) !== null) {
    if (match[1] && !match[1].startsWith('http') && !match[1].startsWith('//')) {
      assets.push(match[1]);
    }
  }

  while ((match = linkRegex.exec(htmlText)) !== null) {
    if (match[1] && !match[1].startsWith('http') && !match[1].startsWith('//')) {
      assets.push(match[1]);
    }
  }

  return assets;
};

// 1. INSTALL EVENT: Precache shell assets and precache-manifest.json
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const core = getCoreAssets();
      
      // A. Cache standard core assets safely
      await Promise.all(
        core.map(async (url) => {
          try {
            const res = await fetch(url, { cache: 'no-cache' });
            if (res && res.status === 200) {
              await cache.put(url, res);
            }
          } catch (e) {
            // Ignore transient fetch failures for optional assets
          }
        })
      );

      // B. Fetch precache-manifest.json generated during vite build to cache all JS/CSS chunks
      try {
        const manifestRes = await fetch('./precache-manifest.json', { cache: 'no-cache' });
        if (manifestRes && manifestRes.status === 200) {
          const manifestList = await manifestRes.json();
          if (Array.isArray(manifestList)) {
            await Promise.all(
              manifestList.map(async (assetUrl) => {
                try {
                  const aRes = await fetch(assetUrl, { cache: 'no-cache' });
                  if (aRes && aRes.status === 200) {
                    await cache.put(assetUrl, aRes);
                  }
                } catch (err) {}
              })
            );
          }
        }
      } catch (manifestErr) {}

      // C. Also fetch index.html and scan it for script/style tags to cache bundles
      try {
        const htmlRes = await fetch('./index.html', { cache: 'no-cache' });
        if (htmlRes && htmlRes.status === 200) {
          const clone = htmlRes.clone();
          await cache.put('./index.html', clone);
          const htmlText = await htmlRes.text();
          const discovered = extractAssetsFromHtml(htmlText);
          await Promise.all(
            discovered.map(async (dUrl) => {
              try {
                const dRes = await fetch(dUrl, { cache: 'no-cache' });
                if (dRes && dRes.status === 200) {
                  await cache.put(dUrl, dRes);
                }
              } catch (e) {}
            })
          );
        }
      } catch (htmlErr) {}
    })
  );
});

// 2. ACTIVATE EVENT: Remove old caches and claim all clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    }).then(async () => {
      try {
        const allClients = await self.clients.matchAll({ type: 'window' });
        allClients.forEach((client) => {
          client.postMessage({ type: 'SW_VERSION_UPDATED', version: CACHE_NAME });
        });
      } catch (e) {}
    })
  );
});

// Helper: Match a request in cache by exact URL, pathname, or filename
async function matchCacheFlexible(cache, request) {
  // 1. Exact match
  const exact = await cache.match(request);
  if (exact) return exact;

  const reqUrl = typeof request === 'string' ? request : request.url;
  const parsed = new URL(reqUrl, self.location.origin);
  const pathname = parsed.pathname;
  const filename = pathname.substring(pathname.lastIndexOf('/') + 1);

  // 2. Match without search query
  if (parsed.search) {
    const withoutSearch = await cache.match(parsed.origin + parsed.pathname);
    if (withoutSearch) return withoutSearch;
  }

  // 3. Match by relative pathname (e.g. ./assets/index-xxx.js)
  const relativeMatch = await cache.match('.' + pathname) || await cache.match('.' + pathname.replace(getBasePath(), ''));
  if (relativeMatch) return relativeMatch;

  // 4. Iterate cache keys if looking for a specific hashed chunk (e.g. index-D9f2.js)
  if (filename && (filename.endsWith('.js') || filename.endsWith('.css') || filename.endsWith('.png') || filename.endsWith('.svg'))) {
    const keys = await cache.keys();
    for (const key of keys) {
      if (key.url.endsWith(filename)) {
        const found = await cache.match(key);
        if (found) return found;
      }
    }
  }

  return null;
}

// Helper: Find the cached index.html
async function getCachedIndexHtml(cache) {
  const base = getBasePath();
  const candidates = [
    './index.html',
    './',
    `${base}/index.html`,
    `${base}/`,
    '/index.html',
    '/'
  ];

  for (const c of candidates) {
    const hit = await cache.match(c);
    if (hit) return hit;
  }

  // Search all keys in cache for index.html
  const keys = await cache.keys();
  for (const k of keys) {
    if (k.url.endsWith('/index.html') || k.url.endsWith(base + '/')) {
      const hit = await cache.match(k);
      if (hit) return hit;
    }
  }

  return null;
}

// 3. FETCH EVENT
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

  // A. NAVIGATION / DOCUMENT REQUESTS (Opening the app from Home Screen, launcher, or refreshing)
  // STRATEGY: Safe Network-First with Cache Fallback - 100% resilient, never throws ERR_FAILED
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      (async () => {
        try {
          const cache = await caches.open(CACHE_NAME);

          // 1. Try to fetch the fresh HTML from network
          try {
            const netResponse = await fetch(request);
            if (netResponse && netResponse.status === 200) {
              const copy = netResponse.clone();
              cache.put(request, copy).catch(() => {});
              cache.put('./index.html', netResponse.clone()).catch(() => {});
              cache.put('./', netResponse.clone()).catch(() => {});

              // Background scan for new assets
              netResponse.clone().text().then((text) => {
                const assets = extractAssetsFromHtml(text);
                assets.forEach((a) => {
                  fetch(a).then((aRes) => {
                    if (aRes && aRes.status === 200) {
                      cache.put(a, aRes).catch(() => {});
                    }
                  }).catch(() => {});
                });
              }).catch(() => {});

              return netResponse;
            }
          } catch (netErr) {
            // Offline or network error - gracefully fall back to cache
          }

          // 2. Offline fallback: Serve cached index.html
          const cachedResponse = (await matchCacheFlexible(cache, request)) || (await getCachedIndexHtml(cache));
          if (cachedResponse) {
            return cachedResponse;
          }
        } catch (swErr) {
          // Log and continue to fallback
        }

        // 3. Ultimate fallback if completely offline and nothing was cached yet
        return new Response(
          `<!DOCTYPE html>
          <html lang="ar" dir="rtl">
            <head>
              <meta charset="UTF-8" />
              <meta name="viewport" content="width=device-width, initial-scale=1.0" />
              <title>توصيل - وضع عدم الاتصال</title>
              <style>
                body { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; color: #0f172a; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
                .card { background: #ffffff; padding: 32px 24px; border-radius: 24px; max-width: 380px; width: 100%; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
                .icon { font-size: 48px; margin-bottom: 16px; }
                h1 { font-size: 20px; font-weight: 800; margin: 0 0 8px; color: #f97316; }
                p { font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 24px; }
                .btn { background: #f97316; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; display: inline-block; width: 100%; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="icon">🛵</div>
                <h1>تطبيق توصيل (أوفلاين)</h1>
                <p>أنت حالياً تتصفح في وضع عدم الاتصال بالإنترنت. يرجى الضغط على زر التحديث أدناه عند توفر الاتصال.</p>
                <button class="btn" onclick="window.location.reload()">إعادة التحميل 🔄</button>
              </div>
            </body>
          </html>`,
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      })()
    );
    return;
  }

  // B. STATIC ASSETS: JS bundles, CSS stylesheets, Web Fonts, and Images
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
      caches.open(CACHE_NAME).then(async (cache) => {
        // 1. Flexible cache lookup (handles path differences & hashes)
        const cached = await matchCacheFlexible(cache, request);

        // 2. Background network fetch
        const networkFetch = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
              const copy = networkResponse.clone();
              cache.put(request, copy);
            }
            return networkResponse;
          })
          .catch(() => null);

        // 3. If cached, return immediately
        if (cached) {
          return cached;
        }

        // 4. If not cached, await network
        const netRes = await networkFetch;
        if (netRes) {
          return netRes;
        }

        // 5. CRITICAL SAFEGUARD: Never return null/undefined to respondWith!
        if (request.destination === 'script' || url.pathname.endsWith('.js')) {
          return new Response('/* offline bundle fallback */ export default {};', {
            headers: { 'Content-Type': 'application/javascript' }
          });
        }

        if (request.destination === 'style' || url.pathname.endsWith('.css')) {
          return new Response('/* offline style fallback */', {
            headers: { 'Content-Type': 'text/css' }
          });
        }

        return new Response('', { status: 408, statusText: 'Offline Asset Unavailable' });
      })
    );
    return;
  }

  // C. API REQUESTS (/api/*): Network First with 3.5s timeout, then cache, then offline JSON
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return new Promise((resolve) => {
          let timedOut = false;
          const timer = setTimeout(() => {
            timedOut = true;
            cache.match(request).then((cached) => {
              if (cached) resolve(cached);
            });
          }, 3000);

          fetch(request)
            .then((response) => {
              clearTimeout(timer);
              if (!timedOut) {
                if (response && response.status === 200) {
                  cache.put(request, response.clone());
                }
                resolve(response);
              }
            })
            .catch(async () => {
              clearTimeout(timer);
              const cached = await cache.match(request);
              if (cached) {
                resolve(cached);
              } else {
                resolve(
                  new Response(JSON.stringify({ error: 'offline', offline: true }), {
                    headers: { 'Content-Type': 'application/json' },
                    status: 503
                  })
                );
              }
            });
        });
      })
    );
    return;
  }

  // D. DEFAULT FALLBACK: Network First with cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const hit = await matchCacheFlexible(cache, request);
        return hit || new Response('Offline', { status: 503 });
      })
  );
});

// ==============================================================================
// 4. NOTIFICATION & STATUS BAR ICON HANDLING (WhatsApp-like top bar badge)
// ==============================================================================

// Helper to resolve icon and badge URLs reliably
const resolveNotifIconUrls = (options = {}) => {
  const base = getBasePath();
  const origin = self.location.origin;
  const iconUrl = options.icon || (base ? `${origin}${base}/icon-192.png` : `${origin}/icon-192.png`);
  const badgeUrl = options.badge || (base ? `${origin}${base}/icon-192.png` : `${origin}/icon-192.png`);
  return { iconUrl, badgeUrl };
};

// A. Helper to sync App Badge on device icon
const syncAppBadge = async (countOverride) => {
  try {
    if (typeof self !== 'undefined' && self.navigator && 'setAppBadge' in self.navigator) {
      if (typeof countOverride === 'number') {
        if (countOverride > 0) {
          await self.navigator.setAppBadge(countOverride);
        } else if ('clearAppBadge' in self.navigator) {
          await self.navigator.clearAppBadge();
        }
        return;
      }
      const activeNotifs = await self.registration.getNotifications();
      const count = (activeNotifs && activeNotifs.length > 0) ? activeNotifs.length : 0;
      if (count > 0) {
        await self.navigator.setAppBadge(count);
      } else if ('clearAppBadge' in self.navigator) {
        await self.navigator.clearAppBadge();
      }
    }
  } catch (e) {
    // Ignore unsupported badging
  }
};

// B. Notification Click: Bring app to foreground or open target order/view
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // If close action clicked, dismiss all notifications and clear badge
  if (event.action === 'close') {
    event.waitUntil(
      self.registration.getNotifications().then((notifications) => {
        for (const notif of notifications) {
          try { notif.close(); } catch {}
        }
        if (typeof self !== 'undefined' && self.navigator && 'clearAppBadge' in self.navigator) {
          return self.navigator.clearAppBadge().catch(() => {});
        }
      }).catch(() => {})
    );
    return;
  }

  // Dismiss any remaining notifications to keep status bar clean when user opens app
  event.waitUntil(
    self.registration.getNotifications().then((notifications) => {
      for (const notif of notifications) {
        try { notif.close(); } catch {}
      }
      if (typeof self !== 'undefined' && self.navigator && 'clearAppBadge' in self.navigator) {
        return self.navigator.clearAppBadge().catch(() => {});
      }
    }).catch(() => {})
  );

  const notifData = event.notification.data || {};
  const base = getBasePath();
  const targetUrl = notifData.url || (base ? `${self.location.origin}${base}/` : `${self.location.origin}/`);

  event.waitUntil(
    (async () => {
      // 1. If an existing window is already open, focus it and notify
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url && client.url.includes(self.location.origin)) {
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              data: notifData
            });
            if ('navigate' in client && targetUrl && client.url !== targetUrl) {
              client.navigate(targetUrl);
            }
            return client.focus();
          }
        }
      }
      // 2. Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })()
  );
});

// C. Notification Close
self.addEventListener('notificationclose', (event) => {
  event.waitUntil(syncAppBadge());
});

// D. Message handler for showing notifications with status bar badge
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'CLEAR_ALL_NOTIFICATIONS' || event.data.type === 'CLEAR_NOTIFICATIONS') {
    event.waitUntil(
      self.registration.getNotifications().then((notifications) => {
        for (const notif of notifications) {
          try {
            notif.close();
          } catch {}
        }
        if (typeof self !== 'undefined' && self.navigator && 'clearAppBadge' in self.navigator) {
          return self.navigator.clearAppBadge().catch(() => {});
        }
      }).catch(() => {})
    );
    return;
  }

  const resolveSoundUrl = (soundName = 'ringtone') => {
    const base = getBasePath();
    const origin = self.location.origin;
    const file = soundName === 'chime' ? 'chime.wav' : (soundName === 'cashier' ? 'cashier.wav' : 'ringtone.wav');
    return base ? `${origin}${base}/sounds/${file}` : `${origin}/sounds/${file}`;
  };

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options = {} } = event.data;
    const { iconUrl, badgeUrl } = resolveNotifIconUrls(options);
    const soundUrl = resolveSoundUrl(options.sound || options.soundType || 'ringtone');

    const notifOptions = {
      body: options.body || '',
      icon: iconUrl,
      badge: badgeUrl,
      sound: soundUrl,
      vibrate: options.vibrate || [600, 200, 600, 200, 1000],
      tag: options.tag || (options.data && options.data.orderId ? 'tw-order-' + options.data.orderId : 'tw-notif-' + Date.now()),
      renotify: true,
      requireInteraction: options.requireInteraction ?? true,
      dir: 'rtl',
      lang: 'ar',
      silent: false,
      actions: [
        { action: 'open', title: 'فتح الطلب 🛵' },
        { action: 'close', title: 'إغلاق' }
      ],
      ...options,
      data: {
        url: (options.data && options.data.url) || self.location.href,
        sound: options.sound || options.soundType || 'ringtone',
        timestamp: Date.now(),
        ...(options.data || {})
      }
    };

    self.registration.showNotification(title || 'توصيل 🛵', notifOptions)
      .then(() => syncAppBadge())
      .catch(() => {});
  }
});

// E. Push Notification handler (wakes up device in background / when screen is locked or browser closed)
self.addEventListener('push', (event) => {
  let data = { title: 'توصيل 🛵', body: 'لديك إشعار جديد في تطبيق توصيل' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const { iconUrl, badgeUrl } = resolveNotifIconUrls(data.options || {});
  const base = getBasePath();
  const origin = self.location.origin;
  const soundName = data.sound || data.data?.sound || 'ringtone';
  const soundFile = soundName === 'chime' ? 'chime.wav' : (soundName === 'cashier' ? 'cashier.wav' : 'ringtone.wav');
  const soundUrl = base ? `${origin}${base}/sounds/${soundFile}` : `${origin}/sounds/${soundFile}`;

  const pushOptions = {
    body: data.body || '',
    icon: iconUrl,
    badge: badgeUrl,
    sound: soundUrl,
    // Strong, repeating vibration to wake up the phone from pocket/sleep
    vibrate: [1000, 300, 1000, 300, 1000, 300, 1500],
    tag: data.tag || (data.data?.orderId ? 'tw-order-' + data.data.orderId : (data.orderId ? 'tw-order-' + data.orderId : 'tw-notif-' + Date.now())),
    renotify: true,
    requireInteraction: true,
    dir: 'rtl',
    lang: 'ar',
    silent: false,
    timestamp: Date.now(),
    data: {
      url: (data.data && data.data.url) || self.location.origin,
      sound: soundName,
      orderId: data.data?.orderId,
      ...(data.data || {})
    },
    actions: [
      { action: 'open', title: 'فتح الطلب 🛵' },
      { action: 'close', title: 'إغلاق' }
    ]
  };

  event.waitUntil(
    (async () => {
      // 1. Show notification with fallback
      try {
        await self.registration.showNotification(data.title || 'توصيل 🛵', pushOptions);
      } catch (primaryErr) {
        console.warn('Rich showNotification failed, trying minimal safe options:', primaryErr);
        try {
          await self.registration.showNotification(data.title || 'توصيل 🛵', {
            body: data.body || '',
            icon: iconUrl,
            badge: badgeUrl,
            vibrate: [600, 200, 600],
            tag: 'tw-notif-' + Date.now(),
            data: { url: self.location.origin }
          });
        } catch (fallbackErr) {
          console.error('All showNotification attempts failed:', fallbackErr);
        }
      }

      // 2. Set App Badge number directly on Android launcher icon (always at least 1)
      await syncAppBadge(1);

      // 3. Broadcast to open clients if any exist to trigger sound player
      try {
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of clients) {
          client.postMessage({
            type: 'PLAY_SOUND',
            sound: soundName
          });
        }
      } catch (broadcastErr) {}
    })()
  );
});
