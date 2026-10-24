import { execFileSync } from 'node:child_process';
import { readFileSync, statSync, existsSync, readdirSync } from 'node:fs';
import { resolve, relative, extname, join } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const files = [
  ...new Set(
    execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
      cwd: root,
      encoding: 'utf8',
    })
      .split('\0')
      .filter(Boolean),
  ),
];
const findings = [];
const forbidden =
  /(^|\/)(\.local|\.env(?:\..*)?|node_modules|coverage|dist|test-results|playwright-report)(\/|$)|\.(db|sqlite3?|pem|key)(-|$)/;
const secrets = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b/,
  /\bgithub_pat_[A-Za-z0-9_]{40,}\b/,
  /\bAKIA[A-Z0-9]{16}\b/,
  /\bsk-[A-Za-z0-9_-]{32,}\b/,
  /(?:\/Users\/|\/home\/)[a-zA-Z0-9._-]+\//,
];
function inspect(path, publishedBuild = false) {
  const name = relative(root, path);
  if (!publishedBuild && forbidden.test(name) && !name.endsWith('.env.example'))
    findings.push(`${name}: forbidden source artifact`);
  const size = statSync(path).size;
  if (size > 1_000_000) findings.push(`${name}: review files over 1 MB before publishing`);
  if (!['.png', '.jpg', '.woff2', '.ico'].includes(extname(name))) {
    const text = readFileSync(path, 'utf8');
    for (const pattern of secrets)
      if (pattern.test(text))
        findings.push(`${name}: secret or machine-path pattern (value redacted)`);
  }
  if (publishedBuild && name.endsWith('.map')) findings.push(`${name}: public source map`);
}
for (const file of files)
  if (existsSync(resolve(root, file)) && statSync(resolve(root, file)).isFile())
    inspect(resolve(root, file));
function walk(dir) {
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, item.name);
    if (item.isDirectory()) walk(path);
    else inspect(path, true);
  }
}
const dist = resolve(root, 'apps/admin/dist');
if (existsSync(dist)) walk(dist);
if (findings.length) {
  console.error(findings.join('\n'));
  process.exitCode = 1;
} else
  console.log(
    `Public boundary check passed: ${files.length} source files${existsSync(dist) ? ' and demo build' : ''}.`,
  );
