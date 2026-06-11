const CACHE = 'guitang-v5'
self.addEventListener('install', e => {
  self.skipWaiting()
})
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))))
  e.waitUntil(self.clients.claim())
})
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  if (e.request.url.includes('api.github.com') || e.request.url.includes('api.deepseek.com') || e.request.url.includes('api.openai.com') || e.request.url.includes('dashscope.aliyuncs.com') || e.request.url.includes('api.xiaomimimo.com')) return
  e.respondWith(fetch(e.request).then(r => { if(r.ok && r.status === 200){caches.open(CACHE).then(c=>c.put(e.request,r.clone()))}; return r }).catch(() => caches.match(e.request).then(r => r || new Response('离线状态，请联网后重试', { status: 503 }))))
})
