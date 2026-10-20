'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {checkLink}=require('../support/check-links.cjs');
function fixture(statuses){let count=0,disposed=0;return {get count(){return count;},get disposed(){return disposed;},async get(url,options){assert.equal(options.timeout,60000);const value=statuses[Math.min(count++,statuses.length-1)];if(value instanceof Error)throw value;return {status:()=>value,url:()=>url,headers:()=>({'retry-after':'1'}),dispose:async()=>{disposed++;}};}};}
test('transient HTTP responses can recover, with each attempt retained and bodies released',async()=>{
 const request=fixture([503,429,200]),waits=[];
 const result=await checkLink(request,'https://example.org/',{delay:async ms=>waits.push(ms)});
 assert.equal(result.ok,true);assert.deepEqual(result.history.map(h=>h.status),[503,429,200]);assert.equal(request.disposed,3);assert.deepEqual(waits,[1000,1000]);
});
test('a dead 404 link stays failed without hiding it behind retries',async()=>{
 const request=fixture([404]);const result=await checkLink(request,'https://example.org/',{delay:async()=>{}});assert.equal(result.ok,false);assert.equal(request.count,1);
});
test('persistent service failures and network exceptions remain failures after all attempts',async()=>{
 for(const statuses of [[503],[new Error('connection reset')]]){
  const request=fixture(statuses);const result=await checkLink(request,'https://example.org/',{delay:async()=>{}});assert.equal(result.ok,false);assert.equal(result.history.length,3);assert.equal(request.count,3);
 }
});
