# Core

Currently `src/dashboard.ts` contains browser-safe dashboard contracts shared by
the demo and its checks. No database, runtime, or business service is implemented.

Future domain, application, storage, and runtime modules belong here. Domain code
must remain independent of React, HTTP, credentials, and concrete connectors. Keep
server-only modules out of browser exports. See [architecture](../../docs/architecture.md).
