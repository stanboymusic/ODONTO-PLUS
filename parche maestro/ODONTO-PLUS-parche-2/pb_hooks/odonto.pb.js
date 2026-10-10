/// <reference path="../pb_data/types.d.ts" />
// ODONTO PLUS · correo, invitaciones de calendario y recordatorios

// 1) El correo se configura con secretos del servidor (fly secrets set SMTP_USER=... SMTP_PASS=...)
onBootstrap((e)=>{
  e.next();
  try{
    const user=$os.getenv('SMTP_USER'),pass=$os.getenv('SMTP_PASS');
    if(!user||!pass)return;
    const host=$os.getenv('SMTP_HOST')||'smtp.gmail.com';
    const port=parseInt($os.getenv('SMTP_PORT')||'587',10);
    const tls=($os.getenv('SMTP_TLS')||'')==='true'||port===465;
    const s=$app.settings();
    if(s.smtp.enabled&&s.smtp.host===host&&s.smtp.port===port&&s.smtp.username===user&&s.smtp.password===pass&&s.smtp.tls===tls&&s.meta.senderAddress===user)return;
    s.smtp.enabled=true;s.smtp.host=host;s.smtp.port=port;s.smtp.username=user;s.smtp.password=pass;s.smtp.tls=tls;
    s.meta.senderAddress=user;
    $app.save(s);
  }catch(err){console.log('odonto: no se pudo configurar el SMTP: '+err)}
});

// 2) Citas: preparar antes de guardar y notificar después
onRecordCreateRequest((e)=>{
  const L=require(`${__hooks}/lib/odonto.js`);
  L.prepararCita(e.record,null);
  e.next();
  L.despuesDeGuardar(e.record,null);
},'citas');

onRecordUpdateRequest((e)=>{
  const L=require(`${__hooks}/lib/odonto.js`);
  const orig=e.record.original();
  L.prepararCita(e.record,orig);
  e.next();
  L.despuesDeGuardar(e.record,orig);
},'citas');

// 3) Recordatorio 3 días antes (revisa cada 15 minutos)
cronAdd('odonto-recordatorios','*/15 * * * *',()=>{
  require(`${__hooks}/lib/odonto.js`).recordatorios();
});

// 4) Endpoints para la app
routerAdd('GET','/api/odonto/estado',(e)=>{
  const L=require(`${__hooks}/lib/odonto.js`);
  const c=L.cfg();
  return e.json(200,{smtp:c.smtp,remitente:c.remitente,destino:L.destinoDoctora(c)});
},$apis.requireAuth());

routerAdd('POST','/api/odonto/prueba',(e)=>{
  const L=require(`${__hooks}/lib/odonto.js`);
  const c=L.cfg(),a=L.destinoDoctora(c);
  if(!a)return e.json(400,{message:'Escribe primero el correo de la clínica en Ajustes.'});
  try{
    L.enviar(a,'Prueba de correo · '+c.nombre,L.plantilla(c,'El correo funciona','<p>Si lees este mensaje, ODONTO PLUS ya puede enviar invitaciones, recordatorios e historias clínicas.</p>',null));
    return e.json(200,{ok:true,a:a});
  }catch(err){return e.json(400,{message:String(err).slice(0,300)})}
},$apis.requireAuth());

routerAdd('POST','/api/odonto/enviar-historia',(e)=>{
  const L=require(`${__hooks}/lib/odonto.js`);
  const a=String(e.request.formValue('to')||'').trim();
  if(!L.EMAIL.test(a))return e.json(400,{message:'El correo del destinatario no es válido.'});
  let files=[];
  try{files=e.findUploadedFiles('pdf')}catch(x){}
  if(!files.length)return e.json(400,{message:'No llegó el PDF de la historia.'});
  const c=L.cfg();
  const asunto=String(e.request.formValue('asunto')||'Historia clínica').slice(0,200);
  const msg=String(e.request.formValue('mensaje')||'').slice(0,3000);
  const nombre=String(e.request.formValue('nombre')||'historia-clinica').replace(/[^\w\-áéíóúñÁÉÍÓÚÑ ]/g,'').trim().replace(/\s+/g,'-').slice(0,80)||'historia-clinica';
  try{
    const cuerpo=(msg?msg.split(/\n/).map(l=>'<p style="margin:0 0 8px">'+L.esc(l)+'</p>').join(''):'<p>Adjuntamos tu historia clínica odontológica.</p>');
    L.enviar(a,asunto,L.plantilla(c,'Historia clínica',cuerpo,null),{[nombre+'.pdf']:files[0].reader.open()});
    return e.json(200,{ok:true});
  }catch(err){
    L.log('enviar historia',err);
    return e.json(400,{message:String(err).slice(0,300)});
  }
},$apis.requireAuth(),$apis.bodyLimit(20971520));
