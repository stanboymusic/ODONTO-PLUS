import {esc} from './ui.js';

// ---------- Datos ----------
const rng=(a,b)=>Array.from({length:Math.abs(b-a)+1},(_,i)=>a<=b?a+i:a-i);
export const FILAS={
  perm_sup:{izq:rng(18,11),der:rng(21,28),cols:8,temp:false},
  temp_sup:{izq:rng(55,51),der:rng(61,65),cols:5,temp:true},
  temp_inf:{izq:rng(85,81),der:rng(71,75),cols:5,temp:true},
  perm_inf:{izq:rng(48,41),der:rng(31,38),cols:8,temp:false}};
export const SUPERFICIES={car:{n:'Caries',c:'#d9322b'},obt:{n:'Obturación',c:'#2563eb'},sel:{n:'Sellante',c:'#16a34a'},fra:{n:'Fractura',c:'#f59e0b'}};
export const DIENTE={end:{n:'Endodoncia',c:'#7c3aed'},cor:{n:'Corona',c:'#c9a45c'},imp:{n:'Implante',c:'#0e7490'},ort:{n:'Brackets',c:'#db2777'},ext:{n:'Extracción indicada',c:'#c2410c'},aus:{n:'Ausente',c:'#64748b'}};
const NOMBRE_SUP={V:'Vestibular',M:'Mesial',D:'Distal',O:'Oclusal / incisal'};

export const norm=d=>{
  const o={teeth:{}};
  if(d&&typeof d==='object'&&d.teeth&&typeof d.teeth==='object')for(const[id,t]of Object.entries(d.teeth)){
    if(!/^\d\d$/.test(id)||!t)continue;
    const s={};for(const[k,v]of Object.entries(t.s||{}))if(['V','P','M','D','O'].includes(k)&&SUPERFICIES[v])s[k]=v;
    const f=(Array.isArray(t.f)?t.f:[]).filter((x,i,a)=>DIENTE[x]&&a.indexOf(x)===i);
    if(Object.keys(s).length||f.length)o.teeth[id]={s,f};
  }
  return o;
};
export const esTemporal=id=>+id>=51;
export const ausente=(d,id)=>!!(d.teeth[id]&&d.teeth[id].f.includes('aus'));
export const hayTemporales=d=>Object.keys(d.teeth).some(esTemporal);

// Posición de cada superficie según el cuadrante (como en el papel: lado derecho del paciente a la izquierda)
export function posiciones(id){
  const q=Math.floor(+id/10),sup=[1,2,5,6].includes(q),izq=[1,4,5,8].includes(q);
  return {top:sup?'V':'P',bottom:sup?'P':'V',[izq?'right':'left']:'M',[izq?'left':'right']:'D',center:'O',
    nombreP:sup?'Palatina':'Lingual'};
}
export function aplicar(d,id,sup,tool){
  const t=d.teeth[id]||(d.teeth[id]={s:{},f:[]});
  if(tool==='borrar'){delete d.teeth[id];return}
  if(SUPERFICIES[tool]){
    if(!sup){if(!Object.keys(t.s).length&&!t.f.length)delete d.teeth[id];return}
    if(t.s[sup]===tool)delete t.s[sup];else t.s[sup]=tool;
  }else if(DIENTE[tool]){const i=t.f.indexOf(tool);if(i>=0)t.f.splice(i,1);else t.f.push(tool)}
  if(!Object.keys(t.s).length&&!t.f.length)delete d.teeth[id];
}
export function resumen(d){
  const T=Object.values(d.teeth),c=fn=>T.filter(fn).length,s=k=>t=>Object.values(t.s).includes(k),f=k=>t=>t.f.includes(k);
  return {caries:c(s('car')),obturados:c(s('obt')),sellantes:c(s('sel')),fracturas:c(s('fra')),endodoncias:c(f('end')),coronas:c(f('cor')),implantes:c(f('imp')),brackets:c(f('ort')),extracciones:c(f('ext')),ausentes:c(f('aus'))};
}
export const resumenTxt=r=>[['Caries',r.caries],['Obturados',r.obturados],['Sellantes',r.sellantes],['Fracturas',r.fracturas],['Endodoncias',r.endodoncias],['Coronas',r.coronas],['Implantes',r.implantes],['Con brackets',r.brackets],['Extracciones indicadas',r.extracciones],['Ausentes',r.ausentes]].filter(x=>x[1]>0).map(x=>x.join(': ')).join(' · ');

// ---------- Dibujo ----------
const CW=46,CH=66,GAP=16,RO=17,RI=7.5,LINE='#4b5b5e';
function cuña(cx,cy,r1,r2,a0,a1){
  const p=(r,a)=>[cx+r*Math.cos(a*Math.PI/180),cy+r*Math.sin(a*Math.PI/180)].map(v=>v.toFixed(2)),A=p(r2,a0),B=p(r2,a1),C=p(r1,a1),D=p(r1,a0);
  return `M${A[0]} ${A[1]}A${r2} ${r2} 0 0 1 ${B[0]} ${B[1]}L${C[0]} ${C[1]}A${r1} ${r1} 0 0 0 ${D[0]} ${D[1]}Z`;
}
const ANG={top:[-135,-45],right:[-45,45],bottom:[45,135],left:[135,225]};
const color=(t,k)=>t&&t.s[k]?SUPERFICIES[t.s[k]].c:'#fff';

// Un diente en coordenadas locales de 0..CW x 0..CH. Con inter=true agrega las áreas de toque.
export function dibujoDiente(id,t,inter,numero=true){
  const cx=CW/2,cy=38,P=posiciones(id),f=t?t.f:[],aus=f.includes('aus');
  let g='';
  if(inter)g+=`<rect x="0" y="0" width="${CW}" height="${CH}" fill="transparent" data-t="${id}"/>`;
  if(numero)g+=`<text x="${cx}" y="11" text-anchor="middle" font-size="11" font-weight="600" fill="#40555a">${id}</text>`;
  g+=`<g opacity="${aus?.35:1}">`;
  for(const pos of['top','right','bottom','left']){
    const k=P[pos];
    g+=`<path d="${cuña(cx,cy,RI,RO,...ANG[pos])}" fill="${color(t,k)}" stroke="${LINE}" stroke-width="1" ${inter?`class="sf" data-t="${id}" data-s="${k}"`:''}/>`;
  }
  g+=`<circle cx="${cx}" cy="${cy}" r="${RI}" fill="${color(t,'O')}" stroke="${LINE}" stroke-width="1" ${inter?`class="sf" data-t="${id}" data-s="O"`:''}/>`;
  g+='</g>';
  if(f.includes('cor'))g+=`<circle cx="${cx}" cy="${cy}" r="${RO+3}" fill="none" stroke="${DIENTE.cor.c}" stroke-width="2.6" pointer-events="none"/>`;
  if(aus)g+=`<path d="M${cx-RO} ${cy-RO}L${cx+RO} ${cy+RO}M${cx+RO} ${cy-RO}L${cx-RO} ${cy+RO}" stroke="${DIENTE.aus.c}" stroke-width="2" stroke-linecap="round" pointer-events="none"/>`;
  if(f.includes('ext'))g+=`<path d="M${cx-RO-2} ${cy-RO-2}L${cx+RO+2} ${cy+RO+2}M${cx+RO+2} ${cy-RO-2}L${cx-RO-2} ${cy+RO+2}" stroke="${DIENTE.ext.c}" stroke-width="3" stroke-linecap="round" pointer-events="none"/>`;
  if(f.includes('end'))g+=`<path d="M${cx-14} ${CH-1}L${cx-6} ${CH-1}L${cx-10} ${CH-9}Z" fill="${DIENTE.end.c}" pointer-events="none"/>`;
  if(f.includes('imp'))g+=`<g pointer-events="none"><rect x="${cx+7}" y="${CH-10}" width="6" height="9" rx="1.5" fill="${DIENTE.imp.c}"/><path d="M${cx+7} ${CH-7}h6M${cx+7} ${CH-4}h6" stroke="#fff" stroke-width="1"/></g>`;
  if(f.includes('ort'))g+=`<rect x="${cx-5}" y="14" width="10" height="6" rx="1.5" fill="${DIENTE.ort.c}" pointer-events="none"/>`;
  return g;
}

// Dibujo completo. inter=true → áreas de toque y estilos para pantalla.
export function dibujoOdonto(d,{temporal=false,inter=false}={}){
  const filas=['perm_sup',...(temporal?['temp_sup','temp_inf']:[]),'perm_inf'];
  const W=16*CW+GAP,top=16;let y=top,out='',wires='',sepY=0;
  for(const k of filas){
    const F=FILAS[k],off=(8-F.cols)*CW;
    if(k==='perm_inf'){sepY=y+4;y+=GAP-4}
    const items=[...F.izq.map((id,i)=>({id,x:off+i*CW})),...F.der.map((id,i)=>({id,x:8*CW+GAP+i*CW}))];
    for(const{id,x}of items)out+=`<g transform="translate(${x} ${y})">${dibujoDiente(id,d.teeth[id],inter)}</g>`;
    for(let i=1;i<items.length;i++){
      const a=items[i-1],b=items[i];
      if((d.teeth[a.id]?.f||[]).includes('ort')&&(d.teeth[b.id]?.f||[]).includes('ort')&&b.x-a.x<=CW+GAP)
        wires+=`<line x1="${a.x+CW/2}" x2="${b.x+CW/2}" y1="${y+17}" y2="${y+17}" stroke="${DIENTE.ort.c}" stroke-width="2"/>`;
    }
    y+=CH+4;
  }
  const H=y+2,mx=8*CW+GAP/2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Segoe UI,Helvetica,Arial,sans-serif" class="od-svg">
<text x="2" y="10" font-size="9" fill="#6b7b7e" letter-spacing=".08em">DERECHA</text><text x="${W-2}" y="10" font-size="9" fill="#6b7b7e" text-anchor="end" letter-spacing=".08em">IZQUIERDA</text>
<line x1="${mx}" x2="${mx}" y1="${top}" y2="${H-2}" stroke="#9fb3b6" stroke-width="1"/>
<line x1="0" x2="${W}" y1="${sepY}" y2="${sepY}" stroke="#9fb3b6" stroke-width="1"/>
${wires}${out}</svg>`;
}
export function dibujoGrande(id,t){
  const P=posiciones(id),L={V:'V',P:P.nombreP[0],M:'M',D:'D',O:''},cx=CW/2,cy=38;
  const lab=(x,y,k)=>`<text x="${x}" y="${y}" text-anchor="middle" font-size="6.5" font-weight="700" fill="#6b7b7e" pointer-events="none">${L[k]}</text>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 6 ${CW+16} ${CH}" class="od-big" font-family="Segoe UI,Helvetica,Arial,sans-serif">${dibujoDiente(id,t,true,false)}${lab(cx,15,P.top)}${lab(cx,CH-1,P.bottom)}${lab(cx-RO-5,cy+2.5,P.left)}${lab(cx+RO+5,cy+2.5,P.right)}</svg>`;
}

// ---------- Componente interactivo ----------
export function odontograma(el,inicial,opt={}){
  let d=norm(inicial),tool='car',temporal=!!opt.temporal||hayTemporales(d),pila=[],hoja=null;
  const toolsHtml=()=>`<div class="od-tools">${[...Object.entries(SUPERFICIES),...Object.entries(DIENTE)].map(([k,v])=>`<button type="button" class="tl ${tool===k?'on':''}" data-tool="${k}"><i style="background:${v.c}"></i>${v.n}</button>`).join('')}<button type="button" class="tl ${tool==='borrar'?'on':''}" data-tool="borrar"><i class="er">✕</i>Borrar diente</button></div>`;
  el.innerHTML=`<div class="od"><div class="od-top"><div class="od-hint">Elige una herramienta y toca la parte del diente.</div><div class="od-acts"><button type="button" class="btn ghost sm" data-a="undo">↩ Deshacer</button><button type="button" class="btn ghost sm" data-a="temp"></button><button type="button" class="btn ghost sm" data-a="clear">Limpiar todo</button></div></div><div class="od-tl"></div><div class="od-wrap"></div><div class="od-sum"></div></div>`;
  const q=s=>el.querySelector(s);
  const compacto=()=>q('.od-wrap').clientWidth<640;
  const guardar=()=>{pila.push(JSON.stringify(d));if(pila.length>60)pila.shift()};
  const cambio=()=>{opt.onChange&&opt.onChange(d)};
  const pintar=()=>{
    q('.od-tl').innerHTML=toolsHtml();
    q('.od-wrap').innerHTML=dibujoOdonto(d,{temporal,inter:true});
    q('[data-a=temp]').textContent=temporal?'Ocultar dentición temporal':'Mostrar dentición temporal';
    q('[data-a=undo]').disabled=!pila.length;
    const r=resumen(d);q('.od-sum').innerHTML=resumenTxt(r)?`<b>Resumen:</b> ${esc(resumenTxt(r))}`:'<span class="mut">Sin hallazgos marcados todavía.</span>';
    if(hoja)hoja.pintar();
  };
  const tocar=(id,sup)=>{guardar();aplicar(d,id,sup,tool);cambio();pintar()};
  q('.od-tl').onclick=e=>{const b=e.target.closest('[data-tool]');if(b){tool=b.dataset.tool;pintar()}};
  q('.od-wrap').onclick=e=>{
    const n=e.target.closest('[data-t]');if(!n)return;
    const id=n.dataset.t,sup=n.dataset.s||'';
    if(compacto()||(!sup&&(SUPERFICIES[tool])))abrir(id);else tocar(id,sup);
  };
  q('.od-acts').onclick=e=>{
    const b=e.target.closest('[data-a]');if(!b)return;
    if(b.dataset.a==='undo'&&pila.length){d=norm(JSON.parse(pila.pop()));cambio();pintar()}
    if(b.dataset.a==='temp'){temporal=!temporal;pintar()}
    if(b.dataset.a==='clear'&&Object.keys(d.teeth).length&&confirm('¿Limpiar todo el odontodiagrama? Podrás deshacerlo con «Deshacer» antes de guardar.')){guardar();d={teeth:{}};cambio();pintar()}
  };
  // Hoja de edición de un diente (pantallas pequeñas o toque fuera de una zona)
  function abrir(id){
    const ov=document.createElement('div');ov.className='ov';
    const P=posiciones(id);
    ov.innerHTML=`<div class="modal od-sheet"><div class="sh-h"><h3>Diente ${id}</h3><button type="button" class="btn" data-x>Listo</button></div><div class="od-tl"></div><div class="od-bigw"></div><div class="od-ref"></div><div class="row end"><button type="button" class="btn ghost sm" data-clear>Limpiar este diente</button></div></div>`;
    document.body.append(ov);
    const p=()=>{
      ov.querySelector('.od-tl').innerHTML=toolsHtml();
      ov.querySelector('.od-bigw').innerHTML=dibujoGrande(id,d.teeth[id]);
      ov.querySelector('.od-ref').innerHTML=`V = vestibular · ${P.nombreP[0]} = ${P.nombreP.toLowerCase()} · M = mesial · D = distal · centro = oclusal / incisal`;
    };
    hoja={pintar:p};p();
    ov.onclick=e=>{
      if(e.target===ov||e.target.closest('[data-x]')){hoja=null;ov.remove();pintar();return}
      const b=e.target.closest('[data-tool]');if(b){tool=b.dataset.tool;pintar();return}
      if(e.target.closest('[data-clear]')){guardar();delete d.teeth[id];cambio();pintar();return}
      const s=e.target.closest('[data-s]');if(s)tocar(id,s.dataset.s);
    };
  }
  pintar();
  return {get:()=>d,set:x=>{d=norm(x);pila=[];temporal=temporal||hayTemporales(d);pintar()},resumen:()=>resumen(d)};
}
