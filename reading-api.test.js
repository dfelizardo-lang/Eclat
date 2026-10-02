const {spawn}=require('node:child_process');
const test=require('node:test');
const assert=require('node:assert/strict');
test('HTTP catalogue, passages and browser bundle agree',async()=>{
 const child=spawn(process.execPath,['server.js'],{cwd:__dirname,env:{...process.env,PORT:'3031'},stdio:['ignore','pipe','pipe']});
 try {
  await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);child.once('exit',code=>reject(new Error('server exit '+code)));});
  const base='http://127.0.0.1:3031';const c=await(await fetch(base+'/api/catalogue')).json();
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
