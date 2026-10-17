const BASE=(typeof window!=='undefined'&&window.ODONTO_API)||'https://odonto-plus-db.fly.dev';
let token=localStorage.getItem('t')||'';

// ── Gestión de inactividad ────────────────────────────────────────────────────
// La sesión se cierra a los 20 min sin actividad. El control se basa en una
// MARCA DE TIEMPO guardada en localStorage (no solo en un setTimeout), así que
// también funciona si se cerró la pestaña/navegador o el equipo estuvo dormido.
const TIMEOUT_MS = 20 * 60 * 1000; // 20 minutos
const KEEP_KEY = 'mantener_sesion';
const ACT_KEY = 'ultima_actividad';
let _tick = null, _lastWrite = 0;

const _mantener = () => localStorage.getItem(KEEP_KEY) === '1';
const _ultima = () => Number(localStorage.getItem(ACT_KEY)) || 0;

function _marcar(force) {
  const n = Date.now();
  if (force || n - _lastWrite > 5000) { // máx. 1 escritura cada 5 s
    _lastWrite = n;
    try { localStorage.setItem(ACT_KEY, String(n)); } catch (e) {}
  }
}

// Sin marca previa (sesiones viejas) cuenta como vencida.
function _vencida() {
  if (!token || _mantener()) return false;
  return Date.now() - _ultima() > TIMEOUT_MS;
}

function _revisar() {
  if (_vencida()) logout(true);
}

function _onActividad() {
  if (!token) return;
  if (_vencida()) { logout(true); return; } // volvió tras dormir/suspender
  _marcar();
}

// Al cargar la app: si hay token pero la sesión ya venció, se descarta en silencio.
if (token && _vencida()) {
  localStorage.removeItem('t');
  token = '';
}

if (typeof window !== 'undefined') {
  ['mousemove','keydown','touchstart','click','scroll'].forEach(ev => {
    window.addEventListener(ev, _onActividad, { passive: true });
  });
  // Al volver a la pestaña / reanudar el equipo, revisar de inmediato
  document.addEventListener('visibilitychange', () => { if (!document.hidden) _revisar(); });
  window.addEventListener('focus', _revisar);
  window.addEventListener('pageshow', _revisar);
  // Si otra pestaña cierra sesión, esta también
  window.addEventListener('storage', e => {
    if (e.key === 't' && !e.newValue && token) { token = ''; location.hash = ''; location.reload(); }
  });
}

export function iniciarIdleTimer() {
  if (!token) return;
  if (!_ultima()) _marcar(true);
  if (!_tick) _tick = setInterval(_revisar, 15000); // red de seguridad
}
export function detenerIdleTimer() { if (_tick) { clearInterval(_tick); _tick = null; } }
export function marcarActividad() { _marcar(true); }
// ─────────────────────────────────────────────────────────────────────────────

export const authed=()=>!!token;
export const logout=(auto=false)=>{
  const esAuto = auto === true; // evita que un click (evento) cuente como cierre automático
  detenerIdleTimer();
  localStorage.removeItem('t');
  localStorage.removeItem(ACT_KEY);
  token='';
  if (esAuto) {
    if (document.getElementById('idle-overlay')) return;
    const msg = document.createElement('div');
    msg.id='idle-overlay';
    msg.style.cssText='position:fixed;inset:0;background:rgba(249,248,245,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;z-index:9999;font-family:var(--font-sans,system-ui)';
    msg.innerHTML='<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#0d4b52" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg><p style="font-size:1.05rem;color:#112325;text-align:center;max-width:280px;margin:0">Sesión cerrada por inactividad.<br><small style="color:#41575a">Inicia sesión de nuevo para continuar.</small></p>';
    document.body.appendChild(msg);
    setTimeout(()=>{location.hash='';location.reload();},1800);
  } else {
    location.hash='';location.reload();
  }
};
async function req(path,opt={}){
  const h={};if(!(opt.body instanceof FormData))h['Content-Type']='application/json';
  if(token)h.Authorization=token;
  const r=await fetch(BASE+'/api/'+path,{...opt,headers:h});
  if(r.status===401&&!path.includes('auth-with'))logout();
  if(!r.ok){const e=await r.json().catch(()=>({}));const d=e.data&&Object.values(e.data).map(x=>x.message).join(', ');throw new Error(d||e.message||'Error '+r.status)}
  return r.status===204?null:r.json();
}
export async function login(email,pw){
  const d=await req('collections/users/auth-with-password',{method:'POST',body:JSON.stringify({identity:email,password:pw})});
  token=d.token;localStorage.setItem('t',token);
  _marcar(true);iniciarIdleTimer(); // arrancar control de inactividad tras login
}
export const list=(c,q={})=>req(`collections/${c}/records?`+new URLSearchParams({perPage:500,...q})).then(d=>d.items);
export const one=(c,id)=>req(`collections/${c}/records/${id}`);
export function save(c,id,data){
  const file=Object.values(data).some(v=>v instanceof File);
  let body=JSON.stringify(data);
  if(file){body=new FormData();for(const[k,v]of Object.entries(data))body.append(k,v)}
  return req(`collections/${c}/records${id?'/'+id:''}`,{method:id?'PATCH':'POST',body});
}
export const del=(c,id)=>req(`collections/${c}/records/${id}`,{method:'DELETE'});
export const ftoken=()=>req('files/token',{method:'POST'}).then(d=>d.token);
export const fileUrl=(r,t)=>`${BASE}/api/files/${r.collectionId}/${r.id}/${r.archivo}?token=${t}`;
export const clinica=async()=>{const r=await list('clinica',{sort:'created',perPage:1});return r[0]||null};
export const estadoCorreo=()=>req('odonto/estado');
export const pruebaCorreo=()=>req('odonto/prueba',{method:'POST',body:'{}'});
export const enviarHistoria=fd=>req('odonto/enviar-historia',{method:'POST',body:fd});
