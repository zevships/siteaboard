import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdir, mkdtemp, writeFile, readFile, symlink, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { request } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
// Runtime modules intentionally stay outside the browser TypeScript project.
// @ts-expect-error Server-only native Node module has no client declaration.
import { initDatabase, readWorkspace } from '../scripts/local-db.mjs';
// @ts-expect-error Server-only native Node module has no client declaration.
import { startLocalServer } from '../scripts/local-server.mjs';
import { demoWorkspace } from '../apps/admin/src/data/workspace.ts';
import type { WorkspaceDataset } from '../packages/core/src/workspace.ts';
import type { Server, IncomingHttpHeaders } from 'node:http';

async function fixture() {
  const base = resolve('.local/runtime-tests');
  await mkdir(base, { recursive: true });
  const dir = await mkdtemp(join(base, 'case-'));
  const dbPath = join(dir, 'workspace.sqlite');
  const distPath = join(dir, 'dist-local');
  await mkdir(distPath);
  await writeFile(join(distPath, 'index.html'), '<!doctype html><title>Local test</title>');
  await writeFile(join(distPath, 'app.js'), 'export const local = true;');
  await initDatabase(dbPath);
  return { dir, dbPath, distPath };
}
function rawRequest(port: number, path: string, headers: Record<string, string> = {}) {
  return new Promise<{ status: number; body: string; headers: IncomingHttpHeaders }>(
    (done, reject) => {
      const req = request({ hostname: '127.0.0.1', port, path, headers }, (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => done({ status: res.statusCode!, body, headers: res.headers }));
      });
      req.on('error', reject);
      req.end();
    },
  );
}
async function close(server: Server) {
  server.closeAllConnections();
  await new Promise<void>((done, reject) =>
    server.close((error) => (error ? reject(error) : done())),
  );
}

test('SQLite initialization is exclusive; read-only query returns replacement data and rejects unsupported schemas', async () => {
  const f = await fixture();
  try {
    const before = await readFile(f.dbPath);
    await assert.rejects(initDatabase(f.dbPath), { code: 'EEXIST' });
    assert.deepEqual(await readFile(f.dbPath), before);
    const data: WorkspaceDataset = await readWorkspace(f.dbPath);
    assert.equal(data.source, 'local');
    assert.equal(data.sites[0].provenance.quality, 'demo');
    const changed = structuredClone(demoWorkspace);
    changed.sites[0].name = 'Local replacement';
    changed.sites[0].daily.at(-1)!.visitors = null;
    const db = new DatabaseSync(f.dbPath);
    db.prepare('UPDATE workspace_snapshot SET payload = ? WHERE id = 1').run(
      JSON.stringify(changed),
    );
    db.close();
    const read = await readWorkspace(f.dbPath);
    assert.equal(read.sites[0].name, 'Local replacement');
    assert.equal(read.sites[0].daily.at(-1).visitors, null);
    const bad = new DatabaseSync(f.dbPath);
    bad.exec('PRAGMA user_version = 2');
    bad.close();
    await assert.rejects(readWorkspace(f.dbPath), /Unsupported/);
    await assert.rejects(readWorkspace(join(f.dir, 'missing.sqlite')));
  } finally {
    await rm(f.dir, { recursive: true, force: true });
  }
});

test('local HTTP enforces origin, host, fetch metadata, sessions, static paths and a read-only API', async () => {
  const f = await fixture();
  let server: Server | undefined;
  try {
    server = await startLocalServer({ ...f, port: 0 });
    const address = server!.address();
    assert.ok(address && typeof address !== 'string');
    assert.equal(address.address, '127.0.0.1');
    const port = address.port;
    const base = `http://127.0.0.1:${port}`;
    assert.equal((await fetch(base + '/api/workspace')).status, 401);
    const root = await rawRequest(port, '/');
    assert.equal(root.status, 200);
    const setCookie = root.headers['set-cookie']![0];
    assert.match(setCookie, /HttpOnly/);
    assert.match(setCookie, /SameSite=Strict/);
    const cookie = setCookie.split(';')[0];
    const api = await fetch(base + '/api/workspace', { headers: { Cookie: cookie } });
    assert.equal(api.status, 200);
    assert.equal(api.headers.get('access-control-allow-origin'), null);
    assert.equal(api.headers.get('cache-control'), 'no-store');
    assert.equal((await api.json()).source, 'local');
    for (const headers of [
      { Origin: 'https://unrelated.example' },
      { Origin: 'null' },
      { Host: `unrelated.example:${port}` },
      { 'Sec-Fetch-Site': 'cross-site' },
      { 'Sec-Fetch-Site': 'same-site' },
    ] as Record<string, string>[]) {
      assert.equal(
        (await rawRequest(port, '/api/workspace', { Cookie: cookie, ...headers })).status,
        403,
      );
    }
    assert.equal(
      (await rawRequest(port, '/api/workspace', { Cookie: 'siteaboard_local=' + 'é'.repeat(64) }))
        .status,
      401,
    );
    assert.equal(
      (await rawRequest(port, '/api/workspace', { Cookie: cookie, Origin: base })).status,
      200,
    );
    assert.equal(
      (await fetch(base + '/api/workspace', { method: 'POST', headers: { Cookie: cookie } }))
        .status,
      405,
    );
    for (const path of [
      '/../workspace.sqlite',
      '/%2e%2e/workspace.sqlite',
      '/assets/%2e%2e/index.html',
      '/%00',
      '/%5c..%5cworkspace.sqlite',
      '/.env',
    ])
      assert.equal((await rawRequest(port, path)).status, 400);
    await symlink(f.dbPath, join(f.distPath, 'leak.json'));
    assert.equal((await fetch(base + '/leak.json')).status, 403);
    assert.equal((await fetch(base + '/missing')).status, 404);
    assert.equal((await fetch(base + '/app.js')).status, 200);
    assert.equal(
      (await fetch(base + '/', { headers: { 'Sec-Fetch-Site': 'cross-site' } })).status,
      403,
    );
    const db = new DatabaseSync(f.dbPath);
    db.exec('DELETE FROM workspace_snapshot');
    db.close();
    const unavailable = await fetch(base + '/api/workspace', { headers: { Cookie: cookie } });
    assert.equal(unavailable.status, 503);
    assert.match(await unavailable.text(), /unavailable/);
  } finally {
    if (server) await close(server);
    await rm(f.dir, { recursive: true, force: true });
  }
});

test('the local service fails closed before listening on a missing or invalid database', async () => {
  const f = await fixture();
  try {
    await assert.rejects(
      startLocalServer({ dbPath: join(f.dir, 'missing.sqlite'), distPath: f.distPath, port: 0 }),
    );
    const db = new DatabaseSync(f.dbPath);
    db.prepare('UPDATE workspace_snapshot SET payload = ?').run('{"schemaVersion":1}');
    db.close();
    await assert.rejects(startLocalServer({ ...f, port: 0 }), /Invalid workspace field/);
  } finally {
    await rm(f.dir, { recursive: true, force: true });
  }
});
