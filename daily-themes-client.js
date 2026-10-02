(function () {
  let daily = null;
  let timer;
  let manualRefresh = false;
  // Keep the existing on-demand discovery button available between daily rotations.
  document.addEventListener('click', event => {
    if (event.target.closest?.('#shuffleBtn')) manualRefresh = true;
  }, true);
  const fallback = buildGuaranteedBatch;
  buildGuaranteedBatch = function () {
    if (!daily || manualRefresh) {
      manualRefresh = false;
      return fallback();
    }
    const audience = mode === 'child' ? 'child' : 'adult';
    const history = passageHistory();
    const pool = PASSAGES.filter(p => p.audience === audience && p.text && p.text.length >= 80 && !history[p.id]);
    if (pool.length < 6) return null;
    const used = new Set(), texts = new Set(), authors = new Set(), works = new Set();
    const assignments = new Map();
    for (const item of daily[audience]) {
      const wanted = wantedThemes(item[1]);
      const ranked = pool.filter(p => !used.has(p.id) && !texts.has(p.text.replace(/\s+/g,' ').trim())).map(p => ({p,score:p.themes.filter(t=>wanted.has(t)).length*20 + (authors.has(p.author)?0:8) + (works.has(p.workTitle)?0:12)})).sort((a,b)=>b.score-a.score);
      if (!ranked.length) return null;
      const p = ranked[0].p;
      used.add(p.id); texts.add(p.text.replace(/\s+/g,' ').trim()); authors.add(p.author); works.add(p.workTitle);
      assignments.set(item[1],p);
    }
    passageAssignments.clear();
    for (const [label,p] of assignments) passageAssignments.set(label,p);
    return daily[audience];
  };
  async function refresh() {
    clearTimeout(timer);
    try {
      const response = await fetch('/api/propositions-thematiques', {cache:'no-store',signal:AbortSignal.timeout(10000)});
      if (!response.ok) throw new Error('Propositions indisponibles');
      const next = await response.json();
      if (!['adult','child'].every(a=>Array.isArray(next[a]) && next[a].length===6 && next[a].every(x=>Array.isArray(x)&&typeof x[1]==='string')) || !Number.isFinite(Date.parse(next.nextRefreshAt))) throw new Error('Propositions invalides');
      const changed = !daily || daily.period !== next.period;
      daily = next;
      if (changed) render();
      timer = setTimeout(refresh, Math.max(1000, Math.min(86400000, Date.parse(next.nextRefreshAt)-Date.now()+1000)));
    } catch (error) {
      console.warn('Éclat : renouvellement thématique temporairement indisponible');
      timer = setTimeout(refresh, 60000);
    }
  }
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  refresh();
})();
