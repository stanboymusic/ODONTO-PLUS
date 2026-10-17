// ODONTO PLUS · Service Worker (Parche 6.2 — timeout network-first)
const CACHE_NAME = 'odonto-plus-shell-20261016-sesion';

// Timeout para recursos del shell: si la red tarda más de esto, sirve desde caché
const SHELL_TIMEOUT_MS = 3000;

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

// Activación: limpieza de cachés viejos y toma de control inmediata
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

// ---------- Helper: fetch con timeout ----------
// Intenta la red; si tarda más de timeoutMs o falla, rechaza la promesa.
// Si la red responde OK, actualiza el caché en background antes de resolver.
// NUNCA se llama para /api/* (excluidos antes de llegar aquí).
function fetchConTimeout(req, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('SW_TIMEOUT')), timeoutMs);

    fetch(req)
      .then((res) => {
        clearTimeout(timer);
        // Actualizar caché en background con la versión fresca
        if (res && res.status === 200 && req.method === 'GET') {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// ---------- Interceptor de peticiones ----------
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Ignorar cross-origin (fly.dev, Google Fonts, etc.) y endpoints /api/*
  //    El SW se hace a un lado; el navegador los maneja directo.
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api')) {
    return;
  }

  // 2. Navegación HTML: network-first con timeout de 3 s
  //    - Red rápida  → HTML fresco del servidor (y actualiza caché)
  //    - Red lenta   → timeout a los 3 s → sirve desde caché
  //    - Sin red     → fallo inmediato   → sirve offline.html
  if (req.mode === 'navigate') {
    event.respondWith(
      fetchConTimeout(req, SHELL_TIMEOUT_MS)
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          const fallback = await caches.match('/offline.html');
          return fallback || caches.match('/');
        })
    );
    return;
  }

  // 3. Recursos estáticos locales (JS, CSS, imágenes, SVG, fuentes locales):
  //    network-first con timeout de 3 s
  //    - Red rápida  → recurso fresco (y actualiza caché en background)
  //    - Red lenta   → timeout a los 3 s → sirve desde caché sin bloquear la app
  //    - Sin caché   → Response.error() (el navegador marcará el recurso como fallido)
  event.respondWith(
    fetchConTimeout(req, SHELL_TIMEOUT_MS)
      .catch(async () => {
        const cached = await caches.match(req);
        return cached || Response.error();
      })
  );
});
