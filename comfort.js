(() => {
 'use strict';
 const engine=document.createElement('script');engine.src='/child-audio.js';engine.onload=()=>{const narrator=document.createElement('script');narrator.src='/child-narrator.js';document.head.append(narrator)};document.head.append(engine);
 const nav=document.createElement('script');nav.src='/accessible-navigation.js';document.head.append(nav);
 const key='eclat-comfort-v1',defaults={size:'100',spacing:false,simple:false,motion:false,theme:'paper'};
 let settings={...defaults};try{settings={...defaults,...JSON.parse(localStorage.getItem(key)||'{}')}}catch{}
 const link=document.createElement('link');link.rel='stylesheet';link.href='/comfort.css';document.head.append(link);
 const skip=document.createElement('a');skip.className='comfort-skip';skip.href='#eclat-main';skip.textContent='Aller au contenu';document.body.prepend(skip);
 const main=document.querySelector('main');if(main){main.id='eclat-main';main.tabIndex=-1}
 const button=document.createElement('button');button.type='button';button.className='comfort-open';button.textContent='Aa · Confort de lecture';button.setAttribute('aria-haspopup','dialog');document.querySelector('header')?.append(button);
 const dialog=document.createElement('dialog');dialog.className='comfort-dialog';dialog.setAttribute('aria-labelledby','comfort-title');
 dialog.innerHTML=`<div class="comfort-heading"><p class="comfort-kicker">À VOTRE RYTHME</p><button type="button" data-close aria-label="Fermer les réglages">×</button></div><h2 id="comfort-title">Confort de lecture</h2><p>Ces réglages s’appliquent aux grandes histoires et aux mini aventuriers. Ils restent sur cet appareil.</p><label class="comfort-field" for="comfort-size">Taille du texte<select id="comfort-size"><option value="100">100 % · habituelle</option><option value="125">125 %</option><option value="150">150 %</option><option value="175">175 %</option><option value="200">200 %</option></select></label><label class="comfort-check"><input type="checkbox" data-setting="spacing">Espacer les lignes et les paragraphes</label><label class="comfort-check"><input type="checkbox" data-setting="simple">Simplifier l’affichage</label><label class="comfort-check"><input type="checkbox" data-setting="motion">Réduire les animations</label><label class="comfort-field" for="comfort-theme">Couleurs<select id="comfort-theme"><option value="paper">Couleurs d’Éclat</option><option value="light">Contraste renforcé · clair</option><option value="dark">Contraste renforcé · sombre</option></select></label><div class="comfort-audio"><h3>Écouter cette page</h3><p>Une lecture des informations visibles, sur demande. Pour naviguer à la voix, vous pouvez aussi utiliser TalkBack ou VoiceOver.</p><label class="comfort-field" for="comfort-rate">Vitesse<select id="comfort-rate"><option value="0.85">Plus lente</option><option value="1" selected>Habituelle</option><option value="1.15">Plus rapide</option></select></label><div class="comfort-buttons"><button type="button" data-speak>Écouter la page</button><button type="button" data-pause disabled>Pause</button><button type="button" data-stop disabled>Arrêter</button></div><p role="status" id="comfort-status"></p></div><button type="button" data-reset>Rétablir les réglages habituels</button>`;
 document.body.append(dialog);
 function apply(){
  if(!['100','125','150','175','200'].includes(settings.size))settings.size='100';
  if(!['paper','light','dark'].includes(settings.theme))settings.theme='paper';
  document.documentElement.style.setProperty('--comfort-scale',Number(settings.size)/100);
  document.body.dataset.comfortTheme=settings.theme;
  ['spacing','simple','motion'].forEach(k=>document.body.classList.toggle('comfort-'+k,!!settings[k]));
  dialog.querySelector('#comfort-size').value=settings.size;dialog.querySelector('#comfort-theme').value=settings.theme;
  dialog.querySelectorAll('[data-setting]').forEach(x=>x.checked=!!settings[x.dataset.setting]);
 }
 function save(){apply();try{localStorage.setItem(key,JSON.stringify(settings))}catch{}}
 apply();button.onclick=()=>dialog.showModal();dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.addEventListener('close',()=>button.focus());
 dialog.addEventListener('change',e=>{if(e.target.dataset.setting)settings[e.target.dataset.setting]=e.target.checked;else if(e.target.id==='comfort-size')settings.size=e.target.value;else if(e.target.id==='comfort-theme')settings.theme=e.target.value;save()});
 dialog.querySelector('[data-reset]').onclick=()=>{settings={...defaults};save()};
 const speech=window.speechSynthesis,status=dialog.querySelector('#comfort-status'),pause=dialog.querySelector('[data-pause]'),stop=dialog.querySelector('[data-stop]');let utterance;
 function end(message){pause.disabled=stop.disabled=true;pause.textContent='Pause';status.textContent=message}
 stop.onclick=()=>{speech?.cancel();end('Lecture arrêtée.')};
 pause.onclick=()=>{if(speech.paused){speech.resume();pause.textContent='Pause'}else{speech.pause();pause.textContent='Reprendre'}};
 dialog.querySelector('[data-speak]').onclick=()=>{
  if(!speech||!window.SpeechSynthesisUtterance){status.textContent='La lecture audio n’est pas disponible sur ce navigateur.';return}
  const reader=document.querySelector('#readerOverlay.open .reader-shell');const root=reader||main;
  const text=root?[...root.querySelectorAll('h1,h2,h3,h4,p,label,legend,button,.reader-text')].filter(e=>e.getClientRects().length&&!e.closest('[hidden]')&&!e.parentElement.closest('.reader-text')).map(e=>e.innerText.trim()).filter(Boolean).join('. '):'';
  if(!text){status.textContent='Aucun texte à lire sur cette page.';return}
  speech.cancel();utterance=new SpeechSynthesisUtterance(text);utterance.lang='fr-FR';utterance.rate=Number(dialog.querySelector('#comfort-rate').value);utterance.onend=()=>end('Lecture terminée.');utterance.onerror=()=>end('Lecture interrompue.');speech.speak(utterance);pause.disabled=stop.disabled=false;status.textContent='Lecture en cours.';
 };
})();
