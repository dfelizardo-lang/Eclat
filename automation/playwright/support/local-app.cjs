'use strict';
const path=require('node:path');
const fs=require('node:fs');
const {fork,execFile}=require('node:child_process');
const {promisify}=require('node:util');
const run=promisify(execFile);
async function startLocalApp({root=path.resolve(__dirname,'../../..'),env=process.env}={}){
  if(env.ECLAT_LOCAL_TEST!=='1'||env.ECLAT_USE_EXISTING_LOCAL_SERVER==='1')return null;
  for(const name of ['express','cheerio','ipaddr.js']){
    try{require.resolve(name,{paths:[root]});}
    catch{await run('npm',['ci','--ignore-scripts','--no-audit','--no-fund'],{cwd:root,timeout:180000});break;}
  }
  const port=Number(env.ECLAT_LOCAL_PORT||32173);
  const child=fork(path.join(root,'server.js'),[],{cwd:root,env:{...env,PORT:String(port)},stdio:['ignore','pipe','pipe','ipc']});
  let output='';
  for(const stream of [child.stdout,child.stderr])stream.on('data',data=>{output=(output+data.toString()).slice(-5000);});
  async function stop(){
    if(child.exitCode!==null||child.signalCode!==null)return;
    await new Promise(resolve=>{const timer=setTimeout(()=>child.kill('SIGKILL'),5000);child.once('exit',()=>{clearTimeout(timer);resolve();});child.kill('SIGTERM');});
  }
  let ready;
  try{
    ready=await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('Le serveur du checkout ne démarre pas : '+output)),30000);
      child.once('error',e=>{clearTimeout(timer);reject(e);});
      child.once('exit',code=>{clearTimeout(timer);reject(new Error('Serveur interrompu ('+code+') : '+output));});
      const accept=message=>{if(message?.type==='eclat-ready'&&Number.isInteger(message.port)){clearTimeout(timer);resolve(message);}};
      child.on('message',accept);
      child.stdout.on('data',()=>{if(output.includes('http://localhost:'+port)){clearTimeout(timer);resolve({type:'eclat-ready',port});}});
    });
    const url='http://127.0.0.1:'+ready.port;
    const response=await fetch(url+'/migration.html',{signal:AbortSignal.timeout(15000)});
    if(response.status!==200)throw new Error('Précontrôle du serveur du checkout : HTTP '+response.status);
    const crypto=require('node:crypto');const hash=crypto.createHash('sha256');
    for(const file of ['server.js','eclat_v73_deployable.html','library-loans-form.js','comfort.css'])hash.update(fs.readFileSync(path.join(root,file)));
    return {url,sourceHash:hash.digest('hex'),stop};
  }catch(error){await stop();throw error;}
}
async function globalSetup(){
  const app=await startLocalApp();if(!app)return;
  process.env.ECLAT_BASE_URL=app.url;
  process.env.ECLAT_TEST_BUILD=app.sourceHash;
  console.log('Éclat testé depuis le checkout Squash : '+app.url+' ; source SHA-256 '+app.sourceHash);
  return app.stop;
}
module.exports=globalSetup;
module.exports.startLocalApp=startLocalApp;
