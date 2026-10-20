const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = name => fs.readFileSync(path.join(__dirname, name), 'utf8');

test('historique : les passages expirés restent archivés mais ne sont plus exclus', () => {
  const html = source('eclat_v73_deployable.html');
  const start = html.indexOf('function passageHistoryKey()');
  const end = html.indexOf('\nfunction assignUniquePassages(', start);
  assert.ok(start >= 0 && end > start, 'Fonctions de l’historique introuvables');
  const values = new Map();
  const localStorage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
  const ctx = vm.createContext({localStorage, mode: 'adult', Date});
  vm.runInContext(html.slice(start, end), ctx);
  const key = 'eclat_passage_history_adult';
  const old = Date.now() - 32 * 86400000;
  const recent = Date.now() - 1000;
  values.set(key, JSON.stringify({old, recent}));
  assert.equal(ctx.passageHistory().old, undefined, 'Un ancien passage ne doit plus être sous embargo');
  assert.equal(ctx.passageHistory().recent, recent);
  assert.equal(JSON.parse(values.get(key)).old, old, 'Une simple lecture ne doit pas supprimer l’historique');
  assert.equal(ctx.passageIsEmbargoed('old'), false);
  assert.equal(ctx.passageIsEmbargoed('recent'), true);
  ctx.rememberPassages([{id: 'new'}]);
  const persisted = JSON.parse(values.get(key));
  assert.equal(persisted.old, old, 'Un nouveau passage ne doit pas effacer l’archive');
  assert.equal(persisted.recent, recent);
  assert.ok(persisted.new >= Date.now() - 10000);
});

test('export : les emprunts récents précèdent les anciens sans perte de données', async () => {
  const js = source('migration.js');
  const start = js.indexOf('async function exportData()');
  const end = js.indexOf('async function importData(', start);
  assert.ok(start >= 0 && end > start, 'Fonction d’export introuvable');
  const old = {id:'a-old', updatedAt:'2026-08-01T10:00:00Z', photos:[]};
  const latest = {id:'z-new', updatedAt:'2026-10-20T10:00:00Z', borrowAgain:['Export adulte'], photos:[]};
  const data = {notebooks:[old,latest], books:[]};
  const ctx = vm.createContext({
    stores:[{db:'eclat-library-loans',store:'notebooks'},{db:'eclat-kids-reading',store:'books'}],
    validKey:key=>key.startsWith('eclat'),
    localStorage:{length:0},
    open:async()=>({close(){}}),
    read:async(_db,store)=>data[store].slice(),
    encode:async x=>x,
    Date, location:{origin:'https://example.test'}
  });
  vm.runInContext(js.slice(start,end),ctx);
  const backup=await ctx.exportData();
  const records=backup.databases.find(d=>d.store==='notebooks').records;
  assert.equal(records.length,2);
  assert.equal(records[0].borrowAgain[0],'Export adulte');
  assert.equal(records[1].id,'a-old');
});
