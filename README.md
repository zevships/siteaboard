# SiteAboard · 站舱

**Bring your sites aboard.** An open-source workspace for website operations,
designed to run on your machine and work with your existing coding agent.

[Live demo](https://zevships.github.io/siteaboard/) · [简体中文](README.zh-CN.md) ·
[Architecture](docs/architecture.md) · [Roadmap](docs/roadmap.md)

SiteAboard is for independent makers building for a global audience. The goal is to
bring traffic, search, changes, and follow-ups into one local workspace, then help an
agent act through a shared CLI and reusable skills. The source is free under MIT.

## Available now

This first release is a **static frontend foundation with fictional data**:

- Six independently loaded pages: Overview, Sites, Search, Activity, Connections,
  and Guides. Connections and guides preview the planned workflows.
- Three color themes (Ocean, Harbor, Sunset), light/dark/system appearance, and
  English/Simplified Chinese. Preferences stay in your browser.
- Responsive navigation, keyboard controls, an accessible chart data table, and
  working 7/30-day demo views.
- GitHub Pages deployment and automated type, contract, publication, and browser checks.

The local database, real data connectors, tracking receiver, CLI, and agent skills are
**not implemented yet**. The demo cannot connect accounts or manage real sites. It
ships no telemetry, external fonts, or AI API calls. GitHub still serves the page and
may process normal hosting request logs under its own policies.

## Run locally

Requirements: **Node.js 26.x** and **pnpm 10.20.0**.

```sh
git clone https://github.com/zevships/siteaboard.git
cd siteaboard
pnpm install --frozen-lockfile
pnpm dev
```

Open http://127.0.0.1:4310. No account, API key, database, or adjacent repository is
needed. This currently runs the static demo locally, not the planned local service.

```sh
pnpm format:check
pnpm check
pnpm exec playwright install chromium
pnpm test:e2e
pnpm build
pnpm preview
```

Browser tests build and preview at `/siteaboard/`, including mobile navigation,
language/theme persistence, deep-link refresh, and unavailable browser storage.
Screenshots and traces are written to ignored `.local/`.

## Project layout

```text
apps/
  admin/                 Working static dashboard
    src/
      app/               Routes and navigation registry
      pages/             One independent component directory per page
      components/        Shared layout, UI, and dashboard components
      providers/         Locale and theme state
      locales/           English and Simplified Chinese dictionaries
      styles/            Semantic tokens, themes, and responsive layout
      data/              Fictional demo fixtures
      lib/               Browser-safe preference utilities
  cli/                   Planned CLI boundary
packages/
  core/                  Browser-safe contracts; future domain/runtime/storage
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
complements manual review and is not a complete security audit. The local backend
and its access controls remain future work.

A local dashboard cannot receive public website events while your computer is
offline. The planned tracking path needs an existing website backend or optional
receiver; third-party hosting/API charges are separate from this free source code.

## Contributing

Start with [AGENTS.md](AGENTS.md), [frontend conventions](docs/frontend.md), and the
[roadmap](docs/roadmap.md). Keep new pages modular, both languages complete, and
all themes accessible. [CLAUDE.md](CLAUDE.md) points to the same contributor rules.

## License

[MIT](LICENSE). No internal project history or personal datasets are distributed.
