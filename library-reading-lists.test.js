const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, 'library-reading-lists.js'), 'utf8');
function setup(initial) {
  const handlers = {};
  const elements = Object.fromEntries(['borrowAgain', 'reserveBooks', 'readingListsStatus'].map(id => [id, {value: '', textContent: ''}]));
  const button = {};
  elements.libraryReadingListsForm = {addEventListener: (name, callback) => { handlers[name] = callback; }, querySelector: () => button};
  const storage = {value: initial, fail: false};
  const context = {document: {getElementById: id => elements[id]}, window: {}, localStorage: {
    getItem: () => storage.value || null,
    setItem: (_key, value) => { if (storage.fail) throw new Error('Quota'); storage.value = value; }
  }};
  vm.runInNewContext(source, context);
  return {elements, storage, button, importRecords: context.window.EclatLibraryReadingLists.importRecords, submit: () => handlers.submit({preventDefault() {}})};
}
test('historical lists migrate once without duplicates or resurrection after removal', () => {
  const app = setup();
  const records = [{id: 'a', borrowAgain: ['Dune', 'Dune'], reserveBooks: ['Bel-Ami']}, {id: 'b', borrowAgain: ['Dune', '1984']}];
  app.importRecords(records);
  assert.equal(app.elements.borrowAgain.value, 'Dune\n1984');
  assert.equal(app.elements.reserveBooks.value, 'Bel-Ami');
  app.elements.borrowAgain.value = '1984';
  app.submit();
  const reloaded = setup(app.storage.value);
  reloaded.importRecords(records);
  assert.equal(reloaded.elements.borrowAgain.value, '1984');
  assert.equal(records[0].borrowAgain.length, 2);
});
test('failed saving preserves persisted wishes and allows retry', () => {
  const app = setup();
  app.elements.reserveBooks.value = ' Le Horla \n\n Le Horla';
  app.storage.fail = true;
  app.submit();
  assert.equal(app.storage.value, undefined);
  assert.match(app.elements.readingListsStatus.textContent, /pas pu/);
  app.storage.fail = false;
  app.submit();
  assert.deepEqual(JSON.parse(app.storage.value).reserveBooks, ['Le Horla']);
});
test('unreadable storage cannot be overwritten by migration or submit', () => {
  const app = setup('{invalid');
  app.importRecords([{id: 'a', borrowAgain: ['Dune']}]);
  app.submit();
  assert.equal(app.storage.value, '{invalid');
  assert.equal(app.button.disabled, true);
});
