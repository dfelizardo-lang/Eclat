const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const catalog = require('./reading-catalog');
const html = fs.readFileSync(__dirname + '/eclat_v73_deployable.html','utf8');
function reader(html, catalog) {
  const context={window:{ECLAT_READING_CATALOG:catalog}};
  const from=html.indexOf('const WORKS=');
  const end=html.indexOf('const PASSAGES=buildPassageIndex();',from)+'const PASSAGES=buildPassageIndex();'.length;
  vm.runInNewContext(html.slice(from,end)+'\nresult={works:WORKS,passages:PASSAGES};',context,{timeout:1000});
  return context.result;
}
test('new editorial passages are loaded exactly once, intact, with stable identifiers',()=>{
  const result=reader(html,catalog);
  assert.equal(result.works.length,catalog.works.length);
  const passages=catalog.works.filter(w=>!w.legacy).flatMap(w=>w.passages);
  for (const passage of passages) {
    const loaded=result.passages.filter(p=>p.id===passage.id);
    assert.equal(loaded.length,1);assert.equal(loaded[0].text,passage.text);
    assert.ok(loaded[0].rights && loaded[0].edition);
  }
  assert.equal(result.passages.length,32+passages.length);
});
test('legacy reader IDs and paragraph windows are preserved',()=>{
  const before=require('node:child_process').execFileSync('git',['show','3b2c194988bc907057f84135022e98cd9ad68757:eclat_v73_deployable.html'],{cwd:__dirname,encoding:'utf8',maxBuffer:4*1024*1024});
  const old=reader(before,{}).passages;
  const current=reader(html,catalog).passages;
  for(const p of old){const same=current.find(q=>q.id===p.id);assert.ok(same);assert.equal(same.text,p.text);}
});

test('all active readings respect the shared short-passage limit without clearing history',()=>{
 const policy=require('./data/catalogue-policy.json');const result=reader(html,catalog);
 for(const p of result.passages)assert.ok(p.text.length<=policy.maxPassageCharacters,p.id+': '+p.text.length);
 assert.ok(!/localStorage\.removeItem\("eclat_passage_history_/.test(html));
 assert.ok(!/\["eclat_passage_history_adult","eclat_passage_history_child"\]\.forEach\(k=>localStorage\.removeItem/.test(html));
});
