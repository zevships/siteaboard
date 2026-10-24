# Frontend conventions

React 19, TypeScript, Vite and TanStack Router. The public hash-routed SPA is a
synthetic demo; the separate local build reads a read-only SQLite snapshot through
`providers/workspace.tsx`. See [local data](local-data.md).

## Components and data

- Global pages each have a directory in `apps/admin/src/pages`, registered in
  `app/navigation.ts` and lazy loaded from `app/router.tsx`.
- Home is the brand link. Top-level navigation is Sites, Content, Improvements, Tasks,
  Playbooks. The old `/connections` bookmark redirects to `/tasks`; `/search` redirects
  to the first site’s search section.
- Content lives in `pages/content`, with scoped `styles/content.css` and an optional
  validated `WorkspaceDataset.content`. No content in a local snapshot means an
  empty view, never demo fallback. Demo save/intake state is in-memory and resets
  on page remount; filtering is currently page-local rather than URL-persisted.
- Site tabs live in `pages/sites/sections`: overview, performance, feedback,
  returning, search, issues and releases. Site/tab/period stay in the URL.
- Shared charts live in `components/reference`, homepage groups in
  `components/operations`. Shared components accept props; pages consume
  `useWorkspace`. Never import fixtures inside view components.
- `packages/core/src/workspace.ts` defines and validates DTOs, adjacent comparison
  windows and null-preserving queries. Public fixtures live in `data/workspace.ts` and `data/content.ts`.
  The content contract and cross-reference validator live in `core/src/content.ts`.
- Missing metrics remain unavailable. Visitor-days, sessions, events and search
  clicks stay distinct. Aggregate event stages do not establish ordered conversion.

## Appearance

`reference.css` preserves the compact operational geometry, neutral surfaces,
chart colors, keyboard tooltips, hover behavior, chart growth and status animations.
`polish.css` adds palette accents and surface refinement, a subtle contour motif, and cool dark surfaces without changing density.
`site-sections.css` contains page-specific extensions. Do not copy decorative
marketing layouts into the dashboard or introduce a permanent sidebar.

`data-theme` selects ocean/harbor/sunset; `data-mode` selects light/dark. System mode
listens for OS changes. Preference storage is validated and gracefully handles blocked
storage. The prepaint script shares its whitelist. No data or credentials persist
in browser storage. Reduced-motion covers elements and pseudo-elements.

All user copy has Chinese and English. Shared keys use `locales/en.ts` and
`locales/zh-CN.ts`; site pairs use `locales/site.ts`; local copy may use explicit
`useI18n().t(Chinese, English)` pairs. Imported user content is rendered as text.

## Verification

```sh
pnpm format:check
pnpm check
pnpm test:e2e
pnpm build:local
```

Browser tests exercise the production Pages subpath at desktop, tablet and phone
widths, chart keyboard interaction, filters, disclosures, theme persistence and
reduced motion. Screenshots go under ignored `.local/screenshots`.

For each visual round, inspect screenshots and compare layout against the reference
structure; do not count source/type checks as a visual pass. Inspect source and
metric/privacy boundaries separately. Record limitations in the verification notes.
