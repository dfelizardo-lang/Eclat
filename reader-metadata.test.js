const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('direct reading replaces author, work, year and source when changing works',()=>{
 const html=fs.readFileSync(__dirname+'/eclat_v73_deployable.html','utf8');const start=html.indexOf('function directPassage('),end=html.indexOf('\n}\n',start)+2;assert.ok(start>0&&end>start);
 const nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'ancienne métadonnée',style:{},classList:{add(){}},removeAttribute(){},setAttribute(){},remove(){},addEventListener(){}});return nodes.get(id);};
 const context={window:{},WORKS:[{title:'Œuvre A',author:'Auteur A',year:'1887'},{title:'Œuvre B',author:'Auteur B',year:'1902'}],document:{getElementById:node,body:{style:{}}},stopReading(){},rememberPassages(){},syncSaveButtonForPassage(){},updateSavedUI(){}};
 vm.runInNewContext(html.slice(start,end),context);
 for(const letter of ['A','B']){const p={id:letter,author:'Auteur '+letter,workTitle:'Œuvre '+letter,text:'Texte de test',source:'https://example.org/'+letter};context.directPassage(p,'Lecture');assert.equal(node('readerAuthor').textContent,p.author);assert.equal(node('readerWork').textContent,p.workTitle);assert.equal(node('readerYear').textContent,letter==='A'?'1887':'1902');assert.equal(node('readerSource').href,p.source);}
});
