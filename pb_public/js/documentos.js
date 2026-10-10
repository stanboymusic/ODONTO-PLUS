import {ftoken,fileUrl} from './api.js';
import {esc,fd,today,badge,toast,comprimir} from './ui.js';
import {crud} from './crud.js';

const CAT=['Permisos y licencias','Título y colegiatura','Seguros','Contratos','Salud y bioseguridad','Impuestos y registros','Otros'];
const dias=v=>v?Math.round((Date.UTC(+v.slice(0,4),+v.slice(5,7)-1,+v.slice(8,10))-Date.UTC(+today().slice(0,4),+today().slice(5,7)-1,+today().slice(8,10)))/864e5):null;
const estado=r=>{const n=dias(r.vencimiento);if(n===null)return badge('Sin vencimiento','');if(n<0)return badge('Vencido','red');if(n<=30)return badge(`Vence en ${n} d`,'red');if(n<=90)return badge(`Vence en ${n} d`,'blue');return badge('Vigente','green')};
const sumar=(f,n)=>{const d=new Date(f+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};

export async function documentos(el){
  const tk=await ftoken(),h=today(),h30=sumar(h,30);
  return crud(el,{col:'documentos',sort:'categoria,titulo',add:'Documento',defaults:{categoria:CAT[0]},
    flt:{'Todos':'','Vencen pronto':`vencimiento!=\"\" && vencimiento<=\"${h30} 23:59:59\"`,...Object.fromEntries(CAT.map(c=>[c,`categoria=\"${c}\"`]))},
    fields:[{k:'titulo',l:'Nombre del documento',r:1},{k:'categoria',l:'Categoría',t:'select',o:CAT},{k:'vencimiento',l:'Fecha de vencimiento (si aplica)',t:'date'},{k:'archivo',l:'Archivo (PDF, imagen o Word)',t:'file'},{k:'nota',l:'Nota',t:'textarea'}],
    beforeSave:async d=>{const a=d.archivo;if(a instanceof File){
      if(a.type.startsWith('image/'))d.archivo=await comprimir(a);
      else if(a.size>20*1048576)throw new Error(`El archivo pesa ${(a.size/1048576).toFixed(1)} MB y el máximo es 20 MB.`)}
      if(!d.vencimiento)d.vencimiento='';return d},
    cols:[['',r=>({h:/\.pdf$/i.test(r.archivo)?'<span style="font-size:28px">📄</span>':/\.docx?$/i.test(r.archivo)?'<span style="font-size:28px">📝</span>':`<img class="th" loading="lazy" src="${fileUrl(r,tk)}&thumb=100x100" onerror="this.replaceWith('🖼️')">`})],['Documento',r=>r.titulo],['Categoría',r=>r.categoria],['Vencimiento',r=>r.vencimiento?fd(r.vencimiento):'—'],['Estado',estado],['Nota',r=>r.nota]],
    summary:rows=>{const v=rows.filter(r=>{const n=dias(r.vencimiento);return n!==null&&n<0}).length,p=rows.filter(r=>{const n=dias(r.vencimiento);return n!==null&&n>=0&&n<=30}).length;
      return `<div class="card"><small>Documentos cargados</small><b>${rows.length}</b></div><div class="card"><small>Vencidos</small><b class="${v?'neg':'pos'}">${v}</b></div><div class="card"><small>Vencen en 30 días</small><b class="${p?'neg':'pos'}">${p}</b></div>`},
    open:async r=>{const w=window.open('','_blank');try{w.location=fileUrl(r,await ftoken())}catch(e){w&&w.close();toast('No se pudo abrir el archivo',1)}}});
}
