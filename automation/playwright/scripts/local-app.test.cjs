'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {startLocalApp}=require('../support/local-app.cjs');
test('two local Squash runs start current checkout servers on separate ports and stop only their own process',async()=>{
  const env={...process.env,ECLAT_LOCAL_TEST:'1',ECLAT_BASE_URL:'http://127.0.0.1:9'};
  delete env.ECLAT_USE_EXISTING_LOCAL_SERVER;
  const apps=[];
  try{
    apps.push(await startLocalApp({env}));apps.push(await startLocalApp({env}));
    assert.notEqual(apps[0].url,apps[1].url);assert.match(apps[0].sourceHash,/^[a-f0-9]{64}$/);
    assert.equal(apps[0].sourceHash,apps[1].sourceHash);assert.equal(env.ECLAT_BASE_URL,'http://127.0.0.1:9');
    for(const app of apps){
      const r=await fetch(app.url+'/emprunts.html/?probe=isolated',{redirect:'manual'});assert.equal(r.status,308);assert.equal(r.headers.get('location'),'/emprunts?probe=isolated');
      assert.equal((await fetch(app.url+'/api/catalogue')).status,200);
      for (const [route, marker] of [['/emprunts','id="loansOverview"'],['/emprunts-enfants','id="bookOverview"'],['/migration','id="exportData"'],['/narration-credits','Retour à l’Accueil']]) {
        const direct = await fetch(app.url+route);
        assert.equal(direct.status,200);
        assert.ok((await direct.text()).includes(marker),route+' must serve its own page');
        for (const suffix of ['/', '.html', '.html/']) {
          const alias = await fetch(app.url+route+suffix+'?probe=route',{redirect:'manual'});
          assert.equal(alias.status,308);
          assert.equal(alias.headers.get('location'),route+'?probe=route');
        }
      }
    }
    await apps[0].stop();assert.equal((await fetch(apps[1].url+'/migration.html')).status,200);
    await assert.rejects(fetch(apps[0].url,{signal:AbortSignal.timeout(2000)}));
  }finally{for(const app of apps)await app.stop();}
});
test('public runs and an explicit existing-local-server opt-out do not start or replace an application',async()=>{
  assert.equal(await startLocalApp({env:{ECLAT_LOCAL_TEST:'0'}}),null);
  assert.equal(await startLocalApp({env:{ECLAT_LOCAL_TEST:'1',ECLAT_USE_EXISTING_LOCAL_SERVER:'1'}}),null);
});
