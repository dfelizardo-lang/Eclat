const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(__dirname+'/eclat_v73_deployable.html','utf8');
test('restored catalogue matches every frozen passage hash and identity',()=>{
 const catalog=require('./reading-catalog'),baseline=require('./automation/playwright/support/corpus-baseline.json');
 const ctx={window:{ECLAT_READING_CATALOG:catalog}};
 const start=html.indexOf('const WORKS='),end=html.indexOf('const PASSAGES=buildPassageIndex();',start)+'const PASSAGES=buildPassageIndex();'.length;
 vm.runInNewContext(html.slice(start,end)+';window.passages=PASSAGES;',ctx);
 const expected=new Map(baseline.passages.map(p=>[p.id,p]));
 assert.equal(ctx.window.passages.length,baseline.passages.length);
 for(const p of ctx.window.passages){const e=expected.get(p.id);assert.ok(e,p.id);for(const field of ['author','audience','workTitle','source'])assert.equal(p[field],e[field],p.id+' '+field);assert.equal(require('node:crypto').createHash('sha256').update(p.text).digest('hex'),e.textHash,p.id);expected.delete(p.id);}
 assert.equal(expected.size,0);
});
function node(){return {textContent:'',children:[],classList:{add(){},toggle(){}},style:{},append(...v){this.children.push(...v)},replaceChildren(){this.children=[]},setAttribute(){},removeAttribute(){},addEventListener(n,f){this[n]=f},focus(){},remove(){}};}
test('direct passage updates separate metadata and respects recent work history',()=>{
 const nodes=new Map();const get=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)};
 const ctx={window:{},document:{getElementById:get,createElement:node,body:{style:{}}},WORKS:[{title:'Œuvre',author:'Auteur',year:1887}],PASSAGES:[{id:'1',author:'Auteur',workTitle:'Œuvre',audience:'adult',text:'Texte',source:'https://example.org/'},{id:'2',author:'Auteur',workTitle:'Œuvre',audience:'adult',text:'Suite'},{id:'3',author:'Autre',workTitle:'Autre œuvre',audience:'adult',text:'Autre texte'}],seen:new Set(),stopReading(){},syncSaveButtonForPassage(){},updateSavedUI(){},rememberPassages(items){for(const p of items)this.seen.add(p.id)},passageIsEmbargoed(id){return ctx.seen.has(id)}};
 // Functions are evaluated in their real global lexical environment.
 ctx.rememberPassages=items=>items.forEach(p=>ctx.seen.add(p.id));
 const start=html.indexOf('function directPassage('),end=html.indexOf('\ndocument.getElementById("saveExcerpt")',start);
 vm.createContext(ctx);vm.runInContext(html.slice(start,end),ctx);
 ctx.directPassage(ctx.PASSAGES[0],'Titre');assert.equal(get('readerAuthor').textContent,'Auteur');assert.equal(get('readerWork').textContent,'Œuvre');assert.equal(get('readerYear').textContent,1887);
 assert.equal(ctx.alternate('work').id,'2');ctx.seen.add('2');assert.equal(ctx.alternate('work'),null);
 ctx.showWorkExhausted();const panel=get('readerDiscovery').children.at(-1);assert.match(panel.children[0].textContent,/Tous les passages disponibles/);panel.children[1].click();assert.equal(ctx.window.eclatCurrentPassage.id,'3');
});
function library(){
 const nodes=new Map(),get=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)};
 let mode='ok';const items=[...Array.from({length:21},(_,i)=>({id:'b'+i,kind:'book',title:'Livre '+i,url:'https://example.org/'+i})),{id:'n',kind:'news',title:'Actualité',url:'https://example.org/news'}];
 const stored={url:'https://example.org/',favorites:[],snapshot:null};const ctx={document:{getElementById:get,createElement:node,hidden:false},localStorage:{getItem:()=>JSON.stringify(stored),setItem(_k,v){Object.assign(stored,JSON.parse(v))}},fetch:async()=>{if(mode==='error')throw Error('Panne');return {ok:true,json:async()=>mode==='invalid'?{}:{checkedAt:'2030-01-01T12:00:00Z',items}}},URL,AbortController,setTimeout,clearTimeout,setInterval(){},EclatLoanViews:{show(){}}};
 vm.runInNewContext(fs.readFileSync(__dirname+'/library-news-client.js','utf8'),ctx);
 return {get,stored,setMode(value){mode=value}};
}
const flush=()=>new Promise(r=>setImmediate(r));
test('library caps books at twenty and offers retry without losing last results',async()=>{
 const app=library();await flush();
 function cards(n){return (n.className==='library-news-card'?1:0)+n.children.reduce((sum,c)=>sum+cards(c),0)}
 assert.equal(cards(app.get('libraryNewsResults')),21);assert.equal(app.stored.snapshot.items.length,22);
 for(const mode of ['error','invalid']){app.setMode(mode);await app.get('libraryRefresh').click();assert.equal(app.get('libraryRefresh').textContent,'Réessayer');assert.equal(cards(app.get('libraryNewsResults')),21);assert.equal(app.get('libraryRefresh').disabled,false);}
 app.setMode('ok');await app.get('libraryRefresh').click();assert.equal(app.get('libraryRefresh').textContent,'Actualiser');
});
