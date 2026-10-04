// Package the existing service's public recordings; no TTS account or runtime API.
const fs=require('node:fs');const path=require('node:path');const crypto=require('node:crypto');
const {inputs}=require('../../scripts/narration-input.cjs');
const API='https://eclat-v1-sync-production.up.railway.app';
const out=path.resolve(__dirname,'../www/narration');
async function download(){
 let manifest;const expected=inputs();
 for(let attempt=0;attempt<40;attempt++){
  try{const r=await fetch(API+'/api/narration',{signal:AbortSignal.timeout(20000)});if(!r.ok)throw new Error('Narration non déployée');
   const m=await r.json();if(!expected.every(p=>m.passages[p.id]?.digest===p.digest))throw new Error('Déploiement du catalogue attendu');manifest=m;break;
  }catch(e){if(attempt===39)throw e;await new Promise(r=>setTimeout(r,15000))}
 }
 fs.mkdirSync(out,{recursive:true});
 for(const p of expected)for(const kind of ['female','male']){
  const record=manifest.passages[p.id],audio=record.voices[kind];
  if(!audio||!/^\/api\/narration\/audio\/[a-f0-9]{64}\/(female|male)\.mp3$/.test(audio.url))throw new Error('Audio invalide');
  const r=await fetch(API+audio.url,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw new Error('Téléchargement audio impossible');
  const bytes=Buffer.from(await r.arrayBuffer());
  if(bytes.length!==audio.bytes||crypto.createHash('sha256').update(bytes).digest('hex')!==audio.sha256)throw new Error('Audio incomplet');
  const folder=path.join(out,audio.sha256);fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,kind+'.mp3'),bytes);
 }
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest));
 console.log('Android : deux voix locales pour '+expected.length+' lectures enfants');
}
if(require.main===module)download().catch(e=>{console.error(e);process.exitCode=1});
module.exports={download};
