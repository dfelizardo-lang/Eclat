/* One visible view; the two main actions remain available in each view. */
(() => {
 const views={list:document.getElementById('loansOverview'),library:document.getElementById('libraryPanel'),form:document.getElementById('loansForm')};
 const library=document.getElementById('libraryWatchOpen'),loan=document.getElementById('newLoan');
 window.EclatLoanViews={show(view){if(!views[view])return;for(const [name,node] of Object.entries(views))node.hidden=name!==view;library.setAttribute('aria-expanded',String(view==='library'));library.setAttribute('aria-pressed',String(view==='library'));loan.setAttribute('aria-pressed',String(view==='form'));}};
})();
