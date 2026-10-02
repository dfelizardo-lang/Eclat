(() => {
  const form = document.getElementById('loansForm');
  const saveButton = document.getElementById('saveButton');
  const status = document.getElementById('saveStatus');
  const photoStatus = document.getElementById('photoStatus');
  const fileInput = document.getElementById('bookPhotos');
  const photoList = document.getElementById('photoList');
  const fields = ['nextVisit', 'returnDate', 'borrowAgain', 'reserveBooks'];
  let db, photos = [], urls = [], busy = false, revision = 0;
  fileInput.disabled = true;
  const addPhotosButton = document.getElementById("addPhotosButton");
  addPhotosButton.disabled = true;
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
      const request = db.transaction('notebooks', 'readonly').objectStore('notebooks').get('default');
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
    photos.forEach((photo, index) => {
      const card = document.createElement('figure'); card.className = 'photo-card';
      const img = document.createElement('img');
      img.src = URL.createObjectURL(photo.blob); urls.push(img.src);
      img.alt = photo.title ? 'Couverture de ' + photo.title : 'Photo du livre emprunté ' + (index + 1);
      const title = document.createElement('input');
      title.type = 'text'; title.value = photo.title || ''; title.placeholder = 'Titre du livre';
      title.setAttribute('aria-label', 'Titre du livre emprunté ' + (index + 1));
      title.addEventListener('input', () => { photo.title = title.value; img.alt = title.value ? 'Couverture de ' + title.value : 'Photo du livre emprunté ' + (index + 1); changed(); });
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Retirer la photo';
      remove.setAttribute('aria-label', 'Retirer la photo du livre ' + (index + 1));
      remove.addEventListener('click', () => { photos = photos.filter(p => p.id !== photo.id); renderPhotos(); changed(); const target=photoList.querySelector('button') || addPhotosButton; target.focus(); });
      card.append(img, title, remove); photoList.append(card);
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
      return {id: crypto.randomUUID(), blob, title: '', originalName: file.name};
    } finally { URL.revokeObjectURL(url); }
  }
  fileInput.addEventListener('change', async () => {
    if (busy) return;
    busy = true; saveButton.disabled = true; fileInput.disabled = true; addPhotosButton.disabled = true;
    message(photoStatus, 'Ajout des photos…');
    let failures = 0, added = 0;
    try {
      for (const file of fileInput.files) {
        try { photos.push(await preparePhoto(file)); added++; } catch { failures++; }
      }
      renderPhotos();
      if (added) changed();
      message(photoStatus, failures ? 'Certaines photos n’ont pas pu être ouvertes. Essayez une image JPEG ou PNG.' : added + ' photo' + (added > 1 ? 's ajoutées.' : ' ajoutée.'), failures > 0);
    } finally { fileInput.value = ''; busy = false; fileInput.disabled = false; saveButton.disabled = !db; addPhotosButton.disabled = !db; }
  });
  fields.forEach(id => document.getElementById(id).addEventListener('input', changed));
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!db || busy) return;
    busy = true; saveButton.disabled = true; fileInput.disabled = true; addPhotosButton.disabled = true;
    message(status, 'Enregistrement…');
    const savedRevision = revision;
    const list = id => document.getElementById(id).value.split('\n').map(line => line.trim()).filter(Boolean);
    // Versioned local record: dates, lists and stable photo IDs can be reused by a mobile client.
    const record = {id: 'default', version: 1, updatedAt: new Date().toISOString(), nextVisit: document.getElementById('nextVisit').value, returnDate: document.getElementById('returnDate').value, borrowAgain: list('borrowAgain'), reserveBooks: list('reserveBooks'), photos};
    try { await writeNotebook(record); message(status, revision === savedRevision ? 'Votre carnet est enregistré.' : 'Modifications à enregistrer.'); }
    catch { message(status, 'Le carnet n’a pas pu être enregistré. Libérez de l’espace sur cet appareil, puis réessayez.', true); }
    finally { busy = false; saveButton.disabled = false; fileInput.disabled = false; addPhotosButton.disabled = false; }
  });
  (async () => {
    try {
      db = await openDatabase();
      const record = await readNotebook();
      if (record) {
        for (const id of fields) document.getElementById(id).value = Array.isArray(record[id]) ? record[id].join('\n') : record[id] || '';
        photos = Array.isArray(record.photos) ? record.photos : [];
      }
      renderPhotos(); saveButton.disabled = false; fileInput.disabled = false; addPhotosButton.disabled = false;
      message(status, record ? 'Votre carnet est prêt.' : 'Votre carnet est prêt à être rempli.');
    } catch {
      message(status, 'L’enregistrement sur cet appareil est indisponible dans ce navigateur.', true);
      fileInput.disabled = true;
    }
  })();
})();
