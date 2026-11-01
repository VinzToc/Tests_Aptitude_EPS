/* xlsx-writer.js — écriture XLSX autonome : styles, formules (avec valeur en cache), mise en forme conditionnelle, graphiques en barres.
   Utilisé pour l'export « résultats et statistiques ». ZIP « stocké », sans dépendance. */
(function(){
const enc=new TextEncoder();
const crcT=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc32=b=>{let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=crcT[(c^b[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0};
const concat=a=>{const o=new Uint8Array(a.reduce((s,x)=>s+x.length,0));let p=0;for(const x of a){o.set(x,p);p+=x.length}return o};
function zip(files){const parts=[],cen=[];let off=0;const n=new Date();
 const dt=(n.getHours()<<11)|(n.getMinutes()<<5)|(n.getSeconds()>>1),dd=((n.getFullYear()-1980)<<9)|((n.getMonth()+1)<<5)|n.getDate();
 for(const f of files){const nm=enc.encode(f.name),crc=crc32(f.data),sz=f.data.length;
  const l=new DataView(new ArrayBuffer(30));l.setUint32(0,0x04034b50,true);l.setUint16(4,20,true);l.setUint16(6,0x0800,true);l.setUint16(10,dt,true);l.setUint16(12,dd,true);
  l.setUint32(14,crc,true);l.setUint32(18,sz,true);l.setUint32(22,sz,true);l.setUint16(26,nm.length,true);
  parts.push(new Uint8Array(l.buffer),nm,f.data);
  const c=new DataView(new ArrayBuffer(46));c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(12,dt,true);c.setUint16(14,dd,true);
  c.setUint32(16,crc,true);c.setUint32(20,sz,true);c.setUint32(24,sz,true);c.setUint16(28,nm.length,true);c.setUint32(42,off,true);
  cen.push(new Uint8Array(c.buffer),nm);off+=30+nm.length+sz}
 const cs=cen.reduce((s,x)=>s+x.length,0),e=new DataView(new ArrayBuffer(22));
 e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cs,true);e.setUint32(16,off,true);
 return concat([...parts,...cen,new Uint8Array(e.buffer)])}
const xe=v=>String(v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const colL=i=>{let s='';for(i++;i>0;i=Math.floor((i-1)/26))s=String.fromCharCode(65+(i-1)%26)+s;return s};
const ref=(r,c,abs)=>abs?`$${colL(c)}$${r+1}`:colL(c)+(r+1);
const qs=n=>"'"+String(n).replace(/'/g,"''")+"'";
const H='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const NS_M='http://schemas.openxmlformats.org/spreadsheetml/2006/main',NS_R='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const NS_C='http://schemas.openxmlformats.org/drawingml/2006/chart',NS_A='http://schemas.openxmlformats.org/drawingml/2006/main',NS_XDR='http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing';
const RT='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const FONT='Arial';

/* ───────── graphique en barres (colonnes) ───────── */
function chartXml(o){
 const strCache=a=>`<c:strCache><c:ptCount val="${a.length}"/>${a.map((v,i)=>`<c:pt idx="${i}"><c:v>${xe(v)}</c:v></c:pt>`).join('')}</c:strCache>`;
 const numCache=(a,f)=>`<c:numCache><c:formatCode>${xe(f||'General')}</c:formatCode><c:ptCount val="${a.length}"/>${a.map((v,i)=>v==null||v===''?'':`<c:pt idx="${i}"><c:v>${v}</c:v></c:pt>`).join('')}</c:numCache>`;
 const txp=(sz,b)=>`<c:txPr><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="${sz}" b="${b?1:0}"><a:latin typeface="${FONT}"/></a:defRPr></a:pPr><a:endParaRPr lang="fr-FR"/></a:p></c:txPr>`;
 const stacked=o.grouping==='percentStacked'||o.grouping==='stacked';
 const ser=o.series.map((s,i)=>`<c:ser><c:idx val="${i}"/><c:order val="${i}"/>`
  +(s.nameRef?`<c:tx><c:strRef><c:f>${xe(s.nameRef)}</c:f>${strCache([s.name])}</c:strRef></c:tx>`:`<c:tx><c:v>${xe(s.name||'')}</c:v></c:tx>`)
  +`<c:spPr><a:solidFill><a:srgbClr val="${s.color}"/></a:solidFill></c:spPr><c:invertIfNegative val="0"/>`
  +(o.labels?`<c:dLbls>${s.labelFmt?`<c:numFmt formatCode="${xe(s.labelFmt)}" sourceLinked="0"/>`:''}<c:spPr><a:noFill/><a:ln><a:noFill/></a:ln></c:spPr>${txp(800,0)}<c:showLegendKey val="0"/><c:showVal val="1"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="0"/><c:showBubbleSize val="0"/></c:dLbls>`:'')
  +`<c:cat><c:strRef><c:f>${xe(o.catRef)}</c:f>${strCache(o.cats)}</c:strRef></c:cat>`
  +`<c:val><c:numRef><c:f>${xe(s.valRef)}</c:f>${numCache(s.vals,s.fmt)}</c:numRef></c:val></c:ser>`).join('');
 const scaling=`<c:scaling><c:orientation val="minMax"/>${o.max!=null?`<c:max val="${o.max}"/>`:''}${o.min!=null?`<c:min val="${o.min}"/>`:''}</c:scaling>`;
 return H+`<c:chartSpace xmlns:c="${NS_C}" xmlns:a="${NS_A}" xmlns:r="${NS_R}"><c:roundedCorners val="0"/><c:chart>`
 +`<c:title><c:tx><c:rich><a:bodyPr/><a:lstStyle/><a:p><a:pPr><a:defRPr sz="1100" b="1"><a:latin typeface="${FONT}"/></a:defRPr></a:pPr><a:r><a:rPr lang="fr-FR" sz="1100" b="1"><a:latin typeface="${FONT}"/></a:rPr><a:t>${xe(o.title)}</a:t></a:r></a:p></c:rich></c:tx><c:overlay val="0"/></c:title><c:autoTitleDeleted val="0"/>`
 +`<c:plotArea><c:layout/><c:barChart><c:barDir val="col"/><c:grouping val="${o.grouping||'clustered'}"/><c:varyColors val="0"/>${ser}<c:gapWidth val="70"/>${stacked?'<c:overlap val="100"/>':''}<c:axId val="50010"/><c:axId val="50020"/></c:barChart>`
 +`<c:catAx><c:axId val="50010"/><c:scaling><c:orientation val="minMax"/></c:scaling><c:delete val="0"/><c:axPos val="b"/><c:numFmt formatCode="General" sourceLinked="0"/><c:majorTickMark val="out"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>${txp(900,0)}<c:crossAx val="50020"/><c:crosses val="autoZero"/><c:auto val="1"/><c:lblAlgn val="ctr"/><c:lblOffset val="100"/><c:noMultiLvlLbl val="0"/></c:catAx>`
 +`<c:valAx><c:axId val="50020"/>${scaling}<c:delete val="0"/><c:axPos val="l"/><c:majorGridlines><c:spPr><a:ln w="6350"><a:solidFill><a:srgbClr val="D9D9D9"/></a:solidFill></a:ln></c:spPr></c:majorGridlines><c:numFmt formatCode="${xe(o.axisFmt||'General')}" sourceLinked="0"/><c:majorTickMark val="out"/><c:minorTickMark val="none"/><c:tickLblPos val="nextTo"/>${txp(900,0)}<c:crossAx val="50010"/><c:crosses val="autoZero"/><c:crossBetween val="between"/></c:valAx>`
 +`</c:plotArea>`+(o.legend===false?'':`<c:legend><c:legendPos val="b"/><c:overlay val="0"/>${txp(900,0)}</c:legend>`)
 +`<c:plotVisOnly val="1"/><c:dispBlanksAs val="gap"/></c:chart></c:chartSpace>`}

/* ───────── classeur ───────── */
function create(){
 const fonts=[],borders=['<border><left/><right/><top/><bottom/><diagonal/></border>'],numFmts=[],xfs=[],dxfs=[];
 const reg=(arr,key)=>{let i=arr.indexOf(key);if(i<0){arr.push(key);i=arr.length-1}return i};
 const fontXml=o=>`<font>${o.b?'<b/>':''}${o.i?'<i/>':''}<sz val="${o.sz||10}"/><color rgb="FF${o.color||'000000'}"/><name val="${FONT}"/></font>`;
 // registre de styles (clé JSON → index xf)
 const xmap=new Map();
 const st=(o={})=>{const k=JSON.stringify(o);if(xmap.has(k))return xmap.get(k);
  const fo=reg(fonts,fontXml(o));
  let fi=0;if(o.fill){const key='<fill><patternFill patternType="solid"><fgColor rgb="FF'+o.fill+'"/><bgColor indexed="64"/></patternFill></fill>';fi=fillIdx(key)}
  let bo=0;if(o.border){const c=o.border===true?'BFC5D2':o.border;const side=n=>`<${n} style="thin"><color rgb="FF${c}"/></${n}>`;bo=reg(borders,`<border>${side('left')}${side('right')}${side('top')}${side('bottom')}<diagonal/></border>`)}
  let nf=0;if(o.fmt){const bi={'0':1,'0.00':2,'0%':9,'0.00%':10};if(bi[o.fmt]!=null)nf=bi[o.fmt];else{let j=numFmts.indexOf(o.fmt);if(j<0){numFmts.push(o.fmt);j=numFmts.length-1}nf=164+j}}
  const al=(o.h||o.v||o.wrap)?`<alignment${o.h?` horizontal="${o.h}"`:''} vertical="${o.v||'center'}"${o.wrap?' wrapText="1"':''}/>`:'';
  xfs.push(`<xf numFmtId="${nf}" fontId="${fo}" fillId="${fi}" borderId="${bo}" xfId="0" applyFont="1"${fi?' applyFill="1"':''}${bo?' applyBorder="1"':''}${nf?' applyNumberFormat="1"':''}${al?' applyAlignment="1">'+al+'</xf>':'/>'}`);
  const idx=xfs.length;xmap.set(k,idx);return idx};
 const fillKeys=['<fill><patternFill patternType="none"/></fill>','<fill><patternFill patternType="gray125"/></fill>'];
 const fillIdx=k=>{let i=fillKeys.indexOf(k);if(i<0){fillKeys.push(k);i=fillKeys.length-1}return i};
 const dxf=o=>{dxfs.push(`<dxf>${o.color?`<font><color rgb="FF${o.color}"/></font>`:''}${o.fill?`<fill><patternFill patternType="solid"><fgColor rgb="FF${o.fill}"/><bgColor rgb="FF${o.fill}"/></patternFill></fill>`:''}</dxf>`);return dxfs.length-1};
 const sheets=[];
 let chartCount=0;
 function addSheet(name,opt={}){
  const sh={name,opt,cells:new Map(),cf:[],charts:[],rowH:{},maxR:0,maxC:0,
   set(r,c,x){sh.cells.set(r+','+c,x);if(r>sh.maxR)sh.maxR=r;if(c>sh.maxC)sh.maxC=c},
   cfAdd(sqref,formula,dxfId){sh.cf.push({sqref,formula,dxfId})},
   addChart(o,anchor){sh.charts.push({o,anchor})}};
  sheets.push(sh);return sh}
 function cellXml(r,c,x){
  if(x==null)return '';
  if(typeof x!=='object')x={v:x};
  const s=x.s!=null?` s="${x.s}"`:'',rf=ref(r,c);
  const hasV=x.v!==undefined&&x.v!==null&&x.v!=='';
  if(x.f){
   const f=x.arr?`<f t="array" ref="${rf}">${xe(x.f)}</f>`:`<f>${xe(x.f)}</f>`;
   if(typeof x.v==='number'&&isFinite(x.v))return `<c r="${rf}"${s}>${f}<v>${x.v}</v></c>`;
   return `<c r="${rf}"${s} t="str">${f}<v>${hasV?xe(x.v):''}</v></c>`}
  if(!hasV)return `<c r="${rf}"${s}/>`;
  if(typeof x.v==='number'&&isFinite(x.v))return `<c r="${rf}"${s}><v>${x.v}</v></c>`;
  return `<c r="${rf}"${s} t="inlineStr"><is><t xml:space="preserve">${xe(x.v)}</t></is></c>`}
 function build(){
  const files=[],ct=[],wbRels=[],sheetRels=[];
  let drawN=0,chartN=0;const out={};
  sheets.forEach((sh,i)=>{
   const n=i+1;let rows='';
   const byRow=new Map();sh.cells.forEach((x,k)=>{const[r,c]=k.split(',').map(Number);if(!byRow.has(r))byRow.set(r,[]);byRow.get(r).push([c,x])});
   [...byRow.keys()].sort((a,b)=>a-b).forEach(r=>{const cs=byRow.get(r).sort((a,b)=>a[0]-b[0]);
    const ht=sh.rowH[r]?` ht="${sh.rowH[r]}" customHeight="1"`:'';
    rows+=`<row r="${r+1}"${ht}>`+cs.map(([c,x])=>cellXml(r,c,x)).join('')+'</row>'});
   Object.keys(sh.rowH).forEach(r=>{if(!byRow.has(+r)){rows+=`<row r="${+r+1}" ht="${sh.rowH[r]}" customHeight="1"/>`}});
   const o=sh.opt;let pane='';
   if(o.freeze){const[fc,fr]=o.freeze;pane=`<pane${fc?` xSplit="${fc}"`:''}${fr?` ySplit="${fr}"`:''} topLeftCell="${colL(fc)}${fr+1}" activePane="${fc&&fr?'bottomRight':fr?'bottomLeft':'topRight'}" state="frozen"/>`}
   let x=H+`<worksheet xmlns="${NS_M}" xmlns:r="${NS_R}"><dimension ref="A1:${colL(sh.maxC)}${sh.maxR+1}"/><sheetViews><sheetView${i===0?' tabSelected="1"':''}${o.grid===false?' showGridLines="0"':''} workbookViewId="0">${pane}</sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/>`;
   if(o.widths)x+='<cols>'+o.widths.map((w,j)=>`<col min="${j+1}" max="${j+1}" width="${w}" customWidth="1"/>`).join('')+'</cols>';
   x+=`<sheetData>${rows}</sheetData>`;
   if(o.filter)x+=`<autoFilter ref="${o.filter}"/>`;
   sh.cf.forEach((c,j)=>{x+=`<conditionalFormatting sqref="${c.sqref}"><cfRule type="expression" dxfId="${c.dxfId}" priority="${j+1}"><formula>${xe(c.formula)}</formula></cfRule></conditionalFormatting>`});
   x+='<pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/><pageSetup orientation="landscape" fitToHeight="0"/>';
   let rel='';
   if(sh.charts.length){drawN++;const dn=drawN;x+=`<drawing r:id="rId1"/>`;
    let dx=H+`<xdr:wsDr xmlns:xdr="${NS_XDR}" xmlns:a="${NS_A}">`,dr='';
    sh.charts.forEach((ch,j)=>{chartN++;const cn=chartN;files.push({name:`xl/charts/chart${cn}.xml`,x:chartXml(ch.o)});
     ct.push(`<Override PartName="/xl/charts/chart${cn}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>`);
     dr+=`<Relationship Id="rId${j+1}" Type="${RT}/chart" Target="../charts/chart${cn}.xml"/>`;
     const[c1,r1,c2,r2]=ch.anchor;
     dx+=`<xdr:twoCellAnchor><xdr:from><xdr:col>${c1}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${r1}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from><xdr:to><xdr:col>${c2}</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>${r2}</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to><xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="${j+2}" name="Graphique ${cn}"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr><xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm><a:graphic><a:graphicData uri="${NS_C}"><c:chart xmlns:c="${NS_C}" xmlns:r="${NS_R}" r:id="rId${j+1}"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor>`});
    dx+='</xdr:wsDr>';
    files.push({name:`xl/drawings/drawing${dn}.xml`,x:dx});
    files.push({name:`xl/drawings/_rels/drawing${dn}.xml.rels`,x:H+`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${dr}</Relationships>`});
    ct.push(`<Override PartName="/xl/drawings/drawing${dn}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>`);
    rel=`<Relationship Id="rId1" Type="${RT}/drawing" Target="../drawings/drawing${dn}.xml"/>`}
   x+='</worksheet>';
   files.push({name:`xl/worksheets/sheet${n}.xml`,x});
   if(rel)files.push({name:`xl/worksheets/_rels/sheet${n}.xml.rels`,x:H+`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rel}</Relationships>`});
   ct.push(`<Override PartName="/xl/worksheets/sheet${n}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`);
   wbRels.push(`<Relationship Id="rId${n}" Type="${RT}/worksheet" Target="worksheets/sheet${n}.xml"/>`)});
  // styles
  const fontsXml=fonts.length?fonts.join(''):'';
  const styles=H+`<styleSheet xmlns="${NS_M}">`
   +(numFmts.length?`<numFmts count="${numFmts.length}">${numFmts.map((f,j)=>`<numFmt numFmtId="${164+j}" formatCode="${xe(f)}"/>`).join('')}</numFmts>`:'')
   +`<fonts count="${fonts.length+1}"><font><sz val="10"/><name val="${FONT}"/></font>${fontsXml}</fonts>`
   +`<fills count="${fillKeys.length}">${fillKeys.join('')}</fills>`
   +`<borders count="${borders.length}">${borders.join('')}</borders>`
   +`<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>`
   +`<cellXfs count="${xfs.length+1}"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>${xfs.map(s=>s.replace(/fontId="(\d+)"/,(m,a)=>`fontId="${+a+1}"`)).join('')}</cellXfs>`
   +`<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>`
   +(dxfs.length?`<dxfs count="${dxfs.length}">${dxfs.join('')}</dxfs>`:'')+`</styleSheet>`;
  files.push({name:'xl/styles.xml',x:styles});
  files.push({name:'xl/workbook.xml',x:H+`<workbook xmlns="${NS_M}" xmlns:r="${NS_R}"><bookViews><workbookView activeTab="0"/></bookViews><sheets>${sheets.map((s,i)=>`<sheet name="${xe(s.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>`});
  files.push({name:'xl/_rels/workbook.xml.rels',x:H+`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${wbRels.join('')}<Relationship Id="rId${sheets.length+1}" Type="${RT}/styles" Target="styles.xml"/></Relationships>`});
  files.push({name:'_rels/.rels',x:H+`<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${RT}/officeDocument" Target="xl/workbook.xml"/></Relationships>`});
  files.unshift({name:'[Content_Types].xml',x:H+`<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${ct.join('')}</Types>`});
  return zip(files.map(f=>({name:f.name,data:enc.encode(f.x)})))}
 return{style:st,dxf,addSheet,build}}
window.XW={create,colL,ref,qs,xe};
})();
