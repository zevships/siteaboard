# Admin frontend

React, Vite and TanStack Router, with separate demo and local data builds. Run from
the repository root:

- `pnpm dev`, `pnpm build`, `pnpm preview`: synthetic static demo, output `dist/`.
- `pnpm build:local`: local API client, output `dist-local/`.
- `pnpm local --db .local/workspace.sqlite`: read-only local server on loopback.

Both outputs are ignored. Only `dist/` is published to GitHub Pages. Each global
route and each site tab is an independent lazy component. See
[frontend conventions](../../docs/frontend.md) and [local data](../../docs/local-data.md).
Live collection, writers, business CLI and agent skills remain future work.
