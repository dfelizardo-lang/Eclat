const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {EventEmitter}=require('node:events');
function instrument({addresses=['93.184.216.34'],redirect}={}){
 const requests=[],lookups=[];
 const fakeHttps={get(url,options,callback){
  requests.push(url.href);const request=new EventEmitter();request.destroy=e=>request.emit('error',e);
  queueMicrotask(()=>{const response=new EventEmitter();response.statusCode=redirect?302:200;response.headers=redirect?{location:redirect}:{'content-type':'text/html'};response.resume=()=>{};callback(response);if(!redirect){response.emit('data',Buffer.from('<title>Bibliothèque de test</title><main>Aucun livre</main>'));response.emit('end');}});
  return request;
 }};
 const ctx={module:{exports:{}},Buffer,URL,AbortSignal,setTimeout,clearTimeout,require(name){if(name==='node:https')return fakeHttps;if(name==='node:dns')return {promises:{lookup:async hostname=>{lookups.push(hostname);return addresses.map(address=>({address,family:address.includes(':')?6:4}));}}};return require(name);}};
 vm.runInNewContext(fs.readFileSync(__dirname+'/library-news.js','utf8'),ctx,{filename:'library-news.js'});
 return {...ctx.module.exports,requests,lookups};
}
test('ECL-TC-062 forbidden URL schemes and literal addresses produce no DNS or HTTPS request',async()=>{
 const api=instrument();
 for(const url of ['https://localhost','https://127.0.0.1','https://[::1]','https://10.0.0.1','https://192.168.0.1','file:///etc/passwd','javascript:alert(1)','http://public-library.org'])await assert.rejects(api.getNews(url));
 assert.deepEqual(api.requests,[]);assert.deepEqual(api.lookups,[]);
});
test('ECL-TC-062 private DNS answers and mixed public/private answers never reach HTTPS',async()=>{
 for(const addresses of [['127.0.0.1'],['169.254.169.254'],['10.0.0.8'],['::1'],['fc00::1'],['93.184.216.34','192.168.1.2']]){
  const api=instrument({addresses});await assert.rejects(api.getNews('https://public-library.org'));assert.deepEqual(api.requests,[]);
 }
});
test('ECL-TC-062 redirect to a private address is rejected before any second request',async()=>{
 for(const redirect of ['https://127.0.0.1/private','https://10.0.0.1','file:///etc/passwd','https://localhost']){
  const api=instrument({redirect});await assert.rejects(api.getNews('https://public-library.org'));assert.deepEqual(api.requests,['https://public-library.org/']);
 }
});
test('ECL-TC-062 public fixture is fetched so a blanket network denial cannot pass the test',async()=>{
 const api=instrument();const data=await api.getNews('https://public-library.org');assert.equal(data.name,'Bibliothèque de test');assert.deepEqual(api.requests,['https://public-library.org/']);
});
