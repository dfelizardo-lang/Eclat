const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const {catalog,render}=require('./patrimoine'),cheerio=require('cheerio');
test('patrimonial collection is source-linked, short, adult-only and excluded from general reading and daily themes',()=>{
 const general=require('./reading-catalog');
 const all=require('./scripts/narration-input.cjs').inputs();
 const frozen=require('./automation/playwright/support/corpus-baseline.json');
 const byId=new Map(all.map(p=>[p.id,p]));
 for(const p of frozen.passages)assert.equal(byId.get(p.id)?.textHash,p.textHash,p.id);
 for(const w of catalog.works){assert.equal(w.audience,'adult');assert.ok(!general.works.some(q=>q.id===w.id));assert.equal(w.passages.length,w.kind==='roman'?15:3);for(const p of w.passages){assert.ok(p.text.length<=2000);assert.equal(byId.get(p.id)?.textHash,p.sha256);assert.equal(crypto.createHash('sha256').update(p.text).digest('hex'),p.sha256);}}
 const {loadCatalog}=require('./daily-themes');const daily=loadCatalog(fs.readFileSync(__dirname+'/eclat_v73_deployable.html','utf8'));
 for(const w of catalog.works)assert.ok(!JSON.stringify(daily).includes(w.id));
 assert.equal(catalog.works.filter(w=>w.kind==='roman').length,10);assert.equal(catalog.works.filter(w=>w.kind==='roman').reduce((n,w)=>n+w.passages.length,0),150);assert.equal(all.length,701);
});
test('collection requires voluntary opening and renders intact source paragraphs, labels and two on-demand audio voices',()=>{
 const manifest={passages:{}};for(const w of catalog.works)for(const p of w.passages)manifest.passages[p.id]={voices:{female:{url:'/api/narration/audio/'+'a'.repeat(64)+'/female.mp3'},male:{url:'/api/narration/audio/'+'b'.repeat(64)+'/male.mp3'}}};
 const $=cheerio.load(render(manifest));assert.equal($('details.entry[open]').length,0);assert.equal($('details.passage').length,153);assert.equal($('audio[autoplay]').length,0);assert.equal($('audio[preload="none"]').length,153);assert.equal($('select option').length,306);
 for(const w of catalog.works)for(const p of w.passages)assert.ok($('blockquote').toArray().some(node=>$(node).text()===p.text));
 assert.equal($('h1').text(),'Érotisme etlittérature classique.');assert.equal($('link[rel="canonical"]').attr('href'),'https://www.eclatsclassiques.com/patrimoine-libertin');
 assert.ok(render().includes('audio momentanément indisponible'));assert.ok(!render().includes('<audio'));
});
test('patrimonial audio stops on voice changes, closed sections and page exit; other readers cannot keep playing',()=>{
 const handlers={},windowHandlers={};const status={textContent:''};
 const audio=()=>({tagName:'AUDIO',paused:false,pause(){this.paused=true},load(){this.loaded=true},parentElement:{querySelector(){return status}}});const first=audio(),second=audio();
 const ctx={document:{querySelectorAll(){return [first,second]},getElementById(){return first},addEventListener(n,fn){handlers[n]=fn}},window:{addEventListener(n,fn){windowHandlers[n]=fn}}};
 vm.runInNewContext(fs.readFileSync(__dirname+'/patrimoine-client.js','utf8'),ctx);
 handlers.play({target:first});assert.equal(second.paused,true);assert.equal(first.paused,false);
 handlers.change({target:{matches(){return true},dataset:{audio:'first'},value:'/api/narration/audio/'+'b'.repeat(64)+'/male.mp3'}});assert.equal(first.paused,true);assert.equal(first.loaded,true);assert.match(status.textContent,/Voix changée/);
 first.paused=false;handlers.toggle({target:{tagName:'DETAILS',open:false,querySelectorAll(){return [first]}}});assert.equal(first.paused,true);
 first.paused=false;windowHandlers.pagehide();assert.equal(first.paused,true);
 handlers.error({target:first});assert.match(status.textContent,/Réessayez/);
});
test('real HTTP routes expose a dedicated collection while retaining the general catalogue',async()=>{
 const child=require('node:child_process').fork(__dirname+'/server.js',[],{env:{...process.env,PORT:'0'},stdio:['ignore','ignore','pipe','ipc']});
 try{const port=await new Promise((resolve,reject)=>{child.on('message',m=>{if(m.type==='eclat-ready')resolve(m.port)});child.once('error',reject);child.once('exit',c=>reject(Error('server '+c)))});const origin='http://127.0.0.1:'+port;
 const page=await fetch(origin+'/patrimoine-libertin');assert.equal(page.status,200);const gate=await page.text();assert.match(gate,/Le videur est resté en 1992/);assert.ok(!gate.includes('Érotisme et'));assert.ok(!gate.includes('<blockquote>'));assert.match(page.headers.get('cache-control'),/no-store/);assert.equal((await fetch(origin+'/api/patrimoine')).status,403);assert.equal((await fetch(origin+'/data/patrimoine-catalog.json')).status,403);
 const challenge=cheerio.load(gate)('input[name=challenge]').val();const q=JSON.parse(Buffer.from(challenge.split('.')[0],'base64url')).q;const answer=String([0,1,2][q]);
 const post=body=>fetch(origin+'/patrimoine-libertin/entrer',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(body),redirect:'manual'});
 assert.ok(!(await post({challenge,answer})).headers.get('set-cookie'));
 const wrong=await post({challenge,answer:String((Number(answer)+1)%3),adult:'yes'});assert.match(await wrong.text(),/Raté/);assert.ok(!wrong.headers.get('set-cookie'));
 assert.ok(!(await post({challenge:challenge+'x',answer,adult:'yes'})).headers.get('set-cookie'));
 const success=await post({challenge,answer,adult:'yes'});assert.equal(success.status,303);const cookie=success.headers.get('set-cookie');assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Lax/);const headers={cookie:cookie.split(';')[0]};
 const unlocked=await fetch(origin+'/patrimoine-libertin',{headers});assert.match(await unlocked.text(),/Une collection à choisir librement/);assert.match(unlocked.headers.get('cache-control'),/no-store/);assert.equal((await fetch(origin+'/api/patrimoine',{headers:{cookie:'eclat_salon=fake'}})).status,403);
 const legacy=await(await fetch(origin+'/api/catalogue')).json();assert.equal(legacy.works.length,184);for(const w of catalog.works)assert.ok(!legacy.works.some(q=>q.id===w.id));
 assert.deepEqual(await(await fetch(origin+'/api/patrimoine',{headers})).json(),catalog);
 const home=await(await fetch(origin)).text();assert.match(home,/body\.kids #patrimoineLink\{display:none!important\}/);assert.ok(!home.includes('Une collection sensuelle et libertine'));assert.match(home,/Le salon rétro/);assert.match(home,/href="\/patrimoine-libertin"/);
 assert.equal((await fetch(origin+'/patrimoine-libertin/',{redirect:'manual'})).status,308);
 assert.doesNotMatch(await(await fetch(origin+'/sitemap.xml')).text(),/\/patrimoine-libertin<\/loc>/);
 }finally{child.kill();}
});
