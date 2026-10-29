const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
const {seed}=require('./scripts/narration-cache.cjs');
test('narration cache reuses only exact text, revision, path, size and binary hash matches',async()=>{
 const out=await fs.mkdtemp(path.join(os.tmpdir(),'eclat-audio-cache-'));
 try{
  const binary=Buffer.from('validated recording'),hash=crypto.createHash('sha256').update(binary).digest('hex');
  const audio={url:'/api/narration/audio/'+hash+'/female.mp3',bytes:binary.length,sha256:hash};
  const passages=['valid','tampered','text-changed','off-origin','wrong-size'].map(id=>({id,digest:id,textHash:'text'}));
  const manifest={engine:'Piper 2023.11.14-2',modelRevision:'c10ece1aade47bb51c153c893d14e5bf8e5b7117',passages:Object.fromEntries(passages.map(p=>[p.id,{...p,voices:{female:{...audio}}}]))};
  manifest.passages['text-changed'].digest='different';
  manifest.passages['off-origin'].voices.female.url='https://other.example/file.mp3';
  manifest.passages['wrong-size'].voices.female.bytes++;
  let fetched=0;
  const request=async url=>{if(url.pathname==='/api/narration')return new Response(JSON.stringify(manifest));fetched++;return new Response(fetched===2?Buffer.from('tampered recording'):binary);};
  const result=await seed('https://example.org',passages,out,request);
  assert.deepEqual(Object.keys(result),['valid']);
  assert.deepEqual(await fs.readFile(path.join(out,hash,'female.mp3')),binary);
  manifest.modelRevision='other-model';assert.deepEqual(await seed('https://example.org',passages,out,request),{});
  await assert.rejects(seed('http://example.org',passages,out,request),/Invalid/);
 }finally{await fs.rm(out,{recursive:true,force:true});}
});
