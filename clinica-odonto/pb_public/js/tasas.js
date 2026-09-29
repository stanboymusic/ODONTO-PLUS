import {list} from './api.js';
import {money,fd,today,info} from './ui.js';
import {crud} from './crud.js';
export const MON=['USD','VES','COP'];
export const RATES={};
// Tasa vigente por moneda = la más reciente registrada (unidades de moneda por 1 USD)
export async function loadRates(){
  const rs=await list('tasas',{sort:'-fecha,-created'});
  for(const k of Object.keys(RATES))delete RATES[k];
  for(const r of rs)if(!(r.moneda in RATES))RATES[r.moneda]=r.valor;
}
export const usd=r=>r.monto_usd||((r.moneda==='USD'||!r.moneda)?r.monto:0);
export const monedaFields=[{k:'monto',l:'Monto pagado',t:'number',r:1},{k:'moneda',l:'Moneda',t:'select',o:MON},{k:'tasa',l:'Tasa del día (por 1 USD)',t:'number',step:'any'}];
export function tasaForm(f){
  const m=f.elements.moneda,t=f.elements.tasa;let manual=false;
  t.oninput=()=>{manual=true};
  const fill=()=>{if(m.value==='USD'){t.value=1;t.readOnly=true}else{t.readOnly=false;if(!manual||!Number(t.value))t.value=RATES[m.value]||''}};
  m.onchange=()=>{manual=false;fill()};
  if(m.value==='USD'||!Number(t.value))fill();
}
export function conMoneda(d){
  const t=d.moneda==='USD'?1:d.tasa;
  if(!(t>0))throw new Error(`Falta la tasa de ${d.moneda}: escríbela en el formulario o regístrala en la sección Tasas.`);
  return{...d,tasa:t,monto_usd:Math.round(d.monto/t*100)/100};
}
export const detalle=(titulo,r,filas)=>info(titulo,[...filas,['Pagado en',money(r.monto,r.moneda||'USD')],['Moneda',r.moneda||'USD'],['Tasa aplicada',(r.moneda||'USD')==='USD'?'—':`1 USD = ${r.tasa||'sin registrar'} ${r.moneda}`],['Equivalente en USD',money(usd(r))]]);
const fmt=(n,d=4)=>Number(n).toLocaleString('es-VE',{maximumFractionDigits:d});
export const tasas=el=>crud(el,{col:'tasas',sort:'-fecha,-created',add:'Tasa',defaults:{moneda:'VES',fecha:today()},
  fields:[{k:'moneda',l:'Moneda',t:'select',o:['VES','COP']},{k:'valor',l:'Cuántas unidades equivalen a 1 USD',t:'number',step:'any',r:1},{k:'fecha',l:'Fecha',t:'date',r:1}],
  cols:[['Fecha',r=>fd(r.fecha)],['USD → moneda',r=>`1 USD = ${fmt(r.valor)} ${r.moneda}`],['Moneda → USD',r=>`1 ${r.moneda} = ${fmt(1/r.valor,6)} USD`]],
  summary:rows=>['VES','COP'].map(m=>{const r=rows.find(x=>x.moneda===m);return `<div class="card"><small>Tasa vigente ${m}</small>${r?`<b>${fmt(r.valor)}</b><span>1 USD = ${fmt(r.valor)} ${m} · 1 ${m} = ${fmt(1/r.valor,6)} USD</span>`:'<b>—</b><span>Registra la primera tasa con «+ Tasa»</span>'}</div>`}).join('')});
