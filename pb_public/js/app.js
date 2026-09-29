import {authed,login,logout} from './api.js';
import {$,esc,toast} from './ui.js';
import {inicio,citas,inventario,finanzas} from './modulos.js';
import {pacientes} from './pacientes.js';
import {tasas} from './tasas.js';
const NAME='ODONTO PLUS';
const LOGO=`<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#15525a"/><path d="M16 6c-1.200 0-2 .5-4 .5C9.500 6.500 8 8.300 8 10.800c0 1.800.7 2.800 1 4.800.3 2.200.6 6.400 2.200 6.400 1.300 0 1.300-3.600 4.800-3.600s3.500 3.600 4.800 3.600c1.600 0 1.900-4.200 2.200-6.400.3-2 1-3 1-4.800 0-2.500-1.500-4.300-4-4.300-2 0-2.800-.5-4-.5z" fill="#fff"/><path d="M16 9.500v5M13.500 12h5" stroke="#c9a45c" stroke-width="1.800" stroke-linecap="round"/></svg>`;
const ic=p=>`<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const N=[
 ['inicio','Inicio',ic('<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'),inicio],
 ['pacientes','Pacientes',ic('<circle cx="9" cy="8" r="3.500"/><path d="M2.500 20c0-3.600 2.900-6 6.500-6s6.500 2.400 6.500 6M16 4.500a3.500 3.500 0 0 1 0 7M18 14.500c2.200.8 3.500 2.800 3.500 5.500"/>'),pacientes],
 ['citas','Citas',ic('<rect x="3.500" y="5" width="17" height="15.500" rx="2"/><path d="M8 3v4M16 3v4M3.500 10h17"/>'),citas],
 ['inventario','Inventario',ic('<path d="M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8"/>'),inventario],
 ['finanzas','Finanzas',ic('<circle cx="12" cy="12" r="9"/><path d="M14.800 9.200c-.5-1-1.600-1.500-2.800-1.500-1.600 0-2.800.8-2.800 2s1.200 1.700 2.800 2 2.800.8 2.800 2-1.200 2-2.800 2c-1.300 0-2.400-.6-2.900-1.600M12 6v1.700M12 16.300V18"/>'),finanzas],
 ['tasas','Tasas',ic('<path d="M4 8h14l-3-3M20 16H6l3 3"/>'),tasas]];
const root=$('#app');
function loginView(){
  document.title=NAME;
  root.innerHTML=`<div class="login"><form class="card lg"><div class="lgo">${LOGO}</div><h1>${NAME}</h1><div class="tag">GESTIÓN CLÍNICA</div><label>Correo<input name="e" type="email" required autofocus></label><label>Contraseña<input name="p" type="password" required></label><button class="btn wide">Entrar</button></form></div>`;
  $('form').onsubmit=async ev=>{ev.preventDefault();const b=ev.submitter;b.disabled=true;
    try{await login(ev.target.e.value,ev.target.p.value);start()}catch(x){toast('Correo o contraseña incorrectos',1);b.disabled=false}};
}
function shell(){
  root.innerHTML=`<aside><div class="brand">${LOGO}<div><b>${NAME}</b><small>Gestión clínica</small></div></div><nav>${N.map(n=>`<a href="#/${n[0]}" data-r="${n[0]}">${n[2]}<span>${n[1]}</span></a>`).join('')}</nav><button class="out">Cerrar sesión</button></aside><main><div class="mtop">${LOGO}${NAME}</div><h2 id="h"></h2><div id="v"></div></main>`;
  $('.out').onclick=logout;
}
async function route(){
  const[r='inicio',id]=location.hash.slice(2).split('/');
  const n=N.find(x=>x[0]===r)||N[0];
  document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('on',a.dataset.r===n[0]));
  $('#h').textContent=n[1];document.title=`${NAME} · ${n[1]}`;const v=$('#v');v.innerHTML='';
  try{await n[4-1](v,id)}catch(e){v.innerHTML=`<div class="empty">No se pudo cargar: ${esc(e.message)}</div>`}
}
function start(){if(!authed()){loginView();return}shell();route()}
addEventListener('hashchange',()=>authed()&&$('#v')&&route());
start();
