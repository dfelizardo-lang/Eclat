'use strict';
const production='https://eclat-lecture.dfelizardo680502.chatgpt.site';
function target(env=process.env){
 const localMode=env.ECLAT_LOCAL_TEST==='1';
 const value=localMode?(env.ECLAT_BASE_URL||'http://127.0.0.1:3000'):(env.DS_BASE_URL||env.ECLAT_BASE_URL||production);
 const url=new URL(value);
 const loopback=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
 if(url.username||url.password||!['http:','https:'].includes(url.protocol))throw new Error('Adresse Éclat invalide : utiliser HTTP(S) sans identifiants.');
 if(localMode&&!loopback)throw new Error('Le mode local exige une adresse localhost ou 127.0.0.1 de l’agent.');
 if(url.origin!==production&&!(localMode&&loopback))throw new Error('BASE_URL doit désigner Éclat ou un serveur local explicitement autorisé par ECLAT_LOCAL_TEST=1.');
 if(url.origin===production&&!env.ECLAT_SITES_TOKEN)throw new Error('ECLAT_SITES_TOKEN absent. Pour tester la version locale depuis Squash, définir ECLAT_LOCAL_TEST=1 et ECLAT_BASE_URL=http://127.0.0.1:3000.');
 return url.origin;
}
module.exports={target,production};
