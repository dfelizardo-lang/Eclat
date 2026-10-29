const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/audience-client.js','utf8');
function run(options={}){
 const sent=[],handlers={},observers=[];let refused=options.refused||false,open=false;
 const overlay={classList:{contains:()=>open}},status={textContent:''};
 const ctx={location:{pathname:'/emprunts.html'},document:{referrer:'https://www.google.fr/search?q=private-word',querySelector:()=>null,getElementById:id=>id==='readerOverlay'?overlay:id==='listenStatus'?status:null,addEventListener:(name,fn)=>{handlers[name]=fn}},localStorage:{getItem(){if(options.blocked)throw Error('Denied');return refused?'1':null;}},navigator:{webdriver:false,sendBeacon:(url,data)=>{sent.push({url,data});return true;},...options.navigator},MutationObserver:class{constructor(fn){this.fn=fn;}observe(target){observers.push({target,fn:this.fn});}},URL,Blob};
 vm.runInNewContext(source,ctx);return {sent,handlers,observers,status,overlay,open(){open=true;},refuse(){refused=true;}};
}
 test('audience payload contains only the approved page, action and referrer origin',async()=>{
 const app=run();assert.equal(app.sent.length,1);assert.equal(app.sent[0].url,'/api/statistiques/collecter');
 const payload=JSON.parse(await app.sent[0].data.text());assert.deepEqual(payload,{event:'view',path:'/emprunts',referrer:'https://www.google.fr'});assert.ok(!JSON.stringify(payload).includes('private-word'));
 });
 test('refusal, browser privacy settings, unavailable storage and local automation prevent collection',()=>{
 for(const options of [{refused:true},{blocked:true},{navigator:{webdriver:true}},{navigator:{doNotTrack:'1'}},{navigator:{globalPrivacyControl:true}}])assert.equal(run(options).sent.length,0);
 });
 test('reader and audio are counted on state changes, and a later refusal stops events',async()=>{
 const app=run();app.open();const reader=app.observers.find(o=>o.target===app.overlay);reader.fn();reader.fn();app.status.textContent='Lecture en cours';const audio=app.observers.find(o=>o.target===app.status);audio.fn();audio.fn();
 assert.deepEqual(await Promise.all(app.sent.map(async s=>JSON.parse(await s.data.text()).event)),['view','reader','audio']);
 app.refuse();app.status.textContent='Lecture en pause';audio.fn();app.status.textContent='Lecture en cours';audio.fn();assert.equal(app.sent.length,3);
 });
