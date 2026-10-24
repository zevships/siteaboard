# SiteAboard · 站舱

**Bring your sites aboard.** An open-source workspace for website operations,
designed to run on your machine and work with your existing coding agent.

[Live demo](https://zevships.github.io/siteaboard/) · [简体中文](README.zh-CN.md) ·
[Architecture](docs/architecture.md) · [Roadmap](docs/roadmap.md)

SiteAboard is for independent makers building for a global audience. The goal is to
bring traffic, search, changes, and follow-ups into one local workspace, then help an
agent act through a shared CLI and reusable skills. The source is free under MIT.

## Available now

The public demo uses **fictional data only**. The same dashboard can also read a
versioned snapshot from a local SQLite database:

- A per-site home dashboard with hourly comparisons, previous-week charts, search,
  issues, attention items, and task status.
- Seven site sections: overview, performance, feedback, returning visitors, search,
  issues, and releases. Each section is its own lazy component.
- Six date ranges, keyboard/pointer chart tooltips and data tables, filters,
  related issues, expandable release comparisons, task history and coverage.
- Content workspace: creator filters, avatar strip, media wall/feed/roster, saved posts,
  knowledge entities and account summaries with synthetic artwork.
- Home through the brand; five top-level tabs: Sites, Content, Improvements, Tasks, Playbooks.
  Search stays inside each site.
- Three color palettes, light/dark/system modes, English/Chinese, responsive
  navigation, and reduced-motion support.
- A read-only loopback service with an authenticated same-origin API and strict
  snapshot validation. [Local data guide](docs/local-data.md).

Real connectors, the tracking receiver, scheduler/writer, CLI, and agent skills
are **not implemented yet**. Task buttons and content save/intake controls simulate in-memory UI states only and are disabled
in read-only local mode. No external service is called. The public app has no
telemetry, external fonts, or AI calls; GitHub may retain normal hosting logs.

## Run locally

Requirements: **Node.js 26.x** and **pnpm 10.20.0**.

```sh
git clone https://github.com/zevships/siteaboard.git
cd siteaboard
pnpm install --frozen-lockfile
pnpm dev
```

Open http://127.0.0.1:4310. No account, API key, database, or adjacent repository is
needed. This command runs the static demo. To use your own database snapshot:

```sh
pnpm db:init --db .local/workspace.sqlite
pnpm build:local
pnpm local --db .local/workspace.sqlite
```

Open http://127.0.0.1:4312. Initialization refuses to overwrite existing files.
The sample database is synthetic; replace its versioned snapshot following the
[contract and import guide](docs/local-data.md), rather than pointing at an
arbitrary existing database. Live collection is a later milestone.

```sh
pnpm format:check
pnpm check
pnpm exec playwright install chromium
pnpm test:e2e
pnpm build
pnpm preview
```

Browser tests cover desktop, tablet, and mobile. They build and preview at `/siteaboard/`, including mobile navigation,
language/theme persistence, deep-link refresh, and unavailable browser storage.
Screenshots and traces are written to ignored `.local/`.

## Project layout

```text
apps/
  admin/                 Dashboard (demo and local data)
    src/
      app/               Routes and navigation registry
      pages/             One independent component directory per page
      components/        Shared layout, UI, and dashboard components
      providers/         Locale, themes, and data boundary
      locales/           English and Simplified Chinese dictionaries
      styles/            Semantic tokens, themes, and responsive layout
      data/              Fictional demo fixtures
      lib/               Browser-safe preference utilities
  cli/                   Planned CLI boundary
packages/
  core/                  Validated contracts and pure queries; future writer/runtime
  connectors/            Planned external source adapters
skills/                  Planned agent workflows
examples/                Synthetic examples only
docs/                    Product, architecture, frontend, and deployment guides
tests/                   Contract and desktop/mobile browser checks
```

The root package currently owns frontend dependencies and scripts. Placeholder
modules are not yet independently installable packages. To add a page, follow
[the frontend guide](docs/frontend.md).

## Deployment and privacy

The default branch deploys only `apps/admin/dist` through GitHub Actions. Pull
requests run checks without deploying. See [deployment setup](docs/deployment.md)
for Pages settings and fork-specific base paths.

Never commit credentials, private datasets, real account identifiers, or local
artifacts. `pnpm check:public` checks source and built output for common leaks; it
complements manual review and is not a complete security audit. The local bundle
(`apps/admin/dist-local`) is separate, ignored, and never deployed to Pages.

A local dashboard cannot receive public website events while your computer is
offline. The planned tracking path needs an existing website backend or optional
receiver; third-party hosting/API charges are separate from this free source code.

## Contributing

Start with [AGENTS.md](AGENTS.md), [frontend conventions](docs/frontend.md), and the
[roadmap](docs/roadmap.md). Keep new pages modular, both languages complete, and
all themes accessible. [CLAUDE.md](CLAUDE.md) points to the same contributor rules.

## License

[MIT](LICENSE). No internal project history or personal datasets are distributed.
