'use strict';
async function capture(page,info,label){
  if(!page||page.isClosed())return;
  const safe=label.replace(/[^a-zA-Z0-9-]/g,'-');
  const state=await page.evaluate(()=>{
    const ids=['returnDate','reminderTime','saveStatus','photoStatus','overviewStatus','bookSaveMessage','bookForm','loansForm'];
    const fields=Object.fromEntries(ids.map(id=>{const el=document.getElementById(id);return [id,el?{text:el.textContent?.slice(0,1000),value:el.value,hidden:el.hidden,disabled:el.disabled,valid:el.validity?.valid,validationMessage:el.validationMessage}:null];}));
    return {url:location.origin+location.pathname,viewport:{width:innerWidth,height:innerHeight},fields,photos:[...document.querySelectorAll('#photoList img')].map(e=>({complete:e.complete,width:e.naturalWidth,height:e.naturalHeight})),invalid:[...document.querySelectorAll('input:invalid,textarea:invalid')].map(e=>({id:e.id,message:e.validationMessage})),scrollWidth:document.documentElement.scrollWidth};
  }).catch(error=>({diagnosticError:error.message}));
  console.error('DIAGNOSTIC '+safe+' '+JSON.stringify(state));
  await info.attach(safe+'.json',{body:Buffer.from(JSON.stringify(state,null,2)),contentType:'application/json'});
  const screenshot=await page.screenshot({fullPage:true,timeout:10000}).catch(()=>null);
  if(screenshot)await info.attach(safe+'.png',{body:screenshot,contentType:'image/png'});
}
module.exports={capture};
