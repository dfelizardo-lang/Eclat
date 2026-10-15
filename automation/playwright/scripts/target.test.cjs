const test=require('node:test'),assert=require('node:assert/strict');
const {target,production}=require('../support/target.cjs');
test('explicit local mode overrides a public Squash dataset without needing a Sites token',()=>{
 assert.equal(target({ECLAT_LOCAL_TEST:'1',ECLAT_BASE_URL:'http://127.0.0.1:3000',DS_BASE_URL:production}),'http://127.0.0.1:3000');
 assert.equal(target({ECLAT_LOCAL_TEST:'1',DS_BASE_URL:production}),'http://127.0.0.1:3000');
});
test('normal execution preserves Squash dataset precedence and requires the site secret',()=>{
 assert.equal(target({DS_BASE_URL:production,ECLAT_BASE_URL:'http://localhost:3000',ECLAT_SITES_TOKEN:'test-only'}),production);
 assert.throws(()=>target({DS_BASE_URL:production}),/ECLAT_SITES_TOKEN absent/);
});
test('local mode cannot redirect tests and credentials to an external host',()=>{
 for(const url of ['http://192.168.1.2:3000','https://example.com','https://eclat-lecture.dfelizardo680502.chatgpt.site','http://localhost.example.com'])assert.throws(()=>target({ECLAT_LOCAL_TEST:'1',ECLAT_BASE_URL:url}),/mode local/);
 assert.throws(()=>target({ECLAT_BASE_URL:'http://127.0.0.1:3000'}),/explicitement/);
 assert.throws(()=>target({ECLAT_LOCAL_TEST:'1',ECLAT_BASE_URL:'http://name:secret@localhost:3000'}),/sans identifiants/);
});
