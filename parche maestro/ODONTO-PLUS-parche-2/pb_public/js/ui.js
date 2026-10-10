export const $=(s,r=document)=>r.querySelector(s);
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const today=()=>new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
export const fd=s=>s?s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4):'';
export const fdt=s=>s?fd(s)+' '+s.slice(11,16):'';
export const money=(n,c='USD')=>({USD:'$ ',VES:'Bs ',COP:'COP $ '}[c]||'')+Number(n||0).toLocaleString('es-VE',{minimumFractionDigits:2,maximumFractionDigits:2});
export const edad=s=>{if(!s)return'';const[y,m,d]=s.slice(0,10).split('-').map(Number),n=new Date();let a=n.getFullYear()-y;if(n.getMonth()+1<m||(n.getMonth()+1===m&&n.getDate()<d))a--;return a>=0?a+' años':''};
export const edadNum=s=>{const a=edad(s);return a?parseInt(a,10):null};
export const emailOk=s=>/^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]+$/.test(String(s||'').trim());
export const badge=(t,c='')=>({h:`<span class="badge ${c}">${esc(t)}</span>`});
export function toast(m,err){const t=document.createElement('div');t.className='toast'+(err?' err':'');t.textContent=m;document.body.append(t);setTimeout(()=>t.remove(),3200)}
function field(f,v){
  v=v??'';let i;
  if(f.t==='bool')return `<label class="chk ${f.full===false?'':'full'}"><input type="checkbox" name="${f.k}" ${v===true||v==='true'||v==='on'?'checked':''}><span>${f.l}</span></label>`;
  if(f.t==='textarea')i=`<textarea name="${f.k}" rows="3">${esc(v)}</textarea>`;
  else if(f.t==='select')i=`<select name="${f.k}">${f.blank?'<option value=""></option>':''}${f.o.map(o=>`<option ${o===v?'selected':''}>${esc(o)}</option>`).join('')}</select>`;
  else if(f.t==='rel')i=`<select name="${f.k}" required>${f.o.map(([id,n])=>`<option value="${id}" ${id===v?'selected':''}>${esc(n)}</option>`).join('')}</select>`;
  else{
    const ty={datetime:'datetime-local',date:'date',number:'number',file:'file',email:'email',tel:'tel'}[f.t]||'text';
    if(f.t==='datetime')v=String(v).slice(0,16).replace(' ','T');
    if(f.t==='date')v=String(v).slice(0,10);
    i=`<input type="${ty}" name="${f.k}" ${ty==='file'?'':`value="${esc(v)}"`} ${f.t==='number'?`step="${f.step||'0.01'}" min="0"`:''} ${f.ph?`placeholder="${esc(f.ph)}"`:''} ${f.t==='email'?'autocapitalize="off" autocomplete="off"':''} ${f.t==='tel'?'inputmode="tel"':''} ${f.r?'required':''}>`;
  }
  return `<label>${f.l}${i}${f.h?`<small class="hint">${esc(f.h)}</small>`:''}</label>`;
}
export function info(title,rows){const d=document.createElement('div');d.className='ov';d.innerHTML=`<div class="modal"><h3>${esc(title)}</h3><dl class="dl">${rows.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl><div class="row end"><button class="btn">Cerrar</button></div></div>`;document.body.append(d);d.onclick=e=>{if(e.target===d||e.target.closest('.btn'))d.remove()}}
export function modal(title,fields,vals,onSave,onInit){
  const d=document.createElement('div');d.className='ov';
  d.innerHTML=`<form class="modal"><h3>${esc(title)}</h3><div class="grid">${fields.map(f=>field(f,vals[f.k])).join('')}</div><div class="row end"><button type="button" class="btn ghost" data-x>Cancelar</button><button class="btn">Guardar</button></div></form>`;
  document.body.append(d);
  onInit&&onInit(d.querySelector('form'));
  d.querySelector('[data-x]').onclick=()=>d.remove();
  d.querySelector('form').onsubmit=async e=>{
    e.preventDefault();const b=e.submitter;b.disabled=true;
    try{
      const fm=new FormData(e.target),o={};
      for(const f of fields){
        let v=fm.get(f.k);
        if(f.t==='bool'){o[f.k]=v!==null;continue}
        if(f.t==='file'&&(!v||!v.size))continue;
        if(f.t==='number')v=Number(v||0);
        if(f.t==='datetime'&&v)v=v.replace('T',' ')+':00';
        o[f.k]=v;
      }
      await onSave(o);d.remove();
    }catch(x){toast(x.message,1);b.disabled=false}
  };
}

export async function comprimir(f){
  try{const b=await createImageBitmap(f,{imageOrientation:'from-image'}),k=Math.min(1,1600/Math.max(b.width,b.height)),c=document.createElement('canvas');
    c.width=Math.round(b.width*k);c.height=Math.round(b.height*k);c.getContext('2d').drawImage(b,0,0,c.width,c.height);
    const o=await new Promise(r=>c.toBlob(r,'image/jpeg',0.8));
    return o&&o.size<f.size?new File([o],f.name.replace(/\.\w+$/,'')+'.jpg',{type:'image/jpeg'}):f}catch(e){return f}}
