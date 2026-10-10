import {clinica,save,estadoCorreo,pruebaCorreo} from './api.js';
import {esc,toast,emailOk} from './ui.js';

const ZONAS=[['America/Caracas','Venezuela (UTC-4)'],['America/Bogota','Colombia (UTC-5)']];
export async function ajustes(el){
  const c=await clinica();
  if(!c){el.innerHTML='<div class="empty">No se encontró el registro de la clínica. Reinicia el servidor para aplicar las actualizaciones.</div>';return}
  let est={smtp:false,remitente:'',destino:''};
  try{est=await estadoCorreo()}catch(e){}
  el.innerHTML=`<div class="two">
  <form class="card hx" id="fc"><h3>Datos de la clínica</h3>
    <label>Nombre de la clínica<input name="nombre" value="${esc(c.nombre)}" required></label>
    <label>Doctora / Doctor<input name="doctora" value="${esc(c.doctora)}" placeholder="Dra. Nombre Apellido"></label>
    <label>Correo de la clínica<input name="email" type="email" value="${esc(c.email)}" placeholder="doctora@gmail.com" autocapitalize="off"><small class="hint">Recibe copia de cada cita y los recordatorios 3 días antes.</small></label>
    <label>Teléfono<input name="telefono" type="tel" value="${esc(c.telefono)}"></label>
    <label>Dirección<input name="direccion" value="${esc(c.direccion)}"></label>
    <label>Zona horaria de las citas<select name="zona">${ZONAS.map(([v,l])=>`<option value="${v}" ${v===c.zona?'selected':''}>${l}</option>`).join('')}</select></label>
    <button class="btn">Guardar datos</button></form>
  <div class="card hx"><h3>Correo y calendario</h3>
    <p class="${est.smtp?'pos':'neg'}" style="margin:0"><b>${est.smtp?'Correo activo':'Correo sin configurar'}</b></p>
    ${est.smtp?`<p class="mut" style="margin:0">Se envía desde <b>${esc(est.remitente)}</b>. Las copias a la doctora llegan a <b>${esc(est.destino||'— (escribe el correo de la clínica)')}</b>.</p>
    <button class="btn ghost" id="tm">Enviar correo de prueba</button>`
    :`<p class="mut" style="margin:0">Para enviar invitaciones, recordatorios e historias por correo hace falta conectar una cuenta de Gmail del consultorio. En el servidor se guardan dos secretos:</p><pre class="code">fly secrets set SMTP_USER="clinica@gmail.com" SMTP_PASS="contraseña de aplicación" -a odonto-plus-db</pre><p class="mut" style="margin:0">La contraseña de aplicación se crea en la cuenta de Google (Seguridad → Verificación en dos pasos → Contraseñas de aplicaciones).</p>`}
    <hr><p class="mut" style="margin:0"><b>Cómo funcionan las citas:</b> al agendar con correo del paciente, él y la doctora reciben la invitación con el evento para su calendario (Gmail y Google Calendar muestran el botón para agregarla). Tres días antes de la cita ambos reciben un recordatorio automático.</p></div></div>`;
  el.querySelector('#fc').onsubmit=async e=>{
    e.preventDefault();const b=e.submitter;b.disabled=true;
    try{const d=Object.fromEntries(new FormData(e.target));d.email=d.email.trim();if(d.email&&!emailOk(d.email))throw new Error('El correo de la clínica no es válido');
      await save('clinica',c.id,d);toast('Datos guardados');ajustes(el)}catch(x){toast(x.message,1);b.disabled=false}
  };
  const tm=el.querySelector('#tm');
  if(tm)tm.onclick=async()=>{tm.disabled=true;tm.textContent='Enviando…';try{await pruebaCorreo();toast('Correo de prueba enviado a '+(est.destino||'la clínica'))}catch(x){toast(x.message,1)}tm.disabled=false;tm.textContent='Enviar correo de prueba'};
}
