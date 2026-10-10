/// <reference path="../pb_data/types.d.ts" />
migrate((app)=>{
  const auth='@request.auth.id != ""';
  const ad=[{type:'autodate',name:'created',onCreate:true},{type:'autodate',name:'updated',onCreate:true,onUpdate:true}];

  // 1) Historia clínica: datos extra, anamnesis, odontodiagrama y periodontograma (JSON)
  const pac=app.findCollectionByNameOrId('pacientes');
  pac.fields.add(
    new SelectField({name:'sexo',values:['Femenino','Masculino'],maxSelect:1}),
    new TextField({name:'ocupacion',max:200}),
    new TextField({name:'motivo',max:5000}),
    new TextField({name:'observaciones',max:20000}),
    new TextField({name:'calculo',max:500}),
    new JSONField({name:'anamnesis',maxSize:200000}),
    new JSONField({name:'anam_odonto',maxSize:200000}),
    new JSONField({name:'odontograma',maxSize:2000000}),
    new JSONField({name:'periodontograma',maxSize:2000000})
  );
  app.save(pac);

  // 2) Datos de la clínica (un solo registro): usados en el PDF y en los correos
  app.save(new Collection({type:'base',name:'clinica',listRule:auth,viewRule:auth,createRule:auth,updateRule:auth,deleteRule:auth,fields:[
    {type:'text',name:'nombre',max:200},
    {type:'text',name:'doctora',max:200},
    {type:'text',name:'email',max:200},
    {type:'text',name:'telefono',max:100},
    {type:'text',name:'direccion',max:500},
    {type:'select',name:'zona',values:['America/Caracas','America/Bogota'],maxSelect:1},
    ...ad]}));
  const cl=new Record(app.findCollectionByNameOrId('clinica'));
  cl.set('nombre','ODONTO PLUS');cl.set('zona','America/Caracas');
  app.save(cl);

  // 3) Documentos legales de la clínica
  app.save(new Collection({type:'base',name:'documentos',listRule:auth,viewRule:auth,createRule:auth,updateRule:auth,deleteRule:auth,fields:[
    {type:'text',name:'titulo',required:true,max:300},
    {type:'select',name:'categoria',required:true,maxSelect:1,values:['Permisos y licencias','Título y colegiatura','Seguros','Contratos','Salud y bioseguridad','Impuestos y registros','Otros']},
    {type:'date',name:'vencimiento'},
    {type:'file',name:'archivo',required:true,maxSelect:1,maxSize:26214400,protected:true,thumbs:['100x100'],mimeTypes:['image/jpeg','image/png','image/webp','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']},
    {type:'text',name:'nota',max:5000},
    ...ad]}));

  // 4) Citas: correo del paciente, notificación e invitación de calendario
  const ci=app.findCollectionByNameOrId('citas');
  ci.fields.add(
    new TextField({name:'email',max:200}),
    new NumberField({name:'duracion',min:5,max:600}),
    new BoolField({name:'notificar'}),
    new BoolField({name:'recordado'}),
    new BoolField({name:'invitado'}),
    new TextField({name:'uid',max:100}),
    new TextField({name:'aviso',max:1000}),
    new NumberField({name:'secuencia',min:0})
  );
  app.save(ci);
},(app)=>{
  ['documentos','clinica'].forEach(n=>{try{app.delete(app.findCollectionByNameOrId(n))}catch(_){}});
  try{const ci=app.findCollectionByNameOrId('citas');['email','duracion','notificar','recordado','invitado','uid','aviso','secuencia'].forEach(n=>ci.fields.removeByName(n));app.save(ci)}catch(_){}
  try{const p=app.findCollectionByNameOrId('pacientes');['sexo','ocupacion','motivo','observaciones','calculo','anamnesis','anam_odonto','odontograma','periodontograma'].forEach(n=>p.fields.removeByName(n));app.save(p)}catch(_){}
});
