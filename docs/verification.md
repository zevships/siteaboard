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
lab, devices and film modules are excluded. Content operations now has a synthetic
UI and an optional read-only snapshot; live social collection/publishing is excluded. Market-research/SERP extensions,
live collectors and write operations are not claimed as implemented. Demo task
animation does not run a real job; local mode is read-only.

## Navigation and content workspace refinement

The brand is now the only Home entry. The visible top-level navigation contains
Sites, Content, Improvements, Tasks and Playbooks. Old Connections and global
Search bookmarks redirect to Tasks and the first site's Search section.

Content preserves the reference's vertical hierarchy: title/cost strip, accounts,
three primary tabs, intake, topic/category/platform facets, creator strip, view
controls and media. Artwork, identities, posts and account readings are synthetic.
The theme layer adds cool surfaces and subtle contour texture without changing
home chart heights or card geometry. Independent source and desktop light/dark
review caught and corrected roster sorting, unstable artwork seeds, saved-card
presentation and mobile filter focus handling.

This is a faithful structural adaptation, not a claim that every old feature has
been copied: the profile uses a modal; feed cards use a responsive grid; country,
research-state and time facets, per-post translation toggles and the account's
per-day chart are not present. Content filters reset on page remount. Live social
collection, publishing and database writes remain unimplemented. Demo saves and
intake drafts exist only in page memory. Optional content data in local snapshots
is validated and displayed read-only; an absent field produces an explicit empty
state rather than demo content.
