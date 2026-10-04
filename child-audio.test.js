const test=require('node:test');const assert=require('node:assert/strict');
const create=require('./child-audio');
function setup(loader,rejectOnce=false){
 const audios=[],states=[],finished=[];let token=1,failure=rejectOnce;
 class Audio{
  constructor(url){this.url=url;this.listeners={};audios.push(this)}
  addEventListener(name,fn){this.listeners[name]=fn}
  async play(){if(failure){failure=false;throw Object.assign(new Error('Autoplay blocked'),{name:'NotAllowedError'})}this.playing=true}
  pause(){this.playing=false}
  removeAttribute(){this.url=''}
  load(){}
 }
 const manifest={passages:{p:{voices:{female:{url:'/female.mp3'},male:{url:'/male.mp3'}}}}};
 const audio=create({Audio,loadManifest:loader||(async()=>manifest),resolveURL:x=>x,notify:x=>states.push(x),finish:x=>finished.push(x),currentToken:()=>token});
 return {audio,audios,states,finished,manifest,changeToken:()=>token++};
}
test('two recordings, pause/resume, live speed and one active voice',async()=>{
 const s=setup();await s.audio.start(1,{id:'p'},'female',1);
 assert.equal(s.audios[0].url,'/female.mp3');assert.equal(s.states.at(-1),'playing');
 s.audio.toggle();assert.equal(s.audios[0].playing,false);s.audio.toggle();await Promise.resolve();assert.equal(s.audios[0].playing,true);
 s.audio.settings('female',0.9);assert.equal(s.audios[0].playbackRate,0.9);
 s.audio.settings('male',1);await new Promise(r=>setImmediate(r));
 assert.equal(s.audios[0].playing,false);assert.equal(s.audios[1].url,'/male.mp3');assert.equal(s.audios[1].playing,true);
 s.audios[0].listeners.ended();assert.equal(s.finished.length,0);
 s.audios[1].listeners.ended();assert.deepEqual(s.finished,[1]);assert.equal(s.audio.active,false);
});
test('closing a reader or changing passage prevents stale asynchronous playback',async()=>{
 let resolve;const s=setup(()=>new Promise(r=>resolve=r));
 const pending=s.audio.start(1,{id:'p'},'female',1);s.audio.stop();resolve(s.manifest);await pending;assert.equal(s.audios.length,0);
 const next=s.audio.start(1,{id:'p'},'male',1);s.changeToken();await next;assert.equal(s.audios.length,0);
});
test('missing recording has an explicit error and remains retryable',async()=>{
 const s=setup();await s.audio.start(1,{id:'absent'},'female',1);assert.equal(s.states.at(-1),'error');assert.equal(s.audio.active,false);
 await s.audio.start(1,{id:'p'},'male',1);assert.equal(s.states.at(-1),'playing');
});
test('a mobile autoplay restriction offers continuation and retries on the next tap',async()=>{
 const s=setup(undefined,true);await s.audio.start(1,{id:'p'},'female',1);
 assert.equal(s.states.at(-1),'ready');assert.equal(s.audio.active,true);
 s.audio.toggle();await Promise.resolve();assert.equal(s.states.at(-1),'playing');
});
test('switching voice during a pause preserves the pause',async()=>{
 const s=setup();await s.audio.start(1,{id:'p'},'female',1);s.audio.toggle();
 s.audio.settings('male',1);await new Promise(r=>setImmediate(r));
 assert.equal(s.states.at(-1),'paused');assert.ok(!s.audios[1].playing);
 s.audio.toggle();await Promise.resolve();assert.equal(s.audios[1].playing,true);
});
test('every adult and child reader entry has a stable content-dependent audio identifier',()=>{
 const input=require('./scripts/narration-input.cjs').inputs();assert.ok(input.filter(p=>p.audience==='child').length>=75);assert.ok(input.filter(p=>p.audience==='adult').length>=71);
 assert.equal(new Set(input.map(p=>p.id)).size,input.length);
 for(const p of input){assert.match(p.digest,/^[a-f0-9]{64}$/);assert.match(p.text,/Ce passage est extrait de/)}
});
