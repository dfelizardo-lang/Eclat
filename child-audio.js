/* Pre-rendered Piper audio: no paid API, text submission or device TTS required. */
(function(root,factory){const create=factory();if(typeof module==='object'&&module.exports)module.exports=create;else root.createEclatChildAudio=create})(typeof window==='object'?window:globalThis,function(){
 return function create({Audio,loadManifest,resolveURL,notify,finish,currentToken}){
  let manifestPromise=null,session=null,generation=0;
  function stop(){generation++;if(session){session.audio?.pause();if(session.audio){session.audio.removeAttribute('src');session.audio.load()}session=null}}
  function valid(s){return session===s&&s.generation===generation&&s.token===currentToken()}
  async function play(s){
   if(!valid(s))return;
   try{await s.audio.play();if(valid(s)){s.paused=false;notify('playing')}}
   catch(e){if(!valid(s))return;s.paused=true;notify(e.name==='NotAllowedError'?'ready':'error')}
  }
  async function start(token,passage,kind,rate,startPaused=false){
   stop();const s={token,passage,kind,rate,generation,paused:startPaused,audio:null};session=s;notify('loading');
   try{
    if(!manifestPromise)manifestPromise=loadManifest().catch(e=>{manifestPromise=null;throw e});
    const manifest=await manifestPromise;if(!valid(s))return;
    const record=manifest.passages[passage.id];const item=record?.voices[kind];
    if(!item)throw new Error('Audio absent');
    s.audio=new Audio(resolveURL(item.url));s.audio.preload='auto';s.audio.playbackRate=rate;
    s.audio.addEventListener('ended',()=>{if(valid(s)){session=null;finish(token)}});
    s.audio.addEventListener('error',()=>{if(valid(s)){manifestPromise=null;session=null;notify('error')}});
    if(startPaused)notify('paused');else await play(s);
   }catch(e){if(valid(s)){session=null;notify('error')}}
  }
  function toggle(){if(!session)return false;const s=session;
   if(!s.audio)return true;
   if(s.paused)void play(s);else{s.audio.pause();s.paused=true;notify('paused')}
   return true;
  }
  function settings(kind,rate){if(!session)return;const s=session;
   if(s.kind!==kind){void start(s.token,s.passage,kind,rate,s.paused);return}
   s.rate=rate;if(s.audio)s.audio.playbackRate=rate;
  }
  return {start,stop,toggle,settings,get active(){return !!session}};
 };
});
