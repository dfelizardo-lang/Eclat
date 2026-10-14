const { test, expect } = require('@playwright/test');

test.use({ serviceWorkers: 'block', trace: 'off' });

test('ECL-TC-001 Charger accueil', async ({ page }) => {
  const origin = 'https://eclat-lecture.dfelizardo680502.chatgpt.site';
  const target = process.env.DS_BASE_URL || process.env.ECLAT_BASE_URL || origin;
  if (new URL(target).origin !== origin) {
    throw new Error('BASE_URL doit désigner le domaine Éclat autorisé.');
  }
  const token = process.env.ECLAT_SITES_TOKEN;
  if (!token) {
    throw new Error('Accès de test non configuré : ECLAT_SITES_TOKEN absent.');
  }
  await page.context().route('**/*', async route => {
    const request = route.request();
    const headers = { ...request.headers() };
    delete headers['oai-sites-authorization'];
    if (new URL(request.url()).origin === origin) {
      headers['OAI-Sites-Authorization'] = 'Bearer ' + token;
    }
    await route.continue({ headers });
  });
  const response = await page.goto(target, { waitUntil: 'domcontentloaded' });
  expect(response, 'Réponse de navigation absente').not.toBeNull();
  expect(response.status(), 'Éclat doit accepter la requête authentifiée').toBe(200);
  await expect(page).toHaveTitle(/Éclat/);
  await expect(page.locator('#adultBtn')).toBeVisible();
  await expect(page.locator('#childBtn')).toBeVisible();
  await expect(page.locator('#moodGrid button')).toHaveCount(6);
});
