import {clinica,save,estadoCorreo,pruebaCorreo} from './api.js';
import {esc,toast,emailOk} from './ui.js';

const ZONAS=[['America/Caracas','Venezuela (UTC-4)'],['America/Bogota','Colombia (UTC-5)']];

export async function ajustes(el){
  const c=await clinica();
  if(!c){el.innerHTML='<div class="empty">No se encontró el registro de la clínica. Reinicia el servidor para aplicar las actualizaciones.</div>';return}
  let est={smtp:false,remitente:'',destino:''};
  try{est=await estadoCorreo()}catch(e){}

  const mantener = localStorage.getItem('mantener_sesion') === '1';

  el.innerHTML=`<div class="two">
  <form class="card hx" id="fc"><h3>Datos de la clínica</h3>
    <label>Nombre de la clínica<input name="nombre" value="${esc(c.nombre)}" required></label>
    <label>Doctora / Doctor<input name="doctora" value="${esc(c.doctora)}" placeholder="Dra. Nombre Apellido"></label>
    <label>Correo de la clínica<input name="email" type="email" value="${esc(c.email)}" placeholder="doctora@gmail.com" autocapitalize="off"><small class="hint">Recibe copia de cada cita y los recordatorios 3 días antes.</small></label>
    <label>Teléfono<input name="telefono" type="tel" value="${esc(c.telefono)}"></label>
    <label>Dirección<input name="direccion" value="${esc(c.direccion)}"></label>
    <label>Zona horaria de las citas<select name="zona">${ZONAS.map(([v,l])=>`<option value="${v}" ${v===c.zona?'selected':''}>${l}</option>`).join('')}</select></label>
    <button class="btn">Guardar datos</button></form>

  <div>
    <div class="card hx" id="card-sesion" style="margin-bottom:var(--gap,1rem)">
      <h3>Seguridad de sesión</h3>
      <p class="mut" style="margin:0 0 12px">Por defecto, la sesión se cierra automáticamente después de <b>20 minutos</b> de inactividad para proteger los datos del consultorio.</p>
      <label class="toggle-row" id="lbl-mantener" style="display:flex;align-items:center;gap:10px;cursor:pointer;user-select:none">
        <span style="flex:1">
          <b>Mantener sesión activa</b>
          <small class="hint" style="display:block;margin-top:2px">Desactiva el cierre automático por inactividad. Recomendado solo en dispositivos de uso exclusivo del consultorio.</small>
        </span>
        <div class="toggle-wrap">
          <input type="checkbox" id="chk-mantener" ${mantener?'checked':''} style="position:absolute;opacity:0;width:0;height:0">
          <span class="toggle-track"><span class="toggle-thumb"></span></span>
        </div>
      </label>
    </div>

    <div class="card hx"><h3>Correo y calendario</h3>
      <p class="${est.smtp?'pos':'neg'}" style="margin:0"><b>${est.smtp?'Correo activo':'Correo sin configurar'}</b></p>
      ${est.smtp?`<p class="mut" style="margin:0">Se envía desde <b>${esc(est.remitente)}</b>. Las copias a la doctora llegan a <b>${esc(est.destino||'— (escribe el correo de la clínica)')}</b>.</p>
      <button class="btn ghost" id="tm">Enviar correo de prueba</button>`
      :`<p class="mut" style="margin:0">Para enviar invitaciones, recordatorios e historias por correo hace falta conectar una cuenta de Gmail del consultorio. En el servidor se guardan dos secretos:</p><pre class="code">fly secrets set SMTP_USER="clinica@gmail.com" SMTP_PASS="contraseña de aplicación" -a odonto-plus-db</pre><p class="mut" style="margin:0">La contraseña de aplicación se crea en la cuenta de Google (Seguridad → Verificación en dos pasos → Contraseñas de aplicaciones).</p>`}
      <hr><p class="mut" style="margin:0"><b>Cómo funcionan las citas:</b> al agendar con correo del paciente, él y la doctora reciben la invitación con el evento para su calendario (Gmail y Google Calendar muestran el botón para agregarla). Tres días antes de la cita ambos reciben un recordatorio automático.</p>
    </div>
  </div>
</div>`;

  el.querySelector('#fc').onsubmit=async e=>{
    e.preventDefault();const b=e.submitter;b.disabled=true;
    try{const d=Object.fromEntries(new FormData(e.target));d.email=d.email.trim();if(d.email&&!emailOk(d.email))throw new Error('El correo de la clínica no es válido');
      await save('clinica',c.id,d);toast('Datos guardados');ajustes(el)}catch(x){toast(x.message,1);b.disabled=false}
  };

  // Toggle mantener sesión
  const chk = el.querySelector('#chk-mantener');
  const track = el.querySelector('.toggle-track');
  const lbl = el.querySelector('#lbl-mantener');

  // Sincronizar estado visual inicial
  if (chk.checked) track.classList.add('is-on');

  lbl.onclick = () => {
    chk.checked = !chk.checked;
    track.classList.toggle('is-on', chk.checked);
    if (chk.checked) {
      localStorage.setItem('mantener_sesion','1');
      toast('Sesión se mantendrá activa sin límite de tiempo');
    } else {
      localStorage.removeItem('mantener_sesion');
      toast('Cierre automático activado — 20 min de inactividad');
    }
  };
  // Evitar doble toggle al hacer click en el propio checkbox
  chk.onclick = e => e.stopPropagation();


  const tm=el.querySelector('#tm');
  if(tm)tm.onclick=async()=>{tm.disabled=true;tm.textContent='Enviando…';try{await pruebaCorreo();toast('Correo de prueba enviado a '+(est.destino||'la clínica'))}catch(x){toast(x.message,1)}tm.disabled=false;tm.textContent='Enviar correo de prueba'};
}
