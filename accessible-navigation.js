(() => {
 'use strict';
 const focusable='button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]';
 const panels=[['readerOverlay','readerTitle','readerClose'],['savedPanel',null,'savedClose'],['libraryPanel',null,'libraryPanelClose']].map(([id,title,close])=>({node:document.getElementById(id),title,close})).filter(x=>x.node?.parentElement===document.body);
 let active=null,lastTrigger=null;const triggers=new Map(),inertBefore=new Map();
 const set=(node,name,value)=>{if(node.getAttribute(name)!==value)node.setAttribute(name,value)};
 function restore(){for(const [node,value]of inertBefore)node.inert=value;inertBefore.clear()}
 function contain(panel){restore();panel.inert=false;for(const node of document.body.children){if(node===panel||['SCRIPT','STYLE','LINK'].includes(node.tagName))continue;inertBefore.set(node,node.inert);node.inert=true}}
 function visible(node){return !!node.getClientRects().length&&!node.closest('[hidden],[inert]')&&getComputedStyle(node).visibility!=='hidden'}
 function sync(){
  updateMobile();
  const next=panels.filter(x=>x.node.classList.contains('open')).sort((a,b)=>(Number(getComputedStyle(b.node).zIndex)||0)-(Number(getComputedStyle(a.node).zIndex)||0))[0]||null;
  for(const p of panels){const open=p===next;set(p.node,'aria-hidden',String(!open));p.node.inert=!open}
  if(next!==active){
   const previous=active;active=next;restore();
   if(next){triggers.set(next,lastTrigger||document.activeElement);contain(next.node);const title=document.getElementById(next.title);const initial=title||next.node.querySelector('h2')||document.getElementById(next.close);if(initial){initial.tabIndex=-1;initial.focus()}}
   else if(previous){const trigger=triggers.get(previous);if(trigger?.isConnected&&visible(trigger))trigger.focus();else document.querySelector('header button')?.focus()}
  }
  for(const id of ['adultBtn','childBtn']){const b=document.getElementById(id);if(b)set(b,'aria-pressed',String(b.classList.contains('active')))}
  const audio=document.querySelector('.audio-settings-panel');if(audio)audio.inert=!audio.closest('.audio-settings')?.classList.contains('open');
 }
 for(const p of panels){set(p.node,'role','dialog');set(p.node,'aria-modal','true');let title=p.title&&document.getElementById(p.title);if(!title){title=p.node.querySelector('h2');if(title&&!title.id)title.id=p.node.id+'-heading';p.title=title?.id}if(title)set(p.node,'aria-labelledby',title.id);else set(p.node,'aria-label',p.node.id==='savedPanel'?'Mes éclats':'Bibliothèques proches');}
 document.addEventListener('click',e=>{const t=e.target.closest('button,a,[role="button"]');if(t)lastTrigger=t},true);
 document.addEventListener('keydown',e=>{
  if(document.querySelector('dialog[open]')||!active)return;
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();document.getElementById(active.close)?.click();return}
  if(e.key!=='Tab')return;
  const items=[...active.node.querySelectorAll(focusable)].filter(visible),first=items[0],last=items.at(-1);if(!first){e.preventDefault();active.node.tabIndex=-1;active.node.focus();return}
  if(e.shiftKey&&(document.activeElement===first||!items.includes(document.activeElement))){e.preventDefault();last.focus()}
  else if(!e.shiftKey&&(document.activeElement===last||!items.includes(document.activeElement))){e.preventDefault();first.focus()}
 },true);
 document.addEventListener('focusin',e=>{if(active&&!active.node.contains(e.target)&&!document.querySelector('dialog[open]'))active.node.querySelector(focusable)?.focus()});
 new MutationObserver(sync).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','hidden']});
 const hero=document.querySelector('.hero-art');if(hero){hero.removeAttribute('aria-hidden');hero.querySelector('.hero-visual')?.setAttribute('aria-hidden','true')}
 for(const node of document.querySelectorAll('[role="status"],.status,.listen-status'))set(node,'aria-live','polite');
 const skip=document.querySelector('.comfort-skip');skip?.addEventListener('click',()=>document.querySelector('main')?.focus());

 const mobile=document.createElement('nav');mobile.className='accessible-mobile-nav';mobile.setAttribute('aria-label','Navigation mobile');
 const home=document.createElement('a');home.textContent='Accueil';
 const loans=document.createElement('a');
 const comfort=document.createElement('button');comfort.type='button';comfort.textContent='Confort';comfort.setAttribute('aria-label','Ouvrir le confort de lecture');comfort.onclick=()=>document.querySelector('.comfort-open')?.click();
 mobile.append(home);
 const saved=document.getElementById('savedOpen');if(saved){const b=document.createElement('button');b.type='button';b.textContent='Mes éclats';b.onclick=()=>saved.click();mobile.append(b)}
 mobile.append(loans,comfort);document.body.append(mobile);
 function updateMobile(){const kids=document.body.classList.contains('kids')||document.body.classList.contains('kids-loans');const h=kids?'/?public=enfants':'/';const l=kids?'/emprunts-enfants.html':'/emprunts.html';if(home.getAttribute('href')!==h)home.setAttribute('href',h);if(loans.getAttribute('href')!==l)loans.setAttribute('href',l);const label=kids?'Mes livres':'Emprunts';if(loans.textContent!==label)loans.textContent=label;const current=location.pathname===l?loans:location.pathname==='/'?home:null;for(const a of [home,loans]){if(a===current)set(a,'aria-current','page');else a.removeAttribute('aria-current')}}
 sync();
})();
