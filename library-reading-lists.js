/* Reading wishes belong to the library, independently of individual loans. */
(() => {
  const form = document.getElementById('libraryReadingListsForm');
  const status = document.getElementById('readingListsStatus');
  const fields = ['borrowAgain', 'reserveBooks'];
  const key = 'eclat-library-reading-lists-v1';
  let state = {borrowAgain: [], reserveBooks: [], importedIds: []};
  let available = true;
  const lines = value => [...new Set(value.split('\n').map(line => line.trim()).filter(Boolean))];
  function render() {
    for (const field of fields) document.getElementById(field).value = state[field].join('\n');
  }
  function save(next) {
    localStorage.setItem(key, JSON.stringify(next));
    state = next;
  }
  try {
    const stored = JSON.parse(localStorage.getItem(key) || 'null');
    if (stored) {
      if (![...fields, 'importedIds'].every(field => Array.isArray(stored[field]) && stored[field].every(value => typeof value === 'string'))) throw new Error('Invalid lists');
      state = stored;
    }
    render();
  } catch {
    available = false;
    status.textContent = 'Vos listes ne peuvent pas être chargées sur cet appareil. Les données existantes sont conservées.';
    for (const field of fields) document.getElementById(field).disabled = true;
    form.querySelector('button[type="submit"]').disabled = true;
  }
  form.addEventListener('input', () => { status.textContent = 'Modifications à enregistrer.'; });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!available) return;
    try {
      const next = {...state};
      for (const field of fields) next[field] = lines(document.getElementById(field).value);
      save(next);
      status.textContent = 'Vos listes sont enregistrées sur cet appareil.';
    } catch { status.textContent = 'Vos listes n’ont pas pu être enregistrées. Réessayez.'; }
  });
  window.EclatLibraryReadingLists = {
    importRecords(records) {
      if (!available) return;
      // Import each historical loan only once, so removing a wish remains final.
      const pending = records.filter(record => record.id && !state.importedIds.includes(record.id));
      if (!pending.length) return;
      const next = {...state, importedIds: [...state.importedIds, ...pending.map(record => record.id)]};
      for (const field of fields) {
        const legacy = pending.flatMap(record => Array.isArray(record[field]) ? record[field].filter(value => typeof value === 'string') : []);
        next[field] = lines([...state[field], ...legacy].join('\n'));
      }
      try { save(next); render(); }
      catch { status.textContent = 'Les anciennes listes n’ont pas pu être récupérées. Elles restent conservées dans vos emprunts.'; }
    }
  };
})();
