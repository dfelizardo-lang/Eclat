'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {target} = require('../support/target.cjs');
const files = ['library-loans-form.js', 'kids-loans.js', 'comfort.css', 'child-narrator.js'];
const digest = value => createHash('sha256').update(value).digest('hex');
async function verifyDeployment({base = target(), root = path.resolve(__dirname, '../../..'), fetcher = fetch} = {}) {
  const results = [];
  for (const file of files) {
    const expected = digest(fs.readFileSync(path.join(root, file)));
    try {
      const response = await fetcher(new URL('/' + file, base), {signal: AbortSignal.timeout(20000), cache: 'no-store'});
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const actual = digest(Buffer.from(await response.arrayBuffer()));
      results.push({file, expected, actual, matches: actual === expected});
    } catch (error) {
      results.push({file, expected, matches: false, error: error.message});
    }
  }
  return {base, matches: results.every(result => result.matches), results};
}
if (require.main === module) {
  verifyDeployment().then(result => {
    console.log(JSON.stringify(result, null, 2));
    if (!result.matches) {
      console.error('La cible ne sert pas tous les fichiers du checkout. Vérifier le rattachement du domaine et la publication avant de relancer la campagne.');
      process.exitCode = 1;
    }
  }).catch(error => {console.error(error.message); process.exitCode = 1;});
}
module.exports = {verifyDeployment, files};
