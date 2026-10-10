import {esc} from './ui.js';
import {FILAS,posiciones} from './odonto.js';

// Cada diente: ps/rec/bop con 6 sitios [V-distal, V-central, V-mesial, P-distal, P-central, P-mesial]
// mov: movilidad 0-3 · fur: furca 0-3
const SITIOS=['Vd','Vc','Vm','Pd','Pc','Pm'];
const num=(v,max)=>{if(v===''||v===null||v===undefined)return null;const n=Math.round(Number(v));return Number.isFinite(n)?Math.max(0,Math.min(max,n)):null};
const seis=(a,f)=>Array.from({length:6},(_,i)=>f(Array.isArray(a)?a[i]:null));
export const vacio=()=>({ps:Array(6).fill(null),rec:Array(6).fill(null),bop:Array(6).fill(0),mov:0,fur:0});
const tieneDatos=t=>t.ps.some(v=>v!==null)||t.rec.some(v=>v!==null)||t.bop.some(Boolean)||t.mov>0||t.fur>0;
export const norm=d=>{
  const o={teeth:{}};
  if(d&&typeof d==='object'&&d.teeth)for(const[id,t]of Object.entries(d.teeth)){
    if(!/^\d\d$/.test(id)||!t)continue;
    const n={ps:seis(t.ps,v=>num(v,15)),rec:seis(t.rec,v=>num(v,15)),bop:seis(t.bop,v=>v?1:0),mov:num(t.mov,3)||0,fur:num(t.fur,3)||0};
    if(tieneDatos(n))o.teeth[id]=n;
  }
  return o;
};
export const ORDEN=[...FILAS.perm_sup.izq,...FILAS.perm_sup.der,...FILAS.perm_inf.izq,...FILAS.perm_inf.der];
// Orden visual de los 3 sitios de un lado: la mesial siempre queda hacia la línea media
export function ordenLado(id){
  const izq=[1,4].includes(Math.floor(+id/10));
  return izq?[0,1,2]:[2,1,0]; // índices relativos a distal(0), central(1), mesial(2)
}
export function resumen(d,ausentes=()=>false){
  let sitios=0,suma=0,bop=0,p4=0,mov=0,fur=0,dientes=0;
  for(const[id,t]of Object.entries(d.teeth)){
    if(ausentes(id))continue;
    dientes++;
    t.ps.forEach((v,i)=>{if(v!==null){sitios++;suma+=v;if(v>=4)p4++;if(t.bop[i])bop++}});
    if(t.mov>0)mov++;if(t.fur>0)fur++;
  }
  return {dientes,sitios,prom:sitios?suma/sitios:0,bop:sitios?Math.round(bop/sitios*100):0,sitiosBop:bop,p4,mov,fur};
}
export const resumenTxt=r=>r.sitios?`Sitios medidos: ${r.sitios} · Profundidad promedio: ${r.prom.toFixed(1)} mm · Sitios ≥ 4 mm: ${r.p4} · Sangrado al sondaje: ${r.bop} %${r.mov?` · Dientes con movilidad: ${r.mov}`:''}${r.fur?` · Con furca: ${r.fur}`:''}`:'';

const col=v=>v>=6?'#c2410c':v>=4?'#e0a300':'#1f8a5b';
const BW=12,TW=46,BH=62,SC=5;
function banda(d,ids,lado,ausentes,y0,out){
  // lado: 0 = vestibular, 3 = palatino/lingual
  ids.forEach(({id,x})=>{
    const t=d.teeth[id],ord=ordenLado(id),dim=ausentes(id);
    out.push(`<g opacity="${dim?.3:1}">`);
    ord.forEach((si,k)=>{
      const v=t?t.ps[lado+si]:null,bx=x+3+k*(BW+1);
      if(v!==null&&v>0){
        const h=Math.min(v,12)*SC;
        out.push(`<rect x="${bx}" y="${y0+BH-h}" width="${BW}" height="${h}" rx="2" fill="${col(v)}"/><text x="${bx+BW/2}" y="${y0+BH-h-2}" font-size="8" text-anchor="middle" fill="#40555a">${v}</text>`);
      }else out.push(`<rect x="${bx}" y="${y0+BH-2}" width="${BW}" height="2" fill="#dfe7e6"/>`);
      if(t&&t.bop[lado+si])out.push(`<circle cx="${bx+BW/2}" cy="${y0+BH+6}" r="3" fill="#d9322b"/>`);
    });
    out.push('</g>');
  });
}
export function dibujoPerio(d,{ausentes=()=>false,inter=false}={}){
  const W=16*TW+14,out=[];let y=14;
  const arcadas=[['Arcada superior',FILAS.perm_sup,'Vestibular','Palatino'],['Arcada inferior',FILAS.perm_inf,'Lingual','Vestibular']];
  arcadas.forEach(([nombre,F,l1,l2],ai)=>{
    const ids=[...F.izq.map((id,i)=>({id,x:i*TW})),...F.der.map((id,i)=>({id,x:8*TW+14+i*TW}))];
    out.push(`<text x="0" y="${y}" font-size="11" font-weight="700" fill="#15282b">${nombre}</text>`);y+=6;const ay0=y;
    // Para la arcada inferior la cara lingual va arriba (igual que el odontodiagrama)
    const arriba=ai===0?0:3,abajo=ai===0?3:0;
    out.push(`<text x="0" y="${y+10}" font-size="8" fill="#6b7b7e">${l1.toUpperCase()}</text>`);
    banda(d,ids,arriba,ausentes,y+12,out);y+=12+BH+14;
    ids.forEach(({id,x})=>out.push(`<text x="${x+TW/2}" y="${y+4}" text-anchor="middle" font-size="11" font-weight="600" fill="#40555a">${id}</text>`));
    y+=10;
    out.push(`<text x="0" y="${y+8}" font-size="8" fill="#6b7b7e">${l2.toUpperCase()}</text>`);
    banda(d,ids,abajo,ausentes,y+10,out);y+=10+BH+14;
    if(inter)ids.forEach(({id,x})=>out.push(`<rect x="${x}" y="${ay0}" width="${TW}" height="${y-ay0}" fill="transparent" class="pc" data-t="${id}"/>`));
    y+=16;
  });
  out.push(`<line x1="${8*TW+7}" x2="${8*TW+7}" y1="14" y2="${y-10}" stroke="#cfdad9" stroke-dasharray="3 3"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${y}" width="${W}" height="${y}" font-family="Segoe UI,Helvetica,Arial,sans-serif" class="pd-svg">${out.join('')}</svg>`;
}

export function periodontograma(el,inicial,opt={}){
  let d=norm(inicial),pila=[];
  const aus=id=>opt.ausentes?opt.ausentes(id):false;
  el.innerHTML=`<div class="od pd"><div class="od-top"><div class="od-hint">Toca un diente para anotar profundidad de sondaje, recesión, sangrado, movilidad y furca.</div><div class="od-acts"><button type="button" class="btn ghost sm" data-a="undo">↩ Deshacer</button><button type="button" class="btn ghost sm" data-a="clear">Limpiar todo</button></div></div><div class="od-wrap"></div><div class="od-sum"></div><div class="pd-leg"><i style="background:#1f8a5b"></i>1-3 mm <i style="background:#e0a300"></i>4-5 mm <i style="background:#c2410c"></i>6 mm o más <i class="dot"></i>Sangrado</div></div>`;
  const q=s=>el.querySelector(s);
  const cambio=()=>opt.onChange&&opt.onChange(d);
  const pintar=()=>{
    q('.od-wrap').innerHTML=dibujoPerio(d,{ausentes:aus,inter:true});
    q('[data-a=undo]').disabled=!pila.length;
    const t=resumenTxt(resumen(d,aus));q('.od-sum').innerHTML=t?`<b>Resumen:</b> ${esc(t)}`:'<span class="mut">Sin mediciones todavía.</span>';
  };
  const snap=()=>{pila.push(JSON.stringify(d));if(pila.length>60)pila.shift()};
  q('.od-wrap').onclick=e=>{const n=e.target.closest('[data-t]');if(n)editar(n.dataset.t)};
  q('.od-acts').onclick=e=>{
    const b=e.target.closest('[data-a]');if(!b)return;
    if(b.dataset.a==='undo'&&pila.length){d=norm(JSON.parse(pila.pop()));cambio();pintar()}
    if(b.dataset.a==='clear'&&Object.keys(d.teeth).length&&confirm('¿Limpiar todo el periodontograma?')){snap();d={teeth:{}};cambio();pintar()}
  };
  function editar(id){
    const P=posiciones(id),ord=ordenLado(id);
    const t=JSON.parse(JSON.stringify(d.teeth[id]||vacio()));
    const nm=['Distal','Central','Mesial'];
    const ov=document.createElement('div');ov.className='ov';
    const fila=(titulo,off)=>`<div class="pd-row"><b>${titulo}</b><div class="pd-cells">${ord.map(si=>{const i=off+si;return `<div class="pd-c"><small>${nm[si]}</small><label>Sondaje (mm)<input type="number" inputmode="numeric" min="0" max="15" step="1" data-k="ps" data-i="${i}" value="${t.ps[i]??''}"></label><label>Recesión (mm)<input type="number" inputmode="numeric" min="0" max="15" step="1" data-k="rec" data-i="${i}" value="${t.rec[i]??''}"></label><button type="button" class="chip ${t.bop[i]?'on bad':''}" data-bop="${i}">Sangra</button><span class="nic" data-n="${i}"></span></div>`}).join('')}</div></div>`;
    const sup=[1,2,5,6].includes(Math.floor(+id/10));
    const pos=ORDEN.indexOf(+id);
    ov.innerHTML=`<form class="modal pd-sheet"><div class="sh-h"><h3>Diente ${id}${aus(id)?' <small class="mut">(ausente)</small>':''}</h3><div class="row"><button type="button" class="btn ghost sm" data-go="-1" ${pos<=0?'disabled':''}>← Anterior</button><button type="button" class="btn ghost sm" data-go="1" ${pos>=ORDEN.length-1?'disabled':''}>Siguiente →</button></div></div>
    ${fila(sup?'Vestibular':'Lingual',sup?0:3)}${fila(sup?'Palatino':'Vestibular',sup?3:0)}
    <div class="grid"><label>Movilidad<select data-k="mov">${[0,1,2,3].map(n=>`<option value="${n}" ${t.mov===n?'selected':''}>${n===0?'0 · Sin movilidad':n}</option>`).join('')}</select></label><label>Furca<select data-k="fur">${[0,1,2,3].map(n=>`<option value="${n}" ${t.fur===n?'selected':''}>${n===0?'0 · Sin lesión':n}</option>`).join('')}</select></label></div>
    <div class="pd-hint mut">Nivel de inserción = sondaje + recesión.</div>
    <div class="row end"><button type="button" class="btn ghost" data-clear>Limpiar diente</button><button type="button" class="btn ghost" data-x>Cancelar</button><button class="btn">Guardar</button></div></form>`;
    document.body.append(ov);
    const nic=()=>ov.querySelectorAll('[data-n]').forEach(s=>{const i=+s.dataset.n;s.textContent=t.ps[i]!==null?`Inserción: ${t.ps[i]+(t.rec[i]||0)} mm`:''});
    nic();
    const leer=()=>{ov.querySelectorAll('input[data-k]').forEach(i=>{t[i.dataset.k][+i.dataset.i]=num(i.value,15)});t.mov=num(ov.querySelector('[data-k=mov]').value,3)||0;t.fur=num(ov.querySelector('[data-k=fur]').value,3)||0};
    ov.addEventListener('input',e=>{if(e.target.matches('input[data-k]')){leer();nic()}});
    const guardar=()=>{leer();snap();if(tieneDatos(t))d.teeth[id]=t;else delete d.teeth[id];cambio();pintar()};
    ov.onclick=e=>{
      const b=e.target.closest('[data-bop]');if(b){const i=+b.dataset.bop;t.bop[i]=t.bop[i]?0:1;b.classList.toggle('on',!!t.bop[i]);b.classList.toggle('bad',!!t.bop[i]);return}
      if(e.target===ov||e.target.closest('[data-x]')){ov.remove();return}
      if(e.target.closest('[data-clear]')){snap();delete d.teeth[id];cambio();pintar();ov.remove();return}
      const g=e.target.closest('[data-go]');if(g){guardar();ov.remove();const n=ORDEN[pos+ +g.dataset.go];if(n)editar(String(n))}
    };
    ov.querySelector('form').onsubmit=e=>{e.preventDefault();guardar();ov.remove()};
  }
  pintar();
  return {get:()=>d,set:x=>{d=norm(x);pila=[];pintar()},refrescar:pintar};
}
