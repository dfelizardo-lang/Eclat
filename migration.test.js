const test=require('node:test'),assert=require('node:assert/strict');
require('./migration');const {mergeRecords,merge,validate,importData}=globalThis.EclatTransfer;
const backup=records=>({application:'Eclat',version:1,localStorage:{},databases:[{db:'eclat-kids-reading',store:'books',records}]});
const book=(id,updatedAt)=>({id,title:'Titre',author:'Auteur',comment:'',photos:[],updatedAt});
test('import deduplicates records and compares instants across timezone offsets',()=>{
 const old=book('a','2026-10-15T12:00:00+02:00'),latest=book('a','2026-10-15T10:30:00Z');
 assert.deepEqual(mergeRecords([old],[latest,old,latest]),[latest]);
 assert.deepEqual(mergeRecords([latest],[old]),[latest]);
 assert.deepEqual(mergeRecords([latest],[{...latest,title:'Tie'}]),[latest]);
});
test('history merge keeps one entry per passage with its last read time',()=>{
 assert.deepEqual(merge({p:100,q:300},{p:200,r:400}),{p:200,q:300,r:400});
});
test('incompatible records and corrupt photos reject before opening any database',async()=>{
 globalThis.indexedDB={open(){assert.fail('Invalid data must not open or mutate storage')}};
 for(const value of [backup([{id:'a'}]),backup([{...book('a','invalid')}]),backup([{...book('a','2026-10-15'),photos:[{id:'p',blob:{__eclatBlob:true,type:'image/png',data:'broken'}}]}]),{...backup([]),localStorage:[]}]){
  await assert.rejects(importData(value));
 }
 delete globalThis.indexedDB;
});
test('backup validates approved child limits without requiring optional fields',()=>{
 const valid=book('a','2026-10-15');valid.title='x'.repeat(250);valid.author='y'.repeat(250);valid.comment='z'.repeat(2000);assert.equal(validate(backup([valid])).version,1);
 for(const patch of [{title:'x'.repeat(251)},{author:' '},{comment:'x'.repeat(2001)},{rating:6},{photos:Array(51).fill({})}])assert.throws(()=>validate(backup([{...valid,...patch}])));
});
