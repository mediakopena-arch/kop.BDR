/* Service worker Pembiayaan Bandar: aplikasi bisa dibuka walau sinyal hilang.
   Halaman: coba internet dulu (selalu versi terbaru), jika gagal pakai salinan terakhir.
   Data/server (Apps Script) TIDAK pernah disimpan di sini. Naikkan VERSI bila mengganti file ikon. */
const VERSI = 'bandar-v1';
const INTI = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSI).then(c => Promise.all(INTI.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSI).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;                              // POST ke server tidak disentuh
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;                    // Apps Script, CDN: langsung ke jaringan
  if (r.mode === 'navigate') {                                 // halaman: jaringan dulu, lalu salinan
    e.respondWith(fetch(r).then(res => {
      const cp = res.clone(); caches.open(VERSI).then(c => c.put('index.html', cp)).catch(() => {});
      return res;
    }).catch(() => caches.match('index.html').then(m => m || caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(r).then(m => {                    // berkas lain: salinan dulu, perbarui diam-diam
    const net = fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(VERSI).then(c => c.put(r, cp)); } return res; }).catch(() => m);
    return m || net;
  }));
});
