import {list,save} from './api.js';
import {esc,money,fd,fdt,today,badge} from './ui.js';
import {crud} from './crud.js';
import {usd,loadRates,monedaFields,tasaForm,conMoneda,detalle} from './tasas.js';
const EC={Programada:'blue',Confirmada:'green',Atendida:'',Cancelada:'red'};
const balCards=rows=>{const t=k=>rows.filter(r=>r.tipo===k).reduce((s,r)=>s+usd(r),0),i=t('Ingreso'),e=t('Egreso');return `<div class="card"><small>Ingresos (USD)</small><b class="pos">${money(i)}</b></div><div class="card"><small>Egresos (USD)</small><b class="neg">${money(e)}</b></div><div class="card"><small>Balance (USD)</small><b class="${i-e<0?'neg':'pos'}">${money(i-e)}</b></div>`};
const pacOpts=async()=>(await list('pacientes',{sort:'nombre'})).map(p=>[p.id,p.nombre]);

export async function inicio(el){
  const t=today(),m=t.slice(0,7);
  const [ps,hoy,low,mv]=await Promise.all([list('pacientes'),list('citas',{filter:`fecha~"${t}"&&estado!="Cancelada"`,sort:'fecha',expand:'paciente'}),list('inventario',{filter:'cantidad<=minimo'}),list('movimientos',{filter:`fecha~"${m}"`})]);
  el.innerHTML=`<div class="sum"><div class="card"><small>Pacientes registrados</small><b>${ps.length}</b></div><div class="card"><small>Citas de hoy</small><b>${hoy.length}</b></div><div class="card"><small>Insumos por reponer</small><b class="${low.length?'neg':'pos'}">${low.length}</b></div></div>
  <div class="two"><div class="card"><h3>Agenda de hoy</h3><ul>${hoy.map(c=>`<li>${fdt(c.fecha).slice(11)} · ${esc(c.expand?.paciente?.nombre||'')} <small>${esc(c.motivo||'')}</small></li>`).join('')||'<li>No hay citas para hoy.</li>'}</ul></div>
  <div class="card"><h3>Insumos por reponer</h3><ul>${low.map(i=>`<li>${esc(i.nombre)} <span class="badge red">${i.cantidad} ${esc(i.unidad||'')}</span></li>`).join('')||'<li>Todo el inventario está sobre el mínimo.</li>'}</ul></div></div>
  <h3 style="margin:22px 0 10px">Balance del mes</h3><div class="sum">${balCards(mv)}</div>`;
}
export const citas=el=>crud(el,{col:'citas',sort:'fecha',expand:'paciente',add:'Cita',defaults:{estado:'Programada'},
  flt:{'Próximas':`fecha>="${today()}"`,'Todas':''},
  fields:async()=>[{k:'paciente',l:'Paciente',t:'rel',o:await pacOpts()},{k:'fecha',l:'Fecha y hora',t:'datetime',r:1},{k:'motivo',l:'Motivo'},{k:'estado',l:'Estado',t:'select',o:Object.keys(EC)}],
  cols:[['Fecha y hora',r=>fdt(r.fecha)],['Paciente',r=>r.expand?.paciente?.nombre||''],['Motivo',r=>r.motivo],['Estado',r=>badge(r.estado,EC[r.estado])]],
  acts:[['✔️',r=>save('citas',r.id,{estado:'Atendida'}),'Marcar como atendida']]});
const CATI=['Odontológico','Limpieza y mantenimiento','Papelería','Generales'];
export const inventario=el=>crud(el,{col:'inventario',sort:'nombre',add:'Insumo',defaults:{categoria:CATI[0],cantidad:0,minimo:1},
  flt:{'Todos':'',...Object.fromEntries(CATI.map(c=>[c,`categoria="${c}"`]))},
  fields:[{k:'nombre',l:'Insumo',r:1},{k:'categoria',l:'Categoría',t:'select',o:CATI},{k:'cantidad',l:'Cantidad',t:'number',r:1},{k:'minimo',l:'Mínimo antes de reponer',t:'number'},{k:'unidad',l:'Unidad (cajas, rollos…)'},{k:'notas',l:'Notas',t:'textarea'}],
  cols:[['Insumo',r=>r.nombre],['Categoría',r=>r.categoria],['Existencia',r=>`${r.cantidad} ${r.unidad||''}`],['Mínimo',r=>r.minimo],['Estado',r=>r.cantidad<=r.minimo?badge('Reponer','red'):badge('Suficiente','green')]],
  cls:r=>r.cantidad<=r.minimo?'low':'',
  acts:[['➖',r=>save('inventario',r.id,{cantidad:Math.max(0,r.cantidad-1)}),'Restar 1'],['➕',r=>save('inventario',r.id,{cantidad:r.cantidad+1}),'Sumar 1']]});
export const CATF=['Consultas y tratamientos','Otros ingresos','Alquiler','Agua','Luz','Condominio','Bomberos','Desechos biológicos','Estacionamiento','Insumos','Otros gastos'];
export const finanzas=el=>crud(el,{col:'movimientos',sort:'-fecha,-created',add:'Movimiento',month:true,defaults:{tipo:'Egreso',categoria:'Alquiler',moneda:'USD',tasa:1,fecha:today()},
  flt:{'Todos':'','Ingresos':'tipo="Ingreso"','Egresos':'tipo="Egreso"'},
  fields:async()=>{await loadRates();return[{k:'tipo',l:'Tipo',t:'select',o:['Ingreso','Egreso']},{k:'categoria',l:'Categoría',t:'select',o:CATF},{k:'concepto',l:'Concepto'},...monedaFields,{k:'fecha',l:'Fecha',t:'date',r:1}]},
  onForm:tasaForm,beforeSave:conMoneda,
  cols:[['Fecha',r=>fd(r.fecha)],['Tipo',r=>badge(r.tipo,r.tipo==='Ingreso'?'green':'red')],['Categoría',r=>r.categoria],['Concepto',r=>r.concepto],['Monto (USD)',r=>money(usd(r))]],
  open:r=>detalle('Detalle del movimiento',r,[['Tipo',r.tipo],['Categoría',r.categoria],['Concepto',r.concepto||'—'],['Fecha',fd(r.fecha)],['Registrado',fdt(r.created)]]),
  summary:balCards});
