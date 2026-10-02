(() => {
  function addLoanButton() {
    const saved = document.getElementById('savedOpen');
    if (!saved || document.getElementById('libraryLoansLink')) return;
    const group = document.createElement('div');
    group.className = 'header-reading-tools';
    saved.before(group);
    group.append(saved);
    const link = document.createElement('a');
    link.id = 'libraryLoansLink';
    link.className = 'library-loans-link';
    link.href = '/emprunts.html';
    const icon = document.createElement('span'); icon.textContent = '▤'; icon.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span'); label.textContent = 'Emprunt en bibliothèque';
    link.append(icon, label);
    group.append(link);
    function updateLoanAudience(){const kids=document.body.classList.contains('kids');link.href=kids?'/emprunts-enfants.html':'/emprunts.html';label.textContent=kids?'Le coin des mini-aventuriers':'Emprunt en bibliothèque';label.hidden=false;link.classList.remove('icon-only');link.setAttribute('aria-label',kids?'Le coin des mini-aventuriers':'Emprunt en bibliothèque');link.title=kids?'Le coin des mini-aventuriers':'Emprunt en bibliothèque';icon.replaceChildren();if(kids){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('width','28');svg.setAttribute('height','28');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.8');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','M12 5v15M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1ZM5 8h4M5 11h4M15 8h4M15 11h4');svg.append(path);icon.append(svg);}else icon.textContent='▤';}
    if(new URLSearchParams(location.search).get('public')==='enfants'&&!document.body.classList.contains('kids'))document.getElementById('childBtn')?.click();
    updateLoanAudience();
    new MutationObserver(updateLoanAudience).observe(document.body,{attributes:true,attributeFilter:['class']});
    const style = document.createElement('style');
    style.textContent = `.header-reading-tools{display:flex;align-items:center;gap:12px}.header-reading-tools #savedOpen,.library-loans-link{display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:46px;border:1px solid #bcb3a4;border-radius:99px;padding:11px 18px;background:transparent;color:inherit;text-decoration:none;font:700 14px Arial,Helvetica,sans-serif;white-space:nowrap;transition:background .18s,border-color .18s}.header-reading-tools #savedOpen>span:first-child,.library-loans-link>span:first-child{font-size:20px;line-height:1;color:#a6482e}.header-reading-tools #savedOpen small{min-width:21px;height:21px;font-size:10px}.header-reading-tools #savedOpen:hover,.library-loans-link:hover{background:#fffaf2;border-color:#a6482e}.header-reading-tools #savedOpen:focus-visible,.library-loans-link:focus-visible{outline:2px solid #c24a2c;outline-offset:3px}@media(max-width:940px){header:has(.header-reading-tools){height:auto;min-height:66px;flex-wrap:wrap;gap:12px;padding-top:12px;padding-bottom:12px}header:has(.header-reading-tools)>.logo{order:1}header:has(.header-reading-tools)>.audience-switch{order:2}.header-reading-tools{order:3;width:100%;justify-content:center;gap:10px}.header-reading-tools #savedOpen>span:nth-child(2){display:inline}}@media(max-width:480px){.header-reading-tools #savedOpen,.library-loans-link{font-size:12px;min-height:44px;padding:10px 12px;gap:6px}.header-reading-tools{gap:8px;align-items:stretch}.header-reading-tools #savedOpen{flex-shrink:0}.library-loans-link{flex:1;min-width:0;max-width:230px}.library-loans-link>span:nth-child(2){white-space:normal;line-height:1.3}.header-reading-tools #savedOpen>span:first-child,.library-loans-link>span:first-child{font-size:18px}.header-reading-tools #savedOpen small{min-width:18px;height:18px;font-size:9px}}`
    style.textContent += '.header-reading-tools .library-loans-link.icon-only{flex:0 0 auto;min-width:54px;padding:10px 13px}.library-loans-link.icon-only>span:first-child{display:flex;align-items:center;justify-content:center}.library-loans-link.icon-only>span[hidden]{display:none!important}';
    document.head.append(style);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addLoanButton);
  else addLoanButton();
})();
