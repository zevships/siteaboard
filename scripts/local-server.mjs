import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { readWorkspace } from './local-db.mjs';

const defaultDist = fileURLToPath(new URL('../apps/admin/dist-local/', import.meta.url));
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
};
export async function startLocalServer({ dbPath, distPath = defaultDist, port = 4312 } = {}) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid local port');
  // Fail before listening; never substitute demo data after a database failure.
  await readWorkspace(dbPath);
  const root = await realpath(resolve(distPath));
  const indexFile = resolve(root, 'index.html');
  if ((await realpath(indexFile)) !== indexFile)
    throw new Error('Symlinked static files are not supported');
  await stat(indexFile);
  const token = randomBytes(32).toString('hex');
  const server = createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    );
    const send = (status, message, type = 'text/plain; charset=utf-8') => {
      response.writeHead(status, { 'Content-Type': type });
      response.end(message);
    };
    const address = server.address();
    const allowedHosts = new Set([`127.0.0.1:${address.port}`, `localhost:${address.port}`]);
    const host = request.headers.host;
    if (
      !allowedHosts.has(host) ||
      (request.headers.origin && request.headers.origin !== `http://${host}`) ||
      (request.headers['sec-fetch-site'] &&
        !['same-origin', 'none'].includes(request.headers['sec-fetch-site']))
    )
      return send(403, 'Local access only');
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.setHeader('Allow', 'GET, HEAD');
      return send(405, 'Read-only service');
    }
    let pathname;
    try {
      pathname = decodeURIComponent((request.url ?? '/').split('?')[0]);
    } catch {
      return send(400, 'Invalid path');
    }
    if (
      !pathname.startsWith('/') ||
      pathname.includes('\\') ||
      pathname.includes('\0') ||
      pathname.split('/').some((part) => part === '..' || part === '.' || part.startsWith('.'))
    )
      return send(400, 'Invalid path');
    if (pathname === '/api/workspace') {
      const cookie =
        (request.headers.cookie ?? '')
          .split(';')
          .map((part) => part.trim())
          .find((part) => part.startsWith('siteaboard_local='))
          ?.slice('siteaboard_local='.length) ?? '';
      if (
        !/^[a-f0-9]{64}$/.test(cookie) ||
        !timingSafeEqual(Buffer.from(cookie), Buffer.from(token))
      )
        return send(401, 'Open the local dashboard to establish a session');
      try {
        const workspace = await readWorkspace(dbPath);
        return send(
          200,
          request.method === 'HEAD' ? '' : JSON.stringify(workspace),
          'application/json; charset=utf-8',
        );
      } catch {
        return send(
          503,
          JSON.stringify({
            error: 'Local data unavailable. Check database schema and contents, then retry.',
          }),
          'application/json; charset=utf-8',
        );
      }
    }
    if (pathname.startsWith('/api/')) return send(404, 'Unknown API route');
    const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + sep)) return send(400, 'Invalid path');
    try {
      const actual = await realpath(file);
      if (actual !== file || !actual.startsWith(root + sep))
        return send(403, 'Static path not allowed');
      const info = await stat(actual);
      if (!info.isFile()) return send(404, 'File not found');
      const type = mimeTypes[extname(actual)];
      if (!type) return send(404, 'File type not served');
      if (file === indexFile) {
        if (request.headers['sec-fetch-mode'] && request.headers['sec-fetch-mode'] !== 'navigate')
          return send(403, 'Open the local dashboard directly');
        response.setHeader(
          'Set-Cookie',
          `siteaboard_local=${token}; HttpOnly; SameSite=Strict; Path=/`,
        );
      }
      return send(200, request.method === 'HEAD' ? '' : await readFile(actual), type);
    } catch {
      return send(404, 'File not found');
    }
  });
  server.requestTimeout = 10000;
  server.headersTimeout = 10000;
  server.maxHeadersCount = 30;
  await new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolveListen);
  });
  return server;
}
function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const dbPath = argument('--db');
    if (!dbPath) throw new Error('A database path is required');
    const server = await startLocalServer({
      dbPath,
      port: argument('--port') ? Number(argument('--port')) : 4312,
    });
    console.log(`SiteAboard local dashboard: http://127.0.0.1:${server.address().port}`);
  } catch {
    console.error(
      'Local startup failed. Check --db, the schema, and the local build. No demo fallback was used.',
    );
    process.exitCode = 1;
  }
}
