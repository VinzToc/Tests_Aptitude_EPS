/* analyse.js — onglet « Analyse » : vue d'ensemble, par classe, élèves à besoins, élèves satisfaisants, fiche élève.
   Utilise les données de l'application (dernière séance de chaque élève) ; chaque épreuve est classée selon le barème du niveau de la classe.
   Charge après app.js : s'appuie sur ses variables globales (STU, lignes, sexOf, nivOf, vkeys, K, pf, TA, …). */
(function(){
const T0=window.TAPP,{$,$$,esc,frDate,isoToday,download,toast,lignes,sexOf,nivOf,vkeys,K,pf,SET}=T0;
const LV=['À besoins','Fragile','Satisfaisant','Absent','Non évalué'];
const COL={'À besoins':'#d93025','Fragile':'#f29900','Satisfaisant':'#1e8e3e','Absent':'#80868b','Non évalué':'#5f7fb0'};
const CODE={R:'À besoins',J:'Fragile',V:'Satisfaisant'};
const COMP=[['pal','Endurance (Luc Léger)'],['sau','Saut sans élan'],['vit','Vitesse']];
const TABS=[['ens','📊','Ensemble'],['cls','🏫','Par classe'],['bes','🔴','À besoins'],['sat','🟢','Satisfaisants'],['fic','🧾','Fiche élève']];
const A={tab:'ens',niv:'all',cls:'',eleve:'all',view:'stack'};
const pct=(n,t)=>t?(n/t*100).toFixed(1).replace('.',',')+' %':'0 %';
const plural=(n,w)=>`${n} ${w}${n>1?'s':''}`;

/* ───────── données : une ligne par élève ayant au moins une saisie (dernière séance) ───────── */
function data(){
 const out=[];
 T0.STU.forEach(e=>{const ls=lignes(e);if(!ls.length)return;const l=ls[ls.length-1],niv=nivOf(e.classe),vk=vkeys(niv),sx=sexOf(e),bk=TA.bkey(niv,sx);
  const absent=l[K.pres]==='Non',ne=String(l[K.ne]||'').split(';');
  const val={pal:pf(l[K.pal]),sau:pf(l[K.sau]),vit:pf(l[vk.vit])},fn={pal:TA.lvPalier,sau:TA.lvSaut,vit:TA.lvVitesse},sk={pal:K.lpal,sau:K.lsau,vit:K.lvit};
  const lv={};
  COMP.forEach(([t])=>{
   if(absent)lv[t]='Absent';else if(ne.includes(t))lv[t]='Non évalué';
   else{let c=val[t]!=null&&bk?fn[t](val[t],bk):null;lv[t]=c?CODE[c]:(LV.includes(l[sk[t]])?l[sk[t]]:'Non évalué')}});
  const cx={};TA.CT.forEach(c=>{cx[c.id]=pf(l[c.key])});
  out.push({e,classe:e.classe,grp:(Array.isArray(e.groupes)?e.groupes:String(e.groupes??'').split('|')).map(x=>String(x).trim()).filter(Boolean),nom:(e.nom||'').toUpperCase(),prenom:e.prenom||'',sx,niv,date:l.Date||'',val,lv,cx,absent})});
 return out.sort((a,b)=>a.nom.localeCompare(b.nom,'fr',{numeric:true})||a.prenom.localeCompare(b.prenom,'fr'))}
const classesOf=d=>[...new Set([...d.map(s=>s.classe),...d.flatMap(s=>s.grp||[])])].sort((a,b)=>a.localeCompare(b,'fr',{numeric:true}));
const countLv=(list,t)=>LV.map(l=>list.filter(s=>s.lv[t]===l).length);

/* ───────── représentations ───────── */
const legend=()=>'<div class="aleg">'+LV.map(l=>`<span><i style="background:${COL[l]}"></i>${l}</span>`).join('')+'</div>';
const stackBar=(n,t)=>`<div class="astack">${LV.map((l,i)=>n[i]?`<div style="width:${n[i]/t*100}%;background:${COL[l]}" title="${l} : ${n[i]}">${n[i]/t>=.07?Math.round(n[i]/t*100)+'%':''}</div>`:'').join('')}</div>`;
function barsChart(n,t){return `<div class="abars">${LV.map((l,i)=>{const p=t?n[i]/t*100:0;return `<div class="abc" title="${l} : ${n[i]}"><span>${Math.round(p)}%</span><div style="height:${Math.max(2,p*1.3).toFixed(1)}px;background:${COL[l]}"></div></div>`}).join('')}</div><div class="abl">${LV.map(l=>`<small>${l}</small>`).join('')}</div>`}
function pieChart(n,t){const R=92,r=52,P=(q,a)=>[(100+q*Math.cos(a)).toFixed(2),(100+q*Math.sin(a)).toFixed(2)];let a=-Math.PI/2,o='';
 n.forEach((v,i)=>{if(!v||!t)return;const f=v/t,a2=a+f*2*Math.PI,c=COL[LV[i]];
  if(f>=.9999)o+=`<circle cx="100" cy="100" r="${(R+r)/2}" fill="none" stroke="${c}" stroke-width="${R-r}"/>`;
  else{const[x1,y1]=P(R,a),[x2,y2]=P(R,a2),[x3,y3]=P(r,a2),[x4,y4]=P(r,a),g=f>.5?1:0;o+=`<path d="M${x1} ${y1}A${R} ${R} 0 ${g} 1 ${x2} ${y2}L${x3} ${y3}A${r} ${r} 0 ${g} 0 ${x4} ${y4}Z" fill="${c}" stroke="#fff" stroke-width="1.5"><title>${LV[i]} : ${v}</title></path>`}
  if(f>=.06){const[tx,ty]=P((R+r)/2,a+f*Math.PI);o+=`<text x="${tx}" y="${ty}" text-anchor="middle" dominant-baseline="central" font-size="14" font-weight="700" fill="#fff" stroke="rgba(0,0,0,.45)" stroke-width="3" paint-order="stroke">${Math.round(f*100)}%</text>`}
  a=a2});
 return `<svg viewBox="0 0 200 200" class="apie">${o}<text x="100" y="100" text-anchor="middle" dominant-baseline="central" font-size="24" font-weight="700" fill="#10264f">${t}</text></svg>`}
const one=(n,t)=>A.view==='pie'?pieChart(n,t):A.view==='bars'?barsChart(n,t):stackBar(n,t);

/* ───────── onglets ───────── */
function summary(list,titre){
 const t=list.length,rows=COMP.map(([k,nom])=>[nom,...countLv(list,k)]);
 const grid=A.view==='stack'?rows.map(r=>`<div class="alab">${r[0]}</div>${stackBar(r.slice(1),t)}`).join(''):'<div class="ag3">'+rows.map(r=>`<div><div class="alab c">${r[0]}</div>${one(r.slice(1),t)}</div>`).join('')+'</div>';
 const ab=list.filter(s=>s.absent).length;
 const kp=`<div class="akpis"><div class="ak"><b>${t}</b><span>élèves</span></div><div class="ak"><b>${t-ab}</b><span>présents</span></div><div class="ak"><b>${ab}</b><span>absents</span></div>`
  +COMP.map(([k,nom])=>{const c=countLv(list,k),ev=c[0]+c[1]+c[2];return `<div class="ak"><b style="color:${COL['Satisfaisant']}">${ev?Math.round(c[2]/ev*100):0}%</b><span>${nom.split(' ')[0]} satisfaisant</span></div>`}).join('')+'</div>';
 const tab=`<div class="awrap"><table class="at"><tr><th>Épreuve</th>${LV.map(l=>`<th class="n">${l}</th>`).join('')}</tr>`+rows.map(r=>`<tr><td><b>${r[0]}</b></td>${r.slice(1).map(v=>`<td class="n">${pct(v,t)}<br><small>${plural(v,'élève')}</small></td>`).join('')}</tr>`).join('')+'</table></div>';
 return{html:kp+`<div class="card"><h3>Répartition des niveaux (${plural(t,'élève')})</h3>${legend()}${grid}</div><div class="card">${tab}</div>`,
  title:titre,sections:[{title:`Répartition des niveaux – ${plural(t,'élève')}`,head:['Épreuve',...LV.map(l=>l+' (n)'),...LV.map(l=>l+' (%)')],rows:rows.map(r=>[r[0],...r.slice(1),...r.slice(1).map(v=>pct(v,t))])}]}}
const sxl=s=>({F:'Fille',M:'Garçon'}[s.sx]||'');
function groups(list,level,titre){
 const out=[3,2,1].map(k=>({k,st:list.filter(s=>COMP.filter(([c])=>s.lv[c]===level).length===k)}));
 const lab=k=>`${k} épreuve${k>1?'s':''} ${level==='À besoins'?'à besoins':'satisfaisante'+(k>1?'s':'')}`;
 const det=s=>COMP.filter(([c])=>s.lv[c]===level).map(c=>c[1]).join(', ');
 const kp='<div class="akpis">'+out.map(g=>`<div class="ak"><b style="color:${COL[level]}">${g.st.length}</b><span>${lab(g.k)}</span></div>`).join('')+'</div>'
  +(list.some(s=>s.sx)?'<div class="aleg"><span><i style="background:#c2185b"></i>Filles</span><span><i style="background:#1a73e8"></i>Garçons</span></div>':'');
 const lists=out.map(g=>`<div class="card"><h3>${lab(g.k)} – ${plural(g.st.length,'élève')}</h3>`+(g.st.length?`<div class="awrap"><table class="at"><tr><th>Nom</th><th>Prénom</th><th>Sexe</th><th>Classe</th><th>Épreuves concernées</th></tr>${g.st.map(s=>`<tr class="${s.sx||''}"><td>${esc(s.nom)}</td><td>${esc(s.prenom)}</td><td>${sxl(s)}</td><td>${esc(s.classe)}</td><td>${det(s)}</td></tr>`).join('')}</table></div>`:'<div class="aempty">Aucun élève</div>')+'</div>').join('');
 return{html:kp+lists,title:titre,sections:[{title:'Synthèse',head:['Situation',"Nombre d'élèves"],rows:out.map(g=>[lab(g.k),g.st.length])},
  ...out.map(g=>({title:`${lab(g.k)} – ${plural(g.st.length,'élève')}`,head:['Nom','Prénom','Sexe','Classe','Épreuves concernées'],rows:g.st.map(s=>[s.nom,s.prenom,sxl(s),s.classe,det(s)])}))]}}
const UNIT={pal:v=>'palier '+TA.frAuto(v),sau:v=>TA.frAuto(v)+' cm',vit:v=>TA.frAuto(v)+' s'};
function ficheOf(s){
 const rows=COMP.map(([k,nom])=>({nom:k==='vit'?`Vitesse ${s.niv==='6'?30:50} m`:nom,v:s.val[k]!=null&&!s.absent?UNIT[k](s.val[k]):'',lv:s.lv[k]}));
 const cp=TA.CT.filter(c=>s.cx[c.id]!=null&&!s.absent).map(c=>{const code=TA.lvCompl(c.id,s.cx[c.id],SET.seuils);return{nom:c.nom,v:TA.frAuto(s.cx[c.id])+' '+c.unit,lv:code?TA.LAB[code]:''}});
 return{s,rows,cp}}
function ficheHtml(f){const s=f.s;
 const tr=(r,c)=>`<tr><td>${esc(r.nom)}</td><td class="c">${esc(r.v)}</td><td class="lv" style="background:${COL[r.lv]||'#eef1f8'};${r.lv&&COL[r.lv]?'':'color:#10264f'}">${r.lv}</td></tr>`;
 return `<div class="fiche"><h2>Fiche récapitulative EPS</h2><div class="inf"><b>Nom</b><span>${esc(s.nom)}</span><b>Prénom</b><span>${esc(s.prenom)}</span><b>Classe</b><span>${esc(s.classe)}</span><b>Niveau</b><span>${TA.NIV[s.niv].lab}</span><b>Date des tests</b><span>${frDate(s.date)}</span></div>`
  +`<table class="at ft"><tr><th>Épreuve</th><th>Résultat</th><th>Niveau</th></tr>${f.rows.map(tr).join('')}</table>`
  +(f.cp.length?`<h3>Tests complémentaires</h3><table class="at ft"><tr><th>Test</th><th>Résultat</th><th>Niveau</th></tr>${f.cp.map(tr).join('')}</table>`:'')
  +'<div class="aleg">'+LV.map(l=>`<span><i style="background:${COL[l]}"></i>${l}</span>`).join('')+'</div></div>'}

/* ───────── affichage ───────── */
const D=()=>data();
const scopeList=(d,c)=>!c||c==='all'?d:d.filter(s=>s.classe===c||(s.grp||[]).includes(c));
function build(){
 const d=D(),cl=classesOf(d);
 if(!A.cls||(A.cls!=='all'&&!cl.includes(A.cls)))A.cls=cl.includes(SET.classe)?SET.classe:(cl[0]||'all');
 const selCl=(all)=>`<label>Classe <select data-k="cls">${all?'<option value="all">Toutes les classes</option>':''}${cl.map(c=>`<option value="${esc(c)}" ${c===A.cls?'selected':''}>${d.some(s=>s.classe===c)?'Classe':'Groupe'} ${esc(c)}</option>`).join('')}</select></label>`;
 const selView=`<label>Représentation <select data-k="view"><option value="stack">Barres empilées</option><option value="bars">Bâtons</option><option value="pie">Diagramme circulaire</option></select></label>`;
 let bar='',r;
 if(!d.length)return{bar:'',res:{html:'<div class="card aempty">Aucun résultat enregistré pour le moment : saisissez ou importez des résultats, puis revenez ici.</div>',title:'',sections:[]}};
 if(A.tab==='ens'){const nv=[...new Set(d.map(s=>s.niv))];
  bar=`<label>Niveau <select data-k="niv"><option value="all">Tous les niveaux</option>${nv.map(n=>`<option value="${n}" ${A.niv===n?'selected':''}>${TA.NIV[n].lab}</option>`).join('')}</select></label>`+selView;
  const l=A.niv==='all'?d:d.filter(s=>s.niv===A.niv);r=summary(l,'Vue d\'ensemble – '+(A.niv==='all'?'toutes classes':TA.NIV[A.niv].lab))}
 else if(A.tab==='cls'){bar=selCl(false)+selView;r=summary(scopeList(d,A.cls),'Résultats – classe '+A.cls)}
 else if(A.tab==='bes'){bar=selCl(true);r=groups(scopeList(d,A.cls),'À besoins','Élèves à besoins – '+(A.cls==='all'?'toutes classes':'classe '+A.cls))}
 else if(A.tab==='sat'){bar=selCl(true);r=groups(scopeList(d,A.cls),'Satisfaisant','Élèves satisfaisants – '+(A.cls==='all'?'toutes classes':'classe '+A.cls))}
 else{const l=scopeList(d,A.cls==='all'?cl[0]:A.cls);if(A.eleve!=='all'&&!l.some(s=>s.e.id===A.eleve))A.eleve='all';
  bar=selCl(false)+`<label>Élève <select data-k="eleve"><option value="all">Toute la classe (${l.length} fiches)</option>${l.map(s=>`<option value="${esc(s.e.id)}" ${A.eleve===s.e.id?'selected':''}>${esc(s.nom)} ${esc(s.prenom)}</option>`).join('')}</select></label>`;
  const sel=A.eleve==='all'?l:l.filter(s=>s.e.id===A.eleve),fs=sel.map(ficheOf);
  r={html:`<div class="ahint">${sel.length>1?`${sel.length} fiches : une par page à l'impression (PDF).`:'Aperçu de la fiche telle qu\'elle sera imprimée (PDF).'}</div>`+(fs.map(ficheHtml).join('')||'<div class="aempty">Aucun élève</div>'),
   title:sel.length===1?`Fiche élève – ${sel[0].nom} ${sel[0].prenom}`:'Fiches élèves – classe '+A.cls,
   sections:[{title:'Résultats',head:['Nom','Prénom','Classe',...COMP.map(c=>c[1]),...TA.CT.map(c=>c.nom)],rows:sel.map(s=>[s.nom,s.prenom,s.classe,...COMP.map(([k])=>s.lv[k]),...TA.CT.map(c=>{const v=s.cx[c.id],code=TA.lvCompl(c.id,v,SET.seuils);return v==null?'':TA.frAuto(v)+(code?' – '+TA.LAB[code]:'')})])}]}}
 return{bar,res:r}}
let LAST=null;
function render(){
 $('#aTabs').innerHTML=TABS.map(([id,ic,lab])=>`<button data-t="${id}" class="${id===A.tab?'act':''}"><span>${ic}</span>${lab}</button>`).join('');
 const {bar,res}=build();LAST=res;
 $('#aBar').innerHTML=bar;$$('#aBar select').forEach(s=>{const k=s.dataset.k;if(k==='view')s.value=A.view});
 $('#aOut').innerHTML=res.html;
 $('#aAct').hidden=!res.sections.length}

/* ───────── exports ───────── */
function exportXlsx(){if(!LAST||!LAST.sections.length)return;
 const X=XW.create(),sh=X.addSheet('Analyse',{widths:[34,22,16,16,16,16,16,16,16,16]});
 const T=X.style({b:1,sz:14,color:'10264F'}),H=X.style({b:1,color:'FFFFFF',fill:'1F4FD8',border:true,wrap:1}),S=X.style({b:1,sz:12,color:'10264F'}),C=X.style({border:true,wrap:1}),
  F={};LV.forEach(l=>F[l]=X.style({border:true,b:1,color:'FFFFFF',fill:COL[l].slice(1),h:'center'}));
 let y=0;sh.set(y++,0,{v:LAST.title,s:T});sh.set(y++,0,{v:'Tests d\'aptitude physique – '+frDate(isoToday()),s:C});y++;
 LAST.sections.forEach(sec=>{sh.set(y++,0,{v:sec.title,s:S});sec.head.forEach((h,i)=>sh.set(y,i,{v:h,s:H}));y++;
  sec.rows.forEach(r=>{r.forEach((v,i)=>{const lvl=LV.find(l=>typeof v==='string'&&(v===l||v.endsWith(' – '+l)));sh.set(y,i,{v:v??'',s:lvl&&v===lvl?F[lvl]:C})});y++});y++});
 download(X.build(),`Analyse_${A.tab}_${isoToday()}.xlsx`);toast('📊 Excel exporté')}
function printNow(){document.body.classList.add('printing');const t=document.title;document.title=LAST&&LAST.title||t;
 const done=()=>{document.body.classList.remove('printing');document.title=t;window.removeEventListener('afterprint',done)};window.addEventListener('afterprint',done);window.print()}

/* ───────── événements ───────── */
$('#aTabs').addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;A.tab=b.dataset.t;render()});
$('#aBar').addEventListener('change',ev=>{const s=ev.target.closest('select');if(!s)return;A[s.dataset.k]=s.value;if(s.dataset.k==='cls')A.eleve='all';render()});
$('#aXls').onclick=exportXlsx;$('#aPdf').onclick=printNow;
window.ANA={open:render};
})();
