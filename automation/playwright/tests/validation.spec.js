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

test('ECL-VAL-ADULTE ouverture et fermeture du formulaire', async ({ page }) => {
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

  await page.locator('#borrowAgain').fill('Validation Playwright');
  await page.locator('#cancelLoan').click();
  await expect(page.locator('#loansForm')).toBeHidden();
  await expect(page.locator('#loansOverview')).toBeVisible();

  await assertNoHorizontalOverflow(page);
});
