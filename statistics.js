'use strict';
const express=require('express'),fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {promisify}=require('node:util');
const scrypt=promisify(crypto.scrypt);
const ADMIN='/administration/statistiques',COOKIE='__Host-eclat_admin';
const PAGES={'/':'Accueil','/emprunts':'Emprunts adultes','/emprunts-enfants':'Carnet enfants','/migration':'Transfert des carnets','/narration-credits':'Crédits des voix'};
const EVENTS={reader:'Ouvertures du lecteur',audio:'Lancements de l’écoute',suggestion:'Clics sur les suggestions'};
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function dayKey(time=Date.now()){
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(time).map(p=>[p.type,p.value]));
 return `${parts.year}-${parts.month}-${parts.day}`;
}
function previousDay(day,n){return new Date(Date.parse(day+'T12:00:00Z')-n*86400000).toISOString().slice(0,10);}
async function passwordHash(password){const salt=crypto.randomBytes(16).toString('hex');return 'scrypt$'+salt+'$'+(await scrypt(password,salt,64)).toString('hex');}
async function passwordMatches(password,encoded){
 const [,salt,hash]=String(encoded).split('$');
 if(!/^[a-f0-9]{32}$/.test(salt||'')||!/^[a-f0-9]{128}$/.test(hash||''))return false;
 const result=await scrypt(password,salt,64);return crypto.timingSafeEqual(result,Buffer.from(hash,'hex'));
}
function source(referrer,origin){
 try{const url=new URL(referrer);if(url.origin===origin)return 'Interne';const host=url.hostname;
  for(const [pattern,label] of [[/(^|\.)google\.[a-z.]+$/,'Google'],[/(^|\.)bing\.com$/,'Bing'],[/(^|\.)duckduckgo\.com$/,'DuckDuckGo'],[/(^|\.)(facebook\.com|fb\.com)$/,'Facebook'],[/(^|\.)instagram\.com$/,'Instagram'],[/(^|\.)linkedin\.com$/,'LinkedIn']])if(pattern.test(host))return label;
  return 'Autres sites';
 }catch{return 'Directe ou inconnue';}
}
function device(ua){return /ipad|tablet|android(?!.*mobile)/i.test(ua)?'Tablette':/mobile|iphone|ipod/i.test(ua)?'Mobile':'Ordinateur';}
function createStore(directory,now=Date.now){
 const file=path.join(directory,'audience.json');let state={version:1,startedAt:new Date(now()).toISOString(),days:{}};let broken=false,queue=Promise.resolve();
 try{state=JSON.parse(fs.readFileSync(file,'utf8'));if(state.version!==1||!state.days||typeof state.days!=='object'||Array.isArray(state.days))throw Error('Invalid statistics');}
 catch(error){if(error.code!=='ENOENT')broken=true;}
 return {
  async record(event){
   if(broken)throw Error('Statistiques indisponibles');
   const task=queue.then(async()=>{
    const next=structuredClone(state),today=dayKey(now()),cutoff=previousDay(today,89);
    for(const day of Object.keys(next.days))if(day<cutoff)delete next.days[day];
    const data=next.days[today]||={views:0,pages:{},sources:{},devices:{},events:{}};
    const add=(map,key)=>{map[key]=(map[key]||0)+1;};
    if(event.event==='view'){data.views++;add(data.pages,event.path);add(data.sources,event.source);add(data.devices,event.device);}else add(data.events,event.event);
    await fsp.mkdir(directory,{recursive:true,mode:0o700});const temp=file+'.tmp';
    try{await fsp.writeFile(temp,JSON.stringify(next),{mode:0o600});await fsp.rename(temp,file);state=next;}
    catch(error){await fsp.rm(temp,{force:true}).catch(()=>{});throw error;}
   });queue=task.catch(()=>{});return task;
  },
  async summary(period=30){await queue;if(broken)throw Error('Statistiques indisponibles');const today=dayKey(now()),days=[];
   for(let n=period-1;n>=0;n--){const date=previousDay(today,n);days.push({date,...(state.days[date]||{views:0,pages:{},sources:{},devices:{},events:{}})});}
   const result={startedAt:state.startedAt,period,timezone:'Europe/Paris',views:0,days:[],pages:{},sources:{},devices:{},events:{}};
   for(const day of days){result.views+=day.views;result.days.push({date:day.date,views:day.views});for(const field of ['pages','sources','devices','events'])for(const [key,value] of Object.entries(day[field]))result[field][key]=(result[field][key]||0)+value;}
   return result;
  }
 };
}
function createStatistics({env=process.env,now=Date.now}={}){
 const router=express.Router(),origin=env.ECLAT_PUBLIC_ORIGIN||'https://www.eclatsclassiques.com';
 const enabled=!!env.ECLAT_STATS_DIR&&!!env.ECLAT_ADMIN_PASSWORD_HASH&&!!env.ECLAT_ADMIN_USER;
 const store=enabled?createStore(env.ECLAT_STATS_DIR,now):null,sessions=new Map(),attempts=new Map(),salt=crypto.randomBytes(32);
 const cookie=(value,age)=>`${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;
 const sameOrigin=req=>req.get('origin')===origin&&req.get('sec-fetch-site')!=='cross-site';
 function limited(req,kind,limit,windowMs){
  const at=now();for(const [key,b] of attempts)if(b.until<=at)attempts.delete(key);
  const key=kind+crypto.createHmac('sha256',salt).update(req.ip||'local').digest('hex');let b=attempts.get(key);
  if(!b){if(attempts.size>=10000)return true;b={count:0,until:at+windowMs};attempts.set(key,b);}return ++b.count>limit;
 }
 function session(req){
  for(const [key,value] of sessions)if(value.expires<=now())sessions.delete(key);
  const token=String(req.get('cookie')||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
  return token&&sessions.get(crypto.createHash('sha256').update(token).digest('hex'));
 }
 function protect(req,res,next){if(!enabled)return res.status(503).send('Administration non configurée.');const user=session(req);if(!user)return res.status(401).json({error:'Connexion administrateur requise.'});req.adminSession=user;next();}
 const {layout,login,dashboard,privacy}=require('./statistics-view');
 router.use(ADMIN,(req,res,next)=>{res.set({'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow, noarchive','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"});next();});
 router.get(ADMIN,async(req,res)=>{
  if(!enabled)return res.status(503).type('html').send(layout('Administration', '<h1>Administration non configurée</h1>'));
  const user=session(req);if(!user)return res.type('html').send(login());
  const period=[7,30,90].includes(Number(req.query.jours))?Number(req.query.jours):30;
  try{res.type('html').send(dashboard(await store.summary(period),user.csrf,PAGES,EVENTS));}catch{res.status(503).type('html').send(layout('Statistiques','<h1>Statistiques momentanément indisponibles</h1><p>Les données existantes sont conservées. Réessayez plus tard.</p>'));}
 });
 router.post(ADMIN+'/connexion',express.urlencoded({extended:false,limit:'2kb'}),async(req,res)=>{
  if(!enabled)return res.sendStatus(503);if(!sameOrigin(req))return res.sendStatus(403);
  if(limited(req,'login',8,15*60000))return res.status(429).type('html').send(login('Trop de tentatives. Réessayez dans quinze minutes.'));
  const user=typeof req.body?.user==='string'?req.body.user:'',password=typeof req.body?.password==='string'?req.body.password:'';
  const valid=password.length>0&&password.length<=256&&await passwordMatches(password,env.ECLAT_ADMIN_PASSWORD_HASH);
  if(!valid||user!==env.ECLAT_ADMIN_USER)return res.status(401).type('html').send(login('Identifiants incorrects.'));
  const token=crypto.randomBytes(32).toString('base64url'),key=crypto.createHash('sha256').update(token).digest('hex');
  if(sessions.size>=100)sessions.delete(sessions.keys().next().value);
  sessions.set(key,{key,csrf:crypto.randomBytes(24).toString('base64url'),expires:now()+8*3600000});res.set('Set-Cookie',cookie(token,8*3600)).redirect(303,ADMIN);
 });
 router.get(ADMIN+'/donnees',protect,async(req,res)=>{try{res.json(await store.summary(30));}catch{res.status(503).json({error:'Statistiques indisponibles.'});}});
 router.post(ADMIN+'/deconnexion',express.urlencoded({extended:false,limit:'2kb'}),protect,(req,res)=>{
  if(!sameOrigin(req)||req.body.csrf!==req.adminSession.csrf)return res.sendStatus(403);
  sessions.delete(req.adminSession.key);res.set('Set-Cookie',cookie('',0)).redirect(303,ADMIN);
 });
 router.use(ADMIN,(req,res)=>res.sendStatus(404));
 router.post('/api/statistiques/collecter',express.text({type:['application/json','text/plain'],limit:'1kb'}),async(req,res)=>{
  if(!enabled)return res.sendStatus(204);if(!sameOrigin(req))return res.sendStatus(403);
  if(req.get('DNT')==='1'||req.get('Sec-GPC')==='1'||/bot|crawler|spider|headless|playwright/i.test(req.get('user-agent')||''))return res.sendStatus(204);
  if(limited(req,'collect',10000,60000))return res.sendStatus(429);
  let body;try{body=JSON.parse(req.body);}catch{return res.sendStatus(400);}
  if(!body||typeof body.path!=='string'||!Object.hasOwn(PAGES,body.path)||!['view',...Object.keys(EVENTS)].includes(body.event)||typeof body.referrer!=='string'||body.referrer.length>300)return res.sendStatus(400);
  try{await store.record({event:body.event,path:body.path,source:source(body.referrer,origin),device:device(req.get('user-agent')||'')});res.sendStatus(204);}catch{res.sendStatus(503);}
 });
 router.get('/mesure-audience',(req,res)=>res.set('Cache-Control','no-store').type('html').send(privacy()));
 router.use((error,req,res,next)=>{if(req.path.startsWith(ADMIN)||req.path==='/api/statistiques/collecter')return res.sendStatus(error.status===413?413:400);next(error);});
 return router;
}
module.exports={createStatistics,createStore,passwordHash,passwordMatches,dayKey,source,device,escape};
