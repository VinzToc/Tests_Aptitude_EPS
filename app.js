/* app.js — Tests d'aptitude physique : seconde (Luc Léger · Saut sans élan · Vitesse 50 m) et sixième (Luc Léger · Saut sans élan · Vitesse 30 m).
   Données : EPS (eps-core.js) — feuille « testaptphys » (= id de l'appli dans apps.json) en mode « lignes » (une ligne par élève et par séance). */
(function(){
'use strict';
const APP='testaptphys',OLD_APP='tests_aptitude';   // OLD_APP : ancien identifiant (migré au démarrage)
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num=TA.num;
const pf=v=>{if(v==null||v==='')return null;const x=typeof v==='number'?v:parseFloat(String(v).replace(',','.'));return isFinite(x)?x:null};
const isoToday=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const frDate=d=>d?d.split('-').reverse().join('/'):'';
const K={date:'Date',niv:'Niveau',sexe:'Sexe',pres:'Présent',pal:'Palier',vma:'VMA (km/h)',ll:'Temps Luc Léger (s)',v1:'Vitesse 50 m essai 1 (s)',v2:'Vitesse 50 m essai 2 (s)',vit:'Vitesse 50 m (s)',
 s1:'Saut essai 1 (cm)',s2:'Saut essai 2 (cm)',sau:'Saut sans élan (cm)',lpal:'Niveau Palier',lvit:'Niveau Vitesse',lsau:'Niveau Saut'};
const K6={v1:'Vitesse 30 m essai 1 (s)',v2:'Vitesse 30 m essai 2 (s)',vit:'Vitesse 30 m (s)'};   // sixième : 30 m
const vkeys=niv=>niv==='6'?K6:K;
const LS=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}catch(e){return null}};

let SET=Object.assign({classe:'',palierMode:'cur',niv:{}},(()=>{try{return JSON.parse(LS('ta_set')||'{}')}catch(e){return{}}})());
SET.date=isoToday();
const saveSet=()=>LS('ta_set',JSON.stringify({classe:SET.classe,palierMode:SET.palierMode,niv:SET.niv}));
/* niveau d'une classe : réglage manuel, sinon détecté d'après le nom (6e… → sixième) */
const nivOf=c=>SET.niv[c]||TA.nivAuto(c);
const NV=()=>nivOf(SET.classe);
const dist=niv=>TA.NIV[niv].dist;

/* ───────── données ───────── */
let STU=[];
async function load(){await migrate();STU=(await EPS.getExt(APP)).sort((a,b)=>(a.nom+' '+a.prenom).localeCompare(b.nom+' '+b.prenom,'fr'))}
const lignes=e=>Array.isArray(e.data.lignes)?e.data.lignes:[];
const lig=(e,d=SET.date)=>lignes(e).find(l=>l.Date===d);
const sexOf=e=>TA.normSex(e.data.Sexe)||TA.normSex([...lignes(e)].reverse().map(l=>l.Sexe).find(Boolean));
const classes=()=>[...new Set(STU.map(e=>e.classe).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'fr',{numeric:true}));
const roster=(c=SET.classe)=>STU.filter(e=>e.classe===c);
const isPresent=(e,d=SET.date)=>{const l=lig(e,d);return !!l&&l[K.pres]==='Oui'};
const presents=()=>roster().filter(e=>isPresent(e));
const nm=e=>`<b>${esc((e.nom||'').toUpperCase())}</b> ${esc(e.prenom)}`;
const nmTxt=e=>`${(e.nom||'').toUpperCase()} ${e.prenom||''}`.trim();
/* migration : ancien identifiant « tests_aptitude » → « testaptphys » (les données déjà saisies sont conservées) */
async function migrate(){
 const d=await EPS.open();
 await new Promise((ok,ko)=>{const t=d.transaction('eleves','readwrite'),o=t.objectStore('eleves'),g=o.getAll();
  g.onsuccess=()=>g.result.forEach(e=>{if(!e.ext||!e.ext[OLD_APP])return;
   const o1=e.ext[OLD_APP],n1=e.ext[APP]||{},seen=new Set((n1.lignes||[]).map(l=>l.Date));
   const ls=[...(n1.lignes||[]),...(Array.isArray(o1.lignes)?o1.lignes:[]).filter(l=>!seen.has(l.Date))].sort((x,y)=>x.Date<y.Date?-1:x.Date>y.Date?1:0);
   e.ext[APP]=Object.assign({},o1,n1,{lignes:ls});delete e.ext[OLD_APP];o.put(e)});
  t.oncomplete=ok;t.onerror=()=>ko(t.error)})}
const sexTxt=s=>s==='F'?'F':s==='M'?'M':'?';

function setLv(l,key,code){if(code)l[key]=TA.LAB[code];else delete l[key]}
function levelsOf(l,sx,niv){const b=TA.bkey(niv,sx),vk=vkeys(niv);setLv(l,K.lpal,b?TA.lvPalier(pf(l[K.pal]),b):null);setLv(l,K.lvit,b?TA.lvVitesse(pf(l[vk.vit]),b):null);setLv(l,K.lsau,b?TA.lvSaut(pf(l[K.sau]),b):null)}
/* enregistre les champs p (null = supprimer) dans la ligne de la date d */
async function patch(e,p,date=SET.date){
 const arr=lignes(e).map(x=>({...x}));let l=arr.find(x=>x.Date===date);if(!l){l={Date:date};arr.push(l)}
 for(const k in p){if(p[k]==null)delete l[k];else l[k]=p[k]}
 const sx=sexOf(e),niv=nivOf(e.classe);if(sx)l[K.sexe]=sx;else delete l[K.sexe];
 l[K.niv]=TA.NIV[niv].court;levelsOf(l,sx,niv);
 arr.sort((a,b)=>a.Date<b.Date?-1:a.Date>b.Date?1:0);
 e.data.lignes=arr;await EPS.setExt(APP,e.id,{lignes:arr})}
async function setSexe(e,v){
 e.data.Sexe=v;const arr=lignes(e).map(x=>({...x}));
 arr.forEach(l=>{if(v)l[K.sexe]=v;else delete l[K.sexe];levelsOf(l,v,nivOf(e.classe))});
 e.data.lignes=arr;await EPS.setExt(APP,e.id,{Sexe:v,lignes:arr})}

/* ───────── interface commune ───────── */
let VIEW='home';
const toast=(t,ms=2600)=>{const x=$('#toast');x.textContent=t;x.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>x.classList.remove('on'),ms)};
function msg(t,ok){const m=$('#msg');m.className='msg '+(ok===false?'ko':'ok');m.textContent=t}
function show(v){VIEW=v;$$('.view').forEach(x=>x.classList.toggle('act',x.id==='v-'+v));$$('#nav button').forEach(b=>b.classList.toggle('act',b.dataset.go===v));window.scrollTo(0,0)}
function go(v){
 if(LL.running&&v!=='ll'){if(!confirm("L'épreuve Luc Léger est en cours. Quitter sans enregistrer ?"))return;llAbort()}
 if(['ll','saut','vit'].includes(v)){
  if(!SET.classe){toast("Importez d'abord une liste d'élèves.");v='home'}
  else if(!presents().length){toast("Cochez d'abord les élèves présents.");v='home'}}
 if(v==='ll')openLL();else if(v==='saut')openTrial('saut');else if(v==='vit')openTrial('vit');else if(v==='res')renderRes();else renderHome();
 show(v)}

/* ───────── accueil ───────── */
function renderHome(){
 const cl=classes();if(!cl.includes(SET.classe))SET.classe=cl[0]||'';
 $('#stuInfo').textContent=STU.length?`${STU.length} élèves · ${cl.length} classes`:'aucune liste';
 $('#selClasse').innerHTML=cl.map(c=>`<option ${c===SET.classe?'selected':''}>${esc(c)}</option>`).join('')||'<option value="">— aucune classe —</option>';
 $('#selDate').value=SET.date;$('#setPalier').value=SET.palierMode;
 applyNiv();
 renderRoster();renderTestStatus();
 $('#expScope').innerHTML=['2','6'].filter(n=>cl.some(c=>nivOf(c)===n)).map(n=>`<option value="niv:${n}" ${n===NV()?'selected':''}>Toutes les classes de ${TA.NIV[n].lab.toLowerCase()}</option>`).join('')
  +cl.map(c=>`<option value="cl:${esc(c)}">Classe ${esc(c)}</option>`).join('');
 if(!STU.length&&!$('#msg').textContent)msg("Aucun élève : cliquez sur « Récupérer la liste Mes Apps EPS » ou importez un fichier .xlsx / .csv.",false)}
/* textes dépendant du niveau de la classe courante (50 m en seconde, 30 m en sixième) */
function applyNiv(){const n=NV(),d=dist(n),I=TA.NIV[n],man=SET.niv[SET.classe];
 document.body.classList.toggle('n6',n==='6');
 $('#nivBadge').textContent=SET.classe?`${I.lab.toUpperCase()} · ${d} m`:'';$('#nivBadge').hidden=!SET.classe;
 $$('#segNiv button').forEach(b=>b.classList.toggle('act',b.dataset.niv?b.dataset.niv===man:!man));
 $('#nivInfo').innerHTML=SET.classe?`Classe <b>${esc(SET.classe)}</b> : niveau <b>${I.lab}</b>${man?'':' <i>(détecté automatiquement d\'après le nom)</i>'} · épreuve de vitesse sur <b>${d} m</b> · barème ${n==='6'?'sixième (identique filles / garçons)':'seconde (selon le sexe)'}`:'';
 $('#hdSub').textContent=`Luc Léger · Saut sans élan · Vitesse ${d} m`;
 $('#navVit').textContent=d+' m';$('#tbVit').textContent=`Vitesse ${d} m`;$('#vitTitle').textContent=`⚡ Vitesse ${d} m`;
 $('#vitHint').innerHTML=`Saisissez le temps de chaque essai en <b>secondes</b> et <b>dixièmes</b> (ex. ${n==='6'?'6 s 4':'8 s 4'}). Le meilleur temps est retenu.${n==='6'?' Le 2ᵉ essai est facultatif.':''}`;
 $('#sexHint').innerHTML=n==='6'?'Cochez les élèves <b>présents</b> : les autres apparaissent en gris dans les résultats. En sixième, le barème est le même pour les filles et les garçons (le sexe est facultatif).':'Cochez les élèves <b>présents</b> : les autres apparaissent en gris dans les résultats. Touchez la pastille <b>♀ / ♂</b> pour corriger le sexe (nécessaire pour appliquer le barème).'}
function renderRoster(){
 const st=$('#roster').scrollTop;
 const r=roster(),dot=(t,on)=>`<span class="dot ${on?'on':''}">${t}</span>`;
 $('#roster').innerHTML=r.map(e=>{const l=lig(e),on=isPresent(e),sx=sexOf(e);
  return `<div class="srow ${on?'':'off'}" data-id="${esc(e.id)}"><input type="checkbox" ${on?'checked':''} aria-label="Présent"><span class="nm">${nm(e)}</span>`
   +`<button class="sx ${sx||'u'}" title="Changer le sexe">${sx==='F'?'♀ F':sx==='M'?'♂ M':'? sexe'}</button>`
   +`<span class="dots">${dot('LL',l&&pf(l[K.pal])!=null)}${dot('S',l&&pf(l[K.sau])!=null)}${dot('V',l&&pf(l[vkeys(nivOf(e.classe)).vit])!=null)}</span></div>`}).join('')||'<div class="srow">Aucun élève dans cette classe.</div>';
 $('#roster').scrollTop=st;
 const p=r.filter(e=>isPresent(e)),nos=NV()==='6'?0:p.filter(e=>!sexOf(e)).length;
 $('#presCnt').textContent=`${p.length} présent(s) sur ${r.length}`;
 const w=$('#warnSex');w.hidden=!nos;w.textContent=`⚠ ${nos} élève(s) présent(s) sans sexe renseigné : le barème (couleurs) ne pourra pas être appliqué. Touchez « ? sexe ».`}
function renderTestStatus(){
 const p=presents();const c=k=>p.filter(e=>{const l=lig(e);return l&&pf(l[k])!=null}).length;
 const t=(id,k)=>{$('#st-'+id).textContent=p.length?(c(k)?`✔ ${c(k)}/${p.length} enregistrés`:'à faire'):'cochez les présents'};
 t('ll',K.pal);t('saut',K.sau);t('vit',vkeys(NV()).vit)}
$('#selClasse').onchange=e=>{SET.classe=e.target.value;saveSet();renderHome()};
$('#segNiv').addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b||!SET.classe)return;const v=b.dataset.niv;if(v)SET.niv[SET.classe]=v;else delete SET.niv[SET.classe];saveSet();renderHome()});
$('#selDate').onchange=e=>{SET.date=e.target.value||isoToday();renderHome()};
$('#setPalier').onchange=e=>{SET.palierMode=e.target.value;saveSet()};
$('#roster').addEventListener('click',async ev=>{
 const row=ev.target.closest('.srow');if(!row||!row.dataset.id)return;const e=STU.find(x=>x.id===row.dataset.id);if(!e)return;
 if(ev.target.closest('.sx')){const cur=sexOf(e),nx=cur===''?'F':cur==='F'?'M':'';await setSexe(e,nx);renderRoster();renderTestStatus();return}
 if(ev.target.matches('input')||ev.target.closest('.nm')){const on=!isPresent(e);await patch(e,{[K.pres]:on?'Oui':'Non'});renderRoster();renderTestStatus()}});
$('#allOn').onclick=async()=>{await Promise.all(roster().map(e=>patch(e,{[K.pres]:'Oui'})));renderRoster();renderTestStatus()};
$('#allOff').onclick=async()=>{await Promise.all(roster().filter(e=>lig(e)).map(e=>patch(e,{[K.pres]:'Non'})));renderRoster();renderTestStatus()};

/* import / récupération */
$('#btnFetch').onclick=async()=>{await load();if(STU.length){renderHome();msg(`✅ ${STU.length} élèves récupérés depuis Mes Apps EPS (${classes().length} classes).`)}else $('#fileIn').click()};
$('#btnFile').onclick=()=>$('#fileIn').click();
$('#btnSex').onclick=()=>$('#sexIn').click();
async function decodeText(f){const b=await f.arrayBuffer();try{return new TextDecoder('utf-8',{fatal:true}).decode(b)}catch(e){return new TextDecoder('windows-1252').decode(b)}}
/* Le sexe n'est pas conservé par Mes Apps EPS : on le lit dans la colonne « Sexe » de l'export Pronote */
async function importSexe(f){
 const{rows}=EPS.parseCSV(await decodeText(f));const hi=rows.findIndex(r=>r.map(EPS.norm).includes('sexe'));
 if(hi<0)throw new Error("Colonne « Sexe » introuvable dans ce fichier.");
 const h=rows[hi].map(EPS.norm),iS=h.indexOf('sexe');
 const iP=h.findIndex(x=>['prenom','prenoms','prenomeleve'].includes(x));
 const iN=h.findIndex(x=>['eleves','eleve','nomeleve'].includes(x)||x.startsWith('nom'));
 const iB=h.findIndex(x=>['neele','nele','naissance','datedenaissance'].includes(x)||x.startsWith('nele'));
 if(iN<0)throw new Error('Colonne des noms introuvable.');
 const byId=new Map(STU.map(e=>[e.id,e]));let ok=0,none=0;
 for(const r of rows.slice(hi+1)){let nom=(r[iN]||'').trim(),pre=iP>=0?(r[iP]||'').trim():'';
  if(iP<0&&nom){const s=EPS.splitName(nom);nom=s[0];pre=s[1]}
  const id=EPS.norm(nom)+'_'+EPS.norm(pre)+'_'+EPS.norm(iB>=0?r[iB]:'');const e=byId.get(id),sx=TA.normSex(r[iS]);
  if(!nom&&!pre)continue;if(!e){none++;continue}if(sx){await setSexe(e,sx);ok++}}
 return{ok,none}}
$('#fileIn').onchange=async ev=>{const f=ev.target.files[0];ev.target.value='';if(!f)return;
 try{const r=await EPS.importFile(f);await load();let t=`✅ ${r.add} élève(s) ajouté(s), ${r.upd} mis à jour.`;
  if(/\.csv$/i.test(f.name)){try{const s=await importSexe(f);t+=` Sexe renseigné pour ${s.ok} élève(s).`}catch(e){}}
  renderHome();msg(t)}catch(e){msg('❌ '+e.message,false)}};
$('#sexIn').onchange=async ev=>{const f=ev.target.files[0];ev.target.value='';if(!f)return;
 try{await load();const s=await importSexe(f);await load();renderHome();msg(`✅ Sexe renseigné pour ${s.ok} élève(s)`+(s.none?` (${s.none} ligne(s) du fichier sans correspondance).`:'.'))}catch(e){msg('❌ '+e.message,false)}};
$$('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));

/* ───────── Luc Léger ───────── */
const LL={audio:null,url:null,fallback:false,running:false,timer:null,startedAt:0,stops:{},wake:null,loading:false};
const kmh=p=>TA.frAuto(TA.vmaOf(p));
async function llLoadAudio(){
 if(LL.audio||LL.loading||LL.fallback)return;LL.loading=true;$('#llAudio').textContent='⏳ Chargement de la bande son…';
 try{const r=await fetch('bande-son-luc-leger.mp3');if(!r.ok)throw new Error('http '+r.status);LL.url=URL.createObjectURL(await r.blob());
  const a=new Audio();a.preload='auto';a.src=LL.url;a.addEventListener('ended',()=>{if(LL.running)llStopAll()});
  await new Promise((ok,ko)=>{a.addEventListener('loadedmetadata',ok,{once:true});a.addEventListener('error',()=>ko(new Error('audio')),{once:true});a.load()});
  LL.audio=a;$('#llAudio').textContent='🔊 Bande son prête ('+TA.mmss(a.duration)+')'}
 catch(e){LL.fallback=true;$('#llAudio').textContent='⚠ Bande son indisponible : chrono seul (bips non diffusés).'}
 LL.loading=false}
const llClock=()=>LL.audio&&!LL.fallback?LL.audio.currentTime:(performance.now()-LL.startedAt)/1000;
function openLL(){
 const ctx=SET.classe+'|'+SET.date;
 if(!LL.running){const keep=LL.ctx===ctx?Object.fromEntries(Object.entries(LL.stops).filter(([,s])=>!s.saved)):{};LL.ctx=ctx;LL.stops={};
  presents().forEach(e=>{const l=lig(e),p=pf(l&&l[K.pal]);if(p!=null)LL.stops[e.id]={p,t:pf(l[K.ll])??0,saved:true}});Object.assign(LL.stops,keep);
  $('#llChrono').textContent='0:00';$('#llInfo').textContent='Prêt';$('#llNext').textContent='';
  const n=Object.keys(LL.stops).length;if(n)$('#llNext').textContent=`${n} résultat(s) déjà enregistré(s) pour cette séance`}
 llRender();llButtons();llLoadAudio()}
function llButtons(){
 $('#llStart').disabled=LL.running||!presents().length;$('#llStopAll').disabled=!LL.running;
 $('#llSave').disabled=!Object.keys(LL.stops).length&&!LL.running}
function llRender(){
 $('#llGrid').innerHTML=presents().map(e=>{const s=LL.stops[e.id],sx=sexOf(e),id=esc(e.id);
  if(s){const bk=TA.bkey(NV(),sx),lv=bk?TA.lvPalier(s.p,bk):null;
   return `<div class="lltile stopped ${lv||'N'}" data-id="${id}"><b>${nm(e)}</b><span class="res1">Palier ${s.p}</span><small>${kmh(s.p)} km/h · ${TA.mmss(s.t)}</small>${LL.running&&!s.saved?'<button class="undo" data-undo title="Annuler">↶</button>':''}</div>`}
  return `<button class="lltile ${LL.running?'':'idle'}" data-id="${id}"><b>${nm(e)}</b><small>${LL.running?'Touchez à l\'arrêt':'En attente du départ'}</small></button>`}).join('')}
function llTick(){const ct=llClock();
 if(ct<TA.T0){$('#llChrono').textContent='−'+Math.ceil(TA.T0-ct);$('#llInfo').textContent='Départ au 1er bip';$('#llNext').textContent='Placez-vous derrière la ligne';return}
 const p=TA.palierAt(ct),nx=TA.nextMark(ct);$('#llChrono').textContent=TA.mmss(ct-TA.T0);
 $('#llInfo').textContent=`Palier ${p} · ${kmh(p)} km/h`;$('#llNext').textContent=nx?`Palier suivant dans ${Math.ceil(nx-ct)} s`:'Dernier palier'}
async function llStart(){
 if(LL.running||!presents().length)return;
 if(Object.keys(LL.stops).length&&!confirm("Des résultats Luc Léger existent pour cette séance. Recommencer l'épreuve (ils seront remplacés à l'enregistrement) ?"))return;
 LL.stops={};await llLoadAudio();LL.startedAt=performance.now();
 if(LL.audio){try{LL.audio.currentTime=0;await LL.audio.play();LL.startedAt=performance.now()}catch(e){LL.fallback=true;$('#llAudio').textContent='⚠ Lecture audio impossible : chrono seul.'}}
 LL.running=true;try{LL.wake=await navigator.wakeLock?.request('screen')}catch(e){}
 clearInterval(LL.timer);LL.timer=setInterval(llTick,100);llTick();llRender();llButtons()}
function llRecord(e){const ct=llClock(),pc=Math.max(0,TA.palierAt(ct)),p=SET.palierMode==='done'?Math.max(0,pc-1):pc;LL.stops[e.id]={p,t:Math.max(0,ct-TA.T0)}}
function llStopOne(id){if(!LL.running||LL.stops[id])return;const e=STU.find(x=>x.id===id);if(!e)return;llRecord(e);llRender();llButtons()}
function llEnd(){LL.running=false;clearInterval(LL.timer);if(LL.audio)LL.audio.pause();try{LL.wake&&LL.wake.release()}catch(e){}LL.wake=null}
function llStopAll(){if(!LL.running)return;presents().forEach(e=>{if(!LL.stops[e.id])llRecord(e)});llEnd();
 $('#llInfo').textContent='Épreuve terminée';$('#llNext').textContent='Vérifiez les résultats puis enregistrez';llRender();llButtons()}
function llAbort(){llEnd();LL.stops={}}
async function llSave(){
 if(LL.running){if(!confirm("L'épreuve est en cours : arrêter pour tous et enregistrer ?"))return;llStopAll()}
 const ps=presents().filter(e=>LL.stops[e.id]&&!LL.stops[e.id].saved);
 await Promise.all(ps.map(e=>{const s=LL.stops[e.id];return patch(e,{[K.pal]:s.p,[K.vma]:TA.vmaOf(s.p),[K.ll]:Math.round(s.t)})}));
 LL.stops={};toast(`✅ Luc Léger enregistré (${ps.length} élève(s))`);go('home')}
$('#llStart').onclick=llStart;$('#llStopAll').onclick=llStopAll;$('#llSave').onclick=llSave;
$('#llGrid').addEventListener('click',ev=>{const t=ev.target.closest('.lltile');if(!t)return;const id=t.dataset.id;
 if(ev.target.closest('[data-undo]')){delete LL.stops[id];llRender();llButtons();return}
 if(!t.classList.contains('stopped')&&!t.classList.contains('idle'))llStopOne(id)});
window.addEventListener('beforeunload',e=>{if(LL.running){e.preventDefault();e.returnValue=''}});

/* ───────── Saut / Vitesse : 2 essais ───────── */
const CFG={
 saut:{box:'#trSaut',keys:[K.s1,K.s2,K.sau],a:['m','cm'],ml:[1,2],unit:['m','cm'],
  parse:a=>TA.sautCm(a[0],a[1]),best:v=>Math.max(...v),lv:TA.lvSaut,split:TA.splitSaut,show:b=>TA.fr(b/100,2)+' m',pair:s=>[s.m,s.cm]},
 vit:{box:'#trVit',keys:[K.v1,K.v2,K.vit],a:['s','d'],ml:[2,2],unit:['s','dixièmes'],
  parse:a=>TA.vitSec(a[0],a[1]),best:v=>Math.min(...v),lv:TA.lvVitesse,split:TA.splitVit,show:b=>TA.frAuto(b)+' s',pair:s=>[s.s,s.d]}};
const trialKeys=kind=>kind==='vit'?(k=>[k.v1,k.v2,k.vit])(vkeys(NV())):CFG.saut.keys;
let DR={};
const dkey=k=>`ta_draft_${k}_${SET.classe}_${SET.date}`;
function trialCalc(kind,arr,sx){const c=CFG[kind],t=arr.map(c.parse),v=t.filter(num),bk=TA.bkey(NV(),sx);const best=v.length?c.best(v):null;return{t,best,lv:best!=null&&bk?c.lv(best,bk):null}}
function openTrial(kind){
 const c=CFG[kind],tk=trialKeys(kind);let d={};try{d=JSON.parse(LS(dkey(kind))||'{}')}catch(e){}DR[kind]=d;
 $(c.box).innerHTML=presents().map(e=>{
  if(!d[e.id]){const l=lig(e)||{};d[e.id]=[c.pair(c.split(pf(l[tk[0]]))),c.pair(c.split(pf(l[tk[1]])))]}
  const sx=sexOf(e),r=trialCalc(kind,d[e.id],sx);
  const inp=(i)=>`<div class="ess"><span class="lab">Essai ${i+1}</span><input inputmode="numeric" maxlength="${c.ml[0]}" data-t="${i}" data-f="0" value="${esc(d[e.id][i][0])}" aria-label="Essai ${i+1} ${c.unit[0]}"> <u>${c.unit[0]}</u> <input inputmode="numeric" maxlength="${c.ml[1]}" data-t="${i}" data-f="1" value="${esc(d[e.id][i][1])}" aria-label="Essai ${i+1} ${c.unit[1]}"> <u>${c.unit[1]}</u></div>`;
  return `<div class="trow ${r.lv||''}" data-id="${esc(e.id)}"><div class="who">${nm(e)} ${NV()==='6'?'':`<button class="sx ${sx||'u'}" data-sx>${sx==='F'?'♀ F':sx==='M'?'♂ M':'? sexe'}</button>`}</div>${inp(0)}${inp(1)}<div class="best ${r.lv||''}">${r.best!=null?'Meilleur : '+c.show(r.best):'—'}</div></div>`}).join('')}
for(const kind of ['saut','vit']){const c=CFG[kind];
 $(c.box).addEventListener('input',ev=>{const i=ev.target;if(!i.matches('input'))return;i.value=i.value.replace(/\D/g,'').slice(0,c.ml[+i.dataset.f]);
  const row=i.closest('.trow'),id=row.dataset.id,d=DR[kind];d[id][+i.dataset.t][+i.dataset.f]=i.value;LS(dkey(kind),JSON.stringify(d));
  const e=STU.find(x=>x.id===id),r=trialCalc(kind,d[id],sexOf(e));
  row.className='trow '+(r.lv||'');const b=row.querySelector('.best');b.className='best '+(r.lv||'');b.textContent=r.best!=null?'Meilleur : '+c.show(r.best):'—'});
 $(c.box).addEventListener('click',async ev=>{const b=ev.target.closest('[data-sx]');if(!b)return;const id=b.closest('.trow').dataset.id,e=STU.find(x=>x.id===id),cur=sexOf(e);
  await setSexe(e,cur===''?'F':cur==='F'?'M':'');const sx=sexOf(e),r=trialCalc(kind,DR[kind][id],sx),row=b.closest('.trow');
  b.className='sx '+(sx||'u');b.textContent=sx==='F'?'♀ F':sx==='M'?'♂ M':'? sexe';row.className='trow '+(r.lv||'');const bb=row.querySelector('.best');bb.className='best '+(r.lv||'')})}
async function saveTrial(kind){const d=DR[kind]||{},tk=trialKeys(kind);const ps=presents();
 await Promise.all(ps.map(e=>{const r=trialCalc(kind,d[e.id]||[['',''],['','']],sexOf(e));
  return patch(e,{[tk[0]]:r.t[0],[tk[1]]:r.t[1],[tk[2]]:r.best})}));
 LS(dkey(kind),null);const n=ps.filter(e=>{const l=lig(e);return l&&pf(l[tk[2]])!=null}).length;
 toast(`✅ ${kind==='saut'?'Saut sans élan':'Vitesse '+dist(NV())+' m'} enregistré (${n} résultat(s))`);go('home')}
$$('[data-save]').forEach(b=>b.onclick=()=>saveTrial(b.dataset.save));

/* ───────── résultats ───────── */
function rowData(e,date){const l=lig(e,date),sx=sexOf(e),pr=!!l&&l[K.pres]==='Oui',niv=nivOf(e.classe),bk=TA.bkey(niv,sx);
 const pal=pf(l&&l[K.pal]),vit=pf(l&&l[vkeys(niv).vit]),sau=pf(l&&l[K.sau]),vma=pf(l&&l[K.vma])??(pal!=null?TA.vmaOf(pal):null);
 return{e,sx,pr,pal,vma,vit,sau,lp:pr&&pal!=null?TA.lvPalier(pal,bk):null,lv:pr&&vit!=null?TA.lvVitesse(vit,bk):null,ls:pr&&sau!=null?TA.lvSaut(sau,bk):null}}
function datesOf(c){const s=new Set([SET.date]);roster(c).forEach(e=>lignes(e).forEach(l=>l.Date&&s.add(l.Date)));return[...s].sort().reverse()}
const barHint=niv=>niv==='6'?'Barème DEPP sixième (filles et garçons) – Endurance : paliers 0-1 / 2-3 / 4+. Vitesse 30 m : ≥ 6,8 / 6,0 à < 6,8 / < 6,0 s. Saut : ≤ 110 / 111-140 / > 140 cm.'
 :'Barème DEPP seconde – Endurance : filles 0-1 / 2-3 / 4+ ; garçons 0-3 / 4-5 / 6+. Vitesse 50 m : filles ≥ 11,0 / 9,5 à < 11,0 / < 9,5 s ; garçons ≥ 9,5 / 8,5 à < 9,5 / < 8,5 s. Saut : filles ≤ 120 / 121-150 / > 150 cm ; garçons ≤ 140 / 141-175 / > 175 cm.';
function renderRes(){
 const cl=classes();let c=$('#rClasse').value&&cl.includes($('#rClasse').value)?$('#rClasse').value:SET.classe;
 $('#rClasse').innerHTML=cl.map(x=>`<option ${x===c?'selected':''}>${esc(x)}</option>`).join('');
 const ds=datesOf(c);let d=$('#rDate').value;if(!ds.includes(d)){d=ds.find(x=>roster(c).some(e=>lig(e,x)))||SET.date}
 $('#rDate').innerHTML=ds.map(x=>`<option value="${x}" ${x===d?'selected':''}>${frDate(x)}</option>`).join('');
 const niv=nivOf(c),dd=dist(niv);
 $('#thVit').textContent=`Vitesse ${dd} m (s)`;$('#barHint').textContent=barHint(niv);
 const R=roster(c).map(e=>rowData(e,d));
 const cls=(lv,pr,val)=>!pr?'G':val==null?'N':lv||'N';
 $('#resBody').innerHTML=R.map(r=>{const ab=!r.pr;
  return `<tr class="${ab?'abs':''}"><td>${nm(r.e)}</td><td>${sexTxt(r.sx)}</td>`
   +`<td class="${cls(r.lp,r.pr,r.pal)}">${ab?'Absent':r.pal!=null?r.pal:'—'}</td><td class="${cls(r.lp,r.pr,r.pal)}">${ab?'':r.vma!=null?TA.frAuto(r.vma):'—'}</td>`
   +`<td class="${cls(r.lv,r.pr,r.vit)}">${ab?'':r.vit!=null?TA.fr(r.vit,2):'—'}</td><td class="${cls(r.ls,r.pr,r.sau)}">${ab?'':r.sau!=null?r.sau:'—'}</td></tr>`}).join('')||'<tr><td colspan=6>Aucun élève</td></tr>';
 const sum=(label,lvKey,valKey)=>{const P=R.filter(r=>r.pr),ev=P.filter(r=>r[valKey]!=null),cnt=k=>ev.filter(r=>r[lvKey]===k).length,A=R.length-P.length,nt=P.length-ev.length,tot=R.length||1;
  const w=n=>(100*n/tot).toFixed(1);const pc=n=>ev.length?Math.round(100*n/ev.length)+' %':'–';
  return `<div class="sc"><b>${label}</b><div class="bar"><i class="R" style="width:${w(cnt('R'))}%"></i><i class="J" style="width:${w(cnt('J'))}%"></i><i class="V" style="width:${w(cnt('V'))}%"></i><i class="N" style="width:${w(nt)}%"></i><i class="G" style="width:${w(A)}%"></i></div>`
   +`<small>🔴 À besoins : <b>${cnt('R')}</b> (${pc(cnt('R'))}) · 🟡 Fragile : <b>${cnt('J')}</b> (${pc(cnt('J'))}) · 🟢 Satisfaisant : <b>${cnt('V')}</b> (${pc(cnt('V'))})</small><small>${ev.length} évalué(s) · ${nt} non testé(s) · ${A} absent(s)</small></div>`};
 $('#resSum').innerHTML=sum('Palier / VMA','lp','pal')+sum('Vitesse '+dd+' m','lv','vit')+sum('Saut sans élan','ls','sau')}
$('#rClasse').onchange=renderRes;$('#rDate').onchange=renderRes;

/* ───────── exports ───────── */
function download(u8,name,mime){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([u8],{type:mime||EPS.XLSX_MIME}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000)}
/* scope : 'niv:2' | 'niv:6' (toutes les classes du niveau) ou 'cl:CLASSE' ; les barèmes dépendent du niveau → un classeur par niveau */
function scopeInfo(scope){
 if(scope&&scope.startsWith('cl:')){const c=scope.slice(3);return{niv:nivOf(c),classes:[c],label:c}}
 const niv=scope&&scope.startsWith('niv:')?scope.slice(4):NV();
 return{niv,classes:classes().filter(c=>nivOf(c)===niv),label:niv==='6'?'sixieme':'seconde'}}
function buildRows(si){
 const cl=si.classes.filter(c=>roster(c).some(e=>lignes(e).length)),rows=[],vk=vkeys(si.niv);
 cl.forEach(c=>roster(c).forEach(e=>{const ls=lignes(e),sx=sexOf(e);
  if(!ls.length){rows.push({classe:c,date:'',nom:nmTxt(e),sexe:sx,present:false,retenu:true});return}
  ls.forEach((l,i)=>{const pal=pf(l[K.pal]);rows.push({classe:c,date:l.Date||'',nom:nmTxt(e),sexe:sx,present:l[K.pres]==='Oui',pal,vma:pf(l[K.vma])??(pal!=null?TA.vmaOf(pal):null),
   vit:pf(l[vk.vit]),sau:pf(l[K.sau]),v1:pf(l[vk.v1]),v2:pf(l[vk.v2]),s1:pf(l[K.s1]),s2:pf(l[K.s2]),ll:pf(l[K.ll]),retenu:i===ls.length-1})})}));
 return rows}
async function exportStats(scope){
 const si=scopeInfo(scope),rows=buildRows(si);if(!rows.length){toast('Aucun résultat enregistré à exporter.');return}
 download(XS.build(rows,{date:frDate(isoToday()),niv:si.niv}),`Statistiques_tests_aptitude_${si.label}_${isoToday()}.xlsx`);toast('📊 Statistiques exportées')}
/* export au format Mes Apps EPS : feuille « testaptphys » (+ liste des élèves concernés) */
async function exportPortal(){
 const ids=STU.filter(e=>lignes(e).length).map(e=>e.id);if(!ids.length){toast('Aucun résultat enregistré à exporter.');return}
 EPS.downloadXLSX(await EPS.exportXLSX({ids,apps:[APP]}),`TestAptPhys_${isoToday()}.xlsx`);toast('⬆ Fichier prêt pour Mes Apps EPS')}
/* les saisies sont déjà écrites dans la base partagée à chaque enregistrement ; ce bouton les réécrit toutes et confirme */
async function saveToPortal(){
 try{await load();const ps=STU.filter(e=>lignes(e).length);
  for(const e of ps)await EPS.setExt(APP,e.id,{lignes:lignes(e)});
  $('#saveMsg').className='msg ok';$('#saveMsg').textContent=ps.length?`✅ ${ps.length} élève(s) enregistré(s) dans Mes Apps EPS (feuille « ${APP} »). Ouvrez le portail pour les voir dans la fiche élève.`:'Aucune saisie à enregistrer pour le moment.'}
 catch(e){$('#saveMsg').className='msg ko';$('#saveMsg').textContent='❌ '+e.message}}
/* suppression : uniquement les données de cette application (la liste d'élèves et les autres applications sont conservées) */
async function wipe(){
 const n=STU.reduce((a,e)=>a+lignes(e).length,0);
 if(LL.running){toast("Terminez d'abord l'épreuve Luc Léger en cours.");return}
 if(!confirm(`Supprimer définitivement toutes les données de l'application (${n} enregistrement(s) : présences, Luc Léger, saut, vitesse sur 30 m / 50 m) ?\n\nLa liste des élèves et les données des autres applications sont conservées.\n\nPensez à exporter une sauvegarde avant.`))return;
 const keepSex=confirm("Conserver le sexe des élèves déjà renseigné ?\n\nOK = conserver le sexe · Annuler = tout supprimer");
 const d=await EPS.open();
 await new Promise((ok,ko)=>{const t=d.transaction('eleves','readwrite'),o=t.objectStore('eleves'),g=o.getAll();
  g.onsuccess=()=>g.result.forEach(e=>{if(!e.ext||!e.ext[APP])return;const a=e.ext[APP],sx=TA.normSex(a.Sexe)||TA.normSex([...(Array.isArray(a.lignes)?a.lignes:[])].reverse().map(l=>l.Sexe).find(Boolean));
   if(keepSex&&sx)e.ext[APP]={Sexe:sx};else delete e.ext[APP];o.put(e)});
  t.oncomplete=ok;t.onerror=()=>ko(t.error)});
 try{Object.keys(localStorage).filter(k=>k.startsWith('ta_draft_')).forEach(k=>localStorage.removeItem(k))}catch(e){}
 LL.stops={};await load();renderHome();toast('🗑 Données de l\'application supprimées')}
$('#btnWipe').onclick=wipe;
$('#expStats').onclick=()=>exportStats($('#expScope').value);
$('#resExp').onclick=()=>exportStats('niv:'+nivOf($('#rClasse').value||SET.classe));
$('#expPortal').onclick=exportPortal;$('#savePortal').onclick=saveToPortal;

/* ───────── démarrage ───────── */
async function init(){
 $('#ver').textContent=APP_VERSION;
 try{await load()}catch(e){msg('❌ Base locale inaccessible : '+e.message,false)}
 renderHome();
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&VIEW==='home'&&!LL.running)load().then(renderHome)});
 if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{})}
init();
})();
