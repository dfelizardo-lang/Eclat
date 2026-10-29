/* Aggregate audience counts only; no visitor identifier or measurement cookie. */
(() => {
 const pages=new Set(['/','/emprunts','/emprunts-enfants','/migration','/narration-credits']);
 const optedOut=()=>{try{return localStorage.getItem('eclat-audience-opt-out')==='1';}catch{return true;}};
 const preference=document.querySelector('[data-analytics-opt-out]');
 function showPreference(){if(preference)preference.textContent=optedOut()?'Réactiver la mesure sur ce navigateur':'Désactiver la mesure sur ce navigateur';}
 if(preference){showPreference();preference.addEventListener('click',()=>{try{const wasDisabled=optedOut();localStorage.setItem('eclat-audience-opt-out',wasDisabled?'0':'1');showPreference();document.getElementById('analyticsPreference').textContent=wasDisabled?'Mesure réactivée. Les signaux de refus du navigateur restent prioritaires.':'Mesure désactivée sur ce navigateur.';}catch{document.getElementById('analyticsPreference').textContent='Votre préférence ne peut pas être enregistrée. La mesure reste désactivée.';}});}
 const footer=document.querySelector('footer');
 if(footer&&!footer.querySelector('[href="/mesure-audience"]')){const link=document.createElement('a');link.href='/mesure-audience';link.textContent='Mesure d’audience';link.style.color='inherit';footer.append(link);}
 const pathname=location.pathname.replace(/\.html\/?$/,'').replace(/\/$/,'')||'/';
 if(!pages.has(pathname))return;
 function send(event){
  if(optedOut()||navigator.webdriver||navigator.doNotTrack==='1'||navigator.globalPrivacyControl)return;
  let referrer='';try{referrer=new URL(document.referrer).origin;}catch{}
  const data=JSON.stringify({event,path:pathname,referrer});
  try{if(navigator.sendBeacon&&navigator.sendBeacon('/api/statistiques/collecter',new Blob([data],{type:'application/json'})))return;fetch('/api/statistiques/collecter',{method:'POST',headers:{'Content-Type':'application/json'},body:data,keepalive:true,credentials:'omit'}).catch(()=>{});}catch{}
 }
 send('view');
 let open=false;
 const overlay=document.getElementById('readerOverlay');
 if(overlay)new MutationObserver(()=>{const visible=overlay.classList.contains('open');if(visible&&!open)send('reader');open=visible;}).observe(overlay,{attributes:true,attributeFilter:['class']});
 const listenStatus=document.getElementById('listenStatus');let listening=false;
 if(listenStatus)new MutationObserver(()=>{const playing=listenStatus.textContent==='Lecture en cours';if(playing&&!listening)send('audio');listening=playing;}).observe(listenStatus,{childList:true,subtree:true,characterData:true});
 document.addEventListener('click',event=>{if(event.target.closest('a[href^="mailto:eeclatsclassiques@gmail.com"]'))send('suggestion');});
})();
