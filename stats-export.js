/* stats-export.js — classeur « Résultats et statistiques » (même structure que le fichier de statistiques modèle) :
   Synthèse (formules) · Graphiques · Données · Barèmes.  Dépend de xlsx-writer.js et tests-core.js. */
(function(){
const NAVY='0F2A5C',FILL={R:'F8CBCB',J:'FFF2CC',V:'D5F0DC',G:'D9D9D9',NT:'ECECEC'};
const CH={R:'E06666',J:'F1C232',V:'6AA84F',NT:'BFBFBF',A:'7F7F7F',N:'0F2A5C'};
const C={cls:0,date:1,nom:2,sex:3,pres:4,pal:5,lpal:6,vma:7,lvma:8,vit:9,lvit:10,sau:11,lsau:12,stat:13,ret:14,v1:15,v2:16,s1:17,s2:18,ll:19,rem:20};
const TESTS=[{nm:'Palier',val:C.pal,lvl:C.lpal,fmt:'0.0',ax:'General'},{nm:'VMA (km/h)',val:C.vma,lvl:C.lvma,fmt:'0.0'},
             {nm:'Vitesse 50 m (s)',val:C.vit,lvl:C.lvit,fmt:'0.00'},{nm:'Saut sans élan (cm)',val:C.sau,lvl:C.lsau,fmt:'0'}];
const LV=['À besoins','Fragile','Satisfaisant'];
const num=TA.num, L=XW.colL, R=XW.ref;
const frDate=d=>d?d.split('-').reverse().join('/'):'';

/* rows : [{classe,date,nom,sexe,present,pal,vma,vit,sau,v1,v2,s1,s2,ll,retenu}] — voir buildRows() dans app.js */
function build(rows,opt={}){
 const X=XW.create(),B=TA.BAR;
 const base={sz:10};
 const st=(o)=>X.style(Object.assign({},base,o));
 const S={hdr:st({b:1,color:'FFFFFF',fill:NAVY,h:'center',wrap:1,border:true}),
  title:X.style({b:1,sz:14,color:NAVY}),h2:X.style({b:1,sz:12,color:NAVY}),note:X.style({i:1,sz:9,color:'555555'}),
  txt:st({border:true}),ctr:st({border:true,h:'center'}),int:st({border:true,h:'center',fmt:'0'}),pct:st({border:true,h:'center',fmt:'0.0%'}),
  d1:st({border:true,h:'center',fmt:'0.0'}),d2:st({border:true,h:'center',fmt:'0.00'}),
  inp:st({border:true,h:'center',color:'0000FF'}),bold:st({b:1,border:true}),boldI:st({b:1,border:true,h:'center',fmt:'0'}),
  boldP:st({b:1,border:true,h:'center',fmt:'0.0%'}),boldD1:st({b:1,border:true,h:'center',fmt:'0.0'}),boldD2:st({b:1,border:true,h:'center',fmt:'0.00'})};
 const fillSt=(k,o={})=>st(Object.assign({border:true,h:'center',fill:FILL[k],fmt:'0'},o));
 const dxR=X.dxf({fill:FILL.R}),dxJ=X.dxf({fill:FILL.J}),dxV=X.dxf({fill:FILL.V}),dxG=X.dxf({fill:FILL.G});

 const N=rows.length,last=N+1;                     // dernière ligne Excel des données
 const rg=c=>`'Données'!$${L(c)}$2:$${L(c)}$${last}`;
 const classes=[...new Set(rows.map(r=>r.classe))].sort((a,b)=>a.localeCompare(b,'fr',{numeric:true}));
 const nc=classes.length;

 /* ───────── niveaux (valeurs en cache) ───────── */
 rows.forEach(r=>{r.lpal=TA.lvPalier(r.pal,r.sexe);r.lvit=TA.lvVitesse(r.vit,r.sexe);r.lsau=TA.lvSaut(r.sau,r.sexe);
  r.stat=r.present?'Présent':'Absent'});
 const lab=c=>c?TA.LAB[c]:'';

 /* ───────── feuille Synthèse ───────── */
 const SY=X.addSheet('Synthèse',{grid:false,widths:[24,11,11,13,13,15,13,12,14,11,13,13,11,9,9,10]});
 const GR=X.addSheet('Graphiques',{grid:false});
 const DO=X.addSheet('Données',{freeze:[4,1],filter:`A1:${L(C.rem)}${last}`,
  widths:[10,11,34,7,9,8,14,10,14,12,14,13,14,10,13,12,12,12,12,14,40]});
 const BA=X.addSheet('Barèmes',{grid:false,widths:[24,40,10,10]});
 SY.set(0,0,{v:"Tests d'aptitude physique – synthèse statistique",s:S.title});
 SY.set(1,0,{v:`Rouge = à besoins · Jaune = fragile · Vert = satisfaisant · Gris = absent. Niveaux selon les barèmes DEPP (onglet « Barèmes »). Statistiques calculées sur la dernière séance de chaque élève (colonne « Retenu » de l'onglet Données).${opt.date?' Export du '+opt.date+'.':''}`,s:S.note});
 const A=rg(C.cls),O=rg(C.ret),NS=rg(C.stat);
 const subset=cls=>rows.filter(r=>r.retenu&&(cls==null||r.classe===cls));
 const pres=a=>a.filter(r=>r.present);

 /* 1. participation */
 let r=3;SY.set(r,0,{v:'1. Participation et absentéisme',s:S.h2});r++;
 ['Classe','Élèves listés','Présents','Absents',"Taux d'absentéisme",'Palier évalués','VMA évalués','Vitesse 50 m évalués','Saut évalués'].forEach((h,i)=>SY.set(r,i,{v:h,s:S.hdr}));
 SY.rowH[r]=32;const partHdr=r;r++;
 const partFirst=r;
 classes.forEach(c=>{const a=subset(c),p=pres(a),rx=r+1;
  SY.set(r,0,{v:c,s:S.txt});
  SY.set(r,1,{f:`COUNTIFS(${A},$A${rx},${O},"Oui")`,v:a.length,s:S.int});
  SY.set(r,2,{f:`B${rx}-D${rx}`,v:p.length,s:S.int});
  SY.set(r,3,{f:`COUNTIFS(${A},$A${rx},${O},"Oui",${NS},"Absent")`,v:a.length-p.length,s:fillSt('G')});
  SY.set(r,4,{f:`IFERROR(D${rx}/B${rx},0)`,v:a.length?(a.length-p.length)/a.length:0,s:fillSt('G',{fmt:'0.0%'})});
  TESTS.forEach((t,k)=>SY.set(r,5+k,{f:`COUNTIFS(${A},$A${rx},${O},"Oui",${NS},"Présent",${rg(t.val)},">=0")`,v:p.filter(x=>num(x[VK[k]])).length,s:S.int}));
  r++});
 const partTot=r,tx=r+1;
 SY.set(r,0,{v:'Total',s:S.bold});
 const allA=subset(null),allP=pres(allA);
 [1,2,3].forEach(c=>SY.set(r,c,{f:`SUM(${L(c)}${partFirst+1}:${L(c)}${r})`,v:[allA.length,allP.length,allA.length-allP.length][c-1],s:c===3?fillSt('G',{b:1}):S.boldI}));
 SY.set(r,4,{f:`IFERROR(D${tx}/B${tx},0)`,v:allA.length?(allA.length-allP.length)/allA.length:0,s:fillSt('G',{b:1,fmt:'0.0%'})});
 TESTS.forEach((t,k)=>SY.set(r,5+k,{f:`SUM(${L(5+k)}${partFirst+1}:${L(5+k)}${r})`,v:allP.filter(x=>num(x[VK[k]])).length,s:S.boldI}));
 r+=3;

 /* 2. bilan global (rempli après les blocs) */
 SY.set(r,0,{v:'2. Bilan global par test (toutes classes)',s:S.h2});r++;
 ['Test','% à besoins','% fragile','% satisfaisant','Évalués','Présents non testés','Absents','% absents (sur listés)'].forEach((h,i)=>SY.set(r,i,{v:h,s:S.hdr}));
 SY.rowH[r]=32;const bilHdr=r;r++;const bilFirst=r;r+=4;r+=2;

 /* 3-6. blocs par test */
 const blocks=[];
 TESTS.forEach((t,k)=>{
  SY.set(r,0,{v:`${3+k}. ${t.nm}`,s:S.h2});r++;
  ['Classe','Élèves listés','Évalués','À besoins (n)','Fragile (n)','Satisfaisant (n)','Présents non testés','Absents (n)','% à besoins (sur évalués)','% fragile','% satisfaisant','% absents (sur listés)','Moyenne','Min','Max','Médiane'].forEach((h,i)=>SY.set(r,i,{v:h,s:S.hdr}));
  SY.rowH[r]=45;const hdrR=r;r++;const first=r;
  const vc=VK[k],lc=LK[k],val=rg(t.val),lvl=rg(t.lvl);
  const mkRow=(cls,rr)=>{const a=subset(cls),p=pres(a),ev=p.filter(x=>num(x[vc])),rx=rr+1,cr=cls==null?'':`${A},$A${rx},`;
   const cnt=lv=>ev.filter(x=>lab(x[lc])===lv).length,vals=ev.map(x=>x[vc]);
   const total=cls==null,sty=(s1,s2)=>total?s2:s1;
   const crit=(extra)=>`COUNTIFS(${cr}${O},"Oui"${extra})`;
   SY.set(rr,1,total?{f:`SUM(B${first+1}:B${rr})`,v:a.length,s:S.boldI}:{f:crit(''),v:a.length,s:S.int});
   SY.set(rr,2,total?{f:`SUM(C${first+1}:C${rr})`,v:ev.length,s:S.boldI}:{f:crit(`,${NS},"Présent",${val},">=0"`),v:ev.length,s:S.int});
   LV.forEach((lv,j)=>{const col=3+j,kk=['R','J','V'][j];
    SY.set(rr,col,total?{f:`SUM(${L(col)}${first+1}:${L(col)}${rr})`,v:cnt(lv),s:fillSt(kk,{b:1})}:{f:crit(`,${NS},"Présent",${lvl},"${lv}"`),v:cnt(lv),s:fillSt(kk)})});
   SY.set(rr,6,total?{f:`SUM(G${first+1}:G${rr})`,v:p.length-ev.length,s:fillSt('NT',{b:1})}:{f:`B${rx}-H${rx}-C${rx}`,v:p.length-ev.length,s:fillSt('NT')});
   SY.set(rr,7,total?{f:`SUM(H${first+1}:H${rr})`,v:a.length-p.length,s:fillSt('G',{b:1})}:{f:crit(`,${NS},"Absent"`),v:a.length-p.length,s:fillSt('G')});
   [0,1,2].forEach(j=>SY.set(rr,8+j,{f:`IFERROR(${L(3+j)}${rx}/$C${rx},0)`,v:ev.length?cnt(LV[j])/ev.length:0,s:sty(S.pct,S.boldP)}));
   SY.set(rr,11,{f:`IFERROR(H${rx}/B${rx},0)`,v:a.length?(a.length-p.length)/a.length:0,s:total?fillSt('G',{b:1,fmt:'0.0%'}):fillSt('G',{fmt:'0.0%'})});
   const cs=cls==null?'':`,${A},$A${rx}`,ds=`${val},${O},"Oui",${NS},"Présent"${cs}`;
   const f2=t.fmt==='0.00'?(total?S.boldD2:S.d2):t.fmt==='0'?(total?S.boldI:S.int):(total?S.boldD1:S.d1);
   const avg=vals.length?vals.reduce((x,y)=>x+y,0)/vals.length:'';
   SY.set(rr,12,{f:`IFERROR(AVERAGEIFS(${val},${O},"Oui",${NS},"Présent"${cs}),"")`,v:avg,s:f2});
   SY.set(rr,13,{f:`IFERROR(_xlfn.MINIFS(${val},${O},"Oui",${NS},"Présent"${cs}),"")`,v:vals.length?Math.min(...vals):'',s:f2});
   SY.set(rr,14,{f:`IFERROR(_xlfn.MAXIFS(${val},${O},"Oui",${NS},"Présent"${cs}),"")`,v:vals.length?Math.max(...vals):'',s:f2});
   if(total){const sv=[...vals].sort((x,y)=>x-y),mid=sv.length?(sv.length%2?sv[(sv.length-1)/2]:(sv[sv.length/2-1]+sv[sv.length/2])/2):'';
    SY.set(rr,15,{f:`IFERROR(MEDIAN(IF((${O}="Oui")*(${NS}="Présent")*ISNUMBER(${val}),${val})),"")`,arr:true,v:mid,s:f2})}
   else SY.set(rr,15,{v:'',s:S.txt})};
  classes.forEach(c=>{SY.set(r,0,{v:c,s:S.txt});mkRow(c,r);r++});
  SY.set(r,0,{v:'Total',s:S.bold});mkRow(null,r);const tot=r;r+=3;
  blocks.push({t,k,hdrR,first,tot});
  // bilan global
  const g=bilFirst+k,tr=tot+1;
  SY.set(g,0,{v:t.nm,s:S.txt});
  [0,1,2].forEach(j=>SY.set(g,1+j,{f:`${L(8+j)}${tr}`,v:(()=>{const ev=allP.filter(x=>num(x[vc]));return ev.length?ev.filter(x=>lab(x[lc])===LV[j]).length/ev.length:0})(),s:S.pct}));
  const ev=allP.filter(x=>num(x[vc]));
  SY.set(g,4,{f:`C${tr}`,v:ev.length,s:S.int});SY.set(g,5,{f:`G${tr}`,v:allP.length-ev.length,s:S.int});
  SY.set(g,6,{f:`H${tr}`,v:allA.length-allP.length,s:fillSt('G')});
  SY.set(g,7,{f:`L${tr}`,v:allA.length?(allA.length-allP.length)/allA.length:0,s:fillSt('G',{fmt:'0.0%'})})});
 SY.set(r,0,{v:"Notes : % de niveaux calculés sur les élèves évalués ; % d'absents sur l'effectif listé. Vitesse 50 m : plus bas = meilleur. Palier et VMA ont les mêmes niveaux (VMA = 8 + 0,5 × palier).",s:S.note});

 /* ───────── feuille Données ───────── */
 const heads=['Classe','Date du test','Nom et prénom','Sexe','Présent','Palier','Niveau Palier','VMA (km/h)','Niveau VMA','Vitesse 50 m (s)','Niveau Vitesse','Saut sans élan (cm)','Niveau Saut','Statut','Retenu (stats)','Vitesse essai 1 (s)','Vitesse essai 2 (s)','Saut essai 1 (cm)','Saut essai 2 (cm)','Temps Luc Léger (s)','Remarque'];
 heads.forEach((h,i)=>DO.set(0,i,{v:h,s:S.hdr}));DO.rowH[0]=32;
 const BR="'Barèmes'!";
 const lvF=(cell,sex,b1,b2,kind)=>{ // formule de niveau
  const cmp=kind==='vit'?'>=':'<=';
  return `IF(OR(${cell}="",${sex}=""),"",IF(${cell}${cmp}IF(${sex}="F",${BR}$C$${b1},${BR}$D$${b1}),"À besoins",IF(${cell}${cmp}IF(${sex}="F",${BR}$C$${b2},${BR}$D$${b2}),"Fragile","Satisfaisant")))`};
 rows.forEach((x,i)=>{const rr=i+1,rx=rr+1,fc=(c)=>L(c)+rx;
  DO.set(rr,C.cls,{v:x.classe,s:S.ctr});DO.set(rr,C.date,{v:frDate(x.date),s:S.ctr});DO.set(rr,C.nom,{v:x.nom,s:S.txt});
  DO.set(rr,C.sex,{v:x.sexe||'',s:S.inp});DO.set(rr,C.pres,{v:x.date?(x.present?'Oui':'Non'):'',s:S.ctr});
  DO.set(rr,C.pal,{v:num(x.pal)?x.pal:'',s:S.int});
  DO.set(rr,C.lpal,{f:lvF(fc(C.pal),'$'+L(C.sex)+rx,4,5,'pal'),v:lab(x.lpal),s:S.ctr});
  DO.set(rr,C.vma,{v:num(x.vma)?x.vma:'',s:S.d1});
  DO.set(rr,C.lvma,{f:`IF(${fc(C.vma)}="","",${fc(C.lpal)})`,v:num(x.vma)?lab(x.lpal):'',s:S.ctr});
  DO.set(rr,C.vit,{v:num(x.vit)?x.vit:'',s:S.d2});
  DO.set(rr,C.lvit,{f:lvF(fc(C.vit),'$'+L(C.sex)+rx,6,7,'vit'),v:lab(x.lvit),s:S.ctr});
  DO.set(rr,C.sau,{v:num(x.sau)?x.sau:'',s:S.int});
  DO.set(rr,C.lsau,{f:lvF(fc(C.sau),'$'+L(C.sex)+rx,8,9,'sau'),v:lab(x.lsau),s:S.ctr});
  DO.set(rr,C.stat,{f:`IF(${fc(C.pres)}="Oui","Présent","Absent")`,v:x.stat,s:S.ctr});
  DO.set(rr,C.ret,{v:x.retenu?'Oui':'Non',s:S.ctr});
  DO.set(rr,C.v1,{v:num(x.v1)?x.v1:'',s:S.d2});DO.set(rr,C.v2,{v:num(x.v2)?x.v2:'',s:S.d2});
  DO.set(rr,C.s1,{v:num(x.s1)?x.s1:'',s:S.int});DO.set(rr,C.s2,{v:num(x.s2)?x.s2:'',s:S.int});
  DO.set(rr,C.ll,{v:num(x.ll)?Math.round(x.ll):'',s:S.int});
  DO.set(rr,C.rem,{v:x.rem||'',s:S.txt})});
 const rngCF=(a,b)=>`${L(a)}2:${L(b)}${last}`;
 DO.cfAdd(`A2:${L(C.rem)}${last}`,`$${L(C.stat)}2="Absent"`,dxG);
 [[C.pal,C.lpal],[C.vma,C.lvma],[C.vit,C.lvit],[C.sau,C.lsau]].forEach(([v,l])=>{
  [['À besoins',dxR],['Fragile',dxJ],['Satisfaisant',dxV]].forEach(([t,d])=>DO.cfAdd(rngCF(v,l),`$${L(l)}2="${t}"`,d))});
 DO.set(last+1,0,{v:"Sexe (en bleu) : non fourni par Pronote dans Mes Apps EPS, saisi dans l'application ; modifiable ici, les niveaux se recalculent. Absent = élève non coché présent. « Retenu » = dernière séance de l'élève (utilisée pour les statistiques).",s:S.note});

 /* ───────── feuille Barèmes ───────── */
 BA.set(0,0,{v:'Barèmes DEPP (groupes de maîtrise officiels)',s:S.title});
 ['Test','Critère','Filles','Garçons'].forEach((h,i)=>BA.set(2,i,{v:h,s:S.hdr}));
 [['Palier','À besoins si ≤',B.F.pal[0],B.M.pal[0]],['Palier','Fragile si ≤',B.F.pal[1],B.M.pal[1]],
  ['Vitesse 50 m (s)','À besoins si ≥',B.F.vit[0],B.M.vit[0]],['Vitesse 50 m (s)','Fragile si ≥ (et < seuil à besoins)',B.F.vit[1],B.M.vit[1]],
  ['Saut sans élan (cm)','À besoins si ≤',B.F.sau[0],B.M.sau[0]],['Saut sans élan (cm)','Fragile si ≤',B.F.sau[1],B.M.sau[1]]].forEach((q,i)=>{
  BA.set(3+i,0,{v:q[0],s:S.txt});BA.set(3+i,1,{v:q[1],s:S.txt});BA.set(3+i,2,{v:q[2],s:S.inp});BA.set(3+i,3,{v:q[3],s:S.inp})});
 BA.set(10,0,{v:'Au-delà du seuil « fragile » (palier, saut) ou en deçà (vitesse) : niveau satisfaisant. VMA (km/h) = 8 + 0,5 × palier. Valeurs en bleu : paramètres modifiables.',s:S.note});

 /* ───────── graphiques ───────── */
 const sy="'Synthèse'!",rr=(c,a,b)=>`${sy}$${L(c)}$${a+1}:$${L(c)}$${b+1}`,cell=(c,a)=>`${sy}$${L(c)}$${a+1}`;
 GR.set(0,0,{v:'Graphiques des résultats par test',s:S.title});
 const clsRows=[partFirst,partFirst+nc-1];
 // répartition globale
 GR.addChart({title:'Répartition globale des niveaux par test (% des élèves évalués)',grouping:'clustered',axisFmt:'0%',min:0,max:1,labels:true,
  catRef:rr(0,bilFirst,bilFirst+3),cats:TESTS.map(t=>t.nm),
  series:LV.map((lv,j)=>({name:['% à besoins','% fragile','% satisfaisant'][j],nameRef:cell(1+j,bilHdr),color:CH[['R','J','V'][j]],valRef:rr(1+j,bilFirst,bilFirst+3),
   vals:TESTS.map((t,k)=>{const ev=allP.filter(x=>num(x[VK[k]]));return ev.length?ev.filter(x=>lab(x[LK[k]])===lv).length/ev.length:0}),fmt:'0.0%',labelFmt:'0%'}))},[0,2,8,20]);
 // absentéisme par classe (+ total)
 GR.addChart({title:"Taux d'absentéisme par classe",grouping:'clustered',axisFmt:'0%',min:0,labels:true,legend:false,
  catRef:rr(0,partFirst,partTot),cats:[...classes,'Total'],
  series:[{name:"Taux d'absentéisme",nameRef:cell(4,partHdr),color:CH.A,valRef:rr(4,partFirst,partTot),
   vals:[...classes.map(c=>{const a=subset(c);return a.length?(a.length-pres(a).length)/a.length:0}),allA.length?(allA.length-allP.length)/allA.length:0],fmt:'0.0%',labelFmt:'0%'}]},[9,2,17,20]);
 blocks.forEach((b,i)=>{
  const a=22+i*19,t=b.t,k=b.k,f=b.first,l=b.tot-1;
  const per=c=>classes.map(cl=>subset(cl));
  const cnt=(cl,fn)=>{const p=pres(subset(cl));return fn(p)};
  const colVals=(col)=>classes.map(cl=>{const p=pres(subset(cl)),ev=p.filter(x=>num(x[VK[k]])),all=subset(cl);
   return col===3?ev.filter(x=>lab(x[LK[k]])==='À besoins').length:col===4?ev.filter(x=>lab(x[LK[k]])==='Fragile').length:col===5?ev.filter(x=>lab(x[LK[k]])==='Satisfaisant').length:col===6?p.length-ev.length:all.length-p.length});
  GR.addChart({title:`${t.nm} – niveaux, présents non testés et absents (% de l'effectif)`,grouping:'percentStacked',axisFmt:'0%',labels:true,
   catRef:rr(0,f,l),cats:classes,
   series:[[3,'R'],[4,'J'],[5,'V'],[6,'NT'],[7,'A']].map(([c,kk])=>({name:['À besoins (n)','Fragile (n)','Satisfaisant (n)','Présents non testés','Absents (n)'][c-3],nameRef:cell(c,b.hdrR),color:CH[kk],valRef:rr(c,f,l),vals:colVals(c),fmt:'0'}))},[0,a,9,a+18]);
  GR.addChart({title:`${t.nm} – moyenne par classe${k===2?' (plus bas = mieux)':''}`,grouping:'clustered',axisFmt:t.fmt==='0'?'0':'0.0',labels:true,legend:false,
   catRef:rr(0,f,l),cats:classes,
   series:[{name:'Moyenne',nameRef:cell(12,b.hdrR),color:CH.N,valRef:rr(12,f,l),
    vals:classes.map(cl=>{const v=pres(subset(cl)).map(x=>x[VK[k]]).filter(num);return v.length?v.reduce((x,y)=>x+y,0)/v.length:''}),fmt:t.fmt==='0.00'?'0.00':'0.0',labelFmt:t.fmt==='0.00'?'0.00':t.fmt==='0'?'0':'0.0'}]},[10,a,17,a+18]);
 });
 return X.build()}
const VK=['pal','vma','vit','sau'],LK=['lpal','lpal','lvit','lsau'];
window.XS={build};
})();
