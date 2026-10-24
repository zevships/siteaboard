# Frontend conventions

The current application is React 19 + TypeScript + Vite + TanStack Router. It is a
static SPA; TanStack Start, Nitro, and a local Node service are deferred. The root
package owns dependencies and scripts until more executable modules exist.

## Add an independent page

1. Create `apps/admin/src/pages/<name>/<name>-page.tsx` with a default exported React
   component. Keep page-specific components beside it.
2. Add its path, translation key, icon, and navigation group to `app/navigation.ts`.
3. Add its lazy import to the typed page map in `app/router.tsx`. The map must cover
   every registered route. `/` is the overview route.
4. Add copy to both `locales/en.ts` and `locales/zh-CN.ts`; the Chinese dictionary is
   checked against the English keys. Use the preference provider's translation and
   locale values; use `Intl` for numbers and dates.
5. Compose shared components from `components/`, passing data via props. Access demo
   fixtures at page level; do not import server code, files, or credentials into UI.
6. Add the route to the browser smoke checks. Check narrow layouts and both modes.

The route registry controls navigation; pages are separate lazy chunks. The shell
owns horizontal top navigation, appearance controls, loading/error/not-found states,
and the content outlet. Mobile navigation expands below the header.
The site-detail query retains the selected site and period across reloads.
Hash history allows copied URLs and refreshes on static hosting without a rewrite
server. Vite's `SITEABOARD_BASE_PATH` controls asset URLs, not hash route paths.

## Theme, appearance, and language

`styles/tokens.css` defines semantic variables for surfaces, text, borders, accents,
and charts. `data-theme` is ocean/harbor/sunset; `data-mode` is light/dark. Add visual
rules with those tokens rather than page-local light/dark colors. `app.css` owns
shared responsive layout. Charts expose a data table and do not rely only on color.

`providers/preferences.tsx` exposes preferences, locale, translations, and setters.
Appearance can be `system`, listening for OS changes while the app is open. The
prepaint script in `public/preferences.js` reduces startup flashes. Its whitelist
and localStorage key must stay aligned with `lib/preferences.ts`.

Only validated theme/mode/locale strings are persisted. Invalid or blocked storage
falls back safely. Do not put tokens, private datasets, or user profiles in browser
storage. The preference provider is shared by every page.

## Demo and future data

`data/demo.ts` contains fictional `.example` domains and deterministic fixtures.
Daily totals, selected periods, and site table totals agree. The metric is visits,
not deduplicated visitors. Demo dates are fixed, not presented as live readings.
`packages/core/src/dashboard.ts` contains browser-safe DTOs only.

The future local service should use a separate server boundary and shared DTOs;
its database, credential store, and connectors must never become browser imports.
Do not bundle server-only packages through a common barrel export.

## Checks

```sh
pnpm format:check
pnpm check
pnpm exec playwright install chromium
pnpm test:e2e
```

Tests run the production bundle under `/siteaboard/`, on desktop and mobile. Review
screenshots in `.local/screenshots/` after UI changes. Keep development/preview
bound to loopback; do not use them as public production servers.

## Visual structure

Use a polished operations UI: horizontal navigation, a wide content region (maximum
1360px), readable 14–15px body copy, restrained borders, and color reserved for
charts, status, and restrained brand accents. Soft surface gradients, a decorative
SVG route in the greeting panel, and light shadows give the interface depth while
keeping data legible. Do not introduce a permanent sidebar or marketing hero into
the dashboard. The home page groups today's and selected-period metrics by site,
then shows follow-ups and task status. Site detail puts its selector, period, data
notes, journey counts, and chart in that order.

`SiteOperations`, `PeriodControl`, and `TaskList` are reusable page sections. Keep
fixtures separate from those components. The demo journey is illustrative event
counts, not verified user conversions; hourly gray bars are a visual reference.
Verify desktop, tablet, and mobile layouts with Chinese and English copy.
