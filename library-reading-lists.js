/* Independent library lists, with a separate editor and saved entries per list. */
(() => {
  const fields = ['borrowAgain', 'reserveBooks'];
  const key = 'eclat-library-reading-lists-v1';
  const node = id => document.getElementById(id);
  let state = {borrowAgain: [], reserveBooks: [], importedIds: []};
  let available = true;
  const editing = {borrowAgain: null, reserveBooks: null};
  const lines = value => [...new Set(value.split('\n').map(line => line.trim()).filter(Boolean))];
  function message(field, text, error = false) {
    node(field + 'Status').textContent = text;
    node(field + 'Status').classList.toggle('error', error);
  }
  function save(next) {
    localStorage.setItem(key, JSON.stringify(next));
    state = next;
  }
  function resetEditor(field) {
    editing[field] = null;
    node(field).value = '';
    node(field + 'Save').textContent = 'Sauvegarder';
    node(field + 'Cancel').hidden = true;
  }
  function render(field) {
    const list = node(field + 'List');
    list.replaceChildren();
    node(field + 'Empty').hidden = state[field].length > 0;
    for (const title of state[field]) {
      const row = document.createElement('li');
      const text = document.createElement('p');
      text.className = 'reading-saved-title';
      text.textContent = title;
      const actions = document.createElement('div');
      actions.className = 'reading-item-actions';
      const open = document.createElement('button');
      open.type = 'button'; open.className = 'photo-button';
      open.textContent = 'Ouvrir / modifier';
      open.setAttribute('aria-label', 'Ouvrir ou modifier : ' + title);
      open.addEventListener('click', () => {
        if (node(field).value.trim() && !window.confirm('Remplacer le texte en cours de saisie par ce livre ?')) return;
        editing[field] = title;
        node(field).value = title;
        node(field + 'Save').textContent = 'Enregistrer la modification';
        node(field + 'Cancel').hidden = false;
        message(field, 'Modifiez le titre, puis enregistrez.');
        node(field).focus();
      });
      const remove = document.createElement('button');
      remove.type = 'button'; remove.className = 'photo-button';
      remove.textContent = 'Supprimer';
      remove.setAttribute('aria-label', 'Supprimer : ' + title);
      remove.addEventListener('click', () => {
        if (!window.confirm('Supprimer « ' + title + ' » de cette liste ?')) return;
        try {
          save({...state, [field]: state[field].filter(value => value !== title)});
          if (editing[field] === title) resetEditor(field);
          render(field);
          message(field, 'Livre supprimé de cette liste.');
          node(field + 'Save').focus();
        } catch { message(field, 'La suppression n’a pas pu être enregistrée. Réessayez.', true); }
      });
      actions.append(open, remove); row.append(text, actions); list.append(row);
    }
  }
  try {
    const stored = JSON.parse(localStorage.getItem(key) || 'null');
    if (stored) {
      if (![...fields, 'importedIds'].every(field => Array.isArray(stored[field]) && stored[field].every(value => typeof value === 'string'))) throw new Error('Invalid lists');
      state = stored;
    }
    fields.forEach(render);
  } catch {
    available = false;
    for (const field of fields) {
      message(field, 'Vos listes ne peuvent pas être chargées sur cet appareil. Les données existantes sont conservées.', true);
      node(field).disabled = true; node(field + 'Save').disabled = true;
    }
  }
  for (const field of fields) {
    node(field).addEventListener('input', () => message(field, 'Modifications à sauvegarder.'));
    node(field + 'Cancel').addEventListener('click', () => {
      resetEditor(field); message(field, 'Modification annulée.'); node(field).focus();
    });
    node(field + 'Form').addEventListener('submit', event => {
      event.preventDefault();
      if (!available) return;
      const entries = lines(node(field).value);
      if (!entries.length) { message(field, 'Saisissez au moins un titre.', true); node(field).focus(); return; }
      try {
        const previous = state[field];
        const index = editing[field] === null ? -1 : previous.indexOf(editing[field]);
        const next = index < 0 ? [...previous, ...entries] : [...previous.slice(0, index), ...entries, ...previous.slice(index + 1)];
        save({...state, [field]: [...new Set(next)]});
        resetEditor(field); render(field);
        message(field, 'Votre liste est sauvegardée sur cet appareil.');
      } catch { message(field, 'Votre liste n’a pas pu être sauvegardée. Réessayez.', true); }
    });
  }
  window.EclatLibraryReadingLists = {
    importRecords(records) {
      if (!available) return;
      const pending = records.filter(record => record.id && !state.importedIds.includes(record.id));
      if (!pending.length) return;
      const next = {...state, importedIds: [...state.importedIds, ...pending.map(record => record.id)]};
      for (const field of fields) {
        const legacy = pending.flatMap(record => Array.isArray(record[field]) ? record[field].filter(value => typeof value === 'string') : []);
        next[field] = lines([...state[field], ...legacy].join('\n'));
      }
      try { save(next); fields.forEach(render); }
      catch { for (const field of fields) message(field, 'Les anciennes listes n’ont pas pu être récupérées. Elles restent conservées dans vos emprunts.', true); }
    }
  };
})();
