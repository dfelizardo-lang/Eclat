(() => {
 const panel=document.getElementById('libraryPanel'),open=document.getElementById('libraryWatchOpen'),form=document.getElementById('libraryUrlForm'),input=document.getElementById('libraryUrl'),status=document.getElementById('libraryNewsStatus'),results=document.getElementById('libraryNewsResults'),savedList=document.getElementById('libraryWantedList');
 const key='eclat-library-watch-v1';let state={url:'',favorites:[],snapshot:null},busy=false,requestNumber=0;
 try{const stored=JSON.parse(localStorage.getItem(key)||'null');if(stored && Array.isArray(stored.favorites))state=stored;}catch{status.textContent='Vos préférences de bibliothèque ne peuvent pas être chargées sur cet appareil.';}
 const safe=value=>{try{const u=new URL(value);return u.protocol==='https:'?u.href:'';}catch{return '';}};
 function persist(next){localStorage.setItem(key,JSON.stringify(next));state=next;}
 function node(tag,text,cls){const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;}
 function card(item,saved=false){
  const article=node('article',null,'library-news-card');article.append(node('p',item.kind==='book'?(item.type||'Livre'):'Actualité','library-item-kind'),node('h4',item.title));
  if(item.author)article.append(node('p',item.author,'library-item-author'));if(item.date)article.append(node('p',item.date,'field-hint'));
  const actions=node('div',null,'library-card-actions'),link=node('a','Voir sur le site');link.href=safe(item.url);link.target='_blank';link.rel='noopener noreferrer';actions.append(link);
  const liked=state.favorites.some(i=>i.id===item.id),heart=node('button',liked?'♥':'♡','library-heart');heart.type='button';heart.setAttribute('aria-pressed',String(liked));heart.setAttribute('aria-label',(liked?'Retirer de ma liste : ':'Penser à demander au bibliothécaire : ')+item.title);
  heart.addEventListener('click',()=>{try{const favorites=liked?state.favorites.filter(i=>i.id!==item.id):[...state.favorites,{...item,libraryUrl:state.url,savedAt:new Date().toISOString()}];persist({...state,favorites});render();status.textContent=liked?'Retiré de votre liste.':'Ajouté à « À demander au bibliothécaire ».';}catch{status.textContent='Cette envie n’a pas pu être enregistrée sur votre appareil.';}});actions.append(heart);article.append(actions);return article;
 }
 function render(){
  results.replaceChildren();savedList.replaceChildren();const snapshot=state.snapshot;
  if(snapshot && snapshot.url){const source=node('a','Ouvrir ma bibliothèque');source.href=safe(snapshot.url);source.target='_blank';source.rel='noopener noreferrer';results.append(source);}
  for(const [kind,title] of [['book','Les nouveautés de votre bibliothèque'],['news','Les actualités']]){
   const items=(snapshot?.items||[]).filter(i=>i.kind===kind && safe(i.url));results.append(node('h3',title));
   if(!items.length){results.append(node('p',kind==='book'?'Aucune nouveauté de livre lisible sur cette page pour le moment.':'Aucune actualité lisible sur cette page pour le moment.','field-hint'));continue;}
   const grid=node('div',null,'library-news-grid');for(const item of items)grid.append(card(item));results.append(grid);
  }
  for(const item of state.favorites.filter(i=>safe(i.url)))savedList.append(card(item,true));
  if(!state.favorites.length)savedList.append(node('p','Touchez un cœur pour garder un titre à demander lors de votre prochaine visite.','field-hint'));
 }
 async function refresh(){
  if(!state.url || busy)return;busy=true;const number=++requestNumber;document.getElementById('libraryRefresh').disabled=true;status.textContent='Consultation de votre bibliothèque…';
  try{const r=await fetch('/api/library-news?url='+encodeURIComponent(state.url),{cache:'no-store',signal:AbortSignal.timeout(45000)});const data=await r.json();if(!r.ok)throw new Error(data.error||'Le site est indisponible.');if(number!==requestNumber)return;const next={...state,snapshot:data};try{persist(next);}catch{state=next;}render();status.textContent=(data.message?data.message+' ':'')+'Vérifié le '+new Date(data.checkedAt).toLocaleString('fr-FR')+'. Actualisation toutes les cinq minutes pendant que ce panneau est ouvert.';}
  catch(e){status.textContent=(e.message||'Le site est momentanément indisponible.')+(state.snapshot?' Les derniers résultats conservés restent affichés.':'');}finally{busy=false;document.getElementById('libraryRefresh').disabled=false;}
 }
 open.addEventListener('click',()=>{panel.hidden=!panel.hidden;open.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden){input.value=state.url||'';render();input.focus();refresh();}});
 document.getElementById('libraryPanelClose').addEventListener('click',()=>{panel.hidden=true;open.setAttribute('aria-expanded','false');open.focus();});
 document.getElementById('libraryRefresh').addEventListener('click',refresh);
 form.addEventListener('submit',event=>{event.preventDefault();const url=safe(input.value.trim());if(!url){status.textContent='Entrez une adresse HTTPS valide.';return;}if(busy){status.textContent='La consultation est en cours. Réessayez dans un instant.';return;}try{persist({...state,url,snapshot:state.url===url?state.snapshot:null});render();refresh();}catch{status.textContent='L’adresse n’a pas pu être enregistrée sur cet appareil.';}});
 setInterval(()=>{if(!panel.hidden && !document.hidden)refresh();},300000);
})();
