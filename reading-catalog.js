const fs = require('node:fs');
const path = require('node:path');
const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/reading-catalog.json'), 'utf8'));
const ids = new Set();
const texts = new Set();
const works = new Set();
for (const work of catalog.works) {
  if (ids.has(work.id) || !['adult', 'child'].includes(work.audience)) throw new Error('Œuvre invalide: ' + work.id);
  ids.add(work.id);
  const key=(work.author + "::" + work.title).normalize("NFC").toLowerCase().replace(/\s+/g," ").trim();
  if (works.has(key)) throw new Error("Œuvre dupliquée: " + key);
  works.add(key);
  if (work.legacy) continue;
  if (!work.editionYear || work.editionYear >= 1930 || work.rights?.authorDeathYear > 1955) throw new Error('Droits à revoir: ' + work.id);
  if (!work.edition || work.rights?.status !== 'public-domain' || work.passages.length !== 3) throw new Error('Métadonnées incomplètes: ' + work.id);
  let end = -1;
  for (const passage of work.passages) {
    const text = passage.text.normalize('NFC').replace(/\s+/g, ' ').trim();
    if (ids.has(passage.id) || texts.has(text) || passage.text.length > 5000 || passage.text.length < 200 || passage.startParagraph <= end) throw new Error('Passage invalide: ' + passage.id);
    ids.add(passage.id); texts.add(text); end = passage.endParagraph;
  }
}
module.exports = catalog;
