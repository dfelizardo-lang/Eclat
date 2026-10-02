const https=require('node:https');
const dns=require('node:dns').promises;
const net=require('node:net');
const crypto=require('node:crypto');
const ipaddr=require('ipaddr.js');
const cheerio=require('cheerio');
const cache=new Map();let inFlight=0;
function publicAddress(address){try{return ipaddr.process(address).range()==='unicast';}catch{return false;}}
function checkedUrl(input){
 const url=new URL(input);const host=url.hostname.replace(/^\[|\]$/g,'');
 if(input.length>2048 || url.protocol!=='https:' || url.username || url.password || (url.port && url.port!=='443') || net.isIP(host) || !host.includes('.') || /(^|\.)(localhost|local|internal|test|invalid|example)$/.test(host))throw new Error('Utilisez l’adresse HTTPS publique de votre bibliothèque.');
 url.hash='';return url;
}
async function download(input,redirects=0){
 const url=checkedUrl(input);let timer;let addresses;try{addresses=await Promise.race([dns.lookup(url.hostname,{all:true}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Le site de la bibliothèque ne répond pas.')),5000);})]);}finally{clearTimeout(timer);}
 if(!addresses.length || addresses.some(a=>!publicAddress(a.address)))throw new Error('Cette adresse ne correspond pas à un site public.');
 const chosen=addresses.find(a=>a.family===4)||addresses[0];
 const result=await new Promise((resolve,reject)=>{
  const req=https.get(url,{signal:AbortSignal.timeout(18000),headers:{'User-Agent':'Eclat/1.0 (library news reader)','Accept':'text/html,application/rss+xml,application/atom+xml,application/xml','Accept-Encoding':'identity'},lookup:(_host,opts,callback)=>opts.all?callback(null,[chosen]):callback(null,chosen.address,chosen.family)},res=>{
   if([301,302,303,307,308].includes(res.statusCode)){res.resume();return resolve({redirect:res.headers.location});}
   if(res.statusCode!==200){res.resume();return reject(new Error('Le site de la bibliothèque est momentanément inaccessible.'));}
   if(!/text\/html|application\/(rss\+xml|atom\+xml|xml|xhtml\+xml)|text\/xml/.test(res.headers['content-type']||'')){res.resume();return reject(new Error('Cette adresse ne fournit pas une page ou un flux lisible.'));}
   const chunks=[];let size=0;res.on('data',chunk=>{size+=chunk.length;if(size>12*1024*1024){req.destroy(new Error('La page de la bibliothèque est trop volumineuse.'));return;}chunks.push(chunk);});res.on('end',()=>resolve({url:url.href,body:Buffer.concat(chunks).toString('utf8')}));res.on('error',reject);
  });req.on('error',reject);
 });
 if(result.redirect){if(redirects>=3)throw new Error('Le site redirige trop de fois.');return download(new URL(result.redirect,url).href,redirects+1);}return result;
}
function safeLink(value,base){try{const u=new URL(value,base);if(u.protocol!=='https:' || u.username || u.password)return '';u.hash='';return u.href;}catch{return '';}}
function parsePage(body,url){
 const $=cheerio.load(body);
 const title=$('title').text();
 if($('altcha-widget').length || (/vérification de sécurité|security verification|just a moment/i.test(title) && /robot|captcha|altcha|human/i.test(body))){const error=new Error('Ce site exige une vérification humaine et bloque la récupération automatique. Ouvrez votre bibliothèque pour consulter ses nouveautés.');error.code='SITE_HUMAN_VERIFICATION';throw error;}
 $('script,style,noscript,.sr-only,.visually-hidden').remove();
 const clean=node=>$(node).text().replace(/\s+/g,' ').trim();const items=[];const seen=new Set();
 function add(title,href,kind,author='',type='',date=''){
  const source=safeLink(href,url);title=title.replace(/\s+/g,' ').trim().slice(0,250);if(!title || !source)return;
  const canonical=new URL(source);canonical.pathname=canonical.pathname.replace(/\/tri\/.*$/,'');for(const key of [...canonical.searchParams.keys()])if(/^(utm_|fbclid$|gclid$)/i.test(key))canonical.searchParams.delete(key);canonical.searchParams.sort();const key=canonical.href;if(seen.has(key))return;seen.add(key);
  items.push({id:crypto.createHash('sha256').update(key).digest('hex'),title,author:author.slice(0,160),kind,type:type.slice(0,80),date:date.slice(0,100),url:source});
 }
 // AFI/Orphée portals publish explicit novelty cards, including duplicate carousels.
 const cards=$('.card_template[data-novelties]').toArray().filter(c=>/^(oui|yes|true|1)$/i.test($(c).attr('data-novelties')||''));
 cards.sort((a,b)=>Number($(b).attr('data-typedoc')==='1')-Number($(a).attr('data-typedoc')==='1'));
 for(const card of cards){const c=$(card),type=clean(c.find('.record_doctype'));if(!/livre|texte|bande dessin|roman/i.test(type))continue;const a=c.find('.card_title a').first();add(clean(a),a.attr('href'),'book',clean(c.find('.card_subtitle')),type);if(items.filter(i=>i.kind==='book').length>=20)break;}
 $('.card_template[class*="Wrapper_Article"]').each((_,card)=>{const c=$(card),widget=c.closest('.widget'),heading=clean(widget.children('.widget-header'));if(heading && !/actualit|agenda|animation/i.test(heading))return;const a=c.find('.card_title a').first();add(clean(a),a.attr('href'),'news','', '',clean(c.find('.article_event_description')));});
 // Other portals: use explicit novelty/news section headings rather than guessing
 // that every navigation link is a new book.
 $('h1,h2,h3,[role="heading"]').each((_,heading)=>{
  const label=clean(heading);if(label.length>100 || !/nouveaut|nouveaux livres|dernières acquisitions|actualit|latest books|new books/i.test(label))return;
  const kind=/nouveaut|nouveaux livres|acquisitions|latest books|new books/i.test(label)?'book':'news';
  let group=$(heading).parent();for(let depth=0;depth<3 && !group.find('article,.book,.book-card,.news-card,.item,.card,li,h3 a,h4 a').length;depth++)group=group.parent();
  const nodes=group.find('article,.book,.book-card,.news-card,.item,.card,li').toArray();
  if(!nodes.length)nodes.push(...group.find('h3,h4').toArray());
  for(const entry of nodes.slice(0,60)){
   const c=$(entry);const a=c.find('h2 a,h3 a,h4 a,.title a,.entry-title a,a.title,a[itemprop="url"]').first();const link=a.length?a:c.is('a')?c:c.find('a[href]').first();
   const title=clean(c.find('h2,h3,h4,.title,.entry-title,[itemprop="name"]').first())||clean(link);
   if(title===label || /^(voir tout|en savoir|lire la suite|réserver|connexion)$/i.test(title))continue;
   add(title,link.attr('href'),kind,clean(c.find('.author,.auteur,.book-author,[itemprop="author"]').first()),kind==='book'?'Livre':'',c.find('time').first().attr('datetime')||clean(c.find('time').first()));
  }
 });
 if(!items.some(i=>i.kind==='news'))$('main article, .actualites article, .news-item, .news-card').each((_,card)=>{const c=$(card),a=c.find('h2 a,h3 a,.entry-title a').first();add(clean(a),a.attr('href'),'news','','',c.find('time').first().attr('datetime')||clean(c.find('time').first()));});
 if(!items.length)$('main h2 a,main h3 a,main .entry-title a').slice(0,20).each((_,a)=>add(clean(a),$(a).attr('href'),'news'));
 const feeds=[];$('link[rel="alternate"]').each((_,node)=>{const n=$(node);if(/rss|atom/.test(n.attr('type')||'')){const link=safeLink(n.attr('href'),url);if(link && new URL(link).origin===new URL(url).origin)feeds.push(link);}});
 return {name:clean($('title').first()).slice(0,180)||new URL(url).hostname,items:items.filter(i=>i.kind==='book').slice(0,20).concat(items.filter(i=>i.kind==='news').slice(0,12)),feeds:[...new Set(feeds)].slice(0,2)};
}
function parseFeed(body,url){
 const $=cheerio.load(body,{xmlMode:true});const items=[];const text=node=>cheerio.load('<div>'+$(node).text()+'</div>')('div').text().replace(/\s+/g,' ').trim();
 $('item,entry').slice(0,12).each((_,node)=>{const n=$(node),title=text(n.find('title').first()).slice(0,250),a=n.find('link').first(),link=safeLink(a.attr('href')||a.text(),url);if(title && link)items.push({id:crypto.createHash('sha256').update(link).digest('hex'),title,author:'',kind:'news',type:'',date:n.find('pubDate,published,updated').first().text().slice(0,100),url:link});});return items;
}
async function getNews(input,{refresh=false}={}){
 const url=checkedUrl(input).href;const cached=cache.get(url);if(!refresh && cached && Date.now()-cached.at<300000)return cached.value;
 if(inFlight>=4)throw new Error('Plusieurs bibliothèques sont en cours de consultation. Réessayez dans un instant.');inFlight++;
 try{const page=await download(url),parsed=parsePage(page.body,page.url);if(/<(rss|feed)[\s>]/i.test(page.body))parsed.items=parseFeed(page.body,page.url);
  if(!parsed.items.length)for(const feed of parsed.feeds){try{const f=await download(feed);parsed.items.push(...parseFeed(f.body,f.url));}catch{/* Keep the home page and its source link available. */}}
  const unique=[...new Map(parsed.items.map(i=>[i.id,i])).values()];const value={name:parsed.name,url:page.url,checkedAt:new Date().toISOString(),refreshSeconds:300,items:unique,message:unique.length?'':'Aucune actualité ou nouveauté lisible automatiquement sur cette page. Consultez le site de votre bibliothèque.'};
  if(cache.size>=100)cache.delete(cache.keys().next().value);cache.set(url,{at:Date.now(),value});return value;
 }finally{inFlight--;}
}
module.exports={getNews,parsePage,parseFeed,checkedUrl,publicAddress};
