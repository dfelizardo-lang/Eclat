const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {DAY,loadCatalog,createRotation} = require('./daily-themes');
const catalog = loadCatalog(fs.readFileSync('eclat_v73_deployable.html','utf8'));
test('client uses server themes while excluding read and duplicate passages',()=>{
  const vm = require('node:vm');
  const selected = createRotation(catalog)(0);
  let rendered = 0;
  const context = {
    mode:'adult', PASSAGES:Array.from({length:10},(_,i)=>({id:String(i),audience:'adult',text:(i===8?'duplicate':String(i)).repeat(100),author:String(i),workTitle:String(i),themes:['nature']})),
    passageHistory:()=>({'0':1}), wantedThemes:()=>new Set(['nature']), passageAssignments:new Map(),
    buildGuaranteedBatch:()=>null,render:()=>rendered++,document:{addEventListener:()=>{}},
    fetch:()=>new Promise(()=>{}),AbortSignal,setTimeout:()=>1,clearTimeout:()=>{},console,
  };
  // Load the real client with a resolved service response, then exercise its batch builder.
  const script = fs.readFileSync('daily-themes-client.js','utf8').replace('let daily = null;', 'let daily = '+JSON.stringify(selected)+';');
  vm.runInNewContext(script,context);
  assert.equal(context.buildGuaranteedBatch().length,6);
  assert.equal(context.passageAssignments.size,6);
  assert.ok([...context.passageAssignments.values()].every(p=>p.id!=='0'));
  assert.equal(new Set([...context.passageAssignments.values()].map(p=>p.text)).size,6);
  context.PASSAGES.length=3;
  assert.equal(context.buildGuaranteedBatch(),null);
});
test('stable for 24 hours and across restarts; changes at the boundary',()=>{
  const rotation = createRotation(catalog), start = 20000*DAY;
  assert.deepEqual(rotation(start),rotation(start+DAY-1));
  assert.deepEqual(rotation(start),createRotation(catalog)(start));
  assert.notDeepEqual(rotation(start).adult,rotation(start+DAY).adult);
  assert.equal(Date.parse(rotation(start).nextRefreshAt)-Date.parse(rotation(start).generatedAt),DAY);
});
test('six distinct labels per audience, no repeats during a complete 12-day rotation',()=>{
  const rotation = createRotation(catalog);
  for(const audience of ['adult','child']) {
    const labels=[];
    for(let day=0;day<12;day++) {
      const selected=rotation(day*DAY)[audience];
      assert.equal(selected.length,6);
      for(const item of selected) assert.ok(catalog[audience].some(x=>x[1]===item[1]));
      labels.push(...selected.map(x=>x[1]));
    }
    assert.equal(new Set(labels).size,72);
  }
});
