const {expect,go,home,comfort,adultForm,childForm}=require('./site');
async function checkResponsive(page,info){
 for(const path of ['/','/emprunts.html','/emprunts-enfants.html','/migration.html']){
  await go(page,path);await expect(page.locator('h1')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),path+' déborde').toBe(true);
  info.annotations.push({type:'navigation-ms',description:path+': '+await page.evaluate(()=>Math.round(performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd))});
 }
 await adultForm(page);await page.locator('#returnDate').fill('2020-01-01');await expect(page.locator('#saveButton')).toBeVisible();
 await childForm(page);await page.locator('#bookTitle').fill('Livre');await page.locator('#bookAuthor').fill('Auteur');await page.locator('#saveBook').click();await expect(page.locator('#bookForm')).toBeHidden();
 await home(page);await comfort(page);await page.locator('[data-setting=simple]').check();await page.locator('[data-close]').click();
 await expect(page.locator('#libraryNearby')).toBeVisible();await expect(page.locator('#libraryLoansLink')).toBeVisible();
 await page.locator('#moodGrid button').first().click();await expect(page.locator('#readerText')).not.toHaveText('');await expect(page.locator('#listenToggle')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
}
module.exports={checkResponsive};
