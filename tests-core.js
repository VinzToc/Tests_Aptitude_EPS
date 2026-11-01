/* tests-core.js — barèmes DEPP, niveaux, palier Luc Léger, formats.  Sans accès au DOM (testable sous Node). */
(function(){
/* ── Bande son « luc-leger.mp3 » (analysée : bip de départ + signal de fin de chaque palier, en secondes de lecture) ── */
const T0=11.67;                       // 1er bip = départ de la course (palier 1 = 8,5 km/h)
const MARK=[70.59,133.71,193.47,257.82,318.66,377.08,438.71,498.23,554.83,614.71,
            672.77,733.58,792.31,853.91,913.24,974.92,1035.04,1097.98,1158.34,1217.05]; // fin des paliers 1 à 20
const PMAX=21;
/* palier en cours à l'instant ct (secondes de lecture) ; 0 = arrêt avant le départ */
function palierAt(ct){if(!(ct>=T0))return 0;let p=1;for(const m of MARK)if(ct>=m)p++;return Math.min(p,PMAX)}
const vmaOf=p=>8+0.5*p;               // palier 0 = 8 km/h ; +0,5 km/h par palier
const nextMark=ct=>{for(const m of MARK)if(ct<m)return m;return null};

/* ── Barèmes « groupes de maîtrise officiels (DEPP) » (identiques à ceux des PDF de résultats) ── */
const BAR={
 F:{pal:[1,3],vit:[11.0,9.5],sau:[120,150]},
 M:{pal:[3,5],vit:[9.5,8.5],sau:[140,175]}};
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

const TA={T0,MARK,PMAX,palierAt,vmaOf,nextMark,BAR,LAB,CODE,lvPalier,lvVitesse,lvSaut,normSex,fr,frAuto,mmss,sautCm,vitSec,splitSaut,splitVit,num};
if(typeof module!=='undefined'&&module.exports)module.exports=TA;else window.TA=TA;
})();
