// ODONTO PLUS · lógica de correo y calendario (se carga con require desde pb_hooks/odonto.pb.js)
const OFF={'America/Caracas':-240,'America/Bogota':-300};
const DIAS=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const D3=3*24*60*60*1000;
const pad=n=>String(n).padStart(2,'0');
const EMAIL=/^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]+$/;

const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icsEsc=s=>String(s==null?'':s).replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');
const fold=l=>{const o=[];while(l.length>60){o.push(l.slice(0,60));l=' '+l.slice(60)}o.push(l);return o.join('\r\n')};

function cfg(){
  let r=null;
  try{const rs=$app.findRecordsByFilter('clinica','id != ""','created',1,0);r=rs[0]||null}catch(e){}
  const g=k=>(r?String(r.getString(k)||''):'').trim();
  const s=$app.settings();
  const zona=g('zona')||'America/Caracas';
  return {nombre:g('nombre')||'ODONTO PLUS',doctora:g('doctora'),email:g('email'),telefono:g('telefono'),direccion:g('direccion'),
    zona:OFF[zona]!==undefined?zona:'America/Caracas',
    remitente:String(s.meta.senderAddress||''),smtp:!!s.smtp.enabled};
}
// Dirección que recibe las copias y recordatorios de la doctora
const destinoDoctora=c=>EMAIL.test(c.email)?c.email:(EMAIL.test(c.remitente)&&c.remitente!=='support@example.com'?c.remitente:'');

// Las fechas se guardan como hora local "de pared" (sin zona): se trabajan siempre con Date.UTC
function parse(s){
  const m=/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(String(s||''));
  if(!m)return null;
  const p={y:+m[1],mo:+m[2],d:+m[3],h:+m[4],mi:+m[5]};
  p.ms=Date.UTC(p.y,p.mo-1,p.d,p.h,p.mi);
  return p;
}
const nowLocal=c=>Date.now()+OFF[c.zona]*60000;
function parts(ms){const d=new Date(ms);return {y:d.getUTCFullYear(),mo:d.getUTCMonth()+1,d:d.getUTCDate(),h:d.getUTCHours(),mi:d.getUTCMinutes(),wd:d.getUTCDay()}}
const stamp=q=>`${q.y}${pad(q.mo)}${pad(q.d)}T${pad(q.h)}${pad(q.mi)}00`;
function humano(p){
  const q=parts(p.ms),h12=q.h%12===0?12:q.h%12;
  return `${DIAS[q.wd]} ${q.d} de ${MESES[q.mo-1]} de ${q.y}, ${h12}:${pad(q.mi)} ${q.h<12?'a. m.':'p. m.'}`;
}
const offStr=min=>{const a=Math.abs(min);return (min<0?'-':'+')+pad(Math.floor(a/60))+pad(a%60)};
const utcStamp=ms=>{const d=new Date(ms);return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`};

function datosCita(rec,pac,c){
  const p=parse(rec.getString('fecha'));
  if(!p)return null;
  const dur=rec.getInt('duracion')||60;
  const fin=parts(p.ms+dur*60000);
  return {p,dur,ini:stamp(parts(p.ms)),fin:stamp(fin),
    titulo:`Cita odontológica · ${c.nombre}`,
    paciente:pac?String(pac.getString('nombre')):'',
    motivo:String(rec.getString('motivo')||''),
    uid:(rec.getString('uid')||rec.id)+'@odonto-plus',
    seq:rec.getInt('secuencia')};
}
const lugar=c=>[c.nombre,c.direccion].filter(Boolean).join(' · ');
function descripcion(c,d,paraDoctora){
  const l=[];
  if(paraDoctora)l.push('Paciente: '+d.paciente);
  if(d.motivo)l.push('Motivo: '+d.motivo);
  if(c.doctora)l.push('Doctora: '+c.doctora);
  if(c.telefono)l.push('Contacto: '+c.telefono);
  return l.join('\n');
}
function gcalLink(c,d,paraDoctora){
  const q=[['action','TEMPLATE'],['text',(paraDoctora?`Cita: ${d.paciente} · `:'Cita odontológica · ')+c.nombre],['dates',d.ini+'/'+d.fin],['ctz',c.zona],['details',descripcion(c,d,paraDoctora)],['location',lugar(c)]];
  return 'https://calendar.google.com/calendar/render?'+q.map(([k,v])=>k+'='+encodeURIComponent(v)).join('&');
}

// metodo: REQUEST (paciente, con RSVP) · PUBLISH (copia de la doctora) · CANCEL
function ics(c,d,metodo,asistente,organizador,paraDoctora){
  const o=OFF[c.zona],L=[
    'BEGIN:VCALENDAR','PRODID:-//ODONTO PLUS//Citas//ES','VERSION:2.0','CALSCALE:GREGORIAN','METHOD:'+metodo,
    'BEGIN:VTIMEZONE','TZID:'+c.zona,'BEGIN:STANDARD','DTSTART:19700101T000000','TZOFFSETFROM:'+offStr(o),'TZOFFSETTO:'+offStr(o),'TZNAME:'+(o===-240?'VET':'COT'),'END:STANDARD','END:VTIMEZONE',
    'BEGIN:VEVENT','UID:'+d.uid,'SEQUENCE:'+d.seq,'DTSTAMP:'+utcStamp(Date.now()),
    `DTSTART;TZID=${c.zona}:${d.ini}`,`DTEND;TZID=${c.zona}:${d.fin}`,
    'SUMMARY:'+icsEsc(paraDoctora?`Cita: ${d.paciente}`:d.titulo),
    'DESCRIPTION:'+icsEsc(descripcion(c,d,paraDoctora)),
    'LOCATION:'+icsEsc(lugar(c))];
  if(metodo!=='PUBLISH'&&organizador)L.push(`ORGANIZER;CN=${icsEsc(c.doctora||c.nombre)}:mailto:${organizador}`);
  if(metodo!=='PUBLISH'&&asistente)L.push(`ATTENDEE;CN=${icsEsc(d.paciente||asistente)};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${asistente}`);
  L.push('STATUS:'+(metodo==='CANCEL'?'CANCELLED':'CONFIRMED'),'TRANSP:OPAQUE');
  if(metodo!=='CANCEL')L.push('BEGIN:VALARM','TRIGGER:-P3D','ACTION:DISPLAY','DESCRIPTION:Cita en 3 días','END:VALARM');
  L.push('END:VEVENT','END:VCALENDAR');
  return L.map(fold).join('\r\n')+'\r\n';
}

function plantilla(c,titulo,cuerpo,boton){
  return `<div style="font-family:Segoe UI,Arial,sans-serif;background:#f3f5f4;padding:24px"><div style="max-width:520px;margin:auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e3e9e8">
<div style="background:#0f3a41;color:#fff;padding:18px 24px"><div style="font:600 18px Georgia,serif;letter-spacing:.14em">${esc(c.nombre)}</div></div>
<div style="padding:24px;color:#15282b;line-height:1.55"><h2 style="margin:0 0 12px;font-size:20px">${esc(titulo)}</h2>${cuerpo}
${boton?`<p style="margin:22px 0 4px"><a href="${esc(boton[1])}" style="background:#1d6b73;color:#fff;text-decoration:none;padding:11px 18px;border-radius:10px;font-weight:600;display:inline-block">${esc(boton[0])}</a></p>`:''}
</div><div style="padding:14px 24px;background:#f8faf9;color:#6b7b7e;font-size:13px">${[c.doctora,c.telefono,c.direccion].filter(Boolean).map(esc).join(' · ')}</div></div></div>`;
}
function bloqueCita(c,d,paraDoctora){
  return `<table style="border-collapse:collapse;margin:8px 0"><tr><td style="padding:4px 14px 4px 0;color:#6b7b7e">Fecha</td><td><b>${esc(humano(d.p))}</b></td></tr>`
   +(paraDoctora?`<tr><td style="padding:4px 14px 4px 0;color:#6b7b7e">Paciente</td><td><b>${esc(d.paciente)}</b></td></tr>`:'')
   +(d.motivo?`<tr><td style="padding:4px 14px 4px 0;color:#6b7b7e">Motivo</td><td>${esc(d.motivo)}</td></tr>`:'')
   +(c.direccion?`<tr><td style="padding:4px 14px 4px 0;color:#6b7b7e">Lugar</td><td>${esc(c.direccion)}</td></tr>`:'')+'</table>';
}

function enviar(a,asunto,html,adjuntos){
  const c=cfg();
  if(!c.smtp)throw new Error('El correo no está configurado en el servidor (faltan SMTP_USER y SMTP_PASS).');
  const at={};
  for(const k of Object.keys(adjuntos||{})){
    const v=adjuntos[k];
    at[k]=typeof v==='string'?$filesystem.fileFromBytes(toBytes(v),k).reader.open():v;
  }
  const m=new MailerMessage({from:{address:c.remitente,name:c.nombre},to:[{address:a}],subject:asunto,html:html,attachments:at});
  $app.newMailClient().send(m);
}
const log=(k,e)=>{try{$app.logger().error('odonto: '+k,'error',String(e))}catch(_){}};

// Envía invitación (nueva / cambio / cancelada) a paciente y doctora. Devuelve un texto de estado.
function notificar(rec,tipo){
  const c=cfg(),res=[];
  let pac=null;try{pac=$app.findRecordById('pacientes',rec.getString('paciente'))}catch(e){}
  const d=datosCita(rec,pac,c);
  if(!d)return 'Cita sin fecha válida';
  const mail=String(rec.getString('email')||'').trim(),doc=destinoDoctora(c),org=c.remitente;
  const asunto={nueva:'Cita agendada',cambio:'Cita reprogramada',cancelada:'Cita cancelada'}[tipo]+` · ${humano(d.p)}`;
  const titulo={nueva:'Tu cita está agendada',cambio:'Tu cita fue reprogramada',cancelada:'Tu cita fue cancelada'}[tipo];
  if(EMAIL.test(mail)){
    try{
      const cuerpo=`<p>Hola${d.paciente?' <b>'+esc(d.paciente.split(' ')[0])+'</b>':''},</p>`+(tipo==='cancelada'?'<p>Tu cita quedó cancelada. Si quieres reprogramarla, escríbenos o llámanos.</p>':'<p>Estos son los datos de tu cita:</p>')+bloqueCita(c,d,false)
        +(tipo==='cancelada'?'':'<p style="color:#6b7b7e;font-size:14px">Te enviaremos un recordatorio 3 días antes. Adjuntamos la invitación para tu calendario.</p>');
      enviar(mail,asunto,plantilla(c,titulo,cuerpo,tipo==='cancelada'?null:['Agregar a Google Calendar',gcalLink(c,d,false)]),{'cita.ics':ics(c,d,tipo==='cancelada'?'CANCEL':'REQUEST',mail,org,false)});
      res.push('Paciente: '+mail);
    }catch(e){log('invitación paciente',e);res.push('Error al escribir al paciente: '+String(e).slice(0,120))}
  }
  if(doc){
    try{
      const t2={nueva:'Cita agendada',cambio:'Cita reprogramada',cancelada:'Cita cancelada'}[tipo];
      enviar(doc,`${t2}: ${d.paciente} · ${humano(d.p)}`,plantilla(c,t2,bloqueCita(c,d,true),tipo==='cancelada'?null:['Agregar a Google Calendar',gcalLink(c,d,true)]),tipo==='cancelada'?{}:{'cita.ics':ics(c,d,'PUBLISH','',org,true)});
      res.push('Doctora: '+doc);
    }catch(e){log('invitación doctora',e);res.push('Error al escribir a la doctora: '+String(e).slice(0,120))}
  }else res.push('Sin correo de la doctora (configúralo en Ajustes)');
  return res.join(' · ');
}

function recordar(rec){
  const c=cfg(),res=[];
  let pac=null;try{pac=$app.findRecordById('pacientes',rec.getString('paciente'))}catch(e){}
  const d=datosCita(rec,pac,c);
  if(!d)return '';
  const mail=String(rec.getString('email')||'').trim(),doc=destinoDoctora(c);
  if(EMAIL.test(mail)){
    try{
      enviar(mail,`Recordatorio: tu cita es el ${humano(d.p)}`,plantilla(c,'Te esperamos en 3 días',`<p>Hola${d.paciente?' <b>'+esc(d.paciente.split(' ')[0])+'</b>':''}, te recordamos tu cita:</p>`+bloqueCita(c,d,false)+'<p style="color:#6b7b7e;font-size:14px">Si no puedes asistir, avísanos con tiempo para reprogramar.</p>',['Agregar a Google Calendar',gcalLink(c,d,false)]));
      res.push('Recordatorio al paciente');
    }catch(e){log('recordatorio paciente',e);res.push('Error recordatorio paciente')}
  }
  if(doc){
    try{
      enviar(doc,`Recordatorio: cita con ${d.paciente} · ${humano(d.p)}`,plantilla(c,'Cita en 3 días',bloqueCita(c,d,true),['Agregar a Google Calendar',gcalLink(c,d,true)]));
      res.push('Recordatorio a la doctora');
    }catch(e){log('recordatorio doctora',e);res.push('Error recordatorio doctora')}
  }
  return res.join(' · ');
}

// ---- Antes de guardar una cita: uid, secuencia, banderas
function prepararCita(rec,orig){
  const c=cfg();
  if(!rec.getString('uid'))rec.set('uid',$security.randomString(24));
  if(!rec.getInt('duracion'))rec.set('duracion',60);
  const cambioFecha=!orig||orig.getString('fecha')!==rec.getString('fecha')||orig.getInt('duracion')!==rec.getInt('duracion');
  if(!orig)rec.set('secuencia',0);
  else if(cambioFecha||(rec.getString('estado')==='Cancelada'&&orig.getString('estado')!=='Cancelada'))rec.set('secuencia',orig.getInt('secuencia')+1);
  if(cambioFecha){
    const p=parse(rec.getString('fecha'));
    // si faltan 3 días o menos, la invitación ya sirve de aviso
    rec.set('recordado',!p||(p.ms-nowLocal(c))<=D3);
  }
}
// ---- Después de guardar: decide si corresponde enviar y deja el aviso en la cita
function despuesDeGuardar(rec,orig){
  const est=rec.getString('estado'),notif=rec.getBool('notificar');
  let tipo='';
  if(est==='Cancelada'){if(orig&&orig.getString('estado')!=='Cancelada'&&orig.getBool('invitado'))tipo='cancelada'}
  else if(notif){
    if(!orig||!orig.getBool('invitado')||orig.getString('estado')==='Cancelada'||orig.getString('email')!==rec.getString('email'))tipo='nueva';
    else if(orig.getString('fecha')!==rec.getString('fecha')||orig.getInt('duracion')!==rec.getInt('duracion')||orig.getString('motivo')!==rec.getString('motivo'))tipo='cambio';
  }
  if(!tipo)return;
  let aviso='';
  try{aviso=notificar(rec,tipo)}catch(e){log('notificar',e);aviso='Error: '+String(e).slice(0,160)}
  try{
    const r=$app.findRecordById('citas',rec.id);
    r.set('aviso',({nueva:'Invitación enviada',cambio:'Cambio notificado',cancelada:'Cancelación enviada'}[tipo])+' · '+aviso);
    if(tipo!=='cancelada')r.set('invitado',true);
    $app.unsafeWithoutHooks().save(r);
  }catch(e){log('aviso',e)}
}

function recordatorios(){
  const c=cfg();
  if(!c.smtp)return 0;
  let rows=[];
  try{rows=$app.findRecordsByFilter('citas','notificar = true && recordado = false && (estado = "Programada" || estado = "Confirmada")','fecha',200,0)}catch(e){log('cron lista',e);return 0}
  const now=nowLocal(c);let n=0;
  for(const r of rows){
    const p=parse(r.getString('fecha'));
    if(!p)continue;
    const diff=p.ms-now;
    if(diff>D3)continue;
    let aviso='';
    if(diff>0){aviso=recordar(r);n++}
    try{r.set('recordado',true);if(aviso)r.set('aviso',aviso);$app.unsafeWithoutHooks().save(r)}catch(e){log('cron guardar',e)}
  }
  return n;
}

module.exports={cfg,destinoDoctora,enviar,esc,EMAIL,prepararCita,despuesDeGuardar,recordatorios,notificar,recordar,plantilla,parse,humano,log};
