const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),express=require('express');
const {createStatistics,createStore,passwordHash,dayKey}=require('./statistics');
const ORIGIN='https://www.eclatsclassiques.com',ADMIN='/administration/statistiques';
async function fixture(run,enabled=true){
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'eclat-stats-'));let time=Date.parse('2026-10-29T12:00:00Z');
 const hash=await passwordHash('strong-test-password');const env=enabled?{ECLAT_STATS_DIR:dir,ECLAT_ADMIN_USER:'owner@example.org',ECLAT_ADMIN_PASSWORD_HASH:hash}:{};
 const app=express();app.use(createStatistics({env,now:()=>time}));const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 const request=(route,options={})=>fetch('http://127.0.0.1:'+server.address().port+route,{redirect:'manual',...options});
 try{await run({dir,request,advance:ms=>{time+=ms},env});}finally{server.closeAllConnections();await new Promise(r=>server.close(r));await fs.rm(dir,{recursive:true,force:true});}
}
const login=(request,extra={})=>request(ADMIN+'/connexion',{method:'POST',headers:{Origin:ORIGIN,'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({user:'owner@example.org',password:'strong-test-password',...extra})});
test('private page and data require a genuine session; logout, expiry and origin checks are enforced',async()=>fixture(async({request,advance})=>{
 let r=await request(ADMIN);assert.equal(r.status,200);assert.match(await r.text(),/Se connecter/);assert.equal(r.headers.get('cache-control'),'no-store');assert.match(r.headers.get('x-robots-tag'),/noindex/);assert.equal(r.headers.get('referrer-policy'),'same-origin','HTML form posts must retain their same-site Origin');
 assert.equal((await request(ADMIN+'/donnees')).status,401);
 assert.equal((await login(request,{password:'wrong'})).status,401);
 assert.equal((await request(ADMIN+'/connexion',{method:'POST',headers:{Origin:'null','Content-Type':'application/x-www-form-urlencoded'},body:'user=owner@example.org&password=strong-test-password'})).status,403);
 assert.equal((await request(ADMIN+'/connexion',{method:'POST',headers:{Origin:'https://other.example','Content-Type':'application/x-www-form-urlencoded'},body:'user=owner@example.org&password=strong-test-password'})).status,403);
 r=await login(request);assert.equal(r.status,303);const raw=r.headers.get('set-cookie');assert.match(raw,/HttpOnly; Secure; SameSite=Strict/);const cookie=raw.split(';')[0];
 r=await request(ADMIN,{headers:{Cookie:cookie}});const html=await r.text();assert.match(html,/La fréquentation/);assert.ok(!html.includes('strong-test-password'));
 const csrf=html.match(/name="csrf" value="([^"]+)"/)[1];
 assert.equal((await request(ADMIN+'/donnees',{headers:{Cookie:cookie}})).status,200);
 assert.equal((await request(ADMIN+'/donnees',{headers:{Cookie:cookie+'tampered'}})).status,401);
 assert.equal((await request(ADMIN+'/deconnexion',{method:'POST',headers:{Cookie:cookie,Origin:ORIGIN,'Content-Type':'application/x-www-form-urlencoded'},body:'csrf=wrong'})).status,403);
 assert.equal((await request(ADMIN+'/deconnexion',{method:'POST',headers:{Cookie:cookie,Origin:ORIGIN,'Content-Type':'application/x-www-form-urlencoded'},body:'csrf='+csrf})).status,303);
 assert.equal((await request(ADMIN+'/donnees',{headers:{Cookie:cookie}})).status,401);
 const next=(await login(request)).headers.get('set-cookie').split(';')[0];advance(9*3600000);assert.equal((await request(ADMIN+'/donnees',{headers:{Cookie:next}})).status,401);
}));
test('collection stores only aggregates, rejects unsafe payloads and respects refusals and bots',async()=>fixture(async({request,dir,env})=>{
 const post=(data,extra={})=>request('/api/statistiques/collecter',{method:'POST',headers:{Origin:ORIGIN,'Content-Type':'application/json','User-Agent':'Mozilla/5.0 (iPhone; Mobile)',...extra},body:JSON.stringify(data)});
 const event={event:'view',path:'/emprunts',referrer:'https://www.google.fr/search?q=private-value',email:'private@example.org',ip:'198.51.100.99'};
 assert.equal((await post(event)).status,204);
 for(const headers of [{DNT:'1'},{'Sec-GPC':'1'},{'User-Agent':'Googlebot'}])assert.equal((await post(event,headers)).status,204);
 assert.equal((await post(event,{Origin:'https://evil.example'})).status,403);
 assert.equal((await post({...event,path:'/secret?private-value'})).status,400);
 assert.equal((await post({...event,event:'unrestricted-event'})).status,400);
 assert.equal((await post({...event,event:'reader'})).status,204);
 const raw=await fs.readFile(path.join(dir,'audience.json'),'utf8');for(const value of ['private-value','private@example.org','198.51.100.99','Mozilla'])assert.ok(!raw.includes(value));
 const fresh=createStore(env.ECLAT_STATS_DIR);const summary=await fresh.summary(30);assert.equal(summary.views,1);assert.equal(summary.pages['/emprunts'],1);assert.equal(summary.sources.Google,1);assert.equal(summary.devices.Mobile,1);assert.equal(summary.events.reader,1);
}));
test('retention uses Paris calendar days and corrupt data is preserved rather than reset',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'eclat-stats-retention-'));try{
 let time=Date.parse('2026-10-29T23:30:00Z');assert.equal(dayKey(time),'2026-10-30');
 const store=createStore(dir,()=>time);await store.record({event:'view',path:'/',source:'Directe ou inconnue',device:'Ordinateur'});
 time+=91*86400000;await store.record({event:'view',path:'/',source:'Interne',device:'Ordinateur'});assert.equal((await store.summary(90)).views,1);assert.equal(Object.keys(JSON.parse(await fs.readFile(path.join(dir,'audience.json'),'utf8')).days).length,1);
 await fs.writeFile(path.join(dir,'audience.json'),'{broken');const broken=createStore(dir);await assert.rejects(broken.summary(),/indisponibles/);await assert.rejects(broken.record({event:'view'}),/indisponibles/);assert.equal(await fs.readFile(path.join(dir,'audience.json'),'utf8'),'{broken');
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('unconfigured administration exposes no statistics and brute force is throttled',async()=>{
 await fixture(async({request})=>{assert.equal((await request(ADMIN)).status,503);assert.equal((await request(ADMIN+'/donnees')).status,503);},false);
 await fixture(async({request})=>{for(let n=0;n<8;n++)assert.equal((await login(request,{password:'wrong'})).status,401);
 assert.equal((await request(ADMIN+'/connexion',{method:'POST',headers:{Origin:'null','Content-Type':'application/x-www-form-urlencoded'},body:'user=owner@example.org&password=strong-test-password'})).status,403);assert.equal((await login(request)).status,429);});
});
