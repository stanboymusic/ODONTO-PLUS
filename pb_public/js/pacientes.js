import {list,one,save,ftoken,fileUrl} from './api.js';
import {esc,money,toast,fd,fdt,today,modal,badge,info,edad,comprimir} from './ui.js';
import {loadRates,monedaFields,tasaForm,conMoneda,usd,detalle as detMoneda} from './tasas.js';
import {crud} from './crud.js';
import {historia,historiaSucia,limpiarSucio} from './historia.js';
import {citasOpts} from './citas.js';
const PF=[{k:'nombre',l:'Nombre completo',r:1},{k:'cedula',l:'Cédula'},{k:'sexo',l:'Sexo',t:'select',o:['Femenino','Masculino'],blank:true},{k:'fecha_nac',l:'Fecha de nacimiento',t:'date'},{k:'ocupacion',l:'Ocupación'},{k:'telefono',l:'Teléfono',t:'tel'},{k:'email',l:'Correo',t:'email'},{k:'direccion',l:'Dirección'},{k:'notas',l:'Notas',t:'textarea'}];
export const pacientes=(el,id)=>id?detalle(el,id):crud(el,{col:'pacientes',sort:'nombre',add:'Paciente',fields:PF,
  cols:[['Paciente',r=>r.nombre],['Cédula',r=>r.cedula],['Teléfono',r=>r.telefono],['Edad',r=>edad(r.fecha_nac)]],
  open:r=>{location.hash='#/pacientes/'+r.id}});

async function detalle(el,id){
  const p=await one('pacientes',id),f=`paciente="${id}"`;
  let T=await list('tratamientos',{filter:f}),P=await list('pagos',{filter:f});
  const TABS=['Historia clínica','Tratamientos','Abonos','Radiografías y fotos','Citas'];
  el.innerHTML=`<a class="back" href="#/pacientes">← Pacientes</a><div class="card ph"><div><h3>${esc(p.nombre)}</h3><p>${[p.cedula&&'C.I. '+p.cedula,p.telefono,edad(p.fecha_nac)].filter(Boolean).map(esc).join(' · ')}</p></div><button class="btn ghost" id="ep">Editar datos</button></div><div class="sum" id="rs"></div><div class="tabs">${TABS.map((t,i)=>`<button class="chip" data-t="${i}">${t}</button>`).join('')}</div><div id="tb"></div>`;
  const rs=()=>{const b=T.reduce((s,t)=>s+t.costo,0),a=P.reduce((s,t)=>s+usd(t),0);
    el.querySelector('#rs').innerHTML=[['Presupuesto',b,''],['Abonado',a,'pos'],['Pendiente por pagar',b-a,b-a>0?'neg':'pos']].map(([l,v,c])=>`<div class="card"><small>${l}</small><b class="${c}">${money(v)}</b></div>`).join('')};
  rs();
  el.querySelector('#ep').onclick=()=>{if(historiaSucia()&&!confirm('Tienes cambios sin guardar en la historia. ¿Continuar sin guardarlos?'))return;limpiarSucio();modal('Editar paciente',PF,p,async d=>{await save('pacientes',id,d);toast('Guardado');detalle(el,id)})};
  const tb=el.querySelector('#tb');
  const tabs=[
    async()=>historia(tb,p,id),
    ()=>crud(tb,{col:'tratamientos',filter:f,sort:'estado,-created',add:'Tratamiento',defaults:{paciente:id,estado:'Por realizar'},
      fields:[{k:'descripcion',l:'Tratamiento o procedimiento',r:1},{k:'estado',l:'Estado',t:'select',o:['Por realizar','Realizado']},{k:'costo',l:'Costo (USD)',t:'number'},{k:'fecha',l:'Fecha de realización',t:'date'}],
      cols:[['Tratamiento',r=>r.descripcion],['Estado',r=>badge(r.estado,r.estado==='Realizado'?'green':'red')],['Costo',r=>money(r.costo)],['Fecha',r=>fd(r.fecha)]],
      acts:[['✅',r=>save('tratamientos',r.id,{estado:'Realizado',fecha:r.fecha||today()}),'Marcar como realizado']],
      after:rows=>{T=rows;rs()}}),
    ()=>crud(tb,{col:'pagos',filter:f,sort:'-fecha',add:'Abono',defaults:{paciente:id,fecha:today(),moneda:'USD',tasa:1},
      fields:async()=>{await loadRates();return[...monedaFields,{k:'fecha',l:'Fecha',t:'date',r:1},{k:'nota',l:'Nota'}]},onForm:tasaForm,beforeSave:conMoneda,
      cols:[['Fecha',r=>fd(r.fecha)],['Monto (USD)',r=>money(usd(r))],['Nota',r=>r.nota]],
      open:r=>detMoneda('Detalle del abono',r,[['Paciente',p.nombre],['Fecha',fd(r.fecha)],['Nota',r.nota||'—']]),
      after:rows=>{P=rows;rs()}}),
    async()=>{const tk=await ftoken();return crud(tb,{col:'archivos',filter:f,add:'Archivo',defaults:{paciente:id,tipo:'Radiografía'},
      fields:[{k:'tipo',l:'Tipo',t:'select',o:['Radiografía','Foto','Otro']},{k:'archivo',l:'Archivo (imagen o PDF)',t:'file'},{k:'nota',l:'Nota'}],
      beforeSave:async d=>{const a=d.archivo;if(a instanceof File){
        if(a.type.startsWith('image/'))d.archivo=await comprimir(a);
        else if(a.size>10*1048576)throw new Error(`El PDF pesa ${(a.size/1048576).toFixed(1)} MB y el máximo es 10 MB. Comprímelo antes de subirlo (por ejemplo en ilovepdf.com/es/comprimir_pdf).`)}return d},
      cols:[['',r=>({h:/\.pdf$/i.test(r.archivo)?'<span style="font-size:30px">📄</span>':`<img class="th" loading="lazy" src="${fileUrl(r,tk)}&thumb=100x100" onerror="this.replaceWith('🖼️')">`})],['Tipo',r=>r.tipo],['Nota',r=>r.nota],['Subido',r=>fd(r.created)]],
      open:async r=>{const w=window.open('','_blank');try{w.location=fileUrl(r,await ftoken())}catch(e){w&&w.close();toast('No se pudo abrir el archivo',1)}}})},
    ()=>crud(tb,{...citasOpts({pac:p,filter:f}),sort:'-fecha'}),
  ];
  const chips=[...el.querySelectorAll('[data-t]')];
  const go=async i=>{if(historiaSucia()&&!confirm('Tienes cambios sin guardar en la historia. ¿Salir sin guardar?'))return;limpiarSucio();chips.forEach((c,j)=>c.classList.toggle('on',i===j));tb.innerHTML='';try{await tabs[i]()}catch(e){tb.innerHTML=`<div class="empty">${esc(e.message)}</div>`}};
  chips.forEach((c,i)=>c.onclick=()=>go(i));
  go(0);
}
