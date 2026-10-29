'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const revision='c10ece1aade47bb51c153c893d14e5bf8e5b7117';
async function seed(origin,passages,out,request=fetch){
 const base=new URL(origin);
 if(base.protocol!=='https:'||base.username||base.password)throw Error('Invalid cache origin');
 async function bytes(url,max){
  const response=await request(url,{signal:AbortSignal.timeout(30000),redirect:'error'});
  if(!response.ok)throw Error('Cache HTTP '+response.status);
  const chunks=[];let size=0;
  for await(const chunk of response.body){size+=chunk.length;if(size>max)throw Error('Cache file too large');chunks.push(chunk);}
  return Buffer.concat(chunks);
 }
 const manifest=JSON.parse((await bytes(new URL('/api/narration',base),5e6)).toString('utf8'));
 if(manifest.engine!=='Piper 2023.11.14-2'||manifest.modelRevision!==revision)return {};
 const tasks=[];
 for(const p of passages){const cached=manifest.passages?.[p.id];if(cached?.digest!==p.digest||cached?.textHash!==p.textHash)continue;
  for(const kind of ['female','male']){const a=cached.voices?.[kind];if(a&&/^[a-f0-9]{64}$/.test(a.sha256)&&a.url==='/api/narration/audio/'+a.sha256+'/'+kind+'.mp3'&&Number.isInteger(a.bytes)&&a.bytes>0&&a.bytes<=2e6)tasks.push({id:p.id,kind,a});}
 }
 const result={};let index=0;
 async function worker(){while(index<tasks.length){const {id,kind,a}=tasks[index++];try{
  const data=await bytes(new URL(a.url,base),2e6);
  if(data.length!==a.bytes||crypto.createHash('sha256').update(data).digest('hex')!==a.sha256)continue;
  const folder=path.join(out,a.sha256);await fs.mkdir(folder,{recursive:true});await fs.writeFile(path.join(folder,kind+'.mp3'),data);
  (result[id]||={})[kind]=a;
 }catch{/* Missing or invalid cache entries are generated locally instead. */}}}
 await Promise.all(Array.from({length:6},worker));return result;
}
module.exports={seed};
if(require.main===module){const {inputs}=require('./narration-input.cjs');seed(process.env.NARRATION_SEED_URL,inputs(),process.env.NARRATION_OUTPUT||path.resolve(__dirname,'../narration')).then(value=>process.stdout.write(JSON.stringify(value))).catch(error=>{console.error(error.message);process.exitCode=1;});}
