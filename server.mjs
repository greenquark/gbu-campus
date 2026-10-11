import http from 'node:http';
import {readFile, readdir, realpath, lstat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';

const DEFAULT_DIST = fileURLToPath(new URL('./dist/', import.meta.url));
const MIME = new Map(Object.entries({
  '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8', '.webmanifest':'application/manifest+json; charset=utf-8',
  '.svg':'image/svg+xml', '.txt':'text/plain; charset=utf-8', '.xml':'application/xml; charset=utf-8',
  '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp',
  '.avif':'image/avif', '.gif':'image/gif', '.ico':'image/x-icon', '.hdr':'image/vnd.radiance',
  '.glb':'model/gltf-binary', '.gltf':'model/gltf+json', '.bin':'application/octet-stream',
  '.woff':'font/woff', '.woff2':'font/woff2', '.ttf':'font/ttf', '.otf':'font/otf',
  '.mp3':'audio/mpeg', '.ogg':'audio/ogg', '.wav':'audio/wav', '.m4a':'audio/mp4',
  '.mp4':'video/mp4', '.webm':'video/webm', '.wasm':'application/wasm', '.pdf':'application/pdf',
}));
const PRIVATE_NAMES = new Set(['src','tools','node_modules','old','server.mjs','package.json',
  'package-lock.json','railway.json','dockerfile','vite.config.js','vite.config.mjs']);
const TEXT = /^(text\/|application\/(json|manifest\+json|xml)|image\/svg\+xml|model\/gltf\+json)/;

function contained(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

function publicPath(value) {
  if (!value.startsWith('/') || /[\\:\u0000-\u001f\u007f]/.test(value)) return false;
  return value.split('/').every(segment => !segment.startsWith('.') && !PRIVATE_NAMES.has(segment.toLowerCase()));
}

function acceptsGzip(header) {
  let wildcard = false;
  for (const entry of String(header || '').split(',')) {
    const [coding, ...parameters] = entry.trim().toLowerCase().split(';');
    let q = 1;
    for (const parameter of parameters) if (parameter.trim().startsWith('q=')) {
      const quality = Number(parameter.trim().slice(2)); q = Number.isFinite(quality) ? quality : 0;
    }
    if (coding === 'gzip') return q > 0;
    if (coding === '*') wildcard = q > 0;
  }
  return wildcard;
}

async function loadBuild(directory) {
  const root = path.resolve(directory);
  const rootInfo = await lstat(root);
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) throw new Error('A regular dist directory is required.');
  const realRoot = await realpath(root), files = new Map();
  async function visit(current, prefix = '') {
    for (const entry of await readdir(current, {withFileTypes:true})) {
      const url = `${prefix}/${entry.name}`;
      if (!publicPath(url) || entry.isSymbolicLink()) continue;
      const filename = path.resolve(current, entry.name);
      if (!contained(root, filename) || !contained(realRoot, await realpath(filename))) continue;
      if (entry.isDirectory()) { await visit(filename, url); continue; }
      const type = MIME.get(path.extname(entry.name).toLowerCase());
      if (!entry.isFile() || !type) continue;
      const body = await readFile(filename);
      const hash = createHash('sha256').update(body).digest('base64url').slice(0, 24);
      const compressed = TEXT.test(type) && body.length >= 256 ? gzipSync(body, {level:6}) : null;
      files.set(url, {body, type, etag:`"${hash}"`, gzip:compressed && compressed.length < body.length ? compressed : null});
    }
  }
  await visit(root);
  if (!files.has('/index.html') || !files.has('/night/index.html')) {
    throw new Error('Build both the daytime tour and /night/ before starting the server.');
  }
  return {root, files};
}

// Load only the completed build. Requests never read project files from disk.
export async function createStaticServer({publicDir = DEFAULT_DIST} = {}) {
  const {root, files} = await loadBuild(publicDir);
  const server = http.createServer((request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    function status(code, message, extra = {}) {
      const body = Buffer.from(`${message}\n`);
      response.writeHead(code, {'Content-Type':'text/plain; charset=utf-8','Content-Length':body.length,
        'Cache-Control':'no-store', ...extra});
      response.end(request.method === 'HEAD' ? undefined : body);
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') return status(405, 'Method not allowed', {Allow:'GET, HEAD'});
    if (!request.url?.startsWith('/')) return status(400, 'Bad request');
    let pathname;
    const queryAt = request.url.indexOf('?'), rawPath = queryAt < 0 ? request.url : request.url.slice(0, queryAt);
    try { pathname = decodeURIComponent(rawPath); }
    catch { return status(400, 'Bad request'); }
    if (!publicPath(pathname) || !contained(root, path.resolve(root, `.${pathname}`))) return status(404, 'Not found');
    if (pathname === '/healthz') {
      const body = Buffer.from('{"ok":true}\n');
      response.writeHead(200, {'Content-Type':'application/json; charset=utf-8','Content-Length':body.length,'Cache-Control':'no-store'});
      return response.end(request.method === 'HEAD' ? undefined : body);
    }
    if (!pathname.endsWith('/') && files.has(`${pathname}/index.html`)) {
      const location = pathname.split('/').map(encodeURIComponent).join('/') + '/' + (queryAt < 0 ? '' : request.url.slice(queryAt));
      return status(308, 'Directory moved', {Location:location});
    }
    const key = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
    const file = files.get(key);
    if (!file) return status(404, 'Not found');
    const compressed = file.gzip && acceptsGzip(request.headers['accept-encoding']);
    const body = compressed ? file.gzip : file.body;
    const etag = compressed ? `${file.etag.slice(0,-1)}-gzip"` : file.etag;
    response.setHeader('Content-Type', file.type);
    response.setHeader('Cache-Control', file.type.startsWith('text/html') ? 'no-cache' : 'public, max-age=3600');
    response.setHeader('ETag', etag);
    response.setHeader('Vary', 'Accept-Encoding');
    if (compressed) response.setHeader('Content-Encoding', 'gzip');
    const tags = String(request.headers['if-none-match'] || '').split(',').map(value => value.trim().replace(/^W\//,''));
    if (tags.includes(etag) || tags.includes('*')) { response.writeHead(304); return response.end(); }
    response.setHeader('Content-Length', body.length);
    response.writeHead(200);
    response.end(request.method === 'HEAD' ? undefined : body);
  });
  server.requestTimeout = 30_000;
  server.headersTimeout = 15_000;
  server.keepAliveTimeout = 5_000;
  return server;
}

export async function startServer({publicDir = DEFAULT_DIST, port = 5190, host = '0.0.0.0'} = {}) {
  const server = await createStaticServer({publicDir});
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => { server.off('error', reject); resolve(); });
  });
  return server;
}

async function main() {
  const port = process.env.PORT === undefined ? 5190 : Number(process.env.PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer from 1 to 65535.');
  const server = await startServer({port, host:process.env.HOST || '0.0.0.0'});
  // No request URLs, environment values, or filesystem paths are written to logs.
  console.log('Campus experience is ready.');
  let stopping = false;
  const stop = () => {
    if (stopping) return;
    stopping = true;
    const deadline = setTimeout(() => { server.closeAllConnections(); process.exit(0); }, 8_000);
    deadline.unref();
    server.close(() => { clearTimeout(deadline); process.exit(0); });
    server.closeIdleConnections();
  };
  process.once('SIGTERM', stop);
  process.once('SIGINT', stop);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(() => { console.error('Campus startup failed. Check the completed build and port configuration.'); process.exitCode = 1; });
}
