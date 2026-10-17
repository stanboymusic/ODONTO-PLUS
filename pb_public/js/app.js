import {authed,login,logout,iniciarIdleTimer} from './api.js';
import {$,esc,toast} from './ui.js';
import {inicio,citas,inventario,finanzas} from './modulos.js';
import {pacientes} from './pacientes.js';
import {tasas} from './tasas.js';
import {documentos} from './documentos.js';
import {ajustes} from './ajustes.js';
import {historiaSucia,limpiarSucio} from './historia.js';
import {initPWA,dispararInstalacion,actualizarBotonesInstalacion} from './pwa.js';

const NAME='Odonto Plus';
const LOGO=`<svg viewBox="0 0 32 32" aria-hidden="true" class="logo-svg"><rect width="32" height="32" rx="8" fill="#0d4b52"/><path d="M16 6c-1.200 0-2 .5-4 .5C9.500 6.500 8 8.300 8 10.800c0 1.800.7 2.800 1 4.800.3 2.200.6 6.400 2.200 6.400 1.300 0 1.300-3.600 4.800-3.600s3.500 3.600 4.800 3.600c1.600 0 1.900-4.200 2.200-6.400.3-2 1-3 1-4.800 0-2.500-1.500-4.300-4-4.300-2 0-2.800-.5-4-.5z" fill="#fff"/><path d="M16 9.500v5M13.500 12h5" stroke="#c9a45c" stroke-width="1.800" stroke-linecap="round"/></svg>`;

const ic=p=>`<svg viewBox="0 0 24 24" aria-hidden="true" class="nav-ic">${p}</svg>`;

const N=[
  ['inicio','Inicio',ic('<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'),inicio],
  ['pacientes','Pacientes',ic('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2.2.8 3.5 2.8 3.5 5.5"/>'),pacientes],
  ['citas','Citas',ic('<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M8 3v4M16 3v4M3.5 10h17"/>'),citas],
  ['documentos','Documentos',ic('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h6"/>'),documentos],
  ['inventario','Inventario',ic('<path d="M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8"/>'),inventario],
  ['finanzas','Finanzas',ic('<circle cx="12" cy="12" r="9"/><path d="M14.8 9.2c-.5-1-1.6-1.5-2.8-1.5-1.6 0-2.8.8-2.8 2s1.2 1.7 2.8 2 2.8.8 2.8 2-1.2 2-2.8 2c-1.3 0-2.4-.6-2.9-1.6M12 6v1.7M12 16.3V18"/>'),finanzas],
  ['tasas','Tasas',ic('<path d="M4 8h14l-3-3M20 16H6l3 3"/>'),tasas],
  ['ajustes','Ajustes',ic('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),ajustes]
];

// 5 accesos directos para la barra móvil
const MOBILE_MAIN_ROUTES = ['pacientes', 'citas', 'inventario', 'finanzas'];

const icMas = ic('<circle cx="12" cy="12" r="1.5"/><circle cx="6" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/>');
const icInstalar = ic('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>');

const root=$('#app');

function skeletonHTML() {
  return `
    <div class="skeleton-wrap">
      <div class="skeleton-bar"></div>
      <div class="skeleton-grid">
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
      </div>
      <div class="skeleton-table"></div>
    </div>
  `;
}

function loginView(){
  document.title=NAME;
  root.innerHTML=`
    <div class="login">
      <form class="card lg">
        <div class="lgo">${LOGO}</div>
        <h1>${NAME}</h1>
        <div class="tag">GESTIÓN CLÍNICA</div>
        <label>Correo<input name="e" type="email" required autofocus placeholder="doctora@clinica.com"></label>
        <label>Contraseña<input name="p" type="password" required placeholder="••••••••"></label>
        <button class="btn wide">Entrar al consultorio</button>
      </form>
    </div>
  `;
  $('form').onsubmit=async ev=>{
    ev.preventDefault();
    const b=ev.submitter;
    b.disabled=true;
    b.textContent='Verificando…';
    try {
      await login(ev.target.e.value,ev.target.p.value);
      start();
    } catch(x) {
      toast('Correo o contraseña incorrectos',1);
      b.disabled=false;
      b.textContent='Entrar al consultorio';
    }
  };
}

function abrirMenuMas() {
  const existing = $('#sheet-mas');
  if (existing) { existing.remove(); return; }

  const sheet = document.createElement('div');
  sheet.id = 'sheet-mas';
  sheet.className = 'ov mobile-sheet-ov';
  sheet.innerHTML = `
    <div class="modal mobile-sheet">
      <div class="mobile-sheet-header">
        <div class="sheet-drag-handle"></div>
        <div class="sh-h">
          <h3>Más opciones</h3>
          <button type="button" class="btn ghost sm" data-x>✕</button>
        </div>
      </div>
      <div class="mobile-sheet-grid">
        <a href="#/inicio" class="sheet-item" data-r="inicio">
          ${N[0][2]}
          <span>Inicio</span>
        </a>
        <a href="#/documentos" class="sheet-item" data-r="documentos">
          ${N[3][2]}
          <span>Documentos</span>
        </a>
        <a href="#/tasas" class="sheet-item" data-r="tasas">
          ${N[6][2]}
          <span>Tasas</span>
        </a>
        <a href="#/ajustes" class="sheet-item" data-r="ajustes">
          ${N[7][2]}
          <span>Ajustes</span>
        </a>
      </div>

      <div class="sheet-actions">
        <button type="button" class="btn ghost wide pwa-install-trigger" id="btn-instalar-sheet" style="display:none">
          ${icInstalar} <span>Instalar app en este teléfono</span>
        </button>
        <div class="sheet-net-row">
          <div id="net-status-sheet" class="net-status"></div>
        </div>
        <button type="button" class="out wide" id="sheet-logout">Cerrar sesión</button>
      </div>
    </div>
  `;
  document.body.appendChild(sheet);

  // Sincronizar indicador de red en el sheet
  const netBadge = $('#net-status-badge');
  const netSheet = $('#net-status-sheet');
  if (netBadge && netSheet) {
    netSheet.innerHTML = netBadge.innerHTML;
    netSheet.className = netBadge.className;
  }

  // Comprobar si se puede instalar
  actualizarBotonesInstalacion();

  sheet.onclick = (e) => {
    if (e.target === sheet || e.target.closest('[data-x]')) {
      sheet.remove();
    }
    const link = e.target.closest('.sheet-item');
    if (link) {
      sheet.remove();
    }
  };

  const btnInst = sheet.querySelector('#btn-instalar-sheet');
  if (btnInst) {
    btnInst.onclick = async () => {
      sheet.remove();
      await dispararInstalacion();
    };
  }

  sheet.querySelector('#sheet-logout').onclick = logout;
}

function shell(){
  root.innerHTML = `
    <!-- Sidebar fija para Desktop -->
    <aside id="main-sidebar">
      <div class="brand">
        ${LOGO}
        <div>
          <b>${NAME}</b>
          <small>Gestión clínica</small>
        </div>
      </div>

      <div class="sidebar-status-wrap">
        <div id="net-status-badge" class="net-status online">
          <span class="net-dot"></span>
          <span>En línea</span>
        </div>
      </div>

      <nav class="desktop-nav">
        <div class="nav-section-title">Clínica</div>
        <a href="#/inicio" data-r="inicio">${N[0][2]}<span>${N[0][1]}</span></a>
        <a href="#/pacientes" data-r="pacientes">${N[1][2]}<span>${N[1][1]}</span></a>
        <a href="#/citas" data-r="citas">${N[2][2]}<span>${N[2][1]}</span></a>
        <a href="#/documentos" data-r="documentos">${N[3][2]}<span>${N[3][1]}</span></a>

        <div class="nav-section-title">Operación</div>
        <a href="#/inventario" data-r="inventario">${N[4][2]}<span>${N[4][1]}</span></a>
        <a href="#/finanzas" data-r="finanzas">${N[5][2]}<span>${N[5][1]}</span></a>
        <a href="#/tasas" data-r="tasas">${N[6][2]}<span>${N[6][1]}</span></a>
        <a href="#/ajustes" data-r="ajustes">${N[7][2]}<span>${N[7][1]}</span></a>
      </nav>

      <div class="sidebar-footer">
        <button type="button" class="btn ghost sm pwa-install-trigger" id="btn-instalar-sidebar" style="display:none">
          ${icInstalar} <span>Instalar app</span>
        </button>
        <button class="out" id="btn-logout">Cerrar sesión</button>
      </div>
    </aside>

    <!-- Barra de navegación inferior móvil (5 accesos directos) -->
    <nav class="mobile-bottom-nav" id="mobile-nav">
      <a href="#/pacientes" data-r="pacientes">
        ${N[1][2]}
        <span>Pacientes</span>
      </a>
      <a href="#/citas" data-r="citas">
        ${N[2][2]}
        <span>Citas</span>
      </a>
      <a href="#/inventario" data-r="inventario">
        ${N[4][2]}
        <span>Inventario</span>
      </a>
      <a href="#/finanzas" data-r="finanzas">
        ${N[5][2]}
        <span>Finanzas</span>
      </a>
      <button type="button" class="nav-item-btn" id="btn-nav-mas" data-r="mas">
        ${icMas}
        <span>Más</span>
      </button>
    </nav>

    <!-- Contenedor principal -->
    <main>
      <header class="top-header">
        <div class="mtop">
          ${LOGO}
          <div class="mtop-text">
            <b>${NAME}</b>
            <small>Consultorio</small>
          </div>
        </div>
        <div class="top-header-right">
          <button type="button" class="btn sm ghost pwa-install-trigger header-install-btn" id="btn-instalar-header" style="display:none">
            ${icInstalar} <span class="d-none-mobile">Instalar app</span>
          </button>
        </div>
      </header>

      <div class="page-title-row">
        <h2 id="h"></h2>
      </div>

      <div id="v"></div>
    </main>
  `;

  $('#btn-logout').onclick = logout;
  
  $('#btn-nav-mas').onclick = abrirMenuMas;

  const btnInstSide = $('#btn-instalar-sidebar');
  if (btnInstSide) btnInstSide.onclick = dispararInstalacion;
  const btnInstHead = $('#btn-instalar-header');
  if (btnInstHead) btnInstHead.onclick = dispararInstalacion;

  initPWA();
}

async function route(){
  const [r='inicio', id] = location.hash.slice(2).split('/');
  const n = N.find(x => x[0] === r) || N[0];

  // Marcar enlace activo en Desktop Nav
  document.querySelectorAll('.desktop-nav a').forEach(a => {
    a.classList.toggle('on', a.dataset.r === n[0]);
  });

  // Marcar enlace activo en Mobile Bottom Nav
  const esPrincipalMovil = MOBILE_MAIN_ROUTES.includes(n[0]);
  document.querySelectorAll('.mobile-bottom-nav a').forEach(a => {
    a.classList.toggle('on', a.dataset.r === n[0]);
  });
  const btnMas = $('#btn-nav-mas');
  if (btnMas) {
    btnMas.classList.toggle('on', !esPrincipalMovil);
  }

  $('#h').textContent = n[1];
  document.title = `${NAME} · ${n[1]}`;

  const old = $('#v');
  const v = document.createElement('div');
  v.id = 'v';
  v.innerHTML = skeletonHTML();
  old.replaceWith(v);

  try {
    await n[3](v, id);
  } catch(e) {
    v.innerHTML = `
      <div class="card empty-card">
        <div class="empty-icon">⚠️</div>
        <h3>No se pudo cargar la vista</h3>
        <p class="mut">${esc(e.message)}</p>
        <button class="btn sm" onclick="location.reload()">Reintentar</button>
      </div>
    `;
  }
}

function start(){
  if(!authed()){
    loginView();
    return;
  }
  iniciarIdleTimer(); // arrancar timer de inactividad al entrar
  shell();
  route();
}

let prev=location.hash,ign=false;
addEventListener('hashchange',()=>{
  if(ign){ign=false;return;}
  if(historiaSucia()){
    if(!confirm('Tienes cambios sin guardar en la historia clínica. ¿Salir sin guardar?')){
      ign=true;
      location.hash=prev;
      return;
    }
    limpiarSucio();
  }
  prev=location.hash;
  authed()&&$('#v')&&route();
});

start();
