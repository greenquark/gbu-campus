import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {mkdtemp, mkdir, writeFile, rm, symlink} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {startServer} from '../server.mjs';

const tempRoot = await mkdtemp(path.join(tmpdir(), 'campus-static-smoke-'));
const publicDir = path.join(tempRoot, 'dist');
let server;
const results = [];
function passed(name) { results.push(name); }
try {
  await mkdir(path.join(publicDir, 'night'), {recursive:true});
  await mkdir(path.join(publicDir, 'assets'));
  await mkdir(path.join(publicDir, 'src'));
  const script = 'console.log("campus");\n'.repeat(200);
  await Promise.all([
    writeFile(path.join(publicDir, 'index.html'), '<!doctype html><title>Day tour</title>'),
    writeFile(path.join(publicDir, 'night', 'index.html'), '<!doctype html><title>Night tour</title>'),
    writeFile(path.join(publicDir, 'assets', 'app.js'), script),
    writeFile(path.join(publicDir, 'assets', 'model.glb'), Buffer.from('glTF')),
    writeFile(path.join(publicDir, 'assets', 'sky.hdr'), '#?RADIANCE'),
    writeFile(path.join(publicDir, 'assets', 'type.woff2'), Buffer.from('wOF2')),
    writeFile(path.join(publicDir, '.env'), 'PRIVATE'),
    writeFile(path.join(publicDir, 'server.mjs'), 'PRIVATE'),
    writeFile(path.join(publicDir, 'src', 'private.js'), 'PRIVATE'),
    writeFile(path.join(publicDir, 'assets', 'app.js.map'), 'PRIVATE'),
    writeFile(path.join(tempRoot, 'outside.txt'), 'PRIVATE'),
  ]);
  let linked = false;
  try { await symlink(tempRoot, path.join(publicDir, 'leak'), process.platform === 'win32' ? 'junction' : 'dir'); linked = true; }
  catch (error) { if (!['EPERM','EACCES','ENOTSUP'].includes(error.code)) throw error; }
  server = await startServer({publicDir, port:0, host:'127.0.0.1'});
  const port = server.address().port;
  function request(target, method = 'GET', headers = {}) {
    return new Promise((resolve, reject) => {
      const req = http.request({host:'127.0.0.1',port,path:target,method,headers}, response => {
        const chunks = [];
        response.on('data', chunk => chunks.push(chunk));
        response.on('end', () => resolve({status:response.statusCode,headers:response.headers,body:Buffer.concat(chunks)}));
        response.on('error', reject);
      });
      req.on('error', reject); req.end();
    });
  }
  let response = await request('/');
  assert.equal(response.status, 200); assert.match(response.body.toString(), /Day tour/); passed('root serves daytime index');
  response = await request('/night?demo=1');
  assert.equal(response.status, 308); assert.equal(response.headers.location, '/night/?demo=1'); passed('night directory redirects with query intact');
  response = await request('/night/');
  assert.equal(response.status, 200); assert.match(response.body.toString(), /Night tour/); passed('night index is separate');
  response = await request('/assets/app.js', 'HEAD');
  assert.equal(response.status, 200); assert.equal(response.body.length, 0); assert.equal(Number(response.headers['content-length']), Buffer.byteLength(script)); passed('HEAD has GET metadata and no body');
  for (const target of ['/missing.js','/night/missing.js','/assets/','/missing/']) {
    response = await request(target); assert.equal(response.status, 404); assert.doesNotMatch(response.body.toString(), /Day tour|Night tour/);
  }
  passed('missing assets and directories return real 404 without SPA fallback');
  for (const target of ['/../outside.txt','/%2e%2e/outside.txt','/%2eenv','/assets/../.env','/assets%2f..%2f.env','/assets%5c..%5c.env','/.env','/server.mjs','/src/private.js','/assets/app.js.map','/assets/app.js::$DATA','/%00']) {
    response = await request(target); assert.equal(response.status, 404, target); assert.doesNotMatch(response.body.toString(), /PRIVATE/);
  }
  passed('traversal, dotfiles, source paths, maps, separators, and null bytes are denied');
  if (linked) { response = await request('/leak/outside.txt'); assert.equal(response.status, 404); passed('directory links cannot expose files outside dist'); }
  response = await request('/%zz'); assert.equal(response.status, 400); passed('malformed escapes are rejected');
  response = await request('/healthz'); assert.equal(response.status, 200); assert.deepEqual(JSON.parse(response.body), {ok:true});
  response = await request('/healthz','HEAD'); assert.equal(response.status, 200); assert.equal(response.body.length,0); passed('healthcheck supports GET and HEAD');
  response = await request('/', 'POST'); assert.equal(response.status,405); assert.equal(response.headers.allow,'GET, HEAD'); passed('unsupported methods return 405');
  for (const [target,type] of [['model.glb','model/gltf-binary'],['sky.hdr','image/vnd.radiance'],['type.woff2','font/woff2']]) {
    response = await request(`/assets/${target}`); assert.equal(response.headers['content-type'],type);
  }
  passed('3D, HDR, and font MIME types are correct');
  response = await request('/assets/app.js','GET',{'Accept-Encoding':'gzip'});
  assert.equal(response.headers['content-encoding'],'gzip'); assert.equal(gunzipSync(response.body).toString(),script);
  const gzipTag = response.headers.etag;
  response = await request('/assets/app.js','GET',{'Accept-Encoding':'gzip;q=0, *;q=1'});
  assert.equal(response.headers['content-encoding'],undefined); assert.equal(response.body.toString(),script); passed('startup gzip honors explicit gzip exclusion');
  response = await request('/assets/app.js','GET',{'Accept-Encoding':'gzip','If-None-Match':gzipTag});
  assert.equal(response.status,304); assert.equal(response.body.length,0); passed('conditional requests use encoding-specific ETags');
  assert.equal(response.headers['x-content-type-options'],'nosniff'); passed('content sniffing is disabled');
  console.log(JSON.stringify({pass:true,checks:results.length,results,symlinkTest:linked?'passed':'unavailable on this host'},null,2));
} finally {
  if (server) await new Promise(resolve => { server.close(resolve); server.closeIdleConnections(); });
  const resolved = path.resolve(tempRoot), temporaryParent = path.resolve(tmpdir());
  if (path.dirname(resolved) !== temporaryParent || !path.basename(resolved).startsWith('campus-static-smoke-')) throw new Error('Refusing cleanup outside the smoke-test temporary directory.');
  await rm(resolved, {recursive:true,force:true});
}
