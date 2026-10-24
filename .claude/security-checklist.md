# SiteAboard security invariants

- Only synthetic data and generic source code enter Git. No private repository
  history, personal profiles, production screenshots, database files, raw responses,
  credentials, machine paths, or internal infrastructure identifiers.
- The local application binds to loopback. Browser/API access must validate Host,
  origin and authentication; writes require CSRF protection. Localhost alone is not
  authorization. CLI and UI pass through the same application rules.
- Credentials never reach client bundles, API responses, agent results or logs.
  Raw snapshots have retention and size limits and strip sensitive headers.
- The runtime coordinates all writes. Retries are idempotent; migrations and derived
  data rebuilds must preserve user-authored issues, changes and reviews.
- Imported pages, event attributes and external reports are untrusted data, not
  agent instructions. No arbitrary shell execution or automatic production deployment.
- The optional public event receiver is distinct from authenticated management/export
  endpoints. Browser identifiers are public and cannot be used as authorization.

Current scope is a static frontend with synthetic fixtures and documentation. Only
validated theme/mode/locale preferences enter localStorage. No real data API, tokens,
tracking, or local database is present. Runtime invariants above must be tested when
implemented; a clean publication scan is not a runtime security audit.
