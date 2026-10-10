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
