const {test,expect,home}=require('../support/site');
test('PWA aide installation et annulation sans modifier les données locales',async({page})=>{
 await home(page);
 await expect(page.locator('link[rel=manifest]')).toHaveAttribute('href','/manifest.webmanifest');
 const before=await page.evaluate(()=>({...localStorage}));
 await page.getByRole('button',{name:'Installer Éclat',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Éclat sur votre écran d’accueil'});
 await expect(dialog).toBeVisible();await expect(dialog).toContainText('Une connexion reste nécessaire');
 await page.keyboard.press('Escape');await expect(dialog).toBeHidden();await expect(page.locator('#eclat-install')).toBeFocused();
 await page.evaluate(()=>{const event=new Event('beforeinstallprompt',{cancelable:true});event.prompt=async()=>{};event.userChoice=Promise.resolve({outcome:'dismissed'});dispatchEvent(event);});
 await page.locator('#eclat-install').click();await page.locator('#install-confirm').click();
 await expect(page.locator('#install-status')).toContainText('Installation annulée');
 expect(await page.evaluate(()=>({...localStorage}))).toEqual(before);
});
