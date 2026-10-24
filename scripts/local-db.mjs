import { DatabaseSync } from 'node:sqlite';
import { open, mkdir, stat, unlink } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { validateWorkspace } from '../packages/core/src/workspace.ts';

export const MAX_SNAPSHOT_BYTES = 8 * 1024 * 1024;
export const schemaSql = `
  PRAGMA user_version = 1;
  CREATE TABLE workspace_snapshot (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    schema_version INTEGER NOT NULL CHECK (schema_version = 1),
    payload TEXT NOT NULL CHECK (json_valid(payload))
  ) STRICT;
`;
export async function initDatabase(filename, workspace) {
  if (typeof filename !== 'string' || !filename) throw new Error('A database path is required');
  if (!workspace) {
    const { demoWorkspace } = await import('../apps/admin/src/data/workspace.ts');
    workspace = { ...demoWorkspace, source: 'local' };
  }
  validateWorkspace(workspace);
  const payload = JSON.stringify(workspace);
  if (Buffer.byteLength(payload) > MAX_SNAPSHOT_BYTES)
    throw new Error('Snapshot exceeds the size limit');
  const path = resolve(filename);
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  // Atomic exclusive creation prevents replacing any existing user file.
  const file = await open(path, 'wx', 0o600);
  await file.close();
  let db;
  try {
    db = new DatabaseSync(path);
    db.exec(schemaSql);
    db.prepare('INSERT INTO workspace_snapshot(id, schema_version, payload) VALUES (1, 1, ?)').run(
      payload,
    );
  } catch (error) {
    db?.close();
    db = undefined;
    await unlink(path);
    throw error;
  } finally {
    db?.close();
  }
  return path;
}
export async function readWorkspace(filename) {
  if (typeof filename !== 'string' || !filename) throw new Error('A database path is required');
  const path = resolve(filename);
  const info = await stat(path);
  if (!info.isFile() || info.size > MAX_SNAPSHOT_BYTES * 2)
    throw new Error('Invalid database file');
  const db = new DatabaseSync(path, { readOnly: true });
  try {
    db.exec('PRAGMA trusted_schema = OFF; PRAGMA query_only = ON;');
    const version = db.prepare('PRAGMA user_version').get();
    if (version.user_version !== 1) throw new Error('Unsupported local database schema');
    const table = db
      .prepare("SELECT type FROM sqlite_schema WHERE name = 'workspace_snapshot'")
      .get();
    if (table?.type !== 'table') throw new Error('Missing workspace snapshot table');
    const row = db
      .prepare(
        'SELECT schema_version, length(CAST(payload AS BLOB)) AS bytes FROM workspace_snapshot WHERE id = 1',
      )
      .get();
    if (!row || row.schema_version !== 1 || row.bytes > MAX_SNAPSHOT_BYTES)
      throw new Error('Invalid workspace snapshot');
    const payload = db.prepare('SELECT payload FROM workspace_snapshot WHERE id = 1').get().payload;
    const workspace = JSON.parse(payload);
    validateWorkspace(workspace);
    // This describes the transport, not measurement quality. Site provenance is untouched.
    return { ...workspace, source: 'local' };
  } finally {
    db.close();
  }
}
function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    if (process.argv[2] !== 'init' || !argument('--db'))
      throw new Error('Usage: node scripts/local-db.mjs init --db <new-file.sqlite>');
    await initDatabase(argument('--db'));
    console.log('Created a local SQLite database with synthetic sample data.');
  } catch (error) {
    console.error(
      error?.code === 'EEXIST'
        ? 'Database already exists; nothing was overwritten.'
        : 'Database initialization failed. Check the command, directory permissions, and schema.',
    );
    process.exitCode = 1;
  }
}
