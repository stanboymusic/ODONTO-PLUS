# ODONTO PLUS · Parche 2

## Qué incluye
1. **Historia clínica con el formato en papel de la doctora**: datos personales, motivo, anamnesis (Sí/No + detalle), anamnesis odontológica, odontodiagrama, observaciones, diagnóstico (con conteo automático de caries), pronóstico y plan.
2. **Odontodiagrama digital interactivo** (numeración FDI, dentición permanente y temporal): caries, obturación, sellante, fractura, endodoncia, corona, implante, brackets (con alambre), extracción indicada y ausente. Con deshacer. En celular se toca el diente y se abre una hoja grande para marcar.
3. **Periodontograma digital**: sondaje, recesión, sangrado, movilidad y furca por diente, con gráfico de barras y resumen (promedio, sitios ≥ 4 mm, % de sangrado).
4. **Compartir la historia**: descargar PDF, WhatsApp, correo (el PDF va adjunto, enviado desde el servidor) y «Compartir…» del teléfono. El PDF incluye odontodiagrama, periodontograma, tratamientos y abonos.
5. **Documentos legales**: módulo nuevo con categorías, fecha de vencimiento y avisos de «vence pronto / vencido».
6. **Citas con correo y calendario**: al agendar se pregunta el correo del paciente (queda guardado en su ficha). Paciente y doctora reciben la invitación (.ics + botón «Agregar a Google Calendar») y, 3 días antes, un recordatorio automático. Botones para agregar a tu Google Calendar y recordar por WhatsApp.
7. **Responsive**: se corrigió la barra inferior en celular (el estilo «premium» le ganaba al de móvil y la desbordaba, por eso se veía todo chiquito), las tablas pasan a tarjetas, los formularios son hojas inferiores y hay margen para el notch.
8. **Ajustes**: datos de la clínica (nombre, doctora, correo, zona horaria) y prueba de correo.
9. Arreglo extra: si navegabas rápido tras entrar, una pantalla lenta podía pisar a la siguiente.

## Cómo desplegarlo
1. Copia el contenido de este zip sobre el repo (o aplica `odonto-plus-parche-2.diff` con `git apply`).
2. Configura el correo en Fly (cuenta Gmail del consultorio con verificación en dos pasos y una *contraseña de aplicación*):
   `fly secrets set SMTP_USER="clinica@gmail.com" SMTP_PASS="xxxx xxxx xxxx xxxx" -a odonto-plus-db`
3. `fly deploy` (aplica solo la migración nueva, no toca datos) y sube `pb_public` a Vercel como siempre.
4. Entra a **Ajustes**, escribe el correo de la clínica, elige la zona horaria y toca **Enviar correo de prueba**.

## Notas
- Las citas se envían por correo con invitación .ics. Gmail y Google Calendar muestran el evento con botón para agregarlo (y lo agregan solos según la configuración de cada persona). No es una sincronización directa por API de Google.
- WhatsApp no permite adjuntar archivos por enlace: en computadora se descarga el PDF y se abre el chat para adjuntarlo; en teléfono usa «Compartir…» para enviarlo directo.
- Los recordatorios los revisa el servidor cada 15 minutos (`min_machines_running = 1` ya lo mantiene encendido).

---

# ODONTO PLUS · Parche 6 (PWA + Rediseño Editorial Impeccable + Emil Kowalski)

## Qué incluye
1. **PWA Instalable completa**:
   - `manifest.webmanifest`: configuración standalone, scope "/", nombre "Odonto Plus", paleta de color y tema marfil/teal.
   - Iconos generados en alta resolución: 192x192, 512x512, maskable 512x512 y Apple touch icon (180x180).
   - `sw.js`: precache automático del app shell, estrategia estricta network-first para PocketBase (`/api/*`) que **nunca** cachea datos de pacientes ni archivos clínicos.
   - `offline.html`: pantalla de respaldo serena y elegante con botón para reintentar y reconexión automática.
   - Flujo de actualización con toast "Nueva versión disponible · Actualizar" con `skipWaiting` controlado.
   - Botón/disparador de instalación compatible con Android, Chromium y guía modal interactiva paso a paso para iOS Safari.
   - Indicador discreto en tiempo real del estado de red (En línea / Sin conexión).
   - `vercel.json` con cabeceras `Cache-Control: no-cache` para el Service Worker y tipo de contenido para el manifiesto.

2. **Rediseño Editorial (Modo Impeccable: "Operate")**:
   - Identidad serena y precisa de clínica odontológica de alta gama, sin plantillas genéricas de IA.
   - Paleta curada en variables CSS: marfil porcelana (`--bg`), tinta verdosa oscura (`--ink`), verde-teal profundo (`--pri`), coral suave (`--coral`), verde éxito clínico (`--ok`) y acento dorado refinado (`--gold`). Soporte para modo oscuro con `prefers-color-scheme`.
   - Tipografía con carácter: serif editorial para títulos (*Fraunces*), sans limpia para interfaz (*Plus Jakarta Sans*), y números tabulares (`font-variant-numeric: tabular-nums`) en toda la contabilidad, resúmenes e historial.
   - Layout: sidebar fija en desktop y barra de navegación inferior móvil con 5 accesos ergonómicos (Pacientes, Citas, Inventario, Finanzas, Más con bottom sheet).
   - Touch targets ≥ 44px en toda la interfaz.
   - Tablas que pasan a tarjetas apiladas fluidas en móvil con jerarquía visual clara.
   - Odontodiagrama y periodontograma completamente responsivos y táctiles.
   - Skeletons de carga suaves con shimmer y empty states informativos con icono y llamado a la acción.

3. **Física de Movimiento (Emil Kowalski)**:
   - Microinteracciones táctiles `:active` con `scale(0.97–0.98)`.
   - Entradas de modales, sheets y toasts desde `scale(0.95)` + `opacity: 0` (nunca desde escala 0).
   - Transiciones estrictamente acotadas (sin `transition: all`) con cubic-bezier `(0.16, 1, 0.3, 1)` y respeto a `prefers-reduced-motion`.

---

# ODONTO PLUS · Parche 6.1 — Harden (revisión post-código)

## Qué corrige

1. **SW Network-first para todos los recursos locales** (riesgo de código obsoleto eliminado):
   - Eliminado `cache-first`. Todo JS/CSS/HTML usa **network-first**: el navegador siempre pide la versión más reciente; solo usa caché si no hay red.
   - El nombre de caché sigue versionado (`odonto-plus-shell-YYYYMMDD-harden`) para limpiar cachés viejos en activación.
   - `/api/*` y cross-origin nunca se interceptan.

2. **Contraste WCAG AA estricto** (≥ 4.5:1 en texto pequeño):
   - `--coral` y `--gold` solo como relleno/ícono, nunca como texto.
   - Nuevas variables de texto: `--coral-text: #ad3426` (5.67:1) y `--gold-text: #785712` (6.45:1).
   - `--mut: #41575a` garantiza ≥ 4.5:1 sobre fondo marfil y blanco.

3. **PDF e impresión siempre en modo claro**:
   - jsPDF usa colores RGB explícitos, nunca variables CSS.
   - `@media print` fuerza `--bg: #ffffff`, `--ink: #111111` y oculta nav/toasts/botones.

4. **Protección de trabajo sin guardar antes de actualizar**:
   - `hayCambiosPendientes()` en `pwa.js` detecta `historiaSucia()` y formularios modales abiertos.
   - Confirmación nativa antes de `skipWaiting` si hay datos sin guardar.
   - `hashchange` también bloquea la navegación si hay historia sucia.

5. **Flujo de actualización robusto**:
   - `userTriggeredUpdate` flag evita recarga automática si la doctora no inició la actualización y tiene trabajo activo.

