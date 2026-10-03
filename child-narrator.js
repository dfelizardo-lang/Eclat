(() => {
 const bar=document.getElementById('listenBar');if(!bar)return;
 const field=document.createElement('fieldset');field.className='child-narrator';field.innerHTML='<legend>Qui te raconte l’histoire ?</legend><label for="childNarratorKind">Voix du récit</label><select id="childNarratorKind"><option value="auto">La voix la plus naturelle disponible</option><option value="female">Une conteuse</option><option value="male">Un conteur</option></select><label for="childNarratorVoice">Choisir une voix disponible</label><select id="childNarratorVoice"></select><p class="child-narrator-note" role="status" aria-live="polite"></p>';bar.after(field);
 const kind=field.querySelector('#childNarratorKind'),choice=field.querySelector('#childNarratorVoice'),note=field.querySelector('p');let saved={kind:'auto',voice:''};try{saved=JSON.parse(localStorage.getItem('eclat-child-narrator')||'null')||saved}catch{}
 kind.value=['auto','female','male'].includes(saved.kind)?saved.kind:'auto';
 const gender=v=>{const n=v.name.toLowerCase();if(/audrey|aurélie|aurelie|amélie|amelie|hortense|julie|denise|sylvie|céline|celine|léa|lea|female|woman|fémin/.test(n))return 'female';if(/thomas|henri|paul|mathieu|antoine|nicolas|male\b|man\b|mascul/.test(n))return 'male';return 'unknown'};
 const voices=()=>[...(window.speechSynthesis?.getVoices()||[])].filter(v=>/^fr(?:[-_]|$)/i.test(v.lang)).sort((a,b)=>voiceNaturalScore(b)-voiceNaturalScore(a));
 function refresh(){
  const all=voices(),matched=kind.value==='auto'?all:all.filter(v=>gender(v)===kind.value),previous=choice.value||saved.voice;
  choice.replaceChildren();const automatic=document.createElement('option');automatic.value='';automatic.textContent='Choix automatique';choice.append(automatic);
  for(const v of all){const o=document.createElement('option');o.value=v.voiceURI;o.textContent=v.name+' · '+v.lang;choice.append(o)}
  if(all.some(v=>v.voiceURI===previous))choice.value=previous;
  note.textContent=!all.length?'Aucune voix française détectée pour le moment. Vérifie les voix de ton appareil.':kind.value!=='auto'&&!matched.length?'Ce type de voix n’est pas identifié sur cet appareil. Choisis une voix dans la liste ou utilise le choix automatique.':'Les voix dépendent de ton appareil. Tu peux écouter et choisir celle que tu préfères.';
 }
 const original=window.selectedFrenchVoice;
 window.selectedFrenchVoice=function(){if(!document.body.classList.contains('kids'))return original();const all=voices();const explicit=all.find(v=>v.voiceURI===choice.value);if(explicit)return explicit;const matched=kind.value==='auto'?all:all.filter(v=>gender(v)===kind.value);return matched[0]||all[0]||null};
 function save(){try{localStorage.setItem('eclat-child-narrator',JSON.stringify({kind:kind.value,voice:choice.value}))}catch{}if(typeof applySpeechSettingLive==='function')applySpeechSettingLive()}
 kind.onchange=()=>{saved.voice='';choice.value='';refresh();save()};choice.onchange=save;
 let wasChild=false;function audience(){const child=document.body.classList.contains('kids');field.hidden=!child;if(child&&!wasChild){const rate=document.getElementById('listenRate');if(rate)rate.value='0.85';refresh()}wasChild=child}
 new MutationObserver(audience).observe(document.body,{attributes:true,attributeFilter:['class']});window.speechSynthesis?.addEventListener('voiceschanged',refresh);refresh();audience();
})();
