import {$} from './ui.js';
import {historiaSucia} from './historia.js';

let deferredPrompt = null;
let userTriggeredUpdate = false;

export const isStandalone = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true ||
         document.referrer.includes('android-app://');
};

export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

// Comprobar si hay trabajo clínico o formularios en edición
function hayCambiosPendientes() {
  if (typeof historiaSucia === 'function' && historiaSucia()) return true;
  if (document.querySelector('.modal form, form.modal')) return true;
  return false;
}

// Toast para nueva versión disponible con skipWaiting
export function mostrarToastActualizacion(registration) {
  if (document.getElementById('pwa-update-toast')) return;
  const t = document.createElement('div');
  t.id = 'pwa-update-toast';
  t.className = 'pwa-toast';
  t.innerHTML = `
    <div class="pwa-toast-content">
      <span class="pwa-toast-dot"></span>
      <div>
        <b>Nueva versión disponible</b>
        <small>Actualización clínica con mejoras</small>
      </div>
    </div>
    <button class="btn sm" id="pwa-update-btn">Actualizar</button>
  `;
  document.body.appendChild(t);

  document.getElementById('pwa-update-btn').onclick = () => {
    if (hayCambiosPendientes()) {
      const salir = confirm('Tienes cambios sin guardar en la historia clínica o en un formulario. ¿Deseas actualizar ahora y descartar los cambios sin guardar?');
      if (!salir) return;
    }
    userTriggeredUpdate = true;
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  };
}

// Modal instructivo para iOS Safari
export function mostrarGuiaIOS() {
  const existing = document.getElementById('ios-guide-modal');
  if (existing) existing.remove();

  const ov = document.createElement('div');
  ov.id = 'ios-guide-modal';
  ov.className = 'ov';
  ov.innerHTML = `
    <div class="modal ios-guide">
      <div class="sh-h">
        <h3>Instalar Odonto Plus en iPhone / iPad</h3>
        <button type="button" class="btn ghost sm" data-x>✕</button>
      </div>
      <p class="mut">Sigue estos dos pasos sencillos en Safari para tener la app completa en tu pantalla de inicio:</p>
      <div class="ios-steps">
        <div class="ios-step">
          <div class="ios-step-num">1</div>
          <div class="ios-step-txt">
            Toca el botón <b>Compartir</b> en la barra inferior de Safari
            <span class="ios-icon-badge"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M12 2v13M16 6l-4-4-4 4"/></svg> Compartir</span>
          </div>
        </div>
        <div class="ios-step">
          <div class="ios-step-num">2</div>
          <div class="ios-step-txt">
            Desplaza hacia abajo y selecciona <b>Añadir a pantalla de inicio</b>
            <span class="ios-icon-badge"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/></svg> Añadir a pantalla de inicio</span>
          </div>
        </div>
      </div>
      <div class="row end">
        <button type="button" class="btn" data-x>Entendido</button>
      </div>
    </div>
  `;
  document.body.append(ov);
  ov.onclick = (e) => {
    if (e.target === ov || e.target.closest('[data-x]')) {
      ov.remove();
    }
  };
}

// Disparador de instalación según plataforma
export async function dispararInstalacion() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    actualizarBotonesInstalacion();
    return outcome === 'accepted';
  } else if (isIOS() && !isStandalone()) {
    mostrarGuiaIOS();
    return true;
  }
  return false;
}

export function actualizarBotonesInstalacion() {
  const instalada = isStandalone();
  const puedeInstalar = !instalada && (!!deferredPrompt || isIOS());
  
  document.querySelectorAll('.pwa-install-trigger').forEach(el => {
    if (instalada) {
      el.style.display = 'none';
    } else {
      el.style.display = puedeInstalar ? 'inline-flex' : 'none';
    }
  });
}

// Inicialización de Service Worker y eventos
export function initPWA() {
  // 1. Estado de conexión en tiempo real
  const updateNetStatus = () => {
    const online = navigator.onLine;
    const badge = document.getElementById('net-status-badge');
    if (badge) {
      badge.className = 'net-status ' + (online ? 'online' : 'offline');
      badge.title = online ? 'Conectado a la red' : 'Sin conexión a internet';
      badge.innerHTML = `<span class="net-dot"></span><span>${online ? 'En línea' : 'Sin conexión'}</span>`;
    }
  };

  window.addEventListener('online', updateNetStatus);
  window.addEventListener('offline', updateNetStatus);

  // 2. Evento beforeinstallprompt (Android / Chromium)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    actualizarBotonesInstalacion();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    actualizarBotonesInstalacion();
  });

  // 3. Registro del Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then((reg) => {
          // Si ya hay un SW esperando activación
          if (reg.waiting) {
            mostrarToastActualizacion(reg);
          }

          // Si se detecta una nueva versión en descarga
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  mostrarToastActualizacion(reg);
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn('[PWA] Error al registrar service worker:', err);
        });

      // Recargar cuando el nuevo service worker tome el control
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing && (userTriggeredUpdate || !hayCambiosPendientes())) {
          refreshing = true;
          window.location.reload();
        }
      });
    });
  }

  // Comprobar estado inicial
  setTimeout(() => {
    updateNetStatus();
    actualizarBotonesInstalacion();
  }, 100);
}
