const test=require('node:test'),assert=require('node:assert/strict');
const {target,production,legacy,headersFor}=require('../support/target.cjs');
test('public domain works without a token as default or explicit Squash dataset',()=>{
 assert.equal(target({}),production);assert.equal(target({DS_BASE_URL:production}),production);
 assert.equal(target({ECLAT_LOCAL_TEST:'0',ECLAT_BASE_URL:production}),production);
 assert.equal(target({DS_BASE_URL:legacy}),legacy);
});
test('explicit local mode overrides a public dataset and requires loopback',()=>{
 assert.equal(target({ECLAT_LOCAL_TEST:'1',ECLAT_BASE_URL:'http://127.0.0.1:3000',DS_BASE_URL:production}),'http://127.0.0.1:3000');
 assert.equal(target({ECLAT_LOCAL_TEST:'1',DS_BASE_URL:production}),'http://127.0.0.1:3000');
 for(const url of ['http://192.168.1.2:3000','https://example.com',production,'http://localhost.example.com'])assert.throws(()=>target({ECLAT_LOCAL_TEST:'1',ECLAT_BASE_URL:url}),/mode local/);
 assert.throws(()=>target({ECLAT_BASE_URL:'http://127.0.0.1:3000'}),/explicitement/);
});
test('dataset precedence is explicit and unknown origins and embedded credentials are rejected',()=>{
 assert.equal(target({DS_BASE_URL:legacy,ECLAT_BASE_URL:production}),legacy);
 for(const url of ['https://eclatsclassiques.com.evil.example','http://eclatsclassiques.com','https://name:secret@eclatsclassiques.com','ftp://eclatsclassiques.com'])assert.throws(()=>target({DS_BASE_URL:url}));
});
test('no bypass token is required or sent to the public domain or third parties',()=>{
 const headers={'OAI-Sites-Authorization':'old',accept:'text/html'};
 assert.deepEqual(headersFor(production,headers,{DS_BASE_URL:production,ECLAT_SITES_TOKEN:'test-only'}),{accept:'text/html'});
 assert.deepEqual(headersFor(legacy,headers,{DS_BASE_URL:legacy}),{accept:'text/html'});
 assert.equal(headersFor(legacy,headers,{DS_BASE_URL:legacy,ECLAT_SITES_TOKEN:'test-only'})['OAI-Sites-Authorization'],'Bearer test-only');
 for(const url of [production,'https://example.com','http://127.0.0.1:3000'])assert.deepEqual(headersFor(url,headers,{DS_BASE_URL:legacy,ECLAT_SITES_TOKEN:'test-only'}),{accept:'text/html'});
 assert.equal(headers['OAI-Sites-Authorization'],'old');
});

test('www production is accepted from Squash while lookalikes and unsafe schemes stay rejected',()=>{
 assert.equal(production,'https://www.eclatsclassiques.com');
 assert.equal(target({DS_BASE_URL:'https://www.eclatsclassiques.com',ECLAT_BASE_URL:'https://eclatsclassiques.com'}),production);
 assert.equal(target({DS_BASE_URL:'https://eclatsclassiques.com'}),'https://eclatsclassiques.com');
 for(const url of ['https://www.eclatsclassiques.com.evil.example','http://www.eclatsclassiques.com','https://user:secret@www.eclatsclassiques.com'])assert.throws(()=>target({DS_BASE_URL:url}));
 const headers={'OAI-Sites-Authorization':'old',accept:'text/html'};
 assert.deepEqual(headersFor(production,headers,{DS_BASE_URL:production,ECLAT_SITES_TOKEN:'test-only'}),{accept:'text/html'});
});
