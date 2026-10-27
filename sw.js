const C='otlog-v3',A=['./','./index.html','./manifest.json','./icon-180.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(A)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
// 캐시 먼저 주고 뒤에서 갱신 (다음 실행 때 새 버전)
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(c=>{const n=fetch(e.request).then(r=>{if(r.ok)caches.open(C).then(x=>x.put(e.request,r.clone()));return r;}).catch(()=>c);return c||n;}));});
