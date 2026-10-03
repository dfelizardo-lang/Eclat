(() => {
 const bar=document.getElementById('listenBar');if(!bar)return;
 const field=document.createElement('fieldset');field.className='child-narrator';field.innerHTML='<legend>Qui te raconte l’histoire ?</legend><div class="narrator-switch" role="group" aria-label="Choisir la voix du récit"><button type="button" data-kind="female" aria-pressed="true">Conteuse</button><button type="button" data-kind="male" aria-pressed="false">Conteur</button></div><p class="child-narrator-note" role="status" aria-live="polite"></p>';bar.after(field);
 const note=field.querySelector('p');let kind='female';try{const saved=JSON.parse(localStorage.getItem('eclat-child-narrator')||'null');if(saved?.kind==='male')kind='male'}catch{}
 function gender(v){const n=v.name.toLowerCase();if(/audrey|aurélie|aurelie|amélie|amelie|hortense|julie|denise|sylvie|céline|celine|léa|lea|female|woman|fémin/.test(n))return 'female';if(/thomas|henri|paul|mathieu|antoine|nicolas|\bmale\b|\bman\b|mascul/.test(n))return 'male';return 'unknown'}
 function score(v){let s=voiceNaturalScore(v);if(/soft|warm|gentle|douce|natural|neural|premium|enhanced/i.test(v.name))s+=20;return s}
 function voices(){return [...(window.speechSynthesis?.getVoices()||[])].filter(v=>/^fr(?:[-_]|$)/i.test(v.lang)).sort((a,b)=>score(b)-score(a))}
 function selected(){const all=voices();return all.find(v=>gender(v)===kind)||all.find(v=>gender(v)==='unknown')||null}
 function refresh(){for(const b of field.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.kind===kind));const all=voices();note.textContent=!all.length?'La voix française n’est pas disponible sur cet appareil.':!all.some(v=>gender(v)===kind)?'Ce choix dépend des voix disponibles sur ton appareil.':'';note.hidden=!note.textContent}
 const original=window.selectedFrenchVoice;window.selectedFrenchVoice=function(){return document.body.classList.contains('kids')?selected():original()};
 field.addEventListener('click',e=>{const b=e.target.closest('[data-kind]');if(!b)return;kind=b.dataset.kind;try{localStorage.setItem('eclat-child-narrator',JSON.stringify({kind}))}catch{}refresh();if(typeof applySpeechSettingLive==='function')applySpeechSettingLive()});
 let wasChild=false;function audience(){const child=document.body.classList.contains('kids');field.hidden=!child;if(child&&!wasChild){const rate=document.getElementById('listenRate');if(rate)rate.value='0.85';refresh()}wasChild=child}
 new MutationObserver(audience).observe(document.body,{attributes:true,attributeFilter:['class']});window.speechSynthesis?.addEventListener('voiceschanged',refresh);refresh();audience();
})();
