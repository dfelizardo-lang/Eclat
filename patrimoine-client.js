(function(){
 const audios=()=>Array.from(document.querySelectorAll('audio'));
 document.addEventListener('play',event=>{if(event.target.tagName==='AUDIO')for(const audio of audios())if(audio!==event.target)audio.pause();},true);
 document.addEventListener('change',event=>{const select=event.target;if(!select.matches('select[data-audio]'))return;const audio=document.getElementById(select.dataset.audio);if(!audio)return;audio.pause();audio.src=select.value;audio.load();const status=audio.parentElement.querySelector('[role="status"]');if(status)status.textContent='Voix changée. Appuyez sur lecture pour écouter.';});
 document.addEventListener('toggle',event=>{if(event.target.tagName==='DETAILS'&&!event.target.open)for(const audio of event.target.querySelectorAll('audio'))audio.pause();},true);
 document.addEventListener('error',event=>{const audio=event.target;if(audio.tagName!=='AUDIO')return;const status=audio.parentElement.querySelector('[role="status"]');if(status)status.textContent='L’audio n’a pas pu être chargé. Réessayez la lecture ; le texte reste disponible.';},true);
 window.addEventListener('pagehide',()=>audios().forEach(audio=>audio.pause()));
})();
