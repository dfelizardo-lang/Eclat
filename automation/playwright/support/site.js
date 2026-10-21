const { test: base, expect } = require("@playwright/test");
const {target,headersFor}=require("./target.cjs");
async function secure(context) {
  const origin=target();
  console.log('Éclat : cible réellement testée = '+origin+' ; mode '+(process.env.ECLAT_LOCAL_TEST==='1'?'local':'site en ligne'));
  await context.route("**/*",async route=>{
    await route.continue({headers:headersFor(route.request().url(),route.request().headers())});
  });
}
const test = base.extend({
  context: async ({ context }, use) => {
    await secure(context);
    await use(context);
  },
});
test.use({ serviceWorkers: "block", trace: "off", video: "off" });
async function go(page, path = "/") {
  const response = await page.goto(target() + path, {
    waitUntil: "domcontentloaded",
  });
  expect(response).not.toBeNull();
  expect(response.status()).toBe(200);
  return response;
}
async function home(page, audience = "adult") {
  await go(page);
  await expect(page.locator("#moodGrid button")).toHaveCount(6);
  await expect(page.locator(".child-narrator")).toHaveCount(1);
  await expect(page.locator("#childBtn")).toHaveAttribute(
    "aria-pressed",
    /true|false/,
  );
  if (audience === "child") await page.locator("#childBtn").click();
}
async function reader(page, audience = "adult") {
  await home(page, audience);
  await page.locator("#moodGrid button").first().click();
  await expect(page.locator("#readerOverlay")).toHaveAttribute(
    "aria-hidden",
    "false",
  );
  await expect(page.locator("#readerText")).not.toHaveText("");
  return page.evaluate(() => window.eclatCurrentPassage);
}
async function comfort(page) {
  await page.locator(".comfort-open").click();
  await expect(page.locator(".comfort-dialog")).toBeVisible();
}
async function adultForm(page) {
  await go(page, "/emprunts.html");
  await page.locator("#newLoan").click();
  await expect(page.locator("#loansForm")).toBeVisible();
}
async function childForm(page) {
  await go(page, "/emprunts-enfants.html");
  await expect(page.locator("#newBook")).toBeEnabled();
  await page.locator("#newBook").click();
  await expect(page.locator("#bookForm")).toBeVisible();
}
async function createLoan(page, label = "Livre A") {
  await expect(page.locator("#newLoan")).toBeEnabled();
  const before = new Set((await readLoans(page)).map(r=>r.id));
  await page.locator("#newLoan").click();
  await expect(page.locator("#loansForm")).toBeVisible();
  await page.locator("#returnDate").fill(label === "Livre B" ? "2030-01-16" : "2030-01-15");
  await expect(page.locator("#returnDate")).toHaveValue(label === "Livre B" ? "2030-01-16" : "2030-01-15");
  await page.locator("#borrowAgain").fill(label);
  await page.locator('#galleryPhoto').setInputFiles({name:'loan.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==','base64')});
  await expect(page.locator('#photoList img')).toBeVisible();
  await expect(page.locator('#photoStatus')).toContainText('prête à être enregistrée');
  await expect(page.locator('#saveButton')).toBeEnabled();
  await page.locator("#saveButton").click();
  await expect(page.locator("#loansForm"), "La transaction doit terminer et refermer le formulaire adulte").toBeHidden({timeout:30000});
  const record=(await readLoans(page)).find(r=>!before.has(r.id));expect(record).toBeTruthy();return record;
}
async function readLoans(page) {
 return page.evaluate(()=>new Promise((resolve,reject)=>{
  const request=indexedDB.open('eclat-library-loans',1);
  request.onerror=()=>reject(request.error);
  request.onsuccess=()=>{const db=request.result;const tx=db.transaction('notebooks');const r=tx.objectStore('notebooks').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);tx.oncomplete=()=>db.close();};
 }));
}
async function saveReadingLists(page,again,reserve) {
 await page.locator('#libraryWatchOpen').click();
 const form=page.locator('#libraryReadingListsForm');await expect(form).toBeVisible();
 await form.locator('#borrowAgain').fill(again);await form.locator('#reserveBooks').fill(reserve);
 await form.getByRole('button',{name:'Enregistrer mes listes'}).click();
 await expect(page.locator('#libraryReadingListsStatus')).toContainText('enregistrées');
}
async function exportBackup(page) {
  const download = page.waitForEvent("download");
  await page.locator("#exportData").click();
  const fs = require("node:fs/promises");
  return JSON.parse(await fs.readFile(await (await download).path(), "utf8"));
}
function backup(records = []) {
  return {
    application: "Eclat",
    version: 1,
    localStorage: { eclat_test_marker: '"ECL-fixture"' },
    databases: [{ db: "eclat-kids-reading", store: "books", records }],
  };
}
function book(id = "ECL-A") {
  return {
    id,
    version: 3,
    title: id,
    author: "Auteur test",
    rating: 3,
    comment: "Très bien",
    photos: [],
    createdAt: "2030-01-01T12:00:00Z",
    updatedAt: "2030-01-01T12:00:00Z",
  };
}
async function importBackup(page, data) {
  await page.locator("#importData").setInputFiles({
    name: "test.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(data)),
  });
  await expect(page.locator("#confirmImport")).toBeEnabled();
  await page.locator("#confirmImport").click();
  await expect(page.locator("#transferStatus")).toContainText(
    "entrées importées",
  );
}
function wav(seconds = 12) {
  const samples = Math.round(8000 * seconds),
    b = Buffer.alloc(44 + samples * 2);
  b.write("RIFF");
  b.writeUInt32LE(b.length - 8, 4);
  b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(8000, 24);
  b.writeUInt32LE(16000, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write("data", 36);
  b.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++)
    b.writeInt16LE(
      Math.round(300 * Math.sin((i * 2 * Math.PI * 440) / 8000)),
      44 + i * 2,
    );
  return b;
}
async function audioFixture(page, mode = "ok", seconds = 12) {
  await page.addInitScript(() => {
    window.__media = [];
    const Native = window.Audio;
    window.Audio = class extends Native {
      constructor(...args) {
        super(...args);
        window.__media.push(this);
      }
    };
  });
  await page.route("**/api/narration", async (route) => {
    // Use the application's actual passage identifiers, not fabricated DOM events.
    const passages = await page.evaluate(() =>
      Object.fromEntries(
        PASSAGES.map((p) => [
          p.id,
          {
            voices: {
              female: { url: "/__eclat_test__/female.wav" },
              male: { url: "/__eclat_test__/male.wav" },
            },
          },
        ]),
      ),
    );
    await route.fulfill({ json: { passages } });
  });
  let release;
  const gate = new Promise((r) => {
    release = r;
  });
  await page.route("**/__eclat_test__/*.wav", async (route) => {
    if (mode === "slow") await gate;
    if (mode === "error") return route.fulfill({ status: 404, body: "" });
    await route.fulfill({ contentType: "audio/wav", body: wav(seconds) });
  });
  return release;
}
async function playing(page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.__media.filter(
            (a) =>
              !a.paused &&
              !a.ended &&
              !a.error &&
              a.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA,
          ).length,
      ),
    )
    .toBe(1);
}
async function stopped(page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.__media.filter(
            (a) =>
              !a.paused &&
              !a.ended &&
              !a.error &&
              a.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA,
          ).length,
      ),
    )
    .toBe(0);
}
module.exports = {
  test,
  expect,
  target,
  secure,
  go,
  home,
  reader,
  comfort,
  adultForm,
  childForm,
  createLoan,
  readLoans,
  saveReadingLists,
  exportBackup,
  importBackup,
  backup,
  book,
  audioFixture,
  playing,
  stopped,
};
