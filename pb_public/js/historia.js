import {save} from './api.js';
import {esc,toast,fd,edad} from './ui.js';
import {odontograma,resumen as resOd,ausente,norm as normOd} from './odonto.js';
import {periodontograma,norm as normPd} from './perio.js';
import {compartir} from './compartir.js';
import {ANAM,ANAM_OD} from './preguntas.js';

const asObj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};

// Estado de edición compartido con el PDF: lo que se ve en pantalla (aunque no se haya guardado)
export function estadoHistoria(p,H){
  return {...p,motivo:H.motivo,observaciones:H.observaciones,diagnostico:H.diagnostico,calculo:H.calculo,pronostico:H.pronostico,tratamiento:H.tratamiento,
    anamnesis:H.anam,anam_odonto:H.anamOd,odontograma:H.od,periodontograma:H.pd};
}

let sucio=false;
export const historiaSucia=()=>sucio;
export const limpiarSucio=()=>{sucio=false;window.onbeforeunload=null};

export function historia(tb,p,id,onSaved){
  const H={motivo:p.motivo||'',observaciones:p.observaciones||'',diagnostico:p.diagnostico||'',calculo:p.calculo||'',pronostico:p.pronostico||'',tratamiento:p.tratamiento||'',
    anam:asObj(p.anamnesis),anamOd:asObj(p.anam_odonto),od:normOd(p.odontograma),pd:normPd(p.periodontograma)};
  sucio=false;
  const marcar=()=>{if(!sucio){sucio=true;btn.classList.add('dirty');ind.textContent='Cambios sin guardar';window.onbeforeunload=e=>{e.preventDefault();e.returnValue=''}}};
  const preg=(lista,key)=>lista.map(([k,l])=>{const r=H[key][k]||{};return `<div class="q"><span class="ql">${esc(l)}</span><div class="seg" data-q="${key}.${k}"><button type="button" data-v="si" class="${r.v==='si'?'on bad':''}">Sí</button><button type="button" data-v="no" class="${r.v==='no'?'on':''}">No</button></div><input class="qd" data-d="${key}.${k}" placeholder="¿Cuál? / detalle" value="${esc(r.d||'')}" ${r.v==='si'?'':'hidden'}></div>`}).join('');
  const datos=[['Nombre',p.nombre],['C.I.',p.cedula],['Sexo',p.sexo],['Fecha de nacimiento',fd(p.fecha_nac)],['Edad',edad(p.fecha_nac)],['Ocupación',p.ocupacion],['Teléfono',p.telefono],['Correo',p.email],['Dirección',p.direccion]].filter(x=>x[1]);
  tb.innerHTML=`<div class="hc">
  <section class="card"><div class="hc-h"><h3>Datos personales</h3><span class="mut">Se editan con «Editar datos»</span></div><dl class="dl2">${datos.map(([k,v])=>`<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')||'<div class="mut">Aún no hay datos personales.</div>'}</dl>
    <label>Motivo de la consulta<textarea data-f="motivo" rows="2">${esc(H.motivo)}</textarea></label></section>
  <section class="card"><h3>Anamnesis</h3>${preg(ANAM,'anam')}</section>
  <section class="card"><h3>Anamnesis odontológica</h3>${preg(ANAM_OD,'anamOd')}</section>
  <section class="card"><h3>Odontodiagrama</h3><div id="od"></div></section>
  <details class="card pdet"><summary><h3>Periodontograma</h3><span class="mut">Sondaje, recesión, sangrado, movilidad y furca</span></summary><div id="pd"></div></details>
  <section class="card hx"><h3>Observaciones y diagnóstico</h3>
    <label>Observaciones<textarea data-f="observaciones" rows="2">${esc(H.observaciones)}</textarea></label>
    <div class="dg"><div class="caries">Caries<b id="nc">0</b></div><label>Cálculo general<input data-f="calculo" value="${esc(H.calculo)}" placeholder="Ej.: leve, moderado…"></label></div>
    <label>Diagnóstico<textarea data-f="diagnostico" rows="3">${esc(H.diagnostico)}</textarea></label>
    <label>Pronóstico<textarea data-f="pronostico" rows="2">${esc(H.pronostico)}</textarea></label>
    <label>Plan de tratamiento<textarea data-f="tratamiento" rows="3">${esc(H.tratamiento)}</textarea></label></section>
  <div class="hbar"><span class="ind"></span><button type="button" class="btn ghost" id="sh">Compartir / PDF</button><button type="button" class="btn" id="sv">Guardar historia</button></div></div>`;
  const btn=tb.querySelector('#sv'),ind=tb.querySelector('.ind');
  const nc=()=>{tb.querySelector('#nc').textContent=resOd(H.od).caries};
  const OD=odontograma(tb.querySelector('#od'),H.od,{onChange:d=>{H.od=d;nc();marcar()},temporal:false});
  const PD=periodontograma(tb.querySelector('#pd'),H.pd,{ausentes:i=>ausente(H.od,i),onChange:d=>{H.pd=d;marcar()}});
  tb.querySelector('.pdet').addEventListener('toggle',e=>{if(e.target.open)PD.refrescar()});
  nc();
  tb.querySelector('.hc').addEventListener('input',e=>{
    const f=e.target.dataset.f;if(f){H[f]=e.target.value;marcar();return}
    const d=e.target.dataset.d;if(d){const[g,k]=d.split('.');(H[g][k]||(H[g][k]={v:'si',d:''})).d=e.target.value;marcar()}
  });
  tb.querySelector('.hc').addEventListener('click',e=>{
    const b=e.target.closest('.seg button');if(!b)return;
    const seg=b.parentElement,[g,k]=seg.dataset.q.split('.'),r=H[g][k]||(H[g][k]={v:'',d:''});
    r.v=r.v===b.dataset.v?'':b.dataset.v;                       // tocar de nuevo deja la pregunta sin responder
    seg.querySelectorAll('button').forEach(x=>{x.classList.toggle('on',r.v===x.dataset.v);x.classList.toggle('bad',r.v==='si'&&x.dataset.v==='si')});
    const di=seg.parentElement.querySelector('.qd');di.hidden=r.v!=='si';if(r.v!=='si'){r.d='';di.value=''}
    marcar();
  });
  btn.onclick=async()=>{
    btn.disabled=true;
    try{
      const d={motivo:H.motivo,observaciones:H.observaciones,diagnostico:H.diagnostico,calculo:H.calculo,pronostico:H.pronostico,tratamiento:H.tratamiento,
        anamnesis:H.anam,anam_odonto:H.anamOd,odontograma:H.od,periodontograma:H.pd};
      const r=await save('pacientes',id,d);Object.assign(p,r);
      sucio=false;window.onbeforeunload=null;btn.classList.remove('dirty');ind.textContent='Guardado ✓';toast('Historia guardada');onSaved&&onSaved(r);
    }catch(x){toast(x.message,1)}
    btn.disabled=false;
  };
  tb.querySelector('#sh').onclick=()=>compartir(estadoHistoria(p,H),id).catch(x=>toast(x.message,1));
}
