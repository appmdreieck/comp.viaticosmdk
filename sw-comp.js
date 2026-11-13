/* Service worker — Comprobación de viáticos M Dreieck (app 2)
   Guarda la app en el equipo para que abra sin internet.
   - La página (HTML) se pide primero a internet: así cada cambio que subas
     a GitHub le llega a todos; si no hay conexión, se usa la copia guardada.
   - Íconos y manifest: primero la copia guardada.
   OJO: el folio, el PDF y guardar en Drive SÍ necesitan internet. */
const CACHE = 'mdcomp2-v5';
const ASSETS = [
  'comprobacion2.html',
  'manifest-comp.webmanifest',
  'c2-icon-192.png',
  'c2-icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;                // POST al Apps Script pasa directo
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // librerías externas (CDN) pasan directo

  var esPagina = req.mode === 'navigate' || /\.html$/.test(url.pathname) || url.pathname.endsWith('/');
  if (esPagina) {
    // Red primero, copia guardada si no hay internet
    e.respondWith(
      fetch(req).then(function (resp) {
        if (resp.ok) { var copy = resp.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {}); }
        return resp;
      }).catch(function () {
        return caches.match(req).then(function (r) { return r || caches.match('comprobacion2.html'); });
      })
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(function (r) {
      return r || fetch(req).then(function (resp) {
        var copy = resp.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
        return resp;
      });
    })
  );
});
