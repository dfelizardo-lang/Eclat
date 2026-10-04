(() => {
 const bar=document.getElementById('listenBar');if(!bar||window.EclatChildAudio)return;
 const field=document.createElement('fieldset');field.className='child-narrator';field.innerHTML='<legend>Qui te raconte l’histoire ?</legend><div class="narrator-switch" role="group" aria-label="Choisir la voix du récit"><button type="button" data-kind="female" aria-pressed="true">Conteuse</button><button type="button" data-kind="male" aria-pressed="false">Conteur</button></div><p class="child-narrator-note" role="status" aria-live="polite">Deux voix françaises pour te raconter les histoires.</p>';bar.after(field);
 let kind='female';try{if(JSON.parse(localStorage.getItem('eclat-child-narrator')||'null')?.kind==='male')kind='male'}catch{}
 const native=!!window.Capacitor?.isNativePlatform?.();
 const credit=document.createElement('a');credit.href='/narration-credits.html';credit.target='_blank';credit.rel='noopener';credit.textContent='Voix et crédits';field.append(credit);
 const rate=()=>parseFloat(document.getElementById('listenRate')?.value||'1');
 function refresh(){for(const b of field.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.kind===kind))}
 function notify(state){
  const icon=document.getElementById('listenIcon'),label=document.getElementById('listenLabel'),status=document.getElementById('listenStatus');
  if(icon)icon.textContent=state==='playing'?'Ⅱ':'▶';
  if(label)label.textContent=state==='playing'?'Pause':state==='paused'||state==='ready'?'Continuer':'Raconte-moi';
  if(status)status.textContent=({loading:'Ton histoire se prépare…',playing:'Lecture en cours',paused:'Lecture en pause',ready:'Appuie sur Continuer pour écouter.',error:'Cette voix est momentanément indisponible. Réessaie.'})[state]||'';
 }
 const audio=createEclatChildAudio({Audio:window.Audio,
  loadManifest:async()=>{const response=await fetch(native?'/narration/manifest.json':'/api/narration');if(!response.ok)throw new Error('Narration indisponible');return response.json()},
  resolveURL:url=>native?url.replace('/api/narration/audio/','/narration/'):url,
  notify,currentToken:()=>speechToken,
  finish:token=>{if(token===speechToken){speechIndex=speechQueue.length;speakCurrent(token)}}});
 window.EclatChildAudio={
  start(token,passage){if(!passage||passage.audience!=='child')return false;audio.start(token,passage,kind,rate());return true},
  stop:audio.stop,toggle:audio.toggle,settings:()=>audio.settings(kind,rate())};
 field.addEventListener('click',e=>{const b=e.target.closest('[data-kind]');if(!b)return;kind=b.dataset.kind;try{localStorage.setItem('eclat-child-narrator',JSON.stringify({kind}))}catch{}refresh();audio.settings(kind,rate())});
 function audience(){field.hidden=!document.body.classList.contains('kids');if(field.hidden)audio.stop()}
 new MutationObserver(audience).observe(document.body,{attributes:true,attributeFilter:['class']});refresh();audience();
})();
