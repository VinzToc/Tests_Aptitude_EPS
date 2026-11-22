/* official.js — fichiers de la plateforme officielle d'évaluation des aptitudes physiques (restitution globale établissement, ex. « 26EVA6 »).
   • OFF.parse(buf)  : lit un export .xlsx de la plateforme (feuilles « …EVA6 » = groupes de maîtrise, « …EVA6_perf » = performances).
   • OFF.build(rows,opt) : écrit un classeur au même format (feuille de lecture + niveaux + performances).
   Dépend de tests-core.js (TA) et xlsx-writer.js (XW). Autonome pour la lecture du ZIP/XLSX. */
(function(){
/* ───────── lecture XLSX (zip + feuilles) ───────── */
async function unzip(buf){const u=new Uint8Array(buf),v=new DataView(buf);let e=u.length-22;
 while(e>=0&&v.getUint32(e,true)!==0x06054b50)e--;if(e<0)throw new Error('Fichier XLSX invalide.');
 const n=v.getUint16(e+10,true);let p=v.getUint32(e+16,true);const dec=new TextDecoder(),out={};
 for(let i=0;i<n&&v.getUint32(p,true)===0x02014b50;i++){
  const m=v.getUint16(p+10,true),cs=v.getUint32(p+20,true),nl=v.getUint16(p+28,true),xl=v.getUint16(p+30,true),cl=v.getUint16(p+32,true),lo=v.getUint32(p+42,true);
  const name=dec.decode(u.subarray(p+46,p+46+nl)),ds=lo+30+v.getUint16(lo+26,true)+v.getUint16(lo+28,true);let d=u.subarray(ds,ds+cs);
  if(m===8){if(typeof DecompressionStream==='undefined')throw new Error("Ce navigateur ne sait pas lire ce fichier XLSX : utilisez un navigateur récent.");
   d=new Uint8Array(await new Response(new Blob([d]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer())}
  else if(m!==0)throw new Error('Compression XLSX non prise en charge.');
  out[name]=d;p+=46+nl+xl+cl}
 return out}
const unxml=s=>s.replace(/&(lt|gt|quot|apos|amp|#\d+|#x[0-9a-fA-F]+);/g,(_,k)=>({lt:'<',gt:'>',quot:'"',apos:"'",amp:'&'}[k]||String.fromCodePoint(k[1]==='x'?parseInt(k.slice(2),16):+k.slice(1))));
const attr=(t,n)=>{const m=new RegExp('(?:^|\\s)'+n+'\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\')').exec(t);return m?unxml(m[1]??m[2]):null};
const strs=b=>[...b.replace(/<rPh\b[\s\S]*?<\/rPh>/g,'').matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map(m=>unxml(m[1])).join('');
const colI=r=>{let n=0;for(const ch of /^[A-Z]+/.exec(r)[0])n=n*26+ch.charCodeAt(0)-64;return n-1};
function readSheet(x,ss){const rows=[];let rn=0;
 for(const rm of x.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)){
  const r=attr(rm[1],'r'),ri=r?+r-1:rn;rn=ri+1;const row=rows[ri]=[];
  for(const cm of(rm[2]||'').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)){
   const ref=attr(cm[1],'r'),t=attr(cm[1],'t'),b=cm[2]||'',ci=ref?colI(ref):row.length;let v;
   if(t==='inlineStr')v=strs(b);
   else{const m=/<v>([\s\S]*?)<\/v>/.exec(b);if(m){const raw=m[1];
    if(t==='s')v=ss[+raw];else if(t==='str'||t==='e')v=unxml(raw);else if(t==='b')v=raw==='1';
    else{const n=Number(raw);v=raw!==''&&isFinite(n)?n:unxml(raw)}}}
   if(v!==undefined)row[ci]=v}}
 return rows}
async function readWorkbook(buf){
 const files=await unzip(buf),T=n=>files[n]?new TextDecoder().decode(files[n]):null;
 const wb=T('xl/workbook.xml'),rel=T('xl/_rels/workbook.xml.rels');if(!wb||!rel)throw new Error('Fichier XLSX invalide.');
 const tg={};for(const m of rel.matchAll(/<Relationship\b[^>]*>/g)){const id=attr(m[0],'Id'),t=attr(m[0],'Target');if(id&&t)tg[id]=t.startsWith('/')?t.slice(1):'xl/'+t}
 const ss=[],sx=T('xl/sharedStrings.xml');if(sx)for(const m of sx.matchAll(/<si\b[^>]*?(?:\/>|>([\s\S]*?)<\/si>)/g))ss.push(strs(m[1]||''));
 const sheets=[];for(const m of wb.matchAll(/<sheet\b[^>]*>/g)){const p=tg[attr(m[0],'r:id')];if(p&&files[p])sheets.push({name:attr(m[0],'name'),rows:readSheet(T(p),ss)})}
 return sheets}

/* ───────── analyse d'un export de la plateforme ───────── */
const flat=s=>String(s==null?'':s).replace(/\s+/g,' ').trim();
const nrm=s=>flat(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
/* en-têtes : « Classe », « Prénom élève », « Nom élève », « Endurance (n° de palier) », « Saut en longueur (distance en cm) », « Vitesse (temps en s) » */
function headerMap(row){const m={};(row||[]).forEach((h,i)=>{const t=nrm(h);if(!t)return;
 if(t.startsWith('classe'))m.classe=i;else if(t.startsWith('prenom'))m.prenom=i;else if(t.startsWith('nom'))m.nom=i;
 else if(t.startsWith('endurance'))m.pal=i;else if(t.startsWith('saut')||t.startsWith('force'))m.sau=i;else if(t.startsWith('vitesse'))m.vit=i});
 return(m.nom!=null&&m.prenom!=null&&m.pal!=null)?m:null}
const dateOf=rows=>{for(const r of rows.slice(0,3))for(const c of(r||[])){const m=/(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(String(c||''));if(m)return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`}return ''};
const LVTXT={'a besoins':'R','besoins':'R','fragile':'J','satisfaisant':'V'};
/* valeur d'une cellule : nombre (performance), niveau (R/J/V) ou statut (absent / nonEval / pasRest) */
function cellVal(v){
 if(v==null||v==='')return{};
 if(typeof v==='number')return{val:v};
 const t=nrm(v);
 if(t==='absent')return{st:'absent'};
 if(t.startsWith('non evalue'))return{st:'nonEval'};
 if(t.startsWith('pas de restitution'))return{st:'pasRest'};
 if(LVTXT[t])return{lv:LVTXT[t]};
 const n=parseFloat(String(v).replace(',','.'));return isFinite(n)?{val:n}:{}}
async function parse(buf){
 const sheets=await readWorkbook(buf),found=[];
 for(const s of sheets){let hi=-1,hm=null;
  for(let i=0;i<Math.min(6,s.rows.length)&&!hm;i++){hm=headerMap(s.rows[i]);if(hm)hi=i}
  if(hm)found.push({name:s.name,hm,hi,rows:s.rows,perf:/_perf$/i.test(s.name)})}
 if(!found.length)return null;
 const perf=found.filter(f=>f.perf),lev=found.filter(f=>!f.perf),map=new Map();
 const get=(r,hm)=>({classe:flat(r[hm.classe]),prenom:flat(r[hm.prenom]),nom:flat(r[hm.nom])});
 const put=(f,isPerf)=>{for(const r of f.rows.slice(f.hi+1)){if(!r||(!r[f.hm.nom]&&!r[f.hm.prenom]))continue;
   const id=get(r,f.hm),k=nrm(id.classe)+'|'+nrm(id.nom)+'|'+nrm(id.prenom);let o=map.get(k);if(!o){o=Object.assign({},id,{t:{}});map.set(k,o)}
   for(const t of['pal','sau','vit']){if(f.hm[t]==null)continue;const c=cellVal(r[f.hm[t]]),x=o.t[t]||(o.t[t]={});
    if(c.val!=null)x.val=c.val;if(c.st)x.st=c.st;if(c.lv&&!isPerf)x.lv=c.lv;else if(c.lv&&x.lv==null)x.lv=c.lv}}};
 perf.forEach(f=>put(f,true));lev.forEach(f=>put(f,false));
 const any=perf[0]||lev[0];
 return{date:dateOf(any.rows),sheets:found.map(f=>f.name),hasPerf:perf.length>0,rows:[...map.values()]}}

/* ───────── export au format de la plateforme ───────── */
const FILL={R:'F8CBCB',J:'FFF2CC',V:'D1E7D8',G:'D9D9D9'},GREEN='2EAE7D';
const frD=d=>d?d.split('-').reverse().join('/'):'';
/* rows : [{classe,prenom,nom,pres:'Oui'|'Non'|null,pal,sau,vit,lpal,lsau,lvit,ne:['pal','sau','vit']}] ; opt : {date (AAAA-MM-JJ de mise à jour), niv:'6'} */
function build(rows,opt={}){
 const X=XW.create(),yy=String((opt.date||new Date().toISOString()).slice(2,4)),code=`${yy}EVA6`,B=TA.BAR['6'];
 const base={sz:10,border:true,wrap:1,v:'top'};
 const hdr=X.style({b:1,sz:10,color:'FFFFFF',fill:GREEN,wrap:1,border:true,v:'top'}),txt=X.style(base),num=X.style(Object.assign({},base,{h:'center'})),
  d2=X.style(Object.assign({},base,{h:'center',fmt:'0.00'})),f=k=>X.style(Object.assign({},base,{h:'center',fill:FILL[k]})),fn=(k,fmt)=>X.style(Object.assign({},base,{h:'center',fill:FILL[k],fmt}));
 const hd=['Classe\n \n','Prénom élève\n \n','Nom élève\n \n','Endurance (n° de palier)\n\n','Saut en longueur (distance en cm)\n\n','Vitesse (temps en s)\n\n',`Date de mise à jour : ${frD(opt.date)}`];
 const W=[10.6,17.6,28.1,31.7,42.3,27,48.3];
 const sorted=rows.slice().sort((a,b)=>a.classe.localeCompare(b.classe,'fr',{numeric:true})||a.nom.localeCompare(b.nom,'fr')||a.prenom.localeCompare(b.prenom,'fr'));
 const T=['pal','sau','vit'],LB={R:'À besoins',J:'Fragile',V:'Satisfaisant'};
 const status=(r,t)=>r.pres==='Non'?'Absent':(r.ne||[]).includes(t)?'Non évalué':r.pres==null?'Pas de restitution':null;
 // — feuille de lecture
 const N=X.addSheet('Note de lecture sixième',{widths:[40,26,40,34,10,10]});
 const tt=X.style({b:1,sz:11}),ti=X.style({sz:10,wrap:1,v:'top'});
 N.set(1,0,{v:'Test',s:hdr});N.set(1,1,{v:'À besoins',s:hdr});N.set(1,2,{v:'Fragile',s:hdr});N.set(1,3,{v:'Satisfaisant',s:hdr});
 const fv=v=>String(v).replace('.',',');
 [['Endurance (Luc Léger)\nPalier réalisé',`Paliers 0 et ${B.pal[0]}`,`Paliers ${B.pal[0]+1} et ${B.pal[1]}`,`Palier ${B.pal[1]+1} ou plus`],
  ['Force musculaire (saut en longueur)\nDistance sautée',`Inférieure ou égale à ${B.sau[0]} cm`,`Strictement supérieure à ${B.sau[0]} cm et inférieure ou égale à ${B.sau[1]} cm`,`Strictement supérieure à ${B.sau[1]} cm`],
  ['Vitesse (30 m plat)\nTemps de parcours des 30 m',`Supérieur ou égal à ${fv(B.vit[0])} s`,`Supérieur ou égal à ${fv(B.vit[1])} s et strictement inférieur à ${fv(B.vit[0])} s`,`Strictement inférieur à ${fv(B.vit[1])} s`]]
  .forEach((q,i)=>q.forEach((v,j)=>N.set(2+i,j,{v,s:j?f(['','R','J','V'][j]):txt})));
 N.set(6,0,{v:'Notes',s:tt});
 N.set(7,0,{v:'L\'intitulé "Absent" apparaît si l\'élève n\'est pas présent lors de la passation du test.',s:ti});
 N.set(8,0,{v:'L\'intitulé "Pas de restitution" indique que les données n\'ont pas été saisies dans le portail de saisie des aptitudes physiques.',s:ti});
 N.set(9,0,{v:'L\'intitulé "Non évalué" apparaît si l\'élève n\'est pas en mesure de réaliser le test dédié.',s:ti});
 N.set(11,0,{v:'Fichier généré par TestAptPhys au format de la plateforme officielle. Données personnelles : usage strictement réservé au chef d\'établissement et à l\'équipe enseignante concernée (RGPD).',s:ti});
 // — feuilles élèves
 const mk=(name,perf)=>{const sh=X.addSheet(name,{widths:W,freeze:[0,1]});
  hd.forEach((h,i)=>sh.set(0,i,{v:h,s:i<6?hdr:X.style({sz:10,b:1})}));
  sorted.forEach((r,i)=>{const y=i+1;sh.set(y,0,{v:r.classe,s:txt});sh.set(y,1,{v:r.prenom,s:txt});sh.set(y,2,{v:r.nom,s:txt});
   T.forEach((t,j)=>{const lv=r['l'+t],val=r[t],st=status(r,t),c=3+j;
    if(st)sh.set(y,c,{v:st,s:st==='Absent'?f('G'):txt});
    else if(perf)sh.set(y,c,val!=null?{v:val,s:lv?fn(lv,t==='vit'?'0.00':'0'):(t==='vit'?d2:num)}:{v:'Pas de restitution',s:txt});
    else sh.set(y,c,lv?{v:LB[lv],s:f(lv)}:{v:'Pas de restitution',s:txt})})})};
 mk(code,false);mk(code+'_perf',true);
 return X.build()}
window.OFF={parse,build,nrm};
})();
