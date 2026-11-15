/* tests-core.js — barèmes DEPP, niveaux, palier Luc Léger, formats.  Sans accès au DOM (testable sous Node). */
(function(){
/* ── Bande son « bande-son-luc-leger.mp3 » (25QP61, analysée : bip de départ + début de chaque palier, en secondes de lecture) ──
   La bande démarre à 8,0 km/h (palier 0, ≈ 1 min), puis +0,5 km/h par palier jusqu'à 18,0 km/h (palier 20). */
const T0=34.84;                       // 1er bip = départ de la course (palier 0 = 8,0 km/h)
const MARK=[97.88, 157.27, 213.46, 274.41, 339.33, 394.38, 459.97, 516.51, 576.72, 640.14, 695.72, 759.89, 816.66, 876.49, 939.12, 999.66, 1058.37, 1119.65, 1179.13, 1241.0]; // début des paliers 1 (8,5 km/h) à 20 (18,0 km/h)
const PMAX=20;
/* palier en cours à l'instant ct (secondes de lecture) ; -1 = avant le départ */
function palierAt(ct){if(!(ct>=T0))return -1;let p=0;for(const m of MARK)if(ct>=m)p++;return Math.min(p,PMAX)}
const vmaOf=p=>8+0.5*p;               // palier 0 = 8 km/h ; +0,5 km/h par palier
const nextMark=ct=>{for(const m of MARK)if(ct<m)return m;return null};

/* ── Barèmes « groupes de maîtrise officiels (DEPP) » (identiques à ceux des PDF de résultats) ── */
const BAR={
 F:{pal:[1,3],vit:[11.0,9.5],sau:[120,150]},
 M:{pal:[3,5],vit:[9.5,8.5],sau:[140,175]},
 '6':{pal:[1,3],vit:[6.8,6.0],sau:[110,140]}};   // sixième : mêmes seuils filles / garçons (vitesse sur 30 m)
const NIV={'2':{lab:'Seconde',court:'2de',dist:50},'6':{lab:'Sixième',court:'6e',dist:30}};
/* niveau d'une classe d'après son nom (6e, 6A, 6EME1, 6°2, SIXIEME… → sixième ; sinon seconde) */
const nivAuto=c=>/^\s*(6|sixi)/i.test(String(c||''))?'6':'2';
/* clé de barème : sixième = commun aux deux sexes ; seconde = selon le sexe */
const bkey=(niv,sx)=>niv==='6'?'6':sx;
const LAB={R:'À besoins',J:'Fragile',V:'Satisfaisant'};
const CODE={'À besoins':'R','Fragile':'J','Satisfaisant':'V'};
const num=v=>typeof v==='number'&&isFinite(v);
function lvPalier(p,s,B=BAR){if(!num(p)||!B[s])return null;const b=B[s].pal;return p<=b[0]?'R':p<=b[1]?'J':'V'}
function lvVitesse(t,s,B=BAR){if(!num(t)||!B[s])return null;const b=B[s].vit;return t>=b[0]?'R':t>=b[1]?'J':'V'}   // plus bas = mieux
function lvSaut(cm,s,B=BAR){if(!num(cm)||!B[s])return null;const b=B[s].sau;return cm<=b[0]?'R':cm<=b[1]?'J':'V'}

function normSex(v){v=String(v==null?'':v).trim().toLowerCase();if(!v)return '';
 if(/^(f|fille|feminin|féminin|femme)/.test(v))return 'F';if(/^(m|g|garcon|garçon|masculin|homme)/.test(v))return 'M';return ''}

/* ── formats / saisie ── */
const fr=(v,d=0)=>num(v)?v.toFixed(d).replace('.',','):'';
const frAuto=v=>num(v)?String(Math.round(v*100)/100).replace('.',','):'';
const mmss=s=>{s=Math.max(0,Math.floor(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
/* saut : mètres + centimètres → cm ; vide si les deux sont vides */
function sautCm(m,cm){m=String(m??'').trim();cm=String(cm??'').trim();if(m===''&&cm==='')return null;
 const a=parseInt(m||'0',10),b=parseInt(cm||'0',10);if(isNaN(a)||isNaN(b))return null;return a*100+b}
/* vitesse : secondes + dixièmes (ou centièmes) → s */
function vitSec(s,d){s=String(s??'').trim();d=String(d??'').trim();if(s===''&&d==='')return null;
 const a=parseInt(s||'0',10);if(isNaN(a))return null;let f=0;if(d!==''){if(!/^\d+$/.test(d))return null;f=parseInt(d,10)/Math.pow(10,d.length)}
 const v=a+f;return v>0?Math.round(v*100)/100:null}
/* inverses (pour préremplir les champs) */
const splitSaut=cm=>num(cm)?{m:String(Math.floor(cm/100)),cm:String(Math.round(cm%100)).padStart(2,'0')}:{m:'',cm:''};
const splitVit=t=>{if(!num(t))return{s:'',d:''};const s=Math.floor(t+1e-9);let d=Math.round((t-s)*100);return{s:String(s),d:d%10===0?String(d/10):String(d).padStart(2,'0')}};

const TA={NIV,nivAuto,bkey,T0,MARK,PMAX,palierAt,vmaOf,nextMark,BAR,LAB,CODE,lvPalier,lvVitesse,lvSaut,normSex,fr,frAuto,mmss,sautCm,vitSec,splitSaut,splitVit,num};
if(typeof module!=='undefined'&&module.exports)module.exports=TA;else window.TA=TA;
})();
