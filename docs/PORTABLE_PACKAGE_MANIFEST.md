# Portable Project Package Manifest

The downloadable archive is a source-only handoff. It contains the working application implementation, tests, database schema and migration history, and deployment documentation.

| Included | Reason |
|---|---|
| `client/`, `server/`, `shared/` | Application interface, backend procedures, source adapters, and tests. |
| `drizzle/` | Version-controlled database schema and SQL migration history. |
| `docs/`, `self-hosting/`, `README.md`, `SECURITY.md` | Architecture, source policy, deployment, custom-domain, security, AI-assistant, and environment guidance. |
| `package.json`, `pnpm-lock.yaml`, TypeScript/Vite/Drizzle configuration | Reproducible dependency and build configuration. |
| `patches/` | Dependency patch required by the lockfile configuration. |

| Excluded | Reason |
|---|---|
| `.env*`, managed secret values, API credentials | Secrets must be entered into the destination host’s encrypted secret manager. |
| `node_modules/`, `dist/` | Reinstall and rebuild these for the destination environment. |
| `.git/`, `.manus-logs/`, browser/session files | They contain environment history and are not application source. |
| Uploaded résumés, output packages, database exports | They are personal data and require a separate, consented migration. |
| Temporary scripts and downloaded samples | They are not required to operate the application. |

> Verify the archive checksum after download. Treat the archive as source code, not as a database backup.
