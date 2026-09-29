/// <reference path="../pb_data/types.d.ts" />
migrate((app)=>{
  const auth='@request.auth.id != ""';
  const mon=['USD','VES','COP'];
  const mv=app.findCollectionByNameOrId('movimientos');
  mv.fields.getByName('moneda').values=mon;
  mv.fields.add(new NumberField({name:'tasa',min:0}),new NumberField({name:'monto_usd',min:0}));
  app.save(mv);
  const pg=app.findCollectionByNameOrId('pagos');
  pg.fields.add(new SelectField({name:'moneda',values:mon,maxSelect:1}),new NumberField({name:'tasa',min:0}),new NumberField({name:'monto_usd',min:0}));
  app.save(pg);
  app.save(new Collection({type:'base',name:'tasas',listRule:auth,viewRule:auth,createRule:auth,updateRule:auth,deleteRule:auth,fields:[
    {type:'select',name:'moneda',values:['VES','COP'],maxSelect:1,required:true},
    {type:'number',name:'valor',required:true,min:0},
    {type:'date',name:'fecha',required:true},
    {type:'autodate',name:'created',onCreate:true},{type:'autodate',name:'updated',onCreate:true,onUpdate:true}]}));
  // Registros anteriores (todo en USD) quedan con moneda, tasa 1 y equivalente en USD
  app.findAllRecords('pagos').forEach(r=>{r.set('moneda','USD');r.set('tasa',1);r.set('monto_usd',r.getFloat('monto'));app.save(r)});
  app.findAllRecords('movimientos').forEach(r=>{if(r.getString('moneda')==='USD'){r.set('tasa',1);r.set('monto_usd',r.getFloat('monto'));app.save(r)}});
},(app)=>{try{app.delete(app.findCollectionByNameOrId('tasas'))}catch(_){}});
