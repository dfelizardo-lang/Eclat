const vm = require('node:vm');
const DAY = 86400000;

// Read only the data declarations from the existing application, never its UI.
function loadCatalog(html) {
  const start = html.indexOf('const WORKS=');
  const end = html.indexOf('function desireHistoryKey()', start);
  if (start < 0 || end < 0) throw new Error('Catalogue thématique introuvable');
  const source = html.slice(start, end);
  function declaration(name) {
    const at = source.indexOf('const ' + name + '=');
    if (at < 0) throw new Error('Déclaration absente: ' + name);
    const stop = source.indexOf(';', at);
    return source.slice(at, stop + 1);
  }
  const context = {};
  vm.runInNewContext(declaration('DESIRES_ADULT') + declaration('DESIRES_CHILD') + declaration('DESIRE_SEMANTICS') + '\nresult={adult:DESIRES_ADULT,child:DESIRES_CHILD,semantics:DESIRE_SEMANTICS};', context, {timeout: 1000});
  return context.result;
}

function hash(value) {
  let h = 2166136261;
  for (const c of value) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return h;
}
function schedule(catalog, audience) {
  const groups = new Map();
  for (const item of catalog[audience]) {
    const label = item[1];
    const matches = Object.entries(catalog.semantics).filter(([word]) => label.toLowerCase().includes(word));
    const category = matches.length ? matches[0][1][0] : 'émotion';
    if (!groups.has(category)) groups.set(category, []);
    if (!groups.get(category).some(x => x[1] === label)) groups.get(category).push(item);
  }
  const queues = [...groups.entries()].sort((a,b)=>hash(audience+a[0])-hash(audience+b[0])).map(([,items]) => items.sort((a,b)=>hash(audience+a[1])-hash(audience+b[1])));
  const ordered = [];
  while (queues.some(q=>q.length)) for (const q of queues) if(q.length) ordered.push(q.shift());
  return ordered;
}
function createRotation(catalog) {
  const ordered = {adult:schedule(catalog,'adult'),child:schedule(catalog,'child')};
  return function snapshot(now = Date.now()) {
    const period = Math.floor(now / DAY);
    const select = audience => {
      const list = ordered[audience];
      return Array.from({length:Math.min(6,list.length)}, (_,i)=>list[(period*6+i)%list.length]);
    };
    return {version:1,period,generatedAt:new Date(period*DAY).toISOString(),nextRefreshAt:new Date((period+1)*DAY).toISOString(),intervalHours:24,adult:select('adult'),child:select('child')};
  };
}
module.exports = {DAY,loadCatalog,createRotation};
