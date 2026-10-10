import {list,save,clinica} from './api.js';
import {badge,fdt,info,emailOk,toast} from './ui.js';
import {gcalUrl,waRecordatorio,humano} from './calendario.js';

export const EC={Programada:'blue',Confirmada:'green',Atendida:'',Cancelada:'red'};
const estadoAviso=r=>{
  if(r.estado==='Cancelada')return badge(r.invitado?'Cancelación enviada':'—',r.invitado?'':'');
  if(!r.notificar)return badge('Sin aviso','');
  if(/error/i.test(r.aviso||''))return badge('Revisar correo','red');
  return r.invitado?badge('Invitación enviada','green'):badge('Pendiente','blue');
};
let CL=null;
const cargarClinica=()=>clinica().then(c=>{CL=c}).catch(()=>{});

// pac: ficha del paciente cuando se agenda desde su historia (sin selector de paciente)
export function citasOpts({pac=null,filter,flt}={}){
  let PAC=pac?[pac]:[];
  cargarClinica();
  const aviso='Se le envía la invitación al calendario y un recordatorio 3 días antes. Si lo dejas vacío, solo se avisa a la doctora.';
  return {col:'citas',sort:'fecha',expand:'paciente',add:'Cita',filter,flt,
    defaults:{estado:'Programada',notificar:true,duracion:60,...(pac?{paciente:pac.id,email:pac.email||''}:{})},
    fields:async()=>{
      if(!pac)PAC=await list('pacientes',{sort:'nombre'});
      return [...(pac?[]:[{k:'paciente',l:'Paciente',t:'rel',o:PAC.map(p=>[p.id,p.nombre])}]),
        {k:'fecha',l:'Fecha y hora',t:'datetime',r:1},{k:'duracion',l:'Duración (minutos)',t:'number',step:'5'},
        {k:'motivo',l:'Motivo'},{k:'estado',l:'Estado',t:'select',o:Object.keys(EC)},
        {k:'email',l:'Correo del paciente',t:'email',ph:'paciente@gmail.com',h:aviso},
        {k:'notificar',l:'Enviar invitación y recordatorio por correo',t:'bool'}];
    },
    onForm:f=>{
      const sel=f.elements.paciente,em=f.elements.email;
      const rellenar=()=>{const p=PAC.find(x=>x.id===(sel?sel.value:pac&&pac.id));if(p&&p.email&&!em.value)em.value=p.email};
      if(sel)sel.onchange=()=>{em.value='';rellenar()};
      rellenar();
    },
    beforeSave:async d=>{
      d.email=String(d.email||'').trim();
      if(d.email&&!emailOk(d.email))throw new Error('El correo del paciente no es válido');
      if(d.duracion&&d.duracion<5)throw new Error('La duración mínima es de 5 minutos');
      const p=pac||PAC.find(x=>x.id===d.paciente);
      // La doctora pregunta el correo una sola vez: queda guardado en la ficha del paciente
      if(d.email&&p&&!p.email){await save('pacientes',p.id,{email:d.email});p.email=d.email}
      return d;
    },
    cols:[['Fecha y hora',r=>fdt(r.fecha)],...(pac?[]:[['Paciente',r=>r.expand?.paciente?.nombre||'']]),['Motivo',r=>r.motivo],['Estado',r=>badge(r.estado,EC[r.estado])],['Aviso',estadoAviso]],
    acts:[
      ['✔️',r=>save('citas',r.id,{estado:'Atendida'}),'Marcar como atendida'],
      ['📅',r=>{const u=gcalUrl(r,r.expand?.paciente?.nombre||pac?.nombre||'',CL||{});if(!u)throw new Error('La cita no tiene fecha');window.open(u,'_blank','noopener')},'Agregar a mi Google Calendar'],
      ['💬',r=>{const p=r.expand?.paciente||pac;if(!p||!p.telefono)throw new Error('El paciente no tiene teléfono registrado');window.open(waRecordatorio(r,p,CL||{}),'_blank','noopener')},'Recordar por WhatsApp']],
    open:r=>info('Detalle de la cita',[['Paciente',r.expand?.paciente?.nombre||pac?.nombre||'—'],['Fecha',humano(r.fecha)],['Duración',(r.duracion||60)+' min'],['Motivo',r.motivo||'—'],['Estado',r.estado],['Correo del paciente',r.email||'—'],['Notificación',r.notificar?(r.aviso||'Pendiente de envío'):'Desactivada'],['Recordatorio 3 días antes',!r.notificar?'—':r.recordado?'Enviado o no necesario':'Programado']])
  };
}
