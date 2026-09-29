export const $=(s,r=document)=>r.querySelector(s);
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const today=()=>new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
export const fd=s=>s?s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4):'';
export const fdt=s=>s?fd(s)+' '+s.slice(11,16):'';
export const money=(n,c='USD')=>({USD:'$ ',EUR:'€ ',VES:'Bs '}[c]||'')+Number(n||0).toLocaleString('es-VE',{minimumFractionDigits:2,maximumFractionDigits:2});
export const badge=(t,c='')=>({h:`<span class="badge ${c}">${esc(t)}</span>`});
export function toast(m,err){const t=document.createElement('div');t.className='toast'+(err?' err':'');t.textContent=m;document.body.append(t);setTimeout(()=>t.remove(),3200)}
function field(f,v){
  v=v??'';let i;
  if(f.t==='textarea')i=`<textarea name="${f.k}" rows="3">${esc(v)}</textarea>`;
  else if(f.t==='select')i=`<select name="${f.k}">${f.o.map(o=>`<option ${o===v?'selected':''}>${esc(o)}</option>`).join('')}</select>`;
  else if(f.t==='rel')i=`<select name="${f.k}" required>${f.o.map(([id,n])=>`<option value="${id}" ${id===v?'selected':''}>${esc(n)}</option>`).join('')}</select>`;
  else{
    const ty={datetime:'datetime-local',date:'date',number:'number',file:'file'}[f.t]||'text';
    if(f.t==='datetime')v=String(v).slice(0,16).replace(' ','T');
    if(f.t==='date')v=String(v).slice(0,10);
    i=`<input type="${ty}" name="${f.k}" ${ty==='file'?'':`value="${esc(v)}"`} ${f.t==='number'?'step="0.01" min="0"':''} ${f.r?'required':''}>`;
  }
  return `<label>${f.l}${i}</label>`;
}
export function modal(title,fields,vals,onSave){
  const d=document.createElement('div');d.className='ov';
  d.innerHTML=`<form class="modal"><h3>${esc(title)}</h3><div class="grid">${fields.map(f=>field(f,vals[f.k])).join('')}</div><div class="row end"><button type="button" class="btn ghost" data-x>Cancelar</button><button class="btn">Guardar</button></div></form>`;
  document.body.append(d);
  d.querySelector('[data-x]').onclick=()=>d.remove();
  d.querySelector('form').onsubmit=async e=>{
    e.preventDefault();const b=e.submitter;b.disabled=true;
    try{
      const fm=new FormData(e.target),o={};
      for(const f of fields){
        let v=fm.get(f.k);
        if(f.t==='file'&&(!v||!v.size))continue;
        if(f.t==='number')v=Number(v||0);
        if(f.t==='datetime'&&v)v=v.replace('T',' ')+':00';
        o[f.k]=v;
      }
      await onSave(o);d.remove();
    }catch(x){toast(x.message,1);b.disabled=false}
  };
}
