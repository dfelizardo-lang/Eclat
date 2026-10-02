/* Google Identity Services: tokens stay in memory and are never persisted. */
(function(root){
 const scope='https://www.googleapis.com/auth/calendar.events.owned';
 let clientId='',loaded=false;
 const ready=(async()=>{
  try{const r=await fetch('/api/google-calendar/config',{cache:'no-store'});if(!r.ok)return false;const c=await r.json();if(!c.enabled)return false;clientId=c.clientId;
   await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.onload=resolve;s.onerror=reject;document.head.append(s);});loaded=true;return true;
  }catch{return false;}
 })();
 function authorize(ownerEmail){
  if(!loaded)return Promise.reject(new Error('La connexion Google est indisponible.'));
  return new Promise((resolve,reject)=>{
   const client=google.accounts.oauth2.initTokenClient({client_id:clientId,scope:scope+' https://www.googleapis.com/auth/userinfo.email',include_granted_scopes:false,callback:r=>{
    if(r.error || !r.access_token || !google.accounts.oauth2.hasGrantedAllScopes(r,scope))reject(new Error('L’autorisation Google Agenda n’a pas été accordée.'));else resolve(r.access_token);
   },error_callback:()=>reject(new Error('La connexion Google a été annulée.'))});
   client.requestAccessToken(ownerEmail?{login_hint:ownerEmail,prompt:''}:{prompt:'select_account'});
  });
 }
 async function identity(token,expected){
  const r=await fetch('https://www.googleapis.com/oauth2/v2/userinfo',{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(20000)});
  if(!r.ok)throw new Error('Le compte Google n’a pas pu être vérifié.');const u=await r.json();if(!u.email || !u.verified_email)throw new Error('Le compte Google n’a pas pu être vérifié.');
  if(expected && u.email.toLowerCase()!==expected.toLowerCase())throw new Error('Reconnectez le compte Google utilisé pour cet emprunt.');return u.email;
 }
 async function request(token,method,id,body){
  const url='https://www.googleapis.com/calendar/v3/calendars/primary/events'+(id?'/'+encodeURIComponent(id):'');
  const r=await fetch(url,{method,headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});
  if(r.status===404 || r.status===410)return {missing:true};if(r.status===409)return {conflict:true};if(!r.ok)throw new Error(r.status===401?'Votre connexion Google a expiré. Réessayez.':'Google Agenda n’a pas pu enregistrer cette modification.');return r.status===204?{}:r.json();
 }
 async function eventId(record){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(record.id));return 'ec'+Array.from(new Uint8Array(digest),v=>v.toString(16).padStart(2,'0')).join('');}
 function eventBody(record){
  root.EclatLoanCalendar.calendar(record);const date=record.reminder.date,time=record.reminder.time;
  const start=new Date(date+'T'+time+':00Z');if(!Number.isFinite(start.getTime()) || start.toISOString().slice(0,16)!==date+'T'+time)throw new Error('La date du rappel est invalide.');
  const timeZone=Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris';
  return {summary:'Emprunt en bibliothèque — rappel',description:'Pensez à rendre vos livres. Date de retour : '+record.returnDate+'. Rappel hebdomadaire jusqu’à désactivation. Référence Éclat : '+record.id,start:{dateTime:start.toISOString().slice(0,19),timeZone},end:{dateTime:new Date(start.getTime()+900000).toISOString().slice(0,19),timeZone},recurrence:['RRULE:FREQ=WEEKLY'],reminders:{useDefault:false,overrides:[{method:'popup',minutes:0}]},extendedProperties:{private:{eclatLoanId:record.id}}};
 }
 async function save(record){
  const token=await authorize(record.googleCalendar?.ownerEmail);const ownerEmail=await identity(token,record.googleCalendar?.ownerEmail);const id=record.googleCalendar?.eventId || await eventId(record);const body=eventBody(record);
  let event=await request(token,'GET',id);
  if(!event.missing){if(event.extendedProperties?.private?.eclatLoanId!==record.id)throw new Error('Cet événement ne correspond pas à cet emprunt.');event=await request(token,'PATCH',id,body);}
  else {event=await request(token,'POST',null,{id,...body});if(event.conflict){const existing=await request(token,'GET',id);if(existing.extendedProperties?.private?.eclatLoanId!==record.id)throw new Error('Cet événement ne correspond pas à cet emprunt.');event=await request(token,'PATCH',id,body);}}
  if(!event.id)throw new Error('Le rappel n’a pas pu être confirmé.');return {eventId:event.id,ownerEmail,linkedAt:new Date().toISOString()};
 }
 async function remove(record){
  if(!record.googleCalendar)return;
  const token=await authorize(record.googleCalendar.ownerEmail);await identity(token,record.googleCalendar.ownerEmail);
  const e=await request(token,'GET',record.googleCalendar.eventId);if(e.missing)return;
  if(e.extendedProperties?.private?.eclatLoanId!==record.id)throw new Error('Cet événement ne correspond pas à cet emprunt.');await request(token,'DELETE',record.googleCalendar.eventId);
 }
 root.EclatLoanGoogle={ready,get enabled(){return loaded;},save,remove};
})(window);
