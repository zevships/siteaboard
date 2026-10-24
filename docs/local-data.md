# Read your own local database

The public GitHub Pages build always uses fictional fixtures. A separate local build
can now read a **versioned SQLite snapshot** through a loopback-only, read-only Node
service. This is the first data adapter, not a scheduler, analytics receiver, account
connector, or a general-purpose adapter for arbitrary SQLite tables.

## Start with a safe example

Requirements: Node.js 26.x and the repository's pnpm version. From the repository:

```sh
node scripts/local-db.mjs init --db .local/workspace.sqlite
pnpm build:local
node scripts/local-server.mjs --db .local/workspace.sqlite
```

Open http://127.0.0.1:4312 directly. The initializer creates a new database containing
only synthetic data. It refuses to overwrite any existing file. The file is created
with mode `0600`; new parent directories use `0700` subject to OS semantics. `.local/`
is ignored by Git. Native file permissions and browser/server behavior were tested
on macOS; Linux and Windows are not yet verified.

The local build is `apps/admin/dist-local`, separate from the public `dist` output.
The UI obtains its snapshot from `/api/workspace`. The server validates the database
at startup and reopens it read-only for each API request. After replacing a snapshot,
reload the browser to see it. Invalid or missing data produces an explicit failure;
the server never falls back to fictional data or silently turns missing values into
zeroes. Stop the service with Ctrl+C. Use `--port <port>` to change its loopback port.

## Snapshot schema

SQLite `PRAGMA user_version` must be `1`. The single snapshot table is:

```sql
CREATE TABLE workspace_snapshot (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  schema_version INTEGER NOT NULL CHECK (schema_version = 1),
  payload TEXT NOT NULL CHECK (json_valid(payload))
) STRICT;
```

`payload` is a JSON `WorkspaceDataset` from
[`packages/core/src/workspace.ts`](../packages/core/src/workspace.ts). The table must
contain row `id = 1`, with `schema_version = 1`. Payloads are limited to 8 MiB and the
database file to 16 MiB. This bounded snapshot format is intended for an initial
local dashboard; larger stores need a future query adapter, not a raised limit by
accident. Additional fields and unknown schema versions are rejected so a changed
producer cannot silently change the UI's metric definitions.

An existing analytics database needs an explicit local transformation into this
contract. It cannot simply be renamed to `workspace.sqlite`. Keep your original
store separate and write a new SiteAboard snapshot; do not run the initializer
against your existing analytics file.

A local producer can validate and replace the row in one transaction. For example,
save this producer script locally, outside published source, and pass it the two
local paths (snapshot JSON first, SiteAboard database second):

```js
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { validateWorkspace } from './packages/core/src/workspace.ts';

const snapshot = JSON.parse(readFileSync(process.argv[2], 'utf8'));
validateWorkspace(snapshot);
const db = new DatabaseSync(process.argv[3]);
try {
  db.exec('BEGIN IMMEDIATE');
  db.prepare('UPDATE workspace_snapshot SET payload = ? WHERE id = 1').run(
    JSON.stringify(snapshot),
  );
  db.exec('COMMIT');
} finally {
  db.close();
}
```

The example assumes execution from the repository root and a root-relative import.
A producer stored under `.local/` must adjust the import to `../packages/core/src/workspace.ts`.
Check the row exists and the schema version before adapting this example into a
production producer. Keep one writer, retain a backup, and never log its payload.
The included HTTP service exposes no write endpoint.

## Definitions that matter

- `source` identifies the transport: `synthetic` in the public demo and `local` when
  served from SQLite. Site `provenance` remains authoritative about whether its
  readings are `demo`, `measured`, or `partial`; opening the sample database does not
  turn synthetic numbers into measurements.
- Every site carries its own reporting timezone, last complete date, capture time,
  source name, definition version, visitor definition, and funnel definition.
- Daily `visitors` are unique within a reporting day. Adding dates gives
  **visitor-person-days**, not unique people across the selected period. `visits`,
  `pageviews`, event participants, event counts, and search clicks are separate.
- Hourly visitors are disjoint **first-seen visitors within that day**. A normal
  hourly unique-visitors report is not interchangeable with these bins. The current
  hour in both today and yesterday arrays stops at the same minute: the site-local
  minute of `time.fetchedAt`. The fixture is captured at 17:30 UTC: hour 17 represents
  17:00–17:30 on both days. Later today bins are null; later yesterday bins show the
  full historical reference. Therefore the complete yesterday daily total comes
  from `daily`, not by adding this comparison array. `todayGoals` and
  `yesterdayGoals` use the same cutoff.
- `querySite(site, 'today')` compares only supported same-cut visitors and goals.
  Other today metrics are unavailable (`null`), not extrapolated from older days.
- `'7d'` and `'30d'` end at `dataThrough`; `'month'` is month-to-date through the last
  complete reporting date (on the first day of a new month, this is the previous
  reporting month). `'all'` begins at the earliest stored day. Each comparison spans
  the preceding equally long date window; missing historical dates stay null.
- Each breakdown dimension must partition the relevant daily measure. Do not add
  country and device records together. Search position is a per-row average; any
  aggregation must be weighted by impressions. Search clicks are not visitors.
- LCP and INP use milliseconds; CLS is unitless. Performance records hold a separate
  p75 for each date, path and device. Do not average those percentiles into a claimed
  period p75. Samples and errors are counts; missing metrics can remain null.
- The supplied event steps are **independent event participant counts**, explicitly
  labeled in provenance. Their ratios are not an ordered user conversion funnel.
  A producer using `ordered-session-funnel` must supply genuinely ordered counts
  and maintain consistent populations. Event table `events` records multiplicity;
  `visitors` records participants. They are not interchangeable.
- `null` means missing; `0` means measured zero. An aggregate containing a missing
  day stays missing. Empty detail arrays mean no supplied records, not evidence of
  zero traffic or zero errors. No private identifiers or credentials are needed for
  this contract; only put data in the local snapshot that you want visible locally.

## Local access boundary

The service binds **127.0.0.1 only**. It checks the exact Host and port, Origin, and
Fetch Metadata; cross-site and same-site-but-not-same-origin requests are rejected.
A direct dashboard navigation establishes a random process-lifetime `HttpOnly`,
`SameSite=Strict` session cookie. API reads require it. The token is never placed in
URLs, JavaScript storage, logs, or the built artifact. No CORS headers are sent.
Responses disable caching and external resources; files cannot escape the static
build directory, and symlinked files are rejected. The API accepts GET/HEAD only.

This boundary prevents accidental cross-site browser reads and public network
exposure. It does not isolate other software running as your OS user, a malicious
browser extension, or a compromised machine. No external account keys are used.
Do not expose this service through a public tunnel or deploy `dist-local` to Pages.
Only `apps/admin/dist` belongs in a public deployment.

## Verification

`node --test tests/workspace.test.ts tests/local-runtime.test.ts` checks exact period
windows, same-cut comparisons, dimension/source reconciliation, missing data, strict
schema validation, exclusive initialization, real database replacement, read-only
API behavior, Host/Origin/Fetch Metadata/session checks, malformed cookies, path
traversal, symlinks, and failure without demo fallback. Browser tests separately
check the rendered local UI. Fixture tests prove consistency, not the accuracy of a
third-party producer: each adapter must verify its own measurement semantics.

## 内容运营快照

`WorkspaceDataset` v1 新增可选 `content` 字段，契约在
`packages/core/src/content.ts`：分类、创作者、帖子、知识实体、账号摘要及采集费用。
旧快照省略该字段仍可读取，内容运营页明确显示尚无内容数据；字段存在时严格
校验结构、时间、数值和关联 ID。当前展示内置图形预览，不接受远程媒体 URL。
公开演示的收藏、标记和录入仅驻留页面内存，本地模式禁用这些写操作，不修改 SQLite。
