# Frontend verification record

## 2026-10-24 — operational layout and local data

The visual baseline is the existing compact operations layout: horizontal global
navigation, site navigation followed by the date toolbar, neutral cards, large
metric values, and dense charts/tables. The refinement layer adds brand accents and
surface depth while retaining this structure.

White-box checks cover the selected original chart/home/task CSS and keyframes,
normalized for the separate light/dark attribute. Data queries validate ranges,
source totals, missing values and the cutoff; local access checks cover sessions,
origins, Host, Fetch Metadata, traversal, symlinks and read-only behavior.

Black-box checks cover desktop/tablet/phone, both modes, tab navigation, date ranges,
chart keyboard tooltips, filters, issue selection, release disclosure, task state
simulation, history and reduced motion. A style-isolation harness renders the same
synthetic home DOM with the original stylesheet: the home card geometry, KPI type
and chart heights match at 1440/820/390. This isolates styling; it is not an
independent pixel-perfect comparison against the full original React application.
Original screenshots and source-comparison artifacts stay in ignored local storage.

The new application intentionally keeps the website-operations scope. Personal,
social, lab, devices and film modules are excluded. Market-research/SERP extensions,
live collectors and write operations are not claimed as implemented. Demo task
animation does not run a real job; local mode is read-only.
