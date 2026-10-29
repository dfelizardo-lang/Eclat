const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, 'library-reading-lists.js'), 'utf8');
function setup(initial) {
  function element() {
    return {value: '', textContent: '', children: [], handlers: {}, classList: {toggle() {}},
      replaceChildren() { this.children = []; }, append(...children) { this.children.push(...children); },
      addEventListener(name, cb) { this.handlers[name] = cb; }, setAttribute() {}, focus() {}};
  }
  const elements = {};
  const node = id => elements[id] ||= element();
  const storage = {value: initial, fail: false};
  const context = {document: {getElementById: node, createElement: element}, window: {confirm: () => true}, localStorage: {
    getItem: () => storage.value || null,
    setItem: (_key, value) => { if (storage.fail) throw new Error('Quota'); storage.value = value; }
  }};
  vm.runInNewContext(source, context);
  return {node, storage, context, importRecords: context.window.EclatLibraryReadingLists.importRecords,
    submit: field => node(field + 'Form').handlers.submit({preventDefault() {}}),
    action: (field, index, action) => node(field + 'List').children[index].children[1].children[action].handlers.click()};
}
const saved = app => JSON.parse(app.storage.value);
test('each block saves independently and existing lists appear below, not in the editor', () => {
  const app = setup(JSON.stringify({borrowAgain: ['Dune'], reserveBooks: ['Bel-Ami'], importedIds: []}));
  app.node('reserveBooks').value = 'Unsaved draft';
  app.node('borrowAgain').value = ' 1984\n1984 ';
  app.submit('borrowAgain');
  assert.deepEqual(saved(app).borrowAgain, ['Dune', '1984']);
  assert.deepEqual(saved(app).reserveBooks, ['Bel-Ami']);
  assert.equal(app.node('reserveBooks').value, 'Unsaved draft');
  assert.equal(app.node('borrowAgain').value, '');
  assert.equal(app.node('borrowAgainList').children.length, 2);
});
test('opening edits a saved entry, cancellation preserves it, deletion persists after reload', () => {
  const app = setup();
  app.node('borrowAgain').value = 'Dune'; app.submit('borrowAgain');
  app.action('borrowAgain', 0, 0);
  assert.equal(app.node('borrowAgain').value, 'Dune');
  app.node('borrowAgain').value = 'Changed'; app.node('borrowAgainCancel').handlers.click();
  assert.deepEqual(saved(app).borrowAgain, ['Dune']);
  app.action('borrowAgain', 0, 0); app.node('borrowAgain').value = 'Dune — Frank Herbert'; app.submit('borrowAgain');
  assert.deepEqual(saved(app).borrowAgain, ['Dune — Frank Herbert']);
  app.context.window.confirm = () => false; app.action('borrowAgain', 0, 1);
  assert.equal(saved(app).borrowAgain.length, 1);
  app.context.window.confirm = () => true; app.action('borrowAgain', 0, 1);
  const reloaded = setup(app.storage.value);
  assert.equal(reloaded.node('borrowAgainList').children.length, 0);
  assert.equal(reloaded.node('borrowAgainEmpty').hidden, false);
});
test('migration is deduplicated and a deleted historical title does not reappear', () => {
  const app = setup(); const records = [{id: 'a', borrowAgain: ['Dune', 'Dune'], reserveBooks: ['Bel-Ami']}];
  app.importRecords(records); assert.deepEqual(saved(app).borrowAgain, ['Dune']);
  app.action('borrowAgain', 0, 1);
  const reloaded = setup(app.storage.value); reloaded.importRecords(records);
  assert.deepEqual(saved(reloaded).borrowAgain, []);
  assert.equal(records[0].borrowAgain.length, 2);
});
test('storage failures preserve saved entries and the editor; retry succeeds', () => {
  const app = setup(); app.node('reserveBooks').value = 'Le Horla'; app.submit('reserveBooks');
  app.storage.fail = true; app.action('reserveBooks', 0, 1);
  assert.deepEqual(saved(app).reserveBooks, ['Le Horla']);
  assert.equal(app.node('reserveBooksList').children.length, 1);
  app.node('reserveBooks').value = '1984'; app.submit('reserveBooks');
  assert.equal(app.node('reserveBooks').value, '1984');
  app.storage.fail = false; app.submit('reserveBooks');
  assert.deepEqual(saved(app).reserveBooks, ['Le Horla', '1984']);
});
test('invalid storage cannot be overwritten', () => {
  const app = setup('{invalid'); app.importRecords([{id: 'a', borrowAgain: ['Dune']}]);
  app.node('borrowAgain').value = '1984'; app.submit('borrowAgain');
  assert.equal(app.storage.value, '{invalid'); assert.equal(app.node('borrowAgainSave').disabled, true);
});
