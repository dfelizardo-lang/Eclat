const { test, expect, target: siteTarget } = require("../support/site");

test.use({ serviceWorkers: "block", trace: "off" });

test("ECL-TC-001 Charger accueil", async ({ page }) => {
  const target = siteTarget();
  const response = await page.goto(target, { waitUntil: "domcontentloaded" });
  expect(response, "Réponse de navigation absente").not.toBeNull();
  expect(response.status(), "Éclat doit accepter la requête authentifiée").toBe(
    200,
  );
  await expect(page).toHaveTitle(/Éclat/);
  await expect(page.locator("h1:visible")).toHaveCount(1);
  await expect(page.locator("#adultBtn")).toBeVisible();
  await expect(page.locator("#childBtn")).toBeVisible();
  await expect(page.locator("#moodGrid button")).toHaveCount(6);
});
