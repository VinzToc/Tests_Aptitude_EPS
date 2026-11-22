importScripts('version.js');
const V='testaptphys-v'+APP_VERSION,F=['./','version.js','index.html','app.css','app.js','eps-core.js','tests-core.js','xlsx-writer.js','stats-export.js','official.js','analyse.js','manifest.webmanifest','bande-son-luc-leger.mp3','icons/icon-192.png','icons/icon-512.png'];
const T=2500; // réseau trop lent (wifi sans Internet…) : on sert tout de suite la copie hors ligne
const net=r=>new Promise((ok,ko)=>{const t=setTimeout(()=>ko(new Error('timeout')),T);fetch(r,{cache:'no-cache'}).then(x=>{clearTimeout(t);ok(x)},e=>{clearTimeout(t);ko(e)})});
// Installation : chaque fichier est chargé séparément ; un fichier manquant ne bloque pas l'installation (donc le mode hors ligne).
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>Promise.all(F.map(u=>fetch(u,{cache:'reload'}).then(r=>r.ok&&c.put(u,r)).catch(()=>{})))));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x.startsWith('testaptphys')||x.startsWith('tests-aptitude')).filter(x=>x!==V).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{const q=e.request;if(q.method!=='GET')return;const u=new URL(q.url);
 // bande son (8 Mo) : cache d'abord, pour un usage hors ligne rapide au gymnase
 if(u.pathname.endsWith('.mp3')){e.respondWith(caches.match(q,{ignoreSearch:true}).then(c=>c||fetch(q).then(r=>{if(r.ok){const k=r.clone();caches.open(V).then(x=>x.put(q,k))}return r})));return}
 // le reste : réseau d'abord (dernière version), copie locale en secours (hors ligne ou réseau trop lent)
 e.respondWith(net(q).then(r=>{if(r.ok&&u.origin===location.origin){const c=r.clone();caches.open(V).then(x=>x.put(q,c))}return r})
  .catch(()=>caches.match(q,{ignoreSearch:true}).then(h=>h||(q.mode==='navigate'?caches.match('index.html').then(x=>x||caches.match('./')):undefined)||Response.error())))});
