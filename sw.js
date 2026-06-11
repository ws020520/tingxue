const CACHE = 'guitang-v5'
self.addEventListener('install', e => {
  e.waitUntil(caches.delete(CACHE))
  self.skipWaiting()
})
self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim())
})
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return
  if (e.request.url.includes('api.github.com') || e.request.url.includes('api.deepseek.com') || e.request.url.includes('api.openai.com') || e.request.url.includes('dashscope.aliyuncs.com') || e.request.url.includes('api.xiaomimimo.com')) return
  e.respondWith(fetch(e.request).then(r => { if(r.ok){caches.open(CACHE).then(c=>c.put(e.request,r.clone()))}; return r }).catch(() => caches.match(e.request)))
})
