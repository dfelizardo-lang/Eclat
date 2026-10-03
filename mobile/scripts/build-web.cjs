const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const out=path.resolve(__dirname,'../www');
const API='https://eclat-v1-sync-production.up.railway.app';
function build(){
 fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
 const assets=['child-narrator.js','accessible-navigation.js','comfort.js','comfort.css','responsive.css','accessible-contrast.css','library-loans.css','kids-loans.css','daily-themes-client.js','library-loans-client.js','library-loans-calendar.js','library-loans-navigation.js','library-news-client.js','library-loans-google.js','library-loans-form.js','kids-loans.js'];
 for(const name of assets)fs.copyFileSync(path.join(root,name),path.join(out,name));
 const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/reading-catalog.json'),'utf8'));
 fs.writeFileSync(path.join(out,'catalogue-snapshot.js'),'window.ECLAT_READING_CATALOG='+JSON.stringify(catalog).replace(/</g,'\\u003c')+';');
 const head='<script src="/comfort.js" defer></script><script src="/mobile-runtime.js"></script>';
 let home=fs.readFileSync(path.join(root,'eclat_v73_deployable.html'),'utf8').replace('/api/reading-catalog.js','/catalogue-snapshot.js');
 home=home.replace(/<\/head>/i,'<link rel="stylesheet" href="/accessible-contrast.css">'+head+'</head>');
 home=home.replace(/<\/body>/i,'<script src="/daily-themes-client.js"></script><script src="/library-loans-client.js"></script></body>');
 fs.writeFileSync(path.join(out,'index.html'),home);
 for(const name of ['emprunts.html','emprunts-enfants.html'])fs.writeFileSync(path.join(out,name),fs.readFileSync(path.join(root,name),'utf8').replace(/<\/head>/i,head+'</head>'));
 fs.copyFileSync(path.resolve(__dirname,'../mobile-runtime.js'),path.join(out,'mobile-runtime.js'));
 fs.writeFileSync(path.join(out,'build-info.json'),JSON.stringify({version:require('../package.json').version,api:API,catalogueWorks:catalog.works.length}));
 return out;
}
if(require.main===module)console.log('Assets Android : '+build());
module.exports={build,out,API};
