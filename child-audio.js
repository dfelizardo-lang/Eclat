/* Pre-rendered Piper audio: no paid API, text submission or device TTS required. */
(function(root,factory){const create=factory();if(typeof module==='object'&&module.exports)module.exports=create;else root.createEclatChildAudio=create})(typeof window==='object'?window:globalThis,function(){
 return function create({Audio,loadManifest,resolveURL,notify,finish,currentToken,timeoutMs=15000}){
  let manifestPromise=null,session=null,generation=0;
  function clearTimer(s){clearTimeout(s.timer);s.timer=null}
  function stop(){generation++;if(session){clearTimer(session);session.audio?.pause();if(session.audio){session.audio.removeAttribute('src');session.audio.load()}session=null}}
  function valid(s){return session===s&&s.generation===generation&&s.token===currentToken()}
  function fail(s){if(!valid(s))return;manifestPromise=null;stop();notify('error')}
  function arm(s){clearTimer(s);s.timer=setTimeout(()=>fail(s),timeoutMs);s.timer.unref?.()}
  async function play(s){
   if(!valid(s))return;arm(s);
   try{await s.audio.play();if(valid(s)){clearTimer(s);s.paused=false;notify('playing')}}
   catch(e){if(!valid(s))return;clearTimer(s);if(e.name==='NotAllowedError'){s.paused=true;notify('ready')}else fail(s)}
  }
  async function start(token,passage,kind,rate,startPaused=false){
   stop();const s={token,passage,kind,rate,generation,paused:startPaused,audio:null,timer:null};session=s;notify('loading');arm(s);
   try{
    if(!manifestPromise)manifestPromise=loadManifest().catch(e=>{manifestPromise=null;throw e});
    const manifest=await manifestPromise;if(!valid(s))return;
    const item=manifest.passages[passage.id]?.voices[kind];
    if(!item)throw new Error('Audio absent');
    s.audio=new Audio(resolveURL(item.url));s.audio.preload='auto';s.audio.playbackRate=rate;
    s.audio.addEventListener('ended',()=>{if(valid(s)){clearTimer(s);session=null;finish(token)}});
    s.audio.addEventListener('error',()=>fail(s));
    for(const event of ['waiting','stalled'])s.audio.addEventListener(event,()=>{if(valid(s)&&!s.paused)arm(s)});
    s.audio.addEventListener('playing',()=>{if(valid(s))clearTimer(s)});
    if(startPaused){clearTimer(s);notify('paused')}else await play(s);
   }catch(e){fail(s)}
  }
  function toggle(){if(!session)return false;const s=session;
   if(!s.audio)return true;
   if(s.paused)void play(s);else{clearTimer(s);s.audio.pause();s.paused=true;notify('paused')}
   return true;
  }
  function settings(kind,rate){if(!session)return;const s=session;
   if(s.kind!==kind){void start(s.token,s.passage,kind,rate,s.paused);return}
   s.rate=rate;if(s.audio)s.audio.playbackRate=rate;
  }
  return {start,stop,toggle,settings,get active(){return !!session}};
 };
});
