// Utilidades de citas: fechas legibles, enlace a Google Calendar y recordatorio por WhatsApp
const DIAS=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const MESES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const pad=n=>String(n).padStart(2,'0');
export const parseF=s=>{const m=/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(s||'');return m?{y:+m[1],mo:+m[2],d:+m[3],h:+m[4],mi:+m[5]}:null};
export function humano(s){
  const p=parseF(s);if(!p)return '';
  const wd=new Date(Date.UTC(p.y,p.mo-1,p.d)).getUTCDay();
  return `${DIAS[wd]} ${p.d} de ${MESES[p.mo-1]} de ${p.y}, ${p.h%12||12}:${pad(p.mi)} ${p.h<12?'a. m.':'p. m.'}`;
}
const stamp=d=>`${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00`;
export function gcalUrl(c,paciente,cl={}){
  const p=parseF(c.fecha);if(!p)return '';
  const ini=new Date(Date.UTC(p.y,p.mo-1,p.d,p.h,p.mi)),fin=new Date(ini.getTime()+(c.duracion||60)*60000);
  const det=[c.motivo&&'Motivo: '+c.motivo,cl.doctora&&'Doctora: '+cl.doctora,cl.telefono&&'Contacto: '+cl.telefono].filter(Boolean).join('\n');
  const q=[['action','TEMPLATE'],['text',`Cita: ${paciente} · ${cl.nombre||'ODONTO PLUS'}`],['dates',stamp(ini)+'/'+stamp(fin)],['ctz',cl.zona||'America/Caracas'],['details',det],['location',[cl.nombre,cl.direccion].filter(Boolean).join(' · ')]];
  return 'https://calendar.google.com/calendar/render?'+q.map(([k,v])=>k+'='+encodeURIComponent(v)).join('&');
}
export function waNumero(t){
  let d=String(t||'').replace(/\D/g,'');if(d.startsWith('00'))d=d.slice(2);
  if(d.startsWith('0'))return '58'+d.slice(1);
  if(d.length>=11)return d;
  if(d.length===10)return (d[0]==='3'?'57':'58')+d;
  return d;
}
export const waRecordatorio=(c,pac,cl={})=>`https://wa.me/${waNumero(pac.telefono)}?text=${encodeURIComponent(`Hola ${String(pac.nombre||'').split(' ')[0]}, te recordamos tu cita en ${cl.nombre||'la clínica'} el ${humano(c.fecha)}. ¡Te esperamos!`)}`;
