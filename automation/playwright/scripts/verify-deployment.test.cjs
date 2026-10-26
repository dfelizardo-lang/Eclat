'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {verifyDeployment} = require('./verify-deployment.cjs');
const root = path.resolve(__dirname, '../../..');
test('deployment verification distinguishes a complete checkout from mixed publications', async () => {
  const fetcher = async url => new Response(fs.readFileSync(path.join(root, url.pathname.slice(1))));
  const current = await verifyDeployment({root, base: 'https://eclatsclassiques.com', fetcher});
  assert.equal(current.matches, true);
  const mixed = await verifyDeployment({root, base: current.base, fetcher: url => url.pathname === '/kids-loans.js' ? new Response('obsolete publication') : fetcher(url)});
  assert.equal(mixed.matches, false);
  assert.deepEqual(mixed.results.filter(result => !result.matches).map(result => result.file), ['kids-loans.js']);
});
test('HTTP and network failures cannot be reported as a matching deployment', async () => {
  for (const fetcher of [async () => new Response('unavailable', {status: 503}), async () => {throw new Error('connection failed');}]) {
    const result = await verifyDeployment({root, base: 'https://eclatsclassiques.com', fetcher});
    assert.equal(result.matches, false);
    assert.ok(result.results.every(item => item.error && !item.matches));
  }
});
