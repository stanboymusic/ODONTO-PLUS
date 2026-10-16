// ODONTO PLUS · Service Worker (Parche 6.1 Harden)
const CACHE_NAME = 'odonto-plus-shell-20261016-harden';

const APP_SHELL = [
  '/',
  '/index.html',
  '/offline.html',
  '/style.css',
  '/manifest.webmanifest',
  '/icons/logo.svg',
  '/icons/logo-maskable.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/js/app.js',
  '/js/api.js',
  '/js/ui.js',
  '/js/pwa.js',
  '/js/modulos.js',
  '/js/crud.js',
  '/js/pacientes.js',
  '/js/historia.js',
  '/js/odonto.js',
  '/js/perio.js',
  '/js/citas.js',
  '/js/calendario.js',
  '/js/documentos.js',
  '/js/tasas.js',
  '/js/ajustes.js',
  '/js/preguntas.js',
  '/js/compartir.js',
  '/js/vendor/jspdf.umd.min.js'
];

// Instalación: precache del app shell inicial
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

// Activación: limpieza inmediata de cualquier caché con versión anterior
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
    }).then(() => self.clients.claim())
  );
});

// Control de skipWaiting para actualizaciones manuales
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Interceptor de peticiones
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Ignorar explícitamente peticiones cross-origin (fly.dev, Google Fonts CDN, etc.) y endpoints /api/*
  // Dejar que el navegador maneje la petición directamente por la red sin tocar el SW
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api')) {
    return;
  }

  // 2. Navegación HTML (páginas): Network-first con fallback a caché y offline.html
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          const fallback = await caches.match('/offline.html');
          return fallback || caches.match('/');
        })
    );
    return;
  }

  // 3. Recursos estáticos locales (HTML, JS, CSS, PNG, SVG): NETWORK-FIRST
  // Siempre pide la versión más fresca del servidor; si no hay internet, usa el caché
  event.respondWith(
    fetch(req)
      .then((networkRes) => {
        if (networkRes && networkRes.status === 200 && req.method === 'GET') {
          const copy = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return networkRes;
      })
      .catch(() => {
        return caches.match(req);
      })
  );
});
