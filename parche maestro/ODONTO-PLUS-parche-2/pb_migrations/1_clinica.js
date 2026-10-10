/// <reference path="../pb_data/types.d.ts" />
migrate((app)=>{
  const auth='@request.auth.id != ""';
  const uc=app.findCollectionByNameOrId('users');
  uc.createRule=null; // sin registro público: solo el personal creado por el administrador
  app.save(uc);
  const ad=[{type:'autodate',name:'created',onCreate:true},{type:'autodate',name:'updated',onCreate:true,onUpdate:true}];
  const mk=(name,fields)=>{const c=new Collection({type:'base',name,listRule:auth,viewRule:auth,createRule:auth,updateRule:auth,deleteRule:auth,fields:[...fields,...ad]});app.save(c);return c};
  const T=(name,r)=>({type:'text',name,required:!!r,max:20000});
  const Nm=(name)=>({type:'number',name,min:0});
  const D=(name,r)=>({type:'date',name,required:!!r});
  const S=(name,values)=>({type:'select',name,values,maxSelect:1,required:true});
  const pac=mk('pacientes',[T('nombre',1),T('cedula'),T('telefono'),T('email'),D('fecha_nac'),T('direccion'),T('notas'),T('diagnostico'),T('pronostico'),T('tratamiento')]);
  const R=()=>({type:'relation',name:'paciente',required:true,collectionId:pac.id,maxSelect:1,cascadeDelete:true});
  mk('tratamientos',[R(),T('descripcion',1),S('estado',['Por realizar','Realizado']),Nm('costo'),D('fecha')]);
  mk('pagos',[R(),Nm('monto'),D('fecha',1),T('nota')]);
  mk('archivos',[R(),S('tipo',['Radiografía','Foto','Otro']),{type:'file',name:'archivo',required:true,maxSelect:1,maxSize:26214400,protected:true,thumbs:['100x100'],mimeTypes:['image/jpeg','image/png','image/webp','application/pdf']},T('nota')]);
  mk('citas',[R(),D('fecha',1),T('motivo'),S('estado',['Programada','Confirmada','Atendida','Cancelada'])]);
  mk('inventario',[T('nombre',1),S('categoria',['Odontológico','Limpieza y mantenimiento','Papelería','Generales']),Nm('cantidad'),Nm('minimo'),T('unidad'),T('notas')]);
  mk('movimientos',[S('tipo',['Ingreso','Egreso']),S('categoria',['Consultas y tratamientos','Otros ingresos','Alquiler','Agua','Luz','Condominio','Bomberos','Desechos biológicos','Estacionamiento','Insumos','Otros gastos']),T('concepto'),Nm('monto'),S('moneda',['USD','VES','EUR']),D('fecha',1)]);
  const em=$os.getenv('APP_USER_EMAIL'),pw=$os.getenv('APP_USER_PASSWORD');
  if(em&&pw){const u=new Record(uc);u.set('email',em);u.setPassword(pw);u.set('verified',true);u.set('name','Consultorio');app.save(u)}
},(app)=>{
  ['movimientos','inventario','citas','archivos','pagos','tratamientos','pacientes'].forEach(n=>{try{app.delete(app.findCollectionByNameOrId(n))}catch(_){}});
});
