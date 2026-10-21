'use strict';
const production='https://eclatsclassiques.com';
const legacy='https://eclat-lecture.dfelizardo680502.chatgpt.site';
function target(env=process.env){
 const localMode=env.ECLAT_LOCAL_TEST==='1';
 const value=localMode?(env.ECLAT_BASE_URL||'http://127.0.0.1:3000'):(env.DS_BASE_URL||env.ECLAT_BASE_URL||production);
 const url=new URL(value);
 const loopback=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
 if(url.username||url.password||!['http:','https:'].includes(url.protocol))throw new Error('Adresse Éclat invalide : utiliser HTTP(S) sans identifiants.');
 if(localMode&&!loopback)throw new Error('Le mode local exige une adresse localhost ou 127.0.0.1 de l’agent.');
 const railwayAllowed=env.ECLAT_ALLOW_RAILWAY_ORIGIN==='1'&&/\.up\.railway\.app$/.test(url.hostname);
 if(![production,legacy].includes(url.origin)&&!(localMode&&loopback)&&!railwayAllowed)throw new Error('BASE_URL doit désigner https://eclatsclassiques.com, une origine Railway explicitement autorisée, ou un serveur local avec ECLAT_LOCAL_TEST=1.');
 return url.origin;
}
function headersFor(requestUrl,headers,env=process.env){
 const result=Object.fromEntries(Object.entries(headers).filter(([key])=>key.toLowerCase()!=='oai-sites-authorization'));
 // A bypass credential is optional and confined to the historical Sites origin.
 if(env.ECLAT_SITES_TOKEN&&target(env)===legacy&&new URL(requestUrl).origin===legacy)result['OAI-Sites-Authorization']='Bearer '+env.ECLAT_SITES_TOKEN;
 return result;
}
module.exports={target,production,legacy,headersFor};
