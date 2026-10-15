const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('the browser caps an oversized API fixture at 20 books and keeps news separate',async()=>{
 function node(tag='div'){return {tag,children:[],events:{},textContent:'',append(...children){this.children.push(...children);},replaceChildren(){this.children=[];},setAttribute(){},addEventListener(type,fn){this.events[type]=fn;},focus(){}};}
 const nodes=new Map();const get=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);};
 const items=Array.from({length:21},(_,i)=>({id:'book-'+i,kind:'book',title:'Livre '+i,url:'https://library.org/book/'+i})).concat({id:'news',kind:'news',title:'Actualité',url:'https://library.org/news'});
 const payload={checkedAt:'2026-10-15T12:00:00Z',items};
 const ctx={URL,AbortController,setTimeout,clearTimeout,setInterval(){},document:{getElementById:get,createElement:node},localStorage:{getItem(){return JSON.stringify({url:'https://library.org/',favorites:[],snapshot:payload});},setItem(){}},EclatLoanViews:{show(){}},fetch:async()=>({ok:true,json:async()=>JSON.parse(JSON.stringify(payload))})};
 vm.runInNewContext(fs.readFileSync(__dirname+'/library-news-client.js','utf8'),ctx);get('libraryWatchOpen').events.click();await new Promise(resolve=>setImmediate(resolve));
 const cards=[];function visit(n){if(n.className==='library-news-card')cards.push(n);for(const child of n.children||[])visit(child);}visit(get('libraryNewsResults'));
 assert.equal(cards.length,21);const labels=cards.map(c=>c.children[0].textContent);assert.equal(labels.filter(x=>x==='Livre').length,20);assert.equal(labels.filter(x=>x==='Actualité').length,1);
});
