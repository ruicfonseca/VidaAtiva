// Cache offline simples: guarda tudo o que a app pede na primeira visita e
// serve da cache a partir daí, actualizando em segundo plano.
const CACHE = 'vidaativa-v2';
const BASE = [
  './', 'index.html', 'styles.css', 'manifest.webmanifest',
  'js/app.js', 'js/catalogo.js', 'js/rotina.js', 'js/sessao.js', 'js/temporizador.js',
  'js/reprodutor.js', 'js/voz.js', 'js/historico.js', 'js/armazenamento.js', 'js/util.js',
  'data/exercicios.json', 'data/rotinas.json',
];

self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(caches.keys().then((chaves) => Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (ev) => {
  if (ev.request.method !== 'GET') return;
  ev.respondWith(
    caches.match(ev.request).then((emCache) => {
      const daRede = fetch(ev.request).then((resp) => {
        if (resp.ok) caches.open(CACHE).then((c) => c.put(ev.request, resp.clone()));
        return resp;
      }).catch(() => emCache);
      return emCache ?? daRede;
    }),
  );
});
