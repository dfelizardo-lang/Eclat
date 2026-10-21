'use strict';
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const transient=new Set([408,425,429,500,502,503,504]);
async function checkLink(request,url,{attempts=3,delay=wait,timeout=60000}={}){
  const history=[];
  for(let i=0;i<attempts;i++){
    try{
      const response=await request.get(url,{timeout,failOnStatusCode:false,maxRedirects:10});
      const status=response.status();history.push({status,finalUrl:response.url()});
      const retryAfter=response.headers()['retry-after'];await response.dispose?.();
      if(!transient.has(status)||i===attempts-1)return {url,ok:status>=200&&status<400,status,history};
      const seconds=Number(retryAfter);await delay(Number.isFinite(seconds)&&seconds>0?Math.min(seconds*1000,30000):2000*(i+1));
    }catch(error){
      history.push({error:error.message});
      if(i===attempts-1)return {url,ok:false,history};
      await delay(2000*(i+1));
    }
  }
}
module.exports={checkLink};
