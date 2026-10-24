# SiteAboard contributor instructions

Read README.md, docs/frontend.md, and docs/architecture.md before implementation.
The working application has a static synthetic demo and a read-only local SQLite
snapshot mode. Live connectors, the writer/scheduler, CLI and agent skills are
planned. Keep implementation status accurate. Read docs/local-data.md for the
implemented local boundary; never mix its bundle with the public demo.

## Work and verification

- Use Node 26 and pnpm 10.20.0; install with `pnpm install --frozen-lockfile`.
- Run `pnpm format:check` and `pnpm check` before committing. For UI changes,
  run `pnpm test:e2e` and inspect desktop/tablet/mobile light and dark screenshots.
- Format with `pnpm format`. Keep scratch outputs in ignored `.local/`.
- Update the relevant README and docs with behavior changes. Use synthetic fixtures
  and meaningful tests for contracts, navigation, preferences, and access boundaries.
- When workspace private-index commit tooling is available, use it and select only
  your files/hunks. Never stage unrelated work. A new repository may bootstrap an
  empty root commit before that tool can operate. Otherwise use explicit file paths.
- Before publishing, inspect the actual commit and built artifact, run
  `pnpm check:public`, and review `.claude/security-checklist.md`. Use a public Git
  author identity. Push and deploy only within the user's authorized scope.

## Frontend boundaries

- Follow the operations layout in docs/frontend.md: horizontal navigation, wide
  content, readable type, per-site metric groups, and compact operational lists.

- Each page has its own directory and default component under `apps/admin/src/pages`.
  Add its navigation metadata in `app/navigation.ts` and lazy import in `app/router.tsx`.
- Shared visual components receive data through props. Route/page components compose
  them. Keep metric definitions outside React, in `packages/core`.
- Public demo data belongs in `apps/admin/src/data/workspace.ts` and its `content.ts` fixture; never load private files.
  Fixtures must be visibly fictional and consistent across summaries and tables.
- Keep all copy bilingual: shared dictionary keys in `locales/en.ts` and `locales/zh-CN.ts`, site keys in `locales/site.ts`, or explicit Chinese/English pairs via `useI18n`. Format dates and
  numbers with the active locale. Reuse semantic CSS tokens for every theme and mode.
- Keep hash routing and the configurable Vite base working on GitHub Pages subpaths.
- Browser persistence holds only validated theme/mode/locale preferences; it must
  fail gracefully when storage is blocked. Preserve keyboard and mobile navigation.

## Product and data boundaries

- This repository builds independently. Never import sibling private repos, personal
  assets, machine-specific paths, production databases, or private Git history.
- The public demo is a static artifact with synthetic data, no analytics, external
  fonts, model calls, account connection, or management API. Deploy only its dist.
- Keep credentials, raw responses, screenshots, and user data out of Git and client
  bundles. Never send personal identifiers to external services without authorization
  for that particular send. Never log credentials, including during debugging.
- The current local runtime is read-only; future writes must use one coordinated writer. UI, CLI, and skills share
  core use cases. Connectors return normalized batches and never write the database.
- Preserve source, timezone, quality, and metric definition versions. Missing data is
  not zero; visits, visitors, events, and search clicks are distinct measures.
- Skills must use implemented public commands and report unsupported operations.
  Do not invent successful integrations or require agents to read credential values.

Unresolved implementation choices belong in docs/roadmap.md. Ship a small tested
vertical slice before adding integrations or additional runtime infrastructure.
