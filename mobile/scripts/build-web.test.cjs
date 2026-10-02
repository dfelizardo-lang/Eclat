const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');const {build,out,API}=require('./build-web.cjs');
test('Android contains actual structured corpus and all local scripts',()=>{
 build();const catalog=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../data/reading-catalog.json')));
 const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path.join(out,'catalogue-snapshot.js'),'utf8'),sandbox);
 assert.equal(sandbox.window.ECLAT_READING_CATALOG.works.length,catalog.works.length);
 for(const name of ['index.html','emprunts.html','emprunts-enfants.html']){
 const html=fs.readFileSync(path.join(out,name),'utf8');assert.match(html,/mobile-runtime.js/);
 for(const m of html.matchAll(/(?:src|href)="(\/[^"?#]+\.(?:js|css))"/g))assert.ok(fs.existsSync(path.join(out,m[1])),name+': '+m[1]);
 }
});
test('API routes to Railway; mobile Google browser OAuth remains disabled',async()=>{
 const calls=[];const win={fetch:async(...a)=>{calls.push(a);return new Response('{}')}};
 vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,'../mobile-runtime.js'),'utf8'),{window:win,URL,Request,Response,location:{href:'https://localhost/emprunts.html',origin:'https://localhost'},document:{addEventListener(){}}});
 await win.fetch('/api/library-news?url=https%3A%2F%2Fexample.org');assert.equal(calls[0][0],API+'/api/library-news?url=https%3A%2F%2Fexample.org');
 const response=await win.fetch('/api/google-calendar/config');assert.equal((await response.json()).enabled,false);assert.equal(calls.length,1);
 await win.fetch('/local.json');assert.equal(calls[1][0],'/local.json');
});
