const { defineConfig, devices } = require('@playwright/test');
const devtools=require('./devtools-devices.json');
module.exports=defineConfig({
 testDir:__dirname+'/devices-tests',timeout:45000,expect:{timeout:10000},workers:2,retries:0,
 reporter:[['list'],['html',{outputFolder:'devices-report',open:'never'}]],
 use:{serviceWorkers:'block',trace:'off',video:'off',locale:'fr-FR',timezoneId:'Europe/Paris'},
 projects:[...devtools.profiles.map(({name,...device})=>({name:'F12 '+name,use:{...device,browserName:'chromium'}})),...Object.entries(devices).map(([name,device])=>({name:'Playwright '+name,use:{...device,browserName:device.defaultBrowserType||'chromium'}}))]
});
