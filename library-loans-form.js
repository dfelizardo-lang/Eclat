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
  const reminderToggle = document.getElementById('weeklyReminder');
  function toggleReminderFields(){const enabled=reminderToggle.checked;document.getElementById('reminderFields').hidden=!enabled;for(const id of ['returnDate','reminderTime'])document.getElementById(id).required=enabled;}
  reminderToggle.addEventListener('change',()=>{toggleReminderFields();changed();});
  document.getElementById('reminderTime').addEventListener('input',changed);
  function openForm(record) {
    currentId = record ? record.id : crypto.randomUUID();
    for (const id of fields) document.getElementById(id).value = record ? (Array.isArray(record[id]) ? record[id].join('\n') : record[id] || '') : '';
    photos = record && Array.isArray(record.photos) ? record.photos.slice(0,1) : [];
    document.getElementById('formHeading').textContent = record ? 'Votre emprunt' : 'Nouvel emprunt';
    reminderToggle.checked = !!record?.reminder?.enabled;
    document.getElementById('reminderTime').value=record?.reminder?.time || '09:00';toggleReminderFields();
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
      const actions=document.createElement('div');actions.className='loan-actions';actions.append(button);
      if(record.reminder?.enabled && !record.closedAt){
        const note=document.createElement('p');note.className='field-hint';note.textContent='Rappel hebdomadaire préparé · '+record.reminder.time;copy.append(note);
        const googleButton=document.createElement('a');googleButton.className='photo-button';googleButton.textContent='Ajouter à Google Agenda';googleButton.href=EclatLoanCalendar.googleCalendarUrl(record);googleButton.target='_blank';googleButton.rel='noopener noreferrer';googleButton.setAttribute('aria-label','Ajouter le rappel de cet emprunt à Google Agenda (nouvel onglet)');
        googleButton.addEventListener('click',()=>message(overviewStatus,'Dans Google Agenda, vérifiez la répétition chaque semaine et ajoutez une notification, puis cliquez sur Enregistrer. Ajoutez cette série une seule fois. Pour arrêter le rappel, supprimez toute la série dans Google Agenda.'));actions.append(googleButton);
        const guidance=document.createElement('p');guidance.className='field-hint';guidance.textContent='Google Agenda : vérifiez la notification, puis Enregistrer. Le rappel reste actif jusqu’à la suppression de la série dans votre agenda.';copy.append(guidance);
        const calendarButton=document.createElement('button');calendarButton.type='button';calendarButton.className='photo-button';calendarButton.textContent='Autre calendrier (.ics)';
        calendarButton.addEventListener('click',()=>{try{const blob=new Blob([EclatLoanCalendar.calendar(record)],{type:'text/calendar;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='eclat-emprunt-'+record.id+'.ics';link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);message(overviewStatus,'Rappel téléchargé. Ouvrez le fichier dans votre calendrier pour ajouter la série hebdomadaire. Importez-le une seule fois. Pour arrêter les alertes, supprimez toute la série dans votre calendrier.');}catch{message(overviewStatus,'Le rappel n’a pas pu être préparé.',true);}});actions.append(calendarButton);
      }
      if(record.closedAt){const badge=document.createElement('p');badge.className='loan-closed';badge.textContent='Livres rendus le '+new Date(record.closedAt).toLocaleDateString('fr-FR');copy.append(badge);}
      const closeButton=document.createElement('button');closeButton.type='button';closeButton.className='photo-button';closeButton.textContent=record.closedAt?'Rouvrir l’emprunt':'Livres rendus';
      closeButton.addEventListener('click',async()=>{if(busy)return;busy=true;closeButton.disabled=true;const closed=!record.closedAt;const updated={...record,closedAt:closed?new Date().toISOString():null,updatedAt:new Date().toISOString()};try{await writeNotebook(updated);records[records.findIndex(item=>item.id===record.id)]=updated;renderRecords();message(overviewStatus,closed?'Emprunt clôturé. Il reste dans votre historique.'+(record.reminder?.enabled?' Si le rappel a été ajouté à votre calendrier, supprimez toute sa série pour arrêter les alertes.':''):'Emprunt rouvert.');newLoan.focus();}catch{message(overviewStatus,'L’emprunt n’a pas pu être mis à jour. Réessayez.',true);closeButton.disabled=false;}finally{busy=false;}});actions.append(closeButton);
      row.append(copy,actions); container.append(row);
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
    const record = {id: currentId, version: 4, closedAt:records.find(item=>item.id===currentId)?.closedAt || null, createdAt: records.find(item => item.id === currentId)?.createdAt || records.find(item => item.id === currentId)?.updatedAt || new Date().toISOString(), updatedAt: new Date().toISOString(), returnDate: document.getElementById('returnDate').value, borrowAgain: list('borrowAgain'), reserveBooks: list('reserveBooks'), reminder: {enabled:reminderToggle.checked,date:document.getElementById('returnDate').value,time:document.getElementById('reminderTime').value}, photos};
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
