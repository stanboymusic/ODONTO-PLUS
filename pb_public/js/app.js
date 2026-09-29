import {authed,login,logout} from './api.js';
import {$,esc,toast} from './ui.js';
import {inicio,citas,inventario,finanzas} from './modulos.js';
import {pacientes} from './pacientes.js';
import {tasas} from './tasas.js';
const N=[['inicio','Inicio','🏠',inicio],['pacientes','Pacientes','🦷',pacientes],['citas','Citas','📅',citas],['inventario','Inventario','📦',inventario],['finanzas','Finanzas','💰',finanzas],['tasas','Tasas','💱',tasas]];
const root=$('#app');
function loginView(){
  root.innerHTML=`<div class="login"><form class="card lg"><div class="logo">🦷</div><h1>Clínica Odontológica</h1><p>Inicia sesión para continuar</p><label>Correo<input name="e" type="email" required autofocus></label><label>Contraseña<input name="p" type="password" required></label><button class="btn wide">Entrar</button></form></div>`;
  $('form').onsubmit=async ev=>{ev.preventDefault();const b=ev.submitter;b.disabled=true;
    try{await login(ev.target.e.value,ev.target.p.value);start()}catch(x){toast('Correo o contraseña incorrectos',1);b.disabled=false}};
}
function shell(){
  root.innerHTML=`<aside><div class="brand">🦷 Clínica</div><nav>${N.map(n=>`<a href="#/${n[0]}" data-r="${n[0]}"><i>${n[2]}</i><span>${n[1]}</span></a>`).join('')}</nav><button class="out">Cerrar sesión</button></aside><main><h2 id="h"></h2><div id="v"></div></main>`;
  $('.out').onclick=logout;
}
async function route(){
  const[r='inicio',id]=location.hash.slice(2).split('/');
  const n=N.find(x=>x[0]===r)||N[0];
  document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('on',a.dataset.r===n[0]));
  $('#h').textContent=n[1];const v=$('#v');v.innerHTML='';
  try{await n[3](v,id)}catch(e){v.innerHTML=`<div class="empty">No se pudo cargar: ${esc(e.message)}</div>`}
}
function start(){if(!authed()){loginView();return}shell();route()}
addEventListener('hashchange',()=>authed()&&$('#v')&&route());
start();
