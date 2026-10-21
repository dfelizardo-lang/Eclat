const { test, expect } = require('@playwright/test');

async function assertNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  expect(overflow.scrollWidth, 'La page ne doit pas déborder horizontalement').toBeLessThanOrEqual(overflow.clientWidth + 2);
}

test('ECL-VAL-JEUNESSE ouverture et saisie du formulaire', async ({ page }) => {
  const response = await page.goto('/emprunts-enfants.html', { waitUntil: 'domcontentloaded' });
  expect(response).not.toBeNull();
  expect(response.status()).toBe(200);

  const newBook = page.locator('#newBook');
  await expect(newBook).toBeVisible();
  await expect(newBook).toBeEnabled();

  await expect(page.locator('#bookForm')).toBeHidden();
  await newBook.click();
  await expect(page.locator('#bookOverview')).toBeHidden();
  await expect(page.locator('#bookForm')).toBeVisible();

  await page.locator('#bookTitle').fill('Le Petit Prince');
  await page.locator('#bookAuthor').fill('Antoine de Saint-Exupéry');
  await page.locator('#bookComment').fill('Validation Playwright du formulaire jeunesse.');
  await expect(page.locator('#saveBook')).toBeEnabled();
  await assertNoHorizontalOverflow(page);
});

test('ECL-VAL-ADULTE création et enregistrement d’un emprunt', async ({ page }) => {
  const response = await page.goto('/emprunts.html', { waitUntil: 'domcontentloaded' });
  expect(response).not.toBeNull();
  expect(response.status()).toBe(200);

  const newLoan = page.locator('#newLoan');
  await expect(newLoan).toBeVisible();
  await expect(newLoan).toBeEnabled();

  await expect(page.locator('#loansForm')).toBeHidden();
  await newLoan.click();
  await expect(page.locator('#loansOverview')).toBeHidden();
  await expect(page.locator('#loansForm')).toBeVisible();

  await page.locator('#returnDate').fill('2030-01-15');
  await page.locator('#galleryPhoto').setInputFiles({
    name: 'loan.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==','base64')
  });
  await expect(page.locator('#photoList img')).toBeVisible();
  await expect(page.locator('#saveButton')).toBeEnabled();

  await page.locator('#saveButton').click();
  await page.waitForTimeout(2000);
  const saveDiagnostic = await page.evaluate(async () => {
    const records = await new Promise(resolve => {
      const request = indexedDB.open('eclat-library-loans', 1);
      request.onerror = () => resolve([]);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction('notebooks', 'readonly');
        const get = tx.objectStore('notebooks').getAll();
        get.onsuccess = () => resolve(get.result);
        get.onerror = () => resolve([]);
      };
    });
    return {
      formHidden: document.getElementById('loansForm').hidden,
      overviewHidden: document.getElementById('loansOverview').hidden,
      saveStatus: document.getElementById('saveStatus').textContent,
      saveDisabled: document.getElementById('saveButton').disabled,
      loanRows: document.querySelectorAll('#loansList .loan-row').length,
      storedRecords: records.length,
      storedPhotoKeys: Object.keys(records[0]?.photos?.[0] || {})
    };
  });
  console.log('ECLAT_SAVE_DIAGNOSTIC '+JSON.stringify(saveDiagnostic));
  await expect(page.locator('#loansForm')).toBeHidden({timeout: 28000});
  await expect(page.locator('#loansOverview')).toBeVisible();
  await expect(page.locator('#loansList .loan-row')).toHaveCount(1);
  await assertNoHorizontalOverflow(page);
});
