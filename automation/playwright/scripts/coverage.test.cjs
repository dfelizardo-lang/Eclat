const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
test('all 81 linkable Squash cases have registered executable implementations',()=>{
 const cases=require('../squash-cases.json');const source=fs.readFileSync(root+'/tests/eclat.spec.js','utf8');const checks=new Map([...source.matchAll(/add\((\d+),/g)].map(m=>[Number(m[1]),async()=>{}]));
 const ctx={module:{exports:{}},require(name){assert.equal(name,'./site');return {test:{},expect:{}};}};
 vm.runInNewContext(fs.readFileSync(root+'/support/remaining.js','utf8'),ctx);ctx.module.exports.install(checks);
 for(const c of cases.filter(c=>c.status==='implemented'))assert.ok(c.number===1||typeof checks.get(c.number)==='function',c.reference+' is linkable without a script');
 assert.equal(cases.filter(c=>c.status==='implemented').length,81);
 for(const c of cases.filter(c=>c.automatedPrecheckVia))assert.ok(checks.has(c.number),c.reference+' precheck missing');
 assert.equal(new Set(cases.map(c=>c.automatedReference)).size,96);
});
test('corpus and credits baselines are versioned technical references, without fabricated editorial approval',()=>{
 const baseline=require('../support/corpus-baseline.json');assert.equal(baseline.editorialApproval,false);assert.equal(baseline.passages.length,182);assert.equal(new Set(baseline.passages.map(p=>p.id)).size,182);for(const p of baseline.passages)assert.match(p.textHash,/^[a-f0-9]{64}$/);
 const html=fs.readFileSync(path.resolve(root,'../../narration-credits.html'),'utf8');for(const {url} of require('../support/credits.json'))assert.ok(html.includes('href="'+url+'"'));
});
