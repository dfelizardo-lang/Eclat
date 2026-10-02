(() => {
  const form = document.getElementById('loansForm');
  const saveButton = document.getElementById('saveButton');
  const status = document.getElementById('saveStatus');
  const photoStatus = document.getElementById('photoStatus');
  const fileInput = document.getElementById('bookPhotos');
  const photoList = document.getElementById('photoList');
  const fields = ['returnDate', 'borrowAgain', 'reserveBooks'];
  const galleryInput = document.getElementById('galleryPhoto');
  const choosePhotoButton = document.getElementById('choosePhotoButton');
  choosePhotoButton.addEventListener('click', () => galleryInput.click());
  let db, photos = [], urls = [], listUrls = [], records = [], currentId = null, busy = false, revision = 0;
  const overview = document.getElementById('loansOverview');
  const overviewStatus = document.getElementById('overviewStatus');
  const newLoan = document.getElementById('newLoan');
  function showOverview() { form.hidden = true; overview.hidden = false; newLoan.focus(); }
  function openForm(record) {
    currentId = record ? record.id : crypto.randomUUID();
    for (const id of fields) document.getElementById(id).value = record ? (Array.isArray(record[id]) ? record[id].join('\n') : record[id] || '') : '';
    photos = record && Array.isArray(record.photos) ? record.photos.slice(0,1) : [];
    document.getElementById('formHeading').textContent = record ? 'Votre emprunt' : 'Nouvel emprunt';
    renderPhotos(); message(photoStatus, ''); message(status, '');
    overview.hidden = true; form.hidden = false; document.getElementById('formHeading').focus();
  }
  newLoan.addEventListener('click', () => openForm(null));
  document.getElementById('cancelLoan').addEventListener('click', () => { if (!busy) showOverview(); });
  function renderRecords() {
    listUrls.forEach(url => URL.revokeObjectURL(url)); listUrls = [];
    const container = document.getElementById('loansList'); container.replaceChildren();
    records.sort((a,b) => (b.createdAt || b.updatedAt || '').localeCompare(a.createdAt || a.updatedAt || '')).forEach(record => {
      const row = document.createElement('article'); row.className = 'loan-row form-card';
      const photo = record.photos && record.photos[0];
      if (photo && photo.blob) { const img = document.createElement('img'); img.src = URL.createObjectURL(photo.blob); listUrls.push(img.src); img.alt = 'Photo d’ensemble des livres empruntés'; row.append(img); }
      const copy = document.createElement('div'); const title = document.createElement('h3');
      const date = record.createdAt || record.updatedAt;
      title.textContent = date ? 'Emprunt du ' + new Date(date).toLocaleDateString('fr-FR') : 'Emprunt enregistré'; copy.append(title);
      const due = document.createElement('p'); due.textContent = record.returnDate ? 'Retour le ' + new Date(record.returnDate + 'T12:00:00').toLocaleDateString('fr-FR') : 'Date de retour à préciser'; copy.append(due);
      for (const [key,label] of [['borrowAgain','À réemprunter'],['reserveBooks','À réserver']]) { if (record[key] && record[key].length) { const p = document.createElement('p'); p.textContent = label + ' : ' + record[key].join(' · '); copy.append(p); } }
      const button = document.createElement('button'); button.type = 'button'; button.className = 'photo-button'; button.textContent = 'Voir / modifier'; button.setAttribute('aria-label', 'Voir ou modifier ' + title.textContent.toLowerCase()); button.addEventListener('click', () => openForm(record));
      row.append(copy,button); container.append(row);
    });
  }
  fileInput.disabled = true;
  const addPhotosButton = document.getElementById("addPhotosButton");
  addPhotosButton.disabled = true; choosePhotoButton.disabled = true; galleryInput.disabled = true;
  addPhotosButton.addEventListener("click", () => fileInput.click());
  function message(node, text, error = false) {
    node.textContent = text;
    node.classList.toggle('error', error);
  }
  function changed() { revision++; message(status, 'Modifications à enregistrer.'); }
  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('eclat-library-loans', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('notebooks', {keyPath: 'id'});
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Database unavailable'));
    });
  }
  function readNotebook() {
    return new Promise((resolve, reject) => {
      const request = db.transaction('notebooks', 'readonly').objectStore('notebooks').getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  function writeNotebook(record) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('notebooks', 'readwrite');
      transaction.objectStore('notebooks').put(record);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }
  function renderPhotos() {
    urls.forEach(url => URL.revokeObjectURL(url)); urls = [];
    photoList.replaceChildren();
    document.getElementById('photoEmpty').hidden = photos.length > 0;
    photos.slice(0,1).forEach(photo => {
      const card = document.createElement('figure'); card.className = 'photo-card';
      const img = document.createElement('img');
      img.src = URL.createObjectURL(photo.blob); urls.push(img.src);
      img.alt = 'Photo d’ensemble de tous les livres empruntés';
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Retirer la photo';
      remove.setAttribute('aria-label', 'Retirer la photo d’ensemble');
      remove.addEventListener('click', () => { photos = photos.filter(p => p.id !== photo.id); renderPhotos(); changed(); const target=photoList.querySelector('button') || addPhotosButton; target.focus(); });
      card.append(img, remove); photoList.append(card);
    });
  }
  async function preparePhoto(file) {
    if (!file.type.startsWith('image/')) throw new Error('Unsupported image');
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = url; });
      const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const context = canvas.getContext('2d'); context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(img, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error('Image conversion failed')), 'image/jpeg', .85));
      return {id: crypto.randomUUID(), blob, originalName: file.name};
    } finally { URL.revokeObjectURL(url); }
  }
  function enablePhotoControls(enabled) {
    fileInput.disabled = !enabled; galleryInput.disabled = !enabled;
    addPhotosButton.disabled = !enabled; choosePhotoButton.disabled = !enabled;
  }
  async function addOverviewPhoto(event) {
    const input = event.target;
    if (busy || !input.files.length) return;
    busy = true; saveButton.disabled = true; enablePhotoControls(false);
    message(photoStatus, 'Préparation de la photo…');
    try {
      const photo = await preparePhoto(input.files[0]);
      photos = [photo]; renderPhotos(); changed();
      message(photoStatus, 'Votre photo d’ensemble est prête à être enregistrée.');
    } catch { message(photoStatus, 'Cette photo n’a pas pu être ouverte. Essayez une image JPEG ou PNG.', true); }
    finally { input.value = ''; busy = false; saveButton.disabled = !db; enablePhotoControls(!!db); }
  }
  fileInput.addEventListener('change', addOverviewPhoto);
  galleryInput.addEventListener('change', addOverviewPhoto);
  fields.forEach(id => document.getElementById(id).addEventListener('input', changed));
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!db || busy) return;
    busy = true; saveButton.disabled = true; enablePhotoControls(false);
    message(status, 'Enregistrement…');
    const savedRevision = revision;
    const list = id => document.getElementById(id).value.split('\n').map(line => line.trim()).filter(Boolean);
    // Versioned local record: dates, lists and stable photo IDs can be reused by a mobile client.
    const record = {id: currentId, version: 3, createdAt: records.find(item => item.id === currentId)?.createdAt || records.find(item => item.id === currentId)?.updatedAt || new Date().toISOString(), updatedAt: new Date().toISOString(), returnDate: document.getElementById('returnDate').value, borrowAgain: list('borrowAgain'), reserveBooks: list('reserveBooks'), photos};
    try { await writeNotebook(record); const index = records.findIndex(item => item.id === record.id); if (index < 0) records.push(record); else records[index] = record; renderRecords(); if (revision === savedRevision) { showOverview(); message(overviewStatus, 'Votre emprunt est enregistré.'); } else message(status, 'Modifications à enregistrer.'); }
    catch { message(status, 'Le carnet n’a pas pu être enregistré. Libérez de l’espace sur cet appareil, puis réessayez.', true); }
    finally { busy = false; saveButton.disabled = false; enablePhotoControls(true); }
  });
  (async () => {
    try {
      db = await openDatabase();
      records = await readNotebook();
      renderRecords(); renderPhotos(); saveButton.disabled = false; enablePhotoControls(true); newLoan.disabled = false;
      message(overviewStatus, records.length ? '' : 'Aucun emprunt pour le moment. Ajoutez votre premier emprunt.');
    } catch {
      message(overviewStatus, 'L’enregistrement sur cet appareil est indisponible dans ce navigateur.', true);
      enablePhotoControls(false);
    }
  })();
})();
