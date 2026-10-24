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

Current scope has a synthetic static frontend and read-only SQLite snapshot mode.
Only validated theme/mode/locale preferences enter localStorage. The public build
must contain neither /api/workspace nor the local runtime. Local API reads require
an HttpOnly SameSite=Strict session, exact loopback Host, Origin/Fetch-Metadata
checks and no-store responses. Static paths reject traversal and symlinks. Failed
or invalid local data must not fall back to demo data. The SQLite initializer must
never overwrite an existing file. No live collector or database writer is shipped.
