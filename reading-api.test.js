const {spawn}=require('node:child_process');
const test=require('node:test');
const assert=require('node:assert/strict');
test('HTTP catalogue, passages and browser bundle agree',async()=>{
 const child=spawn(process.execPath,['server.js'],{cwd:__dirname,env:{...process.env,PORT:'3031'},stdio:['ignore','pipe','pipe']});
 try {
  await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);child.once('exit',code=>reject(new Error('server exit '+code)));});
  const base='http://127.0.0.1:3031';
  for(const route of ['emprunts','emprunts-enfants','migration','narration-credits']){
   const redirect=await fetch(base+'/'+route+'?test=1',{redirect:'manual'});assert.equal(redirect.status,308);assert.equal(redirect.headers.get('location'),'/'+route+'.html?test=1');
   const slash=await fetch(base+'/'+route+'/?test=1',{redirect:'manual'});assert.equal(slash.headers.get('location'),'/'+route+'.html?test=1');
   const htmlSlash=await fetch(base+'/'+route+'.html/?test=1',{redirect:'manual'});assert.equal(htmlSlash.status,308);assert.equal(htmlSlash.headers.get('location'),'/'+route+'.html?test=1');
   const page=await fetch(base+'/'+route);assert.equal(page.status,200);assert.equal(new URL(page.url).pathname,'/'+route+'.html');
  }
for(const route of ['/index.html','/index.html/']){const redirect=await fetch(base+route+'?test=1',{redirect:'manual'});assert.equal(redirect.status,308);assert.equal(redirect.headers.get('location'),'/?test=1');}
const c=await(await fetch(base+'/api/catalogue')).json();
  assert.equal(c.works.length,require('./reading-catalog').works.length);
  for(const w of c.works.filter(w=>!w.legacy))for(const p of w.passages){
   const response=await fetch(base+'/api/passages/'+p.id);assert.equal(response.status,200);
   const live=await response.json();assert.equal(live.text,p.text);assert.equal(live.workId,w.id);
  }
  assert.equal((await fetch(base+'/api/passages/unknown')).status,404);
  const html=await(await fetch(base)).text();assert.ok(html.includes('<script src="/api/reading-catalog.js"></script>'));assert.ok(html.includes('/daily-themes-client.js'));
  const context={window:{}};require('node:vm').runInNewContext(await(await fetch(base+'/api/reading-catalog.js')).text(),context);
  assert.equal(JSON.stringify(context.window.ECLAT_READING_CATALOG),JSON.stringify(c));
 }finally{child.kill();}
});
