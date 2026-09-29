import {list,save,del} from './api.js';
import {esc,modal,toast,today} from './ui.js';
// Tabla genérica con buscador, filtros, alta, edición y borrado.
export async function crud(el,o){
  let rows=[],cur=[],q='',fl=o.flt?Object.keys(o.flt)[0]:'',mo=o.month?today().slice(0,7):'';
  el.innerHTML=`<div class="bar"><input class="search" placeholder="Buscar…"><div class="chips"></div>${o.month?`<input type="month" class="mo" value="${mo}">`:''}<button class="btn add">+ ${o.add||'Nuevo'}</button></div><div class="sum"></div><div class="tw"></div>`;
  const $q=s=>el.querySelector(s);
  const chips=()=>{$q('.chips').innerHTML=o.flt?Object.keys(o.flt).map(k=>`<button type="button" class="chip ${k===fl?'on':''}" data-k="${esc(k)}">${esc(k)}</button>`).join(''):''};
  const draw=()=>{
    const t=q.toLowerCase();
    cur=rows.filter(r=>!t||JSON.stringify(o.cols.map(c=>c[1](r))).toLowerCase().includes(t));
    if(o.summary)$q('.sum').innerHTML=o.summary(rows);
    $q('.tw').innerHTML=cur.length?`<table><thead><tr>${o.cols.map(c=>`<th>${c[0]}</th>`).join('')}<th></th></tr></thead><tbody>${cur.map((r,i)=>`<tr class="${o.cls?o.cls(r):''}" ${o.open?`data-o="${i}"`:''}>${o.cols.map(c=>{const x=c[1](r);return `<td>${x&&x.h!==undefined?x.h:esc(x)}</td>`}).join('')}<td class="act">${(o.acts||[]).map((a,j)=>`<button class="ib" data-k="a${j}" data-i="${i}" title="${esc(a[2]||'')}">${a[0]}</button>`).join('')}<button class="ib" data-k="e" data-i="${i}" title="Editar">✏️</button><button class="ib" data-k="d" data-i="${i}" title="Eliminar">🗑️</button></td></tr>`).join('')}</tbody></table>`:'<div class="empty">Aún no hay registros. Usa el botón «+ '+(o.add||'Nuevo')+'» para agregar el primero.</div>';
  };
  const load=async()=>{
    const f=[o.filter,o.flt&&o.flt[fl],mo&&`fecha~"${mo}"`].filter(Boolean).map(x=>`(${x})`).join('&&');
    try{
      rows=await list(o.col,{sort:o.sort||'-created',...(f&&{filter:f}),...(o.expand&&{expand:o.expand})});
      draw();o.after&&o.after(rows);
    }catch(e){toast(e.message,1)}
  };
  const form=async r=>{
    const F=typeof o.fields==='function'?await o.fields():o.fields;
    modal(r?'Editar':(o.add?'Nuevo: '+o.add:'Nuevo'),F,r||o.defaults||{},async d=>{
      await save(o.col,r&&r.id,r?d:{...o.defaults,...d});toast('Guardado');load();
    });
  };
  $q('.add').onclick=()=>form().catch(e=>toast(e.message,1));
  $q('.search').oninput=e=>{q=e.target.value;draw()};
  $q('.chips').onclick=e=>{const b=e.target.closest('.chip');if(b){fl=b.dataset.k;chips();load()}};
  if(o.month)$q('.mo').onchange=e=>{mo=e.target.value;load()};
  $q('.tw').onclick=async e=>{
    const b=e.target.closest('button');
    if(!b){const tr=e.target.closest('tr[data-o]');if(tr&&o.open)o.open(cur[tr.dataset.o]);return}
    const r=cur[b.dataset.i],k=b.dataset.k;
    try{
      if(k==='e')await form(r);
      else if(k==='d'){if(confirm('¿Eliminar este registro? Esta acción no se puede deshacer.')){await del(o.col,r.id);toast('Eliminado');load()}}
      else{await o.acts[+k.slice(1)][1](r);load()}
    }catch(x){toast(x.message,1)}
  };
  chips();await load();
}
