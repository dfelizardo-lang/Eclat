const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const path=require('node:path');
function inputs(root=path.resolve(__dirname,'..')){
 const html=fs.readFileSync(path.join(root,'eclat_v73_deployable.html'),'utf8');
 const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/reading-catalog.json'),'utf8'));
 const from=html.indexOf('const WORKS=');
 const marker='const PASSAGES=buildPassageIndex();';
 const end=html.indexOf(marker,from)+marker.length;
 if(from<0||end<marker.length)throw new Error('Index de lecture absent');
 const ctx={window:{ECLAT_READING_CATALOG:catalog}};
 vm.runInNewContext(html.slice(from,end)+'\nresult=PASSAGES;',ctx,{timeout:1000});
 return Array.from(ctx.result).filter(p=>p.audience==='child').map(p=>{
  const work=catalog.works.find(w=>w.id===p.workId)||catalog.works.find(w=>w.title===p.workTitle&&w.author===p.author);
  const credits='Ce passage est extrait de '+p.workTitle+'. De '+p.author+'.'+(work?.year?' Publié en '+work.year+'.':'');
  const text=p.text+'\n\n'+credits;
  return {id:p.id,text,digest:crypto.createHash('sha256').update('piper-2023.11.14-2:siwis:tom:1.10:0.35:'+text).digest('hex'),textHash:crypto.createHash('sha256').update(p.text).digest('hex'),workId:work.id,source:p.source};
 });
}
if(require.main===module)process.stdout.write(JSON.stringify(inputs()));
module.exports={inputs};
