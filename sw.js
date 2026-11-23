// Lets the app be installed and open its last copy without network. Always tries the network first.
const CACHE = 'akh-v1';
const SHELL = ['./', 'index.html', 'seed-items.json', 'seed-fleet.json', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request, url = new URL(r.url);
  // Only the app's own pages and data; never the AI function, media streams or other sites.
  if (r.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/.netlify/') || url.pathname.includes('/media/')) return;
  e.respondWith(
    fetch(r).then(res => {
      if (res.ok && res.status === 200) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(r, copy)); }
      return res;
    }).catch(() => caches.match(r).then(hit => hit || caches.match('index.html')))
  );
});
