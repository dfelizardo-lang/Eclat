// Additional assertions retain the imported Squash references and real UI flows.
const s = require('./site');
const {test,expect,go,home,reader,comfort,adultForm,childForm,createLoan,exportBackup,importBackup,backup,book,audioFixture,playing,stopped}=s;
const id=(page,name)=>page.locator('#'+name);
const pages=['/','/emprunts.html','/emprunts-enfants.html','/migration.html','/narration-credits.html'];
async function attachment(info,name,value){await info.attach(name,{body:Buffer.from(JSON.stringify(value,null,2)),contentType:'application/json'});}
async function tabTo(page,locator){
  for(let i=0;i<180;i++){
    if(await locator.evaluateAll(es=>es.includes(document.activeElement)))return;
    await page.keyboard.press('Tab');
  }
  throw new Error('Commande inaccessible par Tab : '+locator);
}
async function keyboardClick(page,locator){await tabTo(page,locator);await page.keyboard.press('Enter');}
function install(checks){
 const extend=(n,fn)=>{const previous=checks.get(n);checks.set(n,async(args,info)=>{await previous(args,info);await fn(args,info);});};
 // Both route cases explicitly exclude the deferred accessibility page.
 extend(2,async({page})=>{await go(page,'/narration-credits.html');await keyboardClick(page,page.getByRole('link',{name:/Retour à l’Accueil/}));await expect(id(page,'adultBtn')).toBeVisible();});
 checks.set(3,async({page})=>{
  for(const route of ['/','/index.html','/emprunts','/emprunts-enfants','/migration','/narration-credits']){
   const canonical=route==='/'||route==='/index.html'?'/':route+'.html';
   const variants=canonical==='/'?[route]:[route,route+'/',canonical,canonical+'/'];
   for(const path of variants){const response=await go(page,path+'?eclat_probe=route');expect(response.status()).toBe(200);expect(new URL(page.url()).pathname).toBe(canonical);expect(new URL(page.url()).searchParams.get('eclat_probe')).toBe('route');await expect(page.locator('h1')).toBeVisible();const reload=await page.reload();expect(reload.status()).toBe(200);}
  }
 });
 extend(9,async({page},info)=>{
  info.setTimeout(120000);
  await home(page);
  const passages=await page.evaluate(()=>PASSAGES.map(p=>({...p,year:WORKS.find(w=>w.title===p.workTitle&&w.author===p.author)?.year}))); expect(passages.length).toBeGreaterThan(0);
  const failures=[];
  for(const p of passages){
   await page.evaluate(p=>directPassage(p,'Contrôle métadonnées'),p);
   for(const [selector,value] of [['readerAuthor',p.author],['readerWork',p.workTitle],['readerYear',String(p.year)]]){
    if(!(await id(page,selector).innerText()).includes(value))failures.push({id:p.id,field:selector,expected:value});
   }
   expect(await id(page,'readerSource').getAttribute('href')).toBe(p.source);
  }
  await attachment(info,'metadonnees-corpus.json',{count:passages.length,failures});expect(failures).toEqual([]);
 });
 extend(19,async({page})=>{
  // The prior flow finishes playing: measure a full quiet interval, then resume.
  await id(page,'listenToggle').click();await stopped(page);
  const before=await page.evaluate(()=>window.__media.at(-1).currentTime);
  await page.waitForTimeout(600);
  expect(await page.evaluate(()=>window.__media.at(-1).currentTime)).toBeCloseTo(before,2);
  await id(page,'listenToggle').click();await playing(page);
  await expect.poll(()=>page.evaluate(()=>window.__media.at(-1).currentTime)).toBeGreaterThan(before);
  expect(await page.evaluate(()=>window.__media.filter(a=>!a.paused&&!a.ended).length)).toBe(1);
 });
 extend(26,async({page})=>{
  await id(page,'continuousListen').click();await playing(page);
  // A genuine ended listener schedules the inter-excerpt delay. Cancel that delay.
  await page.evaluate(()=>window.__media.at(-1).dispatchEvent(new Event('ended')));
  await id(page,'continuousListen').click();await stopped(page);
  const before=await page.evaluate(()=>({id:window.eclatCurrentPassage.id,count:window.__media.length}));
  await page.waitForTimeout(2500);
  expect(await page.evaluate(()=>({id:window.eclatCurrentPassage.id,count:window.__media.length}))).toEqual(before);
 });
 checks.set(10,async({page},info)=>{
  const file=process.env.ECLAT_EDITORIAL_REFERENCE;
  test.skip(!file,'BLOQUÉ : ECLAT_EDITORIAL_REFERENCE doit désigner les textes et sources approuvés, indépendants du catalogue applicatif.');
  const reference=JSON.parse(require('node:fs').readFileSync(file,'utf8'));
  expect(reference.approvedBy).toBeTruthy();expect(reference.sourceRevision).toBeTruthy();expect(reference.passages.length).toBeGreaterThan(0);
  await home(page);const actual=await page.evaluate(()=>PASSAGES);const results=[];
  for(const approved of reference.passages){expect(approved.source).toMatch(/^https:\/\//);const p=actual.find(p=>p.id===approved.id);expect(p,approved.id).toBeTruthy();expect(p.text).toBe(approved.text);expect(p.source).toBe(approved.source);expect(p.author).toBe(approved.author);expect(p.workTitle).toBe(approved.workTitle);results.push(approved.id);}
  await attachment(info,'comparaison-editoriale.json',{approvedBy:reference.approvedBy,sourceRevision:reference.sourceRevision,checked:results});
 });
 checks.set(38,async({page},info)=>{
  const AxeBuilder=require('@axe-core/playwright').default;info.setTimeout(180000);
  for(const theme of ['light','dark'])for(const path of ['/','/emprunts.html','/emprunts-enfants.html']){
   await go(page,path);await comfort(page);await id(page,'comfort-theme').selectOption(theme);await page.locator('[data-close]').click();
   const result=await new AxeBuilder({page}).withRules(['color-contrast']).analyze();await attachment(info,'contrastes-'+theme+'-'+path.replace(/[^a-z]/g,'')+'.json',result);expect.soft(result.violations,path+' '+theme).toEqual([]);
   await page.keyboard.press('Tab');
   const focus=await page.evaluate(()=>{const e=document.activeElement,s=getComputedStyle(e);return {element:e.tagName,outline:s.outlineStyle,color:s.outlineColor};});await attachment(info,'focus-'+theme+'-'+path.replace(/[^a-z]/g,'')+'.json',focus);
  }
 });
 checks.set(56,async({page})=>{
  await adultForm(page);await expect(id(page,'bookPhotos')).toHaveAttribute('capture','environment');
  const chooser=page.waitForEvent('filechooser');await id(page,'addPhotosButton').click();const capture=await chooser;expect(capture.isMultiple()).toBe(false);await capture.setFiles([]);
  await expect(id(page,'loansForm')).toBeVisible();await expect(id(page,'choosePhotoButton')).toBeEnabled();
  const gallery=page.waitForEvent('filechooser');await id(page,'choosePhotoButton').click();const files=await gallery;await files.setFiles({name:'test.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==','base64')});await expect(page.locator('#photoList img')).toBeVisible();
 });
 checks.set(11,async({page},info)=>{
  await home(page);const expected=require('./corpus-baseline.json');const {createHash}=require('node:crypto');
  const passages=await page.evaluate(()=>PASSAGES);const actual=passages.map(p=>({id:p.id,audience:p.audience,author:p.author,workTitle:p.workTitle,source:p.source,textHash:createHash('sha256').update(p.text).digest('hex')}));
  expect(new Set(actual.map(p=>p.id)).size).toBe(actual.length);expect(actual).toEqual(expected.passages);
  await attachment(info,'integrite-corpus.json',{count:actual.length,baseline:expected.date,editorialApproval:false});
 });
 checks.set(62,async({page},info)=>{
  info.setTimeout(180000);const fs=require('node:fs'),path=require('node:path');const {execFile}=require('node:child_process');const run=require('node:util').promisify(execFile);const root=path.resolve(__dirname,'../../..');
  // This case exercises the real server downloader with instrumented DNS/HTTPS.
  if(!fs.existsSync(path.join(root,'node_modules/cheerio/package.json')))await run('npm',['ci','--ignore-scripts','--no-audit','--no-fund'],{cwd:root,timeout:120000});
  const result=await run(process.execPath,['--test','library-news-security.test.js'],{cwd:root,timeout:30000});
  await info.attach('securite-requetes-sortantes.txt',{body:Buffer.from(result.stdout),contentType:'text/plain'});
  for(const url of ['https://localhost','https://127.0.0.1','https://10.0.0.1','file:///etc/passwd','javascript:alert(1)']){const response=await page.request.get(s.target()+'/api/library-news?url='+encodeURIComponent(url));expect(response.status(),url).toBe(400);expect((await response.json()).error).toBeTruthy();}
 });
 checks.set(93,async({browser},info)=>{
  info.setTimeout(1800000);const measurements=[];
  for(const {name,...profile} of require('../devtools-devices.json').profiles){
   const context=await browser.newContext({...profile,serviceWorkers:'block'});
   try{await s.secure(context);const page=await context.newPage();for(const path of ['/','/emprunts.html','/emprunts-enfants.html','/migration.html']){
    await go(page,path);await expect(page.locator('h1')).toBeVisible();
    const nav=await page.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0];return {domContentLoadedMs:n.domContentLoadedEventEnd,responseMs:n.responseEnd,transferBytes:n.transferSize};});
    expect(nav.domContentLoadedMs).toBeGreaterThan(0);const begin=performance.now();
    if(path==='/'){await page.locator('#moodGrid button').first().click();await expect(id(page,'readerText')).not.toHaveText('');}
    if(path==='/emprunts.html'){await id(page,'newLoan').click();await expect(id(page,'loansForm')).toBeVisible();}
    if(path==='/emprunts-enfants.html'){await id(page,'newBook').click();await expect(id(page,'bookForm')).toBeVisible();}
    measurements.push({profile:name,path,...nav,interactionMs:performance.now()-begin,conditions:'Réseau agent, sans limitation CPU ; émulation géométrique uniquement',performanceCompliance:'non évaluée : budgets non définis'});
   }}finally{await context.close();}
  }
  await attachment(info,'mesures-performance-F12.json',measurements);
 });
 checks.set(31,async({page,context})=>{
  await audioFixture(page);await reader(page);await id(page,'saveExcerpt').click();
  const content=await id(page,'readerText').innerText();
  await id(page,'listenToggle').click();await playing(page);
  const fail=route=>route.abort('internetdisconnected');
  await context.setOffline(true);await page.route('**/__eclat_test__/*.wav',fail);
  try{
   // Buffered media may finish without a connection. Request an uncached voice.
   await page.locator('.child-narrator [data-kind=male]').click();
   await expect(id(page,'listenStatus')).toContainText('indisponible',{timeout:16000});
   await expect(id(page,'listenToggle')).toContainText(/Réessayer/i);
   expect(await id(page,'readerText').innerText()).toBe(content);await expect(id(page,'savedCount')).toHaveText('1');await stopped(page);
  }finally{await context.setOffline(false);await page.unroute('**/__eclat_test__/*.wav',fail);}
  await id(page,'listenToggle').click();await playing(page);
  expect(await page.evaluate(()=>window.__media.filter(a=>!a.paused&&!a.ended).length)).toBe(1);
 });
 checks.set(35,async({browser},info)=>{
  const profiles=require('../devtools-devices.json').profiles;info.setTimeout(1800000);
  for(const {name,...profile} of profiles){await test.step(name,async()=>{
   const context=await browser.newContext({...profile,locale:'fr-FR',serviceWorkers:'block'});
   try{await s.secure(context);const page=await context.newPage();await home(page);await comfort(page);await id(page,'comfort-size').selectOption('200');await page.locator('[data-close]').click();
    for(const path of pages){await go(page,path);await expect(page.locator('h1')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),path).toBe(true);}
    await childForm(page);await id(page,'bookTitle').fill('Grand texte');await id(page,'bookAuthor').fill('Auteur');await id(page,'saveBook').click();await expect(id(page,'bookForm')).toBeHidden();
    await reader(page);await expect(id(page,'readerText')).not.toHaveText('');await id(page,'readerClose').click();
    expect(await page.locator('main').evaluate(e=>Number(getComputedStyle(e).zoom))).toBe(2);
   }finally{await context.close();}
  });}
 });
 checks.set(40,async({page},info)=>{
  await home(page);await comfort(page);await page.locator('[data-setting=motion]').check();await page.locator('[data-close]').click();
  for(const mode of ['setting','system']){
   if(mode==='system'){await comfort(page);await page.locator('[data-setting=motion]').uncheck();await page.locator('[data-close]').click();await page.emulateMedia({reducedMotion:'reduce'});}
   await page.locator('#moodGrid button').first().click();await expect(id(page,'readerText')).not.toHaveText('');
   const active=await page.evaluate(()=>document.getAnimations().filter(a=>a.playState==='running').map(a=>({type:a.constructor.name,target:a.effect?.target?.id||a.effect?.target?.className})));
   await attachment(info,'animations-'+mode+'.json',active);expect(active).toEqual([]);await id(page,'readerClose').click();
  }
 });
 checks.set(41,async({page})=>{
  await page.addInitScript(()=>{
   window.__speech={calls:[],paused:false};window.SpeechSynthesisUtterance=class{constructor(text){this.text=text;}};
   Object.defineProperty(window,'speechSynthesis',{configurable:true,value:{get paused(){return window.__speech.paused;},getVoices(){return [];},addEventListener(){},speak(u){window.__speech.calls.push({action:'speak',text:u.text,lang:u.lang});},pause(){window.__speech.paused=true;window.__speech.calls.push({action:'pause'});},resume(){window.__speech.paused=false;window.__speech.calls.push({action:'resume'});},cancel(){window.__speech.calls.push({action:'cancel'});}}});
  });
  await home(page);const visible=await id(page,'heroCopy').innerText();await comfort(page);await page.locator('[data-speak]').click();
  const spoken=await page.evaluate(()=>window.__speech.calls.find(c=>c.action==='speak'));expect(spoken.lang).toBe('fr-FR');expect(spoken.text).toContain(visible.trim());
  await page.locator('[data-pause]').click();await page.locator('[data-pause]').click();await page.locator('[data-stop]').click();
  expect(await page.evaluate(()=>window.__speech.calls.map(c=>c.action))).toEqual(['cancel','speak','pause','resume','cancel']);await expect(page.locator('[data-pause]')).toBeDisabled();
 });
 const permissionCase=checks.get(48);
 checks.set(48,async(args,info)=>{
  await args.page.addInitScript(()=>{window.__geoCalls=0;Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition(_success,error){window.__geoCalls++;error?.({code:1,message:'Permission denied'});},watchPosition(_success,error){window.__geoCalls++;error?.({code:1,message:'Permission denied'});return 0;},clearWatch(){}}});});
  await permissionCase(args,info);
 });
 extend(48,async({page},info)=>{
  const calls=await page.evaluate(()=>window.__geoCalls||0);info.annotations.push({type:'géolocalisation',description:'Recherche par code postal ; aucune commande de localisation dans cette version. Appels : '+calls});expect(calls).toBe(0);
 });
 checks.set(58,async({page})=>{
  await go(page,'/emprunts.html');await createLoan(page,'Rappel test');await page.getByRole('button',{name:/Voir ou modifier/}).click();await id(page,'weeklyReminder').check();await id(page,'saveButton').click();await expect(id(page,'loansForm')).toBeHidden();
  const link=page.getByRole('link',{name:/Ajouter le rappel.*Google Agenda/});await expect(link).toHaveAttribute('target','_blank');
  await expect(id(page,'loansList')).toContainText(/Enregistrer/);await expect(id(page,'loansList')).toContainText(/supprimez toute la série/);
  await page.getByRole('button',{name:'Livres rendus',exact:true}).click();await expect(id(page,'overviewStatus')).toContainText(/supprimez toute sa série/);await expect(link).toHaveCount(0);
 });
 extend(60,async({page})=>{
  const titles=await page.locator('#libraryNewsResults .library-news-card h4').allTextContents();expect(titles).toEqual([...Array.from({length:20},(_,i)=>'Livre fixture '+i),'Actualité fixture']);
 });
 extend(61,async({page})=>{await expect(page.locator('#libraryWantedList h4')).toHaveText('Livre fixture 0');await page.locator('#libraryWantedList .library-heart').click();await expect(page.locator('#libraryWantedList .library-news-card')).toHaveCount(0);await page.reload();await id(page,'libraryWatchOpen').click();await expect(page.locator('#libraryWantedList .library-news-card')).toHaveCount(0);});
 checks.set(63,async({page},info)=>{
  info.setTimeout(60000);let mode='ok',release;const gate=new Promise(r=>release=r);
  await page.route('**/api/library-news?**',async route=>{
   if(mode==='hang'){await gate;return route.abort().catch(()=>{});}
   if(mode==='error')return route.fulfill({status:503,json:{error:'Panne de test'}});
   if(mode==='invalid')return route.fulfill({body:'not json',contentType:'text/plain'});
   return route.fulfill({json:{url:'https://example.org/',checkedAt:new Date().toISOString(),items:[{id:'book-1',kind:'book',title:'Conservé',url:'https://example.org/book'}]}});
  });
  await go(page,'/emprunts.html');await id(page,'libraryWatchOpen').click();await id(page,'libraryUrl').fill('https://example.org/');await page.getByRole('button',{name:'Enregistrer et consulter'}).click();await expect(page.locator('#libraryNewsResults h4')).toHaveText('Conservé');await page.locator('#libraryNewsResults .library-heart').click();
  try{for(const failure of ['error','invalid','hang']){mode=failure;await id(page,'libraryRefresh').click();await expect(id(page,'libraryRefresh')).toBeEnabled({timeout:16000});await expect(id(page,'libraryRefresh')).toHaveText('Réessayer');await expect(page.locator('#libraryNewsResults h4')).toHaveText('Conservé');await expect(page.locator('#libraryWantedList h4')).toHaveText('Conservé');}}
  finally{release();}
  mode='ok';await id(page,'libraryRefresh').click();await expect(id(page,'libraryNewsStatus')).toContainText('Vérifié le');
 });
 extend(68,async({page})=>{
  await reader(page);await id(page,'saveExcerpt').click();
  await go(page,'/emprunts.html');await createLoan(page,'Export adulte');await childForm(page);await id(page,'bookTitle').fill('Export enfant');await id(page,'bookAuthor').fill('Auteur');await id(page,'saveBook').click();await expect(id(page,'bookForm')).toBeHidden();await go(page,'/migration.html');
  const before=await page.evaluate(()=>EclatTransfer.exportData());const exported=await exportBackup(page);expect(exported.databases).toEqual(before.databases);expect(exported.localStorage).toEqual(before.localStorage);
  const loan=exported.databases.find(d=>d.store==='notebooks').records[0];expect(loan.borrowAgain).toContain('Export adulte');expect(loan.photos[0].blob.data).toMatch(/^data:image\/jpeg;base64,/);expect(exported.databases.find(d=>d.store==='books').records.some(b=>b.title==='Export enfant')).toBe(true);
 });
 extend(71,async({page,browser})=>{
  const base=book('merge');base.updatedAt='2030-01-01T10:00:00Z';base.title='Existant';await importBackup(page,backup([base,book('preserved')]));
  await importBackup(page,backup([{...base,title:'Ancien',updatedAt:'2029-12-31T10:00:00Z'}]));
  await importBackup(page,backup([{...base,title:'Égalité'}]));
  let data=await exportBackup(page);expect(data.databases.find(d=>d.store==='books').records.find(b=>b.id==='merge').title).toBe('Existant');
  await importBackup(page,backup([{...base,title:'Plus récent',updatedAt:'2030-01-01T12:00:01+02:00'}]));await page.reload();data=await exportBackup(page);const books=data.databases.find(d=>d.store==='books').records;expect(books.find(b=>b.id==='merge').title).toBe('Plus récent');expect(books.some(b=>b.id==='preserved')).toBe(true);
  await go(page,'/emprunts.html');await createLoan(page,'Import avec photo');await reader(page);await id(page,'saveExcerpt').click();await go(page,'/migration.html');const full=await exportBackup(page);
  const context=await browser.newContext({serviceWorkers:'block'});
  try{await s.secure(context);const restored=await context.newPage();await go(restored,'/migration.html');await importBackup(restored,full);await restored.reload();const after=await exportBackup(restored);expect(after.databases).toEqual(full.databases);expect(after.localStorage).toEqual(full.localStorage);
   await go(restored,'/emprunts.html');await expect(id(restored,'loansList')).toContainText('Import avec photo');await expect.poll(()=>restored.locator('#loansList img').evaluate(e=>e.complete&&e.naturalWidth>0)).toBe(true);
   await go(restored,'/emprunts-enfants.html');await expect(id(restored,'savedBooks')).toContainText('Plus récent');
  }finally{await context.close();}

 });
 extend(76,async({page})=>{await id(page,'newBook').click();await id(page,'bookTitle').fill('Après quota');await id(page,'bookAuthor').fill('Test');await id(page,'saveBook').click();await expect(id(page,'bookForm')).toBeHidden();await page.reload();await expect(id(page,'savedBooks')).toContainText('Après quota');await expect(id(page,'savedBooks')).toContainText('Conservé');});
 extend(78,async({page})=>{const inventory=require('./credits.json');for(const entry of inventory)await expect(page.locator('a[href="'+entry.url+'"]')).toHaveCount(1);await page.getByRole('link',{name:'Retour à l’Accueil'}).click();await expect(id(page,'adultBtn')).toBeVisible();});
 checks.set(79,async({page},info)=>{
  info.setTimeout(240000);
  await go(page,'/narration-credits.html');const results=[];
  for(const {url} of require('./credits.json')){
   const response=await page.request.get(url,{timeout:20000,failOnStatusCode:false});results.push({url,status:response.status(),final:response.url()});expect.soft(response.status(),url).toBeGreaterThanOrEqual(200);expect.soft(response.status(),url).toBeLessThan(400);
  }
  await attachment(info,'liens-credits.json',results);
 });
 checks.set(83,async({page})=>{
  await home(page);
  for(const [trigger,panel] of [[page.locator('#moodGrid button').first(),id(page,'readerOverlay')],[id(page,'savedOpen'),id(page,'savedPanel')],[page.locator('.comfort-open').first(),page.locator('.comfort-dialog')]]){
   await keyboardClick(page,trigger);await expect(panel).toBeVisible();
   for(const key of ['Tab','Shift+Tab'])for(let i=0;i<35;i++){await page.keyboard.press(key);expect(await panel.evaluate(e=>e.contains(document.activeElement))).toBe(true);}
   await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
  }
 });
 checks.set(84,async({page},info)=>{
  info.setTimeout(120000);
  await home(page);await keyboardClick(page,id(page,'childBtn'));await expect(page.locator('body')).toHaveClass(/kids/);await keyboardClick(page,page.locator('#moodGrid button').first());await expect(id(page,'readerText')).not.toHaveText('');await page.keyboard.press('Escape');
  await keyboardClick(page,id(page,'libraryLoansLink'));await expect(page).toHaveURL(/emprunts-enfants/);await keyboardClick(page,id(page,'newBook'));await tabTo(page,id(page,'bookTitle'));await page.keyboard.type('Carnet clavier');await tabTo(page,id(page,'bookAuthor'));await page.keyboard.type('Auteur clavier');await keyboardClick(page,id(page,'saveBook'));await expect(id(page,'bookForm')).toBeHidden();await expect(id(page,'savedBooks')).toContainText('Carnet clavier');
  await go(page,'/emprunts.html');await keyboardClick(page,id(page,'newLoan'));await keyboardClick(page,id(page,'cancelLoan'));await expect(id(page,'loansForm')).toBeHidden();
  await go(page,'/migration.html');await keyboardClick(page,id(page,'exportData'));await go(page,'/narration-credits.html');await keyboardClick(page,page.getByRole('link',{name:'Retour à l’Accueil'}));await expect(id(page,'adultBtn')).toBeVisible();
 });
 // Run the measurable parts from already-linked Squash cases. The original
 // mixed cases retain their independent human/native acceptance requirements.
 extend(85,async(args,info)=>{
  info.setTimeout(300000);
  const nested={setTimeout(){},attach:info.attach.bind(info),annotations:info.annotations};
  for(const n of [38,83,84])await test.step('Précontrôle ECL-TC-'+String(n).padStart(3,'0'),()=>checks.get(n)(args,nested));
 });
 extend(54,async(args,info)=>{await test.step('Capture et repli galerie — précontrôle 056',()=>checks.get(56)(args,info));});
 const integrity=checks.get(11);
 checks.set(11,async(args,info)=>{await integrity(args,info);if(process.env.ECLAT_EDITORIAL_REFERENCE)await checks.get(10)(args,info);});
}
module.exports={install};
