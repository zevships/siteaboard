# Core

`src/workspace.ts` contains the versioned browser-safe workspace contract, strict
boundary validation, null-preserving aggregation and adjacent comparison windows.
The synthetic fixture and read-only SQLite adapter use this same contract.

Future domain, application, storage and runtime modules belong here. Domain code
must remain independent of React, HTTP, credentials and concrete connectors. Keep
server-only modules out of browser exports. See [architecture](../../docs/architecture.md)
and [local data](../../docs/local-data.md).
