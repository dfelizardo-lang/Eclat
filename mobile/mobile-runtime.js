/* Android-only entry point. No browser data deletion. */
(function(){
 const API='https://eclat-v1-sync-production.up.railway.app';
 const nativeFetch=window.fetch.bind(window);
 window.fetch=function(input,init){
  const url=new URL(input instanceof Request?input.url:String(input),location.href);
  if(url.origin===location.origin && url.pathname.startsWith('/api/')){
   if(url.pathname==='/api/google-calendar/config')return Promise.resolve(new Response(JSON.stringify({enabled:false}),{headers:{'Content-Type':'application/json'}}));
   const target=API+url.pathname+url.search;
   input=input instanceof Request?new Request(target,input):target;
  }
  return nativeFetch(input,init);
 };
 document.addEventListener('DOMContentLoaded',()=>{
  document.addEventListener('click',event=>{
   const link=event.target.closest?.('a[href]');
   const browser=window.Capacitor?.Plugins?.Browser;
   if(!link || !browser)return;
   const url=new URL(link.href,location.href);
   if(url.protocol==='https:' && url.origin!==location.origin){
    event.preventDefault();browser.open({url:url.href});
   }
  });
  const app=window.Capacitor?.Plugins?.App;
  if(app)app.addListener('backButton',({canGoBack})=>{
   const reader=document.getElementById('readerOverlay');
   if(reader?.classList.contains('open')){document.getElementById('readerClose')?.click();return;}
   if(canGoBack)history.back();else app.exitApp();
  });
 });
})();
