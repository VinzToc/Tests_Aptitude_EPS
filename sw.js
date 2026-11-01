importScripts('version.js');
const V='tests-aptitude-v'+APP_VERSION,F=['./','version.js','index.html','app.css','app.js','eps-core.js','tests-core.js','xlsx-writer.js','stats-export.js','manifest.webmanifest','luc-leger.mp3','icons/icon-192.png','icons/icon-512.png'];
// Installation : chaque fichier est chargé depuis le réseau ; un fichier manquant ne bloque pas l'installation.
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(F.map(u=>fetch(u,{cache:'reload'}).then(r=>r.ok&&c.put(u,r)).catch(()=>{})))));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const u=new URL(e.request.url);
 // bande son (8 Mo) : cache d'abord, pour un usage hors ligne rapide au gymnase
 if(u.pathname.endsWith('.mp3')){e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(c=>c||fetch(e.request).then(r=>{if(r.ok){const k=r.clone();caches.open(V).then(x=>x.put(e.request,k))}return r})));return}
 // le reste : réseau d'abord (dernière version), cache en secours (hors ligne)
 e.respondWith(fetch(e.request,{cache:'no-cache'}).then(r=>{if(r.ok&&u.origin===location.origin){const c=r.clone();caches.open(V).then(x=>x.put(e.request,c))}return r}).catch(()=>caches.match(e.request,{ignoreSearch:true})))});
