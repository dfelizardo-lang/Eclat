const test=require('node:test'),assert=require('node:assert/strict');const {parsePage,parseFeed,checkedUrl,publicAddress}=require('./library-news');
test('only public HTTPS hosts can be fetched, including after redirects',()=>{
 for(const url of ['http://site.fr','https://127.0.0.1','https://[::1]','https://user:pass@site.fr','https://site.fr:444','https://localhost','https://host.local'])assert.throws(()=>checkedUrl(url));
 for(const ip of ['127.0.0.1','10.1.2.3','169.254.169.254','172.16.0.1','192.168.1.1','::1','fc00::1','::ffff:127.0.0.1'])assert.equal(publicAddress(ip),false,ip);assert.equal(publicAddress('8.8.8.8'),true);
});
test('portal cards are deduplicated, only books count as books and source titles stay intact',()=>{
 const book='<div class="card_template" data-novelties="Oui" data-typedoc="1"><div class="card_title"><a href="/book/1"><span class="sr-only">Voir le document </span>Un livre &amp; ses secrets</a></div><div class="record_doctype">Livres</div><div class="card_subtitle">Une autrice</div></div>';
 const disc=book.replace('Livres','Disques').replace('/book/1','/disc/1');
 const page='<title>Ma médiathèque</title>'+book+book+disc+'<div class="widget"><div class="widget-header">Actualités</div><div class="card_template card_Wrapper_Article"><div class="card_title"><a href="/news/2">Rencontre</a></div></div></div><script>alert(1)</script>';
 const x=parsePage(page,'https://bibliotheque.fr/');assert.equal(x.items.length,2);assert.equal(x.items[0].title,'Un livre & ses secrets');assert.equal(x.items[0].author,'Une autrice');assert.equal(x.items[0].url,'https://bibliotheque.fr/book/1');assert.equal(x.items[1].kind,'news');
});
test('RSS and Atom keep source links and reject executable URLs',()=>{
 const rss='<rss><channel><item><title>Une actualité</title><link>https://bibliotheque.fr/news</link><pubDate>2026-10-03</pubDate></item><item><title>Piège</title><link>javascript:alert(1)</link></item></channel></rss>';assert.equal(parseFeed(rss,'https://bibliotheque.fr/').length,1);
 const atom='<feed><entry><title>Rencontre</title><link href="https://bibliotheque.fr/agenda"/><updated>2026-10-03</updated></entry></feed>';assert.equal(parseFeed(atom,'https://bibliotheque.fr/')[0].url,'https://bibliotheque.fr/agenda');
});

test('any public portal can expose novelty sections with distinct query-based notices',()=>{
 const page='<main><section><h2>Nos nouveautés</h2><article><h3><a href="/?notice=1">Premier livre</a></h3><p class="author">Autrice A</p></article><article><h3><a href="/?notice=2">Deuxième livre</a></h3><p class="auteur">Auteur B</p></article></section><section><h2>Actualités</h2><article><h3><a href="/rencontre">Rencontre lecture</a></h3></article></section></main>';
 const x=parsePage(page,'https://autre-bibliotheque.fr/');assert.equal(x.items.filter(i=>i.kind==='book').length,2);assert.equal(x.items.find(i=>i.title==='Premier livre').author,'Autrice A');assert.equal(x.items.find(i=>i.title==='Rencontre lecture').kind,'news');assert.notEqual(x.items[0].id,x.items[1].id);
});

test('the novelty list never exceeds twenty books',()=>{
 const cards=Array.from({length:35},(_,i)=>'<article><h3><a href="/book/'+i+'">Livre '+i+'</a></h3></article>').join('');
 const parsed=parsePage('<main><section><h2>Nouveautés</h2>'+cards+'</section></main>','https://bibliotheque.fr/');assert.equal(parsed.items.filter(i=>i.kind==='book').length,20);
});

test('a human verification page is a blocked source rather than an empty catalogue',()=>{
 assert.throws(()=>parsePage('<title>Vérification de sécurité</title><altcha-widget></altcha-widget><p>Je ne suis pas un robot</p>','https://bibliotheque.fr/'),e=>e.code==='SITE_HUMAN_VERIFICATION');
 const ordinary=parsePage('<title>Aucune nouveauté</title><main>Aucun livre</main>','https://bibliotheque.fr/');assert.equal(ordinary.items.length,0);
});
