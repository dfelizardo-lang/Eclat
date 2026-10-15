(function(root){
 const stores=[{db:'eclat-library-loans',store:'notebooks'},{db:'eclat-kids-reading',store:'books'}];
 const validKey=k=>/^eclat[-_]/i.test(k)&&!/^eclat_libraries_/i.test(k);
 async function encode(value){
  if(value instanceof Blob)return {__eclatBlob:true,type:value.type,data:await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(value);})};
  if(Array.isArray(value))return Promise.all(value.map(encode));
  if(value&&typeof value==='object')return Object.fromEntries(await Promise.all(Object.entries(value).map(async([k,v])=>[k,await encode(v)])));
  return value;
 }
 function decode(value){
  if(value?.__eclatBlob===true){if(typeof value.data!=='string'||!/^data:[^,]*;base64,/.test(value.data))throw new Error('Photo invalide');const str=atob(value.data.slice(value.data.indexOf(',')+1));return new Blob([Uint8Array.from(str,c=>c.charCodeAt(0))],{type:typeof value.type==='string'?value.type:'application/octet-stream'});}
  if(Array.isArray(value))return value.map(decode);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,decode(v)]));
  return value;
 }
 function merge(a,b){if(Array.isArray(a)&&Array.isArray(b))return [...new Map([...b,...a].map(v=>[JSON.stringify(v),v])).values()];if(a&&b&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b))return Object.fromEntries([...new Set([...Object.keys(a),...Object.keys(b)])].map(k=>[k,k in a&&k in b?merge(a[k],b[k]):k in b?b[k]:a[k]]));if(typeof a==='number'&&typeof b==='number')return Math.max(a,b);return b;}
 function validate(value){
  const invalid=()=>{throw new Error('Ce fichier ne contient pas une sauvegarde Éclat compatible. Aucune donnée n’a été modifiée.');};
  const object=v=>v&&typeof v==='object'&&!Array.isArray(v);
  function safe(v){if(!v||typeof v!=='object')return;for(const [k,x]of Object.entries(v)){if(['__proto__','constructor','prototype'].includes(k))invalid();safe(x);}}
  if(!object(value)||value.application!=='Eclat'||value.version!==1||!object(value.localStorage)||!Array.isArray(value.databases))invalid();safe(value);
  for(const [k,v]of Object.entries(value.localStorage))if(!validKey(k)||typeof v!=='string')invalid();
  const seen=new Set();
  for(const item of value.databases){
   if(!object(item)||!stores.some(s=>s.db===item.db&&s.store===item.store)||seen.has(item.db)||!Array.isArray(item.records)||item.records.length>10000)invalid();seen.add(item.db);
   for(const r of item.records){
    if(!object(r)||typeof r.id!=='string'||!r.id.trim()||r.id.length>300)invalid();
    for(const k of ['updatedAt','createdAt','closedAt'])if(r[k]!=null&&(typeof r[k]!=='string'||!Number.isFinite(Date.parse(r[k]))))invalid();
    const kids=item.store==='books';
    if(kids&&(typeof r.title!=='string'||!r.title.trim()||r.title.length>250||typeof r.author!=='string'||!r.author.trim()||r.author.length>250||(r.comment!=null&&(typeof r.comment!=='string'||r.comment.length>2000))||(r.rating!=null&&(!Number.isInteger(r.rating)||r.rating<0||r.rating>5))))invalid();
    if(r.photos!=null&&(!Array.isArray(r.photos)||r.photos.length>(kids?50:1)))invalid();
    for(const photo of r.photos||[]){if(!object(photo)||typeof photo.id!=='string'||!object(photo.blob)||photo.blob.__eclatBlob!==true||!['image/jpeg','image/png','image/webp'].includes(photo.blob.type))invalid();decode(photo.blob);}
    if(!kids){if(r.returnDate!=null&&(typeof r.returnDate!=='string'||(r.returnDate!==''&&(!/^\d{4}-\d{2}-\d{2}$/.test(r.returnDate)||!Number.isFinite(Date.parse(r.returnDate))))))invalid();for(const key of ['borrowAgain','reserveBooks'])if(r[key]!=null&&(!Array.isArray(r[key])||r[key].some(x=>typeof x!=='string')))invalid();if(r.reminder!=null&&(!object(r.reminder)||typeof r.reminder.enabled!=='boolean'))invalid();}
   }
  }
  return value;
 }
 function mergeRecords(existing,incoming){
  const byId=new Map(existing.map(r=>[r.id,r]));
  const time=r=>Date.parse(r.updatedAt||r.createdAt||'')||0;
  for(const r of incoming){const old=byId.get(r.id);if(!old||time(r)>time(old))byId.set(r.id,r);}
  return [...byId.values()];
 }
 function open(spec){return new Promise((resolve,reject)=>{const r=indexedDB.open(spec.db,1);r.onupgradeneeded=()=>r.result.createObjectStore(spec.store,{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(new Error('Fermez les autres pages Éclat, puis réessayez.'));});}
 function read(db,store){return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readonly');const r=tx.objectStore(store).getAll();let result;r.onsuccess=()=>{result=r.result;};tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
 async function exportData(){const local={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(validKey(k))local[k]=localStorage.getItem(k);}const databases=[];for(const spec of stores){const db=await open(spec);try{databases.push({...spec,records:await encode(await read(db,spec.store))});}finally{db.close();}}return {application:'Eclat',version:1,exportedAt:new Date().toISOString(),origin:location.origin,localStorage:local,databases};}
 function writeAll(db,store,records){return new Promise((resolve,reject)=>{
  const tx=db.transaction(store,'readwrite'),target=tx.objectStore(store);
  tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Écriture annulée'));
  try{target.clear();for(const r of records)target.put(r);}catch(error){tx.abort();reject(error);}
 });}
 async function importData(value){
  validate(value);const decoded=value.databases.map(item=>({...item,records:decode(item.records)}));
  const plans=[],localPlans=[];let imported=0,preserved=0;
  // Complete validation and reads before the first mutation.
  try{
   for(const item of decoded){const db=await open(item);const plan={db,store:item.store,before:await read(db,item.store),written:false};plans.push(plan);plan.after=mergeRecords(plan.before,item.records);const old=new Map(plan.before.map(r=>[r.id,r]));for(const r of plan.after){if(old.get(r.id)!==r)imported++;else if(item.records.some(x=>x.id===r.id))preserved++;}}
   for(const [key,v]of Object.entries(value.localStorage)){const before=localStorage.getItem(key);let after=v;if(before!==null){after=before;try{after=JSON.stringify(merge(JSON.parse(v),JSON.parse(before)));}catch{}}localPlans.push({key,before,after,written:false});}
   for(const p of plans){await writeAll(p.db,p.store,p.after);p.written=true;}
   for(const p of localPlans){localStorage.setItem(p.key,p.after);p.written=true;}
   return {imported,preserved};
  }catch(error){
   let restored=true;
   for(const p of localPlans.filter(p=>p.written)){try{if(p.before===null)localStorage.removeItem(p.key);else localStorage.setItem(p.key,p.before);}catch{restored=false;}}
   for(const p of plans.filter(p=>p.written)){try{await writeAll(p.db,p.store,p.before);}catch{restored=false;}}
   throw new Error(restored?'L’import a échoué. Les données précédentes ont été conservées. Réessayez.':'L’import a été interrompu et la restauration est incomplète. Gardez la sauvegarde avant de réessayer.',{cause:error});
  }finally{for(const p of plans)p.db.close();}
 }
 root.EclatTransfer={encode,decode,merge,mergeRecords,validate,exportData,importData};
 if(typeof document==='undefined')return;
 const status=document.getElementById('transferStatus'),download=document.getElementById('exportData'),input=document.getElementById('importData'),result=document.getElementById('backupSummary'),confirm=document.getElementById('confirmImport');let pending=null;
 function busy(value){download.disabled=value;input.disabled=value;confirm.disabled=value;}
 download.addEventListener('click',async()=>{busy(true);status.textContent='Préparation de la sauvegarde avec les photos…';try{const backup=await exportData(),blob=new Blob([JSON.stringify(backup)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='eclat-sauvegarde-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);status.textContent='Sauvegarde téléchargée. Elle contient vos carnets, photos, favoris et historique de cet appareil. Rien n’a été effacé.';}catch{status.textContent='La sauvegarde n’a pas pu être préparée. Gardez cette adresse et réessayez avant le transfert.';}finally{busy(false);confirm.disabled=!pending;}});
 input.addEventListener('change',async()=>{pending=null;confirm.disabled=true;result.textContent='';try{const file=input.files[0];if(!file)return;if(file.size>150*1024*1024)throw new Error('Ce fichier dépasse 150 Mo.');pending=validate(JSON.parse(await file.text()));result.textContent=pending.databases.reduce((n,d)=>n+d.records.length,0)+' entrées de carnets et '+Object.keys(pending.localStorage).length+' préférences/historiques prêts à importer. Les données déjà présentes seront conservées ou fusionnées.';confirm.disabled=false;}catch(e){status.textContent=e.message||'Le fichier ne peut pas être lu.';}});
 confirm.addEventListener('click',async()=>{if(!pending)return;busy(true);status.textContent='Import en cours…';try{const r=await importData(pending);status.textContent=r.imported+' entrées importées, '+r.preserved+' entrées déjà présentes conservées. Vous pouvez revenir à l’accueil.';pending=null;}catch(e){status.textContent=e.message||'L’import n’a pas pu être terminé. Gardez la sauvegarde et réessayez.';}finally{busy(false);confirm.disabled=!pending;}});
})(typeof window!=='undefined'?window:globalThis);
