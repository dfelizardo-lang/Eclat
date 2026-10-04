(() => {
 const bar=document.getElementById('listenBar');if(!bar||window.EclatChildAudio)return;
 const field=document.createElement('fieldset');field.className='child-narrator';field.innerHTML='<legend>Qui te raconte l’histoire ?</legend><div class="narrator-switch" role="group" aria-label="Choisir la voix du récit"><button type="button" data-kind="female" aria-pressed="true">Conteuse</button><button type="button" data-kind="male" aria-pressed="false">Conteur</button></div><p class="child-narrator-note" role="status" aria-live="polite">Deux voix françaises pour te raconter les histoires.</p>';bar.after(field);
 let kind='female';const child=()=>document.body.classList.contains('kids');const preferenceKey=()=>child()?'eclat-child-narrator':'eclat-adult-narrator';function loadKind(){kind='female';try{if(JSON.parse(localStorage.getItem(preferenceKey())||'null')?.kind==='male')kind='male'}catch{}}loadKind();
 const native=!!window.Capacitor?.isNativePlatform?.();
 const credit=document.createElement('a');credit.href='/narration-credits.html';credit.target='_blank';credit.rel='noopener';credit.textContent='Voix et crédits';field.append(credit);
 const rate=()=>1;
 const bedtime=document.getElementById('bedtimeStory');
 const bedtimeControls=document.createElement('div');bedtimeControls.className='bedtime-audio-controls';bedtimeControls.hidden=true;
 const bedtimeToggle=document.createElement('button');bedtimeToggle.type='button';bedtimeToggle.textContent='Pause';bedtimeToggle.setAttribute('aria-label','Mettre l’histoire du soir en pause');bedtimeControls.append(bedtimeToggle);bedtime?.after(bedtimeControls);
 function refresh(){for(const b of field.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.kind===kind))}
 function notify(state){
  const icon=document.getElementById('listenIcon'),label=document.getElementById('listenLabel'),status=document.getElementById('listenStatus');
  if(icon)icon.textContent=state==='playing'?'Ⅱ':'▶';
  if(label)label.textContent=state==='playing'?'Pause':state==='paused'||state==='ready'?'Continuer':child()?'Raconte-moi':'Écouter';
  document.getElementById('listenToggle')?.setAttribute('aria-label',state==='playing'?'Mettre la lecture en pause':state==='paused'||state==='ready'?'Continuer la lecture':document.body.classList.contains('kids')?'Raconte-moi':'Écouter le texte');
  if(status)status.textContent=({loading:child()?'Ton histoire se prépare…':'Votre lecture se prépare…',playing:'Lecture en cours',paused:'Lecture en pause',ready:'Appuie sur Continuer pour écouter.',error:'Cette voix est momentanément indisponible. Réessaie.'})[state]||'';
  if(typeof bedtimeMode!=='undefined'&&bedtimeMode){
   bedtimeControls.hidden=false;bedtimeToggle.disabled=state==='loading';
   bedtimeToggle.textContent=state==='playing'?'Pause':state==='error'?'Réessayer':'Continuer';
   bedtimeToggle.setAttribute('aria-label',state==='playing'?'Mettre l’histoire du soir en pause':'Continuer l’histoire du soir');
   const meta=document.getElementById('bedtimeMeta');if(meta){meta.setAttribute('role','status');meta.textContent=state==='playing'?'Lecture en cours · '+(window.eclatCurrentPassage?.author||''):status?.textContent||''}
  }
 }
 const audio=createEclatChildAudio({Audio:window.Audio,
  loadManifest:async()=>{const response=await fetch(native?'/narration/manifest.json':'/api/narration');if(!response.ok)throw new Error('Narration indisponible');return response.json()},
  resolveURL:url=>native?url.replace('/api/narration/audio/','/narration/'):url,
  notify,currentToken:()=>speechToken,
  finish:token=>{if(token===speechToken){notify('stopped');speechIndex=speechQueue.length;speakCurrent(token)}}});
 window.EclatChildAudio={
  start(token,passage){if(!passage)return false;audio.start(token,passage,kind,rate());return true},
  stop(){audio.stop();notify('stopped');bedtimeControls.hidden=true},toggle:audio.toggle,settings:()=>audio.settings(kind,rate())};
 bedtimeToggle.addEventListener('click',()=>{if(!audio.toggle()&&bedtimeMode)speakCurrent(speechToken)});
 if(bedtime)new MutationObserver(()=>{bedtimeControls.hidden=bedtime.getAttribute('aria-pressed')!=='true'}).observe(bedtime,{attributes:true,attributeFilter:['aria-pressed']});
 field.addEventListener('click',e=>{const b=e.target.closest('[data-kind]');if(!b)return;kind=b.dataset.kind;try{localStorage.setItem(preferenceKey(),JSON.stringify({kind}))}catch{}refresh();audio.settings(kind,rate())});
 let wasChild=child();function audience(){const isChild=child();if(isChild!==wasChild){audio.stop();bedtimeControls.hidden=true;loadKind();wasChild=isChild}field.hidden=false;field.querySelector('legend').textContent=isChild?'Qui te raconte l’histoire ?':'Qui vous accompagne dans la lecture ?';field.querySelector('[data-kind=female]').textContent=isChild?'Conteuse':'Narratrice';field.querySelector('[data-kind=male]').textContent=isChild?'Conteur':'Narrateur';field.querySelector('p').textContent=isChild?'Deux voix françaises pour te raconter les histoires.':'Deux voix françaises pour écouter les textes.';refresh()}
 new MutationObserver(audience).observe(document.body,{attributes:true,attributeFilter:['class']});refresh();audience();
})();
