const BASE='https://odonto-plus-db.fly.dev';
let token=localStorage.getItem('t')||'';
export const authed=()=>!!token;
export const logout=()=>{localStorage.removeItem('t');token='';location.hash='';location.reload()};
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
