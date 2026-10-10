import {list,clinica,enviarHistoria} from './api.js';
import {esc,toast,fd,edad,money,emailOk} from './ui.js';
import {dibujoOdonto,resumen as resOd,resumenTxt as txtOd,norm as normOd,hayTemporales,SUPERFICIES,DIENTE} from './odonto.js';
import {dibujoPerio,resumen as resPd,resumenTxt as txtPd,norm as normPd} from './perio.js';
import {usd} from './tasas.js';
import {ANAM,ANAM_OD} from './preguntas.js';
import {waNumero} from './calendario.js';

// ---------- Utilidades ----------
let _jp;
function cargarJsPDF(){
  if(window.jspdf)return Promise.resolve(window.jspdf.jsPDF);
  return _jp||(_jp=new Promise((ok,ko)=>{
    const s=document.createElement('script');s.src=new URL('./vendor/jspdf.umd.min.js',import.meta.url).href;
    s.onload=()=>window.jspdf?ok(window.jspdf.jsPDF):(_jp=null,ko(new Error('No se pudo iniciar el generador de PDF')));
    s.onerror=()=>{_jp=null;ko(new Error('No se pudo cargar el generador de PDF. Revisa tu conexión.'))};
    document.head.append(s);
  }));
}
// Las fuentes estándar del PDF solo entienden Latin-1: se reemplazan los símbolos fuera de ese rango
const L=s=>String(s??'').replace(/[–—]/g,'-').replace(/[“”]/g,'"').replace(/[‘’]/g,"'").replace(/…/g,'...').replace(/≥/g,'>=').replace(/→/g,'->').replace(/[^\x09\x0A\x20-\x7E\u00A0-\u00FF]/g,'?');
export async function rasterizar(svg,escala=2.5){
  const w=+/width="([\d.]+)"/.exec(svg)[1],h=+/height="([\d.]+)"/.exec(svg)[1];
  const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
  try{
    const img=new Image();
    await new Promise((ok,ko)=>{img.onload=ok;img.onerror=()=>ko(new Error('No se pudo dibujar el odontodiagrama'));img.src=url});
    const c=document.createElement('canvas');c.width=Math.round(w*escala);c.height=Math.round(h*escala);
    const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);
    return {url:c.toDataURL('image/jpeg',0.93),w,h};
  }finally{URL.revokeObjectURL(url)}
}
export const nombreArchivo=p=>'Historia-'+(String(p.nombre||'paciente').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\w\- ]/g,'').trim().replace(/\s+/g,'-')||'paciente')+'.pdf';

// ---------- PDF ----------
export async function construirPDF(p,id){
  const [jsPDF,cl,T,P]=await Promise.all([cargarJsPDF(),clinica().catch(()=>null),list('tratamientos',{filter:`paciente="${id}"`,sort:'fecha,created'}),list('pagos',{filter:`paciente="${id}"`,sort:'fecha,created'})]);
  const C={nombre:cl?.nombre||'ODONTO PLUS',doctora:cl?.doctora||'',telefono:cl?.telefono||'',direccion:cl?.direccion||''};
  const od=normOd(p.odontograma),pd=normPd(p.periodontograma);
  const doc=new jsPDF({unit:'mm',format:'a4'}),PW=210,PH=297,M=14,CWID=PW-2*M;
  let y=0;
  const color=(r,g,b)=>doc.setTextColor(r,g,b);
  const ensure=h=>{if(y+h>PH-18){doc.addPage();y=16}};
  const titulo=t=>{ensure(14);y+=4;doc.setFont('helvetica','bold');doc.setFontSize(11);color(15,58,65);doc.text(L(t),M,y);doc.setDrawColor(201,164,92);doc.setLineWidth(.5);doc.line(M,y+1.6,M+CWID,y+1.6);y+=7};
  const parrafo=(t,{bold=false,size=10,gris=false}={})=>{
    doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);gris?color(107,123,126):color(21,40,43);
    for(const ln of doc.splitTextToSize(L(t),CWID)){ensure(5);doc.text(ln,M,y);y+=4.8}
  };
  const campo=(k,v,x,w)=>{doc.setFont('helvetica','bold');doc.setFontSize(8);color(107,123,126);doc.text(L(k).toUpperCase(),x,y);doc.setFont('helvetica','normal');doc.setFontSize(10);color(21,40,43);
    const ls=doc.splitTextToSize(L(v||'-'),w);doc.text(ls,x,y+4.4);return 4.4+ls.length*4.6};
  const etiqueta=k=>{ensure(12);doc.setFont('helvetica','bold');doc.setFontSize(8);color(107,123,126);doc.text(L(k).toUpperCase(),M,y);y+=4.4};
  const parejas=filas=>{for(let i=0;i<filas.length;i+=2){ensure(14);const a=campo(...filas[i],M,CWID/2-4),b=filas[i+1]?campo(...filas[i+1],M+CWID/2,CWID/2):0;y+=Math.max(a,b)+2}};

  // Encabezado
  doc.setFillColor(15,58,65);doc.rect(0,0,PW,26,'F');doc.setFillColor(201,164,92);doc.rect(0,26,PW,1,'F');
  doc.setFont('times','bold');doc.setFontSize(18);color(255,255,255);doc.text(L(C.nombre.toUpperCase()),M,12);
  doc.setFont('helvetica','normal');doc.setFontSize(9);color(190,214,217);
  doc.text(L([C.doctora,C.telefono].filter(Boolean).join('  |  ')||'Gestión clínica odontológica'),M,19);
  doc.text('Emitida: '+fd(new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString()),PW-M,19,{align:'right'});
  y=38;doc.setFont('helvetica','bold');doc.setFontSize(14);color(15,58,65);doc.text('HISTORIA CLINICA ODONTOLOGICA',PW/2,y,{align:'center'});y+=4;

  titulo('Datos personales');
  parejas([['Nombres y apellidos',p.nombre],['C.I.',p.cedula],['Sexo',p.sexo],['Fecha de nacimiento',fd(p.fecha_nac)+(p.fecha_nac?`  (${edad(p.fecha_nac)})`:'')],['Ocupación',p.ocupacion],['Teléfono',p.telefono],['Correo',p.email],['Dirección',p.direccion]]);
  if(p.motivo){etiqueta('Motivo de la consulta');parrafo(p.motivo)}

  const preguntas=(lista,datos)=>{
    const d=datos&&typeof datos==='object'?datos:{};
    for(const[k,q]of lista){
      const r=d[k]||{},resp=r.v==='si'?'SI'+(r.d?`: ${r.d}`:''):r.v==='no'?'NO':'Sin responder';
      const ls=doc.splitTextToSize(L(resp),CWID*0.38);ensure(Math.max(6,ls.length*4.6+2));
      doc.setFont('helvetica','normal');doc.setFontSize(9.5);color(21,40,43);doc.text(L(q),M,y);
      doc.setFont('helvetica',r.v==='si'?'bold':'normal');r.v==='si'?color(194,65,12):color(21,40,43);doc.text(ls,M+CWID*0.62,y);
      doc.setDrawColor(227,233,232);doc.setLineWidth(.2);y+=Math.max(1,(ls.length-1)*4.6)+2.2;doc.line(M,y-1.2,M+CWID,y-1.2);y+=2.2;
    }
  };
  titulo('Anamnesis');preguntas(ANAM,p.anamnesis);
  titulo('Anamnesis odontológica');preguntas(ANAM_OD,p.anam_odonto);

  // Odontodiagrama
  const temporal=hayTemporales(od);
  const img=await rasterizar(dibujoOdonto(od,{temporal,inter:false}));
  const ih=CWID*img.h/img.w;
  ensure(ih+30);titulo('Odontodiagrama');
  doc.addImage(img.url,'JPEG',M,y,CWID,ih,undefined,'FAST');y+=ih+3;
  // leyenda
  let lx=M;doc.setFontSize(7.5);doc.setFont('helvetica','normal');
  for(const[,v]of[...Object.entries(SUPERFICIES),...Object.entries(DIENTE)]){
    const w=doc.getTextWidth(L(v.n))+7;if(lx+w>M+CWID){lx=M;y+=4.5;ensure(5)}
    const r=parseInt(v.c.slice(1,3),16),g=parseInt(v.c.slice(3,5),16),b=parseInt(v.c.slice(5,7),16);
    doc.setFillColor(r,g,b);doc.rect(lx,y-2.4,3,3,'F');color(64,85,90);doc.text(L(v.n),lx+4.2,y);lx+=w+2;
  }
  y+=5;
  const rs=txtOd(resOd(od));if(rs)parrafo('Resumen: '+rs,{size:9,gris:true});

  if(Object.keys(pd.teeth).length){
    const ausentes=i=>(od.teeth[i]?.f||[]).includes('aus');
    const ip=await rasterizar(dibujoPerio(pd,{ausentes,inter:false}),2.2),hp=CWID*ip.h/ip.w;
    ensure(hp+24);titulo('Periodontograma');
    doc.addImage(ip.url,'JPEG',M,y,CWID,hp,undefined,'FAST');y+=hp+3;
    const t=txtPd(resPd(pd,ausentes));if(t)parrafo(t,{size:9,gris:true});
  }

  // Observaciones y diagnóstico
  titulo('Observaciones y diagnóstico');
  const nCaries=resOd(od).caries;
  if(p.observaciones){etiqueta('Observaciones');parrafo(p.observaciones)}
  parejas([['Diagnóstico: caries',String(nCaries)],['Cálculo general',p.calculo]]);
  if(p.diagnostico){etiqueta('Diagnóstico');parrafo(p.diagnostico)}
  if(p.pronostico){y+=1;etiqueta('Pronóstico');parrafo(p.pronostico)}
  if(p.tratamiento){y+=1;etiqueta('Plan de tratamiento');parrafo(p.tratamiento)}

  // Tratamientos y abonos
  const filas=[
    ...T.filter(t=>t.estado==='Realizado').map(t=>({f:(t.fecha||t.created||'').slice(0,10),d:t.descripcion,m:t.costo||0,tipo:'T'})),
    ...P.map(a=>({f:(a.fecha||'').slice(0,10),d:'Abono'+(a.moneda&&a.moneda!=='USD'?` (${money(a.monto,a.moneda)} a tasa ${a.tasa||'-'})`:'')+(a.nota?` - ${a.nota}`:''),m:usd(a),tipo:'A'}))
  ].sort((a,b)=>a.f.localeCompare(b.f));
  titulo('Tratamientos realizados y abonos');
  if(filas.length){
    const X=[M,M+26,M+CWID-30],hdr=()=>{ensure(10);doc.setFillColor(15,58,65);doc.rect(M,y-4,CWID,6.5,'F');doc.setFont('helvetica','bold');doc.setFontSize(8.5);color(255,255,255);doc.text('FECHA',X[0]+2,y);doc.text('TRATAMIENTO / ABONO',X[1]+2,y);doc.text('MONTO (USD)',M+CWID-2,y,{align:'right'});y+=6};
    hdr();
    filas.forEach((r,i)=>{
      const ls=doc.splitTextToSize(L(r.d),X[2]-X[1]-4),h=Math.max(6,ls.length*4.5+2);
      if(y+h>PH-18){doc.addPage();y=16;hdr()}
      if(i%2===0){doc.setFillColor(244,247,246);doc.rect(M,y-4,CWID,h,'F')}
      doc.setFont('helvetica','normal');doc.setFontSize(9);color(21,40,43);
      doc.text(fd(r.f),X[0]+2,y);doc.text(ls,X[1]+2,y);
      r.tipo==='A'?color(31,138,91):color(21,40,43);doc.text(L(money(r.m)),M+CWID-2,y,{align:'right'});
      y+=h;
    });
  }else parrafo('Aún no hay tratamientos realizados ni abonos registrados.',{gris:true});
  const pend=T.filter(t=>t.estado!=='Realizado');
  if(pend.length){y+=2;parrafo('Pendientes por realizar: '+pend.map(t=>t.descripcion+(t.costo?` (${money(t.costo)})`:'')).join('; '),{size:9,gris:true})}
  const pres=T.reduce((s,t)=>s+(t.costo||0),0),ab=P.reduce((s,a)=>s+usd(a),0);
  ensure(16);y+=3;doc.setFont('helvetica','bold');doc.setFontSize(9.5);color(21,40,43);
  doc.text(L(`Presupuesto: ${money(pres)}     Abonado: ${money(ab)}     Pendiente: ${money(pres-ab)}`),M+CWID,y,{align:'right'});

  // Pie de página
  const n=doc.getNumberOfPages();
  for(let i=1;i<=n;i++){doc.setPage(i);doc.setDrawColor(227,233,232);doc.setLineWidth(.3);doc.line(M,PH-12,PW-M,PH-12);doc.setFont('helvetica','normal');doc.setFontSize(8);color(107,123,126);
    doc.text(L(`${C.nombre} · Historia clínica de ${p.nombre||''}`),M,PH-7);doc.text(`Página ${i} de ${n}`,PW-M,PH-7,{align:'right'})}
  return {doc,blob:doc.output('blob'),nombre:nombreArchivo(p),clinica:C};
}

// ---------- Compartir ----------
const puedeCompartirArchivos=()=>{try{return !!(navigator.canShare&&navigator.share&&navigator.canShare({files:[new File(['x'],'x.pdf',{type:'application/pdf'})]}))}catch(e){return false}};
function descargar(blob,nombre){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=nombre;document.body.append(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}

export async function compartir(p,id){
  const ov=document.createElement('div');ov.className='ov';
  const nom1=String(p.nombre||'').split(' ')[0];
  ov.innerHTML=`<div class="modal"><h3>Compartir historia clínica</h3><p class="mut" style="margin:0">El PDF incluye el odontodiagrama${Object.keys(normPd(p.periodontograma).teeth).length?' y el periodontograma':''}.</p>
  <div class="shg"><button type="button" data-a="pdf">📄<b>Descargar PDF</b></button><button type="button" data-a="wa">💬<b>WhatsApp</b></button><button type="button" data-a="mail">✉️<b>Correo (Gmail)</b></button>${puedeCompartirArchivos()?'<button type="button" data-a="share">📤<b>Compartir…</b><small>WhatsApp, Gmail y más</small></button>':''}</div>
  <div class="shf"></div><div class="shs mut" aria-live="polite"></div><div class="row end"><button type="button" class="btn ghost" data-x>Cerrar</button></div></div>`;
  document.body.append(ov);
  const f=ov.querySelector('.shf'),st=ov.querySelector('.shs');let cache=null;
  const pdf=async()=>{if(cache)return cache;st.textContent='Generando PDF…';try{cache=await construirPDF(p,id)}finally{st.textContent=''}return cache};
  const ocupado=(b,on)=>{ov.querySelectorAll('button').forEach(x=>x.disabled=on&&x!==b)};
  const nombreClin=()=>cache?.clinica.nombre||'ODONTO PLUS';
  ov.onclick=async e=>{
    if(e.target===ov||e.target.closest('[data-x]')){ov.remove();return}
    const b=e.target.closest('[data-a]');if(!b)return;
    const a=b.dataset.a;
    try{
      if(a==='pdf'){ocupado(b,1);const r=await pdf();descargar(r.blob,r.nombre);toast('PDF descargado')}
      else if(a==='share'){ocupado(b,1);const r=await pdf();const file=new File([r.blob],r.nombre,{type:'application/pdf'});
        try{await navigator.share({files:[file],title:'Historia clínica',text:`Historia clínica de ${p.nombre||''}`})}catch(x){if(x.name!=='AbortError')throw x}}
      else if(a==='wa'){
        f.innerHTML=`<label>Número de WhatsApp<input type="tel" inputmode="tel" id="wn" value="${esc(waNumero(p.telefono))}" placeholder="Ej.: 584141234567"><small class="hint">Con código de país, sin + ni espacios. En WhatsApp tendrás que adjuntar el PDF que se descarga.</small></label><div class="row end"><button type="button" class="btn" data-go="wa">Abrir WhatsApp</button></div>`;f.querySelector('#wn').focus()}
      else if(a==='mail'){
        f.innerHTML=`<label>Para<input type="email" id="mp" value="${esc(p.email||'')}" placeholder="correo@gmail.com" autocapitalize="off"></label><label>Asunto<input id="ms" value="${esc('Historia clínica · '+(p.nombre||''))}"></label><label>Mensaje<textarea id="mm" rows="4">${esc(`Hola ${nom1},\n\nTe comparto tu historia clínica odontológica.\n\nSaludos.`)}</textarea></label><div class="row end"><button type="button" class="btn" data-go="mail">Enviar con PDF adjunto</button></div>`;f.querySelector('#mp').focus()}
    }catch(x){toast(x.message||'No se pudo completar la acción',1)}finally{if(a!=='wa'&&a!=='mail')ocupado(b,0)}
  };
  f.addEventListener('click',async e=>{
    const b=e.target.closest('[data-go]');if(!b)return;
    try{
      if(b.dataset.go==='wa'){
        const n=waNumero(f.querySelector('#wn').value);if(n.length<10)throw new Error('Escribe el número de WhatsApp con código de país');
        const w=window.open('about:blank','_blank');ocupado(b,1);
        try{const r=await pdf();descargar(r.blob,r.nombre);
          const msg=`Hola ${nom1}, te comparto tu historia clínica de ${nombreClin()}. Te adjunto el PDF.`;
          const url=`https://wa.me/${n}?text=${encodeURIComponent(msg)}`;
          if(w)w.location.href=url;else location.href=url;
          st.textContent='Se descargó el PDF. Adjúntalo en el chat de WhatsApp que se abrió.'}
        catch(x){w&&w.close();throw x}finally{ocupado(b,0)}
      }else{
        const to=f.querySelector('#mp').value.trim();if(!emailOk(to))throw new Error('Escribe un correo válido');
        ocupado(b,1);b.textContent='Enviando…';
        try{const r=await pdf();st.textContent='Enviando correo…';
          const fm=new FormData();fm.append('to',to);fm.append('asunto',f.querySelector('#ms').value||'Historia clínica');fm.append('mensaje',f.querySelector('#mm').value);fm.append('nombre',r.nombre.replace(/\.pdf$/,''));
          fm.append('pdf',new File([r.blob],r.nombre,{type:'application/pdf'}));
          await enviarHistoria(fm);st.textContent='';toast('Correo enviado a '+to);ov.remove()}
        finally{ocupado(b,0);b.textContent='Enviar con PDF adjunto';st.textContent=''}
      }
    }catch(x){toast(x.message||'No se pudo enviar',1)}
  });
}
