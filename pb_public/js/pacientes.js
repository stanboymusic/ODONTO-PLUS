import {list,one,save,ftoken,fileUrl} from './api.js';
import {esc,money,toast,fd,fdt,today,modal,badge} from './ui.js';
import {crud} from './crud.js';
const PF=[{k:'nombre',l:'Nombre completo',r:1},{k:'cedula',l:'Cédula'},{k:'telefono',l:'Teléfono'},{k:'email',l:'Correo'},{k:'fecha_nac',l:'Fecha de nacimiento',t:'date'},{k:'direccion',l:'Dirección'},{k:'notas',l:'Notas',t:'textarea'}];
const edad=s=>{if(!s)return'';const[y,m,d]=s.slice(0,10).split('-').map(Number),n=new Date();let a=n.getFullYear()-y;if(n.getMonth()+1<m||(n.getMonth()+1===m&&n.getDate()<d))a--;return a+' años'};
const EC={Programada:'blue',Confirmada:'green',Atendida:'',Cancelada:'red'};
export const pacientes=(el,id)=>id?detalle(el,id):crud(el,{col:'pacientes',sort:'nombre',add:'Paciente',fields:PF,
  cols:[['Paciente',r=>r.nombre],['Cédula',r=>r.cedula],['Teléfono',r=>r.telefono],['Edad',r=>edad(r.fecha_nac)]],
  open:r=>{location.hash='#/pacientes/'+r.id}});

async function detalle(el,id){
  const p=await one('pacientes',id),f=`paciente="${id}"`;
  let T=await list('tratamientos',{filter:f}),P=await list('pagos',{filter:f});
  const TABS=['Historia clínica','Tratamientos','Abonos','Radiografías y fotos','Citas'];
  el.innerHTML=`<a class="back" href="#/pacientes">← Pacientes</a><div class="card ph"><div><h3>${esc(p.nombre)}</h3><p>${[p.cedula&&'C.I. '+p.cedula,p.telefono,edad(p.fecha_nac)].filter(Boolean).map(esc).join(' · ')}</p></div><button class="btn ghost" id="ep">Editar datos</button></div><div class="sum" id="rs"></div><div class="tabs">${TABS.map((t,i)=>`<button class="chip" data-t="${i}">${t}</button>`).join('')}</div><div id="tb"></div>`;
  const rs=()=>{const b=T.reduce((s,t)=>s+t.costo,0),a=P.reduce((s,t)=>s+t.monto,0);
    el.querySelector('#rs').innerHTML=[['Presupuesto',b,''],['Abonado',a,'pos'],['Pendiente por pagar',b-a,b-a>0?'neg':'pos']].map(([l,v,c])=>`<div class="card"><small>${l}</small><b class="${c}">${money(v)}</b></div>`).join('')};
  rs();
  el.querySelector('#ep').onclick=()=>modal('Editar paciente',PF,p,async d=>{await save('pacientes',id,d);toast('Guardado');detalle(el,id)});
  const tb=el.querySelector('#tb');
  const tabs=[
    async()=>{tb.innerHTML=`<form class="card hx"><label>Diagnóstico<textarea name="diagnostico" rows="4">${esc(p.diagnostico)}</textarea></label><label>Pronóstico<textarea name="pronostico" rows="3">${esc(p.pronostico)}</textarea></label><label>Plan de tratamiento<textarea name="tratamiento" rows="4">${esc(p.tratamiento)}</textarea></label><button class="btn">Guardar historia</button></form>`;
      tb.querySelector('form').onsubmit=async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;
        try{const d=Object.fromEntries(new FormData(e.target));Object.assign(p,await save('pacientes',id,d));toast('Historia guardada')}catch(x){toast(x.message,1)}b.disabled=false}},
    ()=>crud(tb,{col:'tratamientos',filter:f,sort:'estado,-created',add:'Tratamiento',defaults:{paciente:id,estado:'Por realizar'},
      fields:[{k:'descripcion',l:'Tratamiento o procedimiento',r:1},{k:'estado',l:'Estado',t:'select',o:['Por realizar','Realizado']},{k:'costo',l:'Costo (USD)',t:'number'},{k:'fecha',l:'Fecha de realización',t:'date'}],
      cols:[['Tratamiento',r=>r.descripcion],['Estado',r=>badge(r.estado,r.estado==='Realizado'?'green':'red')],['Costo',r=>money(r.costo)],['Fecha',r=>fd(r.fecha)]],
      acts:[['✅',r=>save('tratamientos',r.id,{estado:'Realizado',fecha:r.fecha||today()}),'Marcar como realizado']],
      after:rows=>{T=rows;rs()}}),
    ()=>crud(tb,{col:'pagos',filter:f,sort:'-fecha',add:'Abono',defaults:{paciente:id,fecha:today()},
      fields:[{k:'monto',l:'Monto (USD)',t:'number',r:1},{k:'fecha',l:'Fecha',t:'date',r:1},{k:'nota',l:'Nota'}],
      cols:[['Fecha',r=>fd(r.fecha)],['Monto',r=>money(r.monto)],['Nota',r=>r.nota]],after:rows=>{P=rows;rs()}}),
    async()=>{const tk=await ftoken();return crud(tb,{col:'archivos',filter:f,add:'Archivo',defaults:{paciente:id,tipo:'Radiografía'},
      fields:[{k:'tipo',l:'Tipo',t:'select',o:['Radiografía','Foto','Otro']},{k:'archivo',l:'Archivo (imagen o PDF)',t:'file'},{k:'nota',l:'Nota'}],
      cols:[['',r=>({h:`<img class="th" src="${fileUrl(r,tk)}&thumb=100x100" onerror="this.replaceWith('📄')">`})],['Tipo',r=>r.tipo],['Nota',r=>r.nota],['Subido',r=>fd(r.created)]],
      open:async r=>{const w=window.open('','_blank');try{w.location=fileUrl(r,await ftoken())}catch(e){w&&w.close();toast('No se pudo abrir el archivo',1)}}})},
    ()=>crud(tb,{col:'citas',filter:f,sort:'-fecha',add:'Cita',defaults:{paciente:id,estado:'Programada'},
      fields:[{k:'fecha',l:'Fecha y hora',t:'datetime',r:1},{k:'motivo',l:'Motivo'},{k:'estado',l:'Estado',t:'select',o:Object.keys(EC)}],
      cols:[['Fecha y hora',r=>fdt(r.fecha)],['Motivo',r=>r.motivo],['Estado',r=>badge(r.estado,EC[r.estado])]]}),
  ];
  const chips=[...el.querySelectorAll('[data-t]')];
  const go=async i=>{chips.forEach((c,j)=>c.classList.toggle('on',i===j));tb.innerHTML='';try{await tabs[i]()}catch(e){tb.innerHTML=`<div class="empty">${esc(e.message)}</div>`}};
  chips.forEach((c,i)=>c.onclick=()=>go(i));
  go(0);
}
