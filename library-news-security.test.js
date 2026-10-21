const test = require('node:test');
const assert = require('node:assert/strict');
const https = require('node:https');
const dns = require('node:dns').promises;
const {EventEmitter} = require('node:events');
const {getNews} = require('./library-news');

// Exercise the real downloader without contacting public or private networks.
test('outbound library requests reject private DNS answers, redirects and rebinding', async t => {
  let addresses = [{address:'127.0.0.1',family:4}], calls = 0, redirect = null;
  t.mock.method(dns, 'lookup', async () => addresses);
  t.mock.method(https, 'get', (url, options, callback) => {
    calls++;
    const request = new EventEmitter();
    request.destroy = error => request.emit('error',error);
    process.nextTick(() => {
      options.lookup(url.hostname,{all:true},(error,resolved) => {
        assert.ifError(error);
        assert.deepEqual(resolved,[{address:'8.8.8.8',family:4}], 'connect only to the previously validated address');
      });
      const response = new EventEmitter();
      response.resume = () => {};
      response.statusCode = redirect ? 302 : 200;
      response.headers = redirect ? {location:redirect} : {'content-type':'text/html'};
      callback(response);
      if (!redirect) { response.emit('data',Buffer.from('<title>Bibliothèque</title>')); response.emit('end'); }
    });
    return request;
  });
  for (const address of ['127.0.0.1','10.0.0.1','169.254.169.254','::1','fc00::1','::ffff:127.0.0.1']) {
    addresses = [{address,family:address.includes(':')?6:4}];
    await assert.rejects(getNews('https://bibliotheque.fr/private',{refresh:true}), /site public/);
  }
  addresses = [{address:'8.8.8.8',family:4},{address:'192.168.0.1',family:4}];
  await assert.rejects(getNews('https://bibliotheque.fr/mixed',{refresh:true}), /site public/);
  assert.equal(calls,0,'no connection before all DNS answers pass validation');
  addresses = [{address:'8.8.8.8',family:4}];
  for (redirect of ['https://127.0.0.1/','https://localhost/','http://bibliotheque.fr/','file:///etc/passwd']) {
    await assert.rejects(getNews('https://bibliotheque.fr/redirect',{refresh:true}), /HTTPS publique/);
  }
  redirect = null;
  assert.equal((await getNews('https://bibliotheque.fr/pinned',{refresh:true})).name,'Bibliothèque');
});
