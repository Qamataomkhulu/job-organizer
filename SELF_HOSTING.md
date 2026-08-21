# Self-Hosting Job Organizer

Job Organizer’s source code can be moved to your own repository and hosted behind a domain you control. The published version is currently available at **joborganize-7kpoftaq.manus.space**. The simplest way to use a custom domain is to connect it to the managed deployment; this keeps the existing database, authentication, object storage, AI integration, and daily schedule intact.

If you prefer a third-party host, use the portable source archive included with this project. The application is TypeScript/Node 22 with React, Express, tRPC, Drizzle, and a MySQL-compatible database. It does **not** run unchanged outside its current environment because several server helpers depend on managed integrations. Those integrations must be replaced before a third-party deployment is production-ready.

## Deployment paths

| Path | What changes | When it is the better fit |
|---|---|---|
| **Connect your own domain to the managed deployment** | DNS only; existing integrations and scheduled refresh stay intact. | You want the fastest, lowest-maintenance path. |
| **Move source code to a third-party Node host** | Replace the managed authentication, LLM, object storage, and scheduler integrations. | You need complete infrastructure ownership or already operate a cloud stack. |

> **Important:** A daily refresh must use the hosting provider’s scheduler, cloud scheduler, or an authenticated external cron service. Do not use in-process timers such as `setInterval` or `node-cron` in a serverless deployment.

## What to export

The portable archive excludes `node_modules`, local build output, logs, secret files, and environment-specific runtime state. It includes the application source, Drizzle migrations, tests, CI workflow, public-source policy, and self-hosting template.

```bash
unzip Job_Organizer_Source_Package.zip
cd job-organizer
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
```

## Required replacement work for external hosting

| Current capability | Current integration | External-hosting replacement |
|---|---|---|
| User sign-in | Managed OAuth and session helpers in `server/_core` | An OAuth/session provider such as Auth.js, Clerk, or your own secure session service. |
| Database | Managed MySQL-compatible `DATABASE_URL` | Managed MySQL/TiDB database and a production connection string. |
| Résumé and ZIP storage | Managed object-storage helpers | S3-compatible storage (AWS S3, Cloudflare R2, Backblaze B2, or equivalent). |
| AI profile and document generation | Built-in server-side LLM helper | An LLM provider SDK with server-only API key handling and equivalent structured-output validation. |
| Daily Jobicy refresh | Authenticated platform heartbeat | Your hosting provider’s scheduler calling a protected `/api/scheduled/daily-vacancy-refresh` endpoint. |
| Authentication for scheduled calls | Platform cron identity | A dedicated cron secret validated by the endpoint. |

## Recommended external runtime shape

Run the web server as a Node 22 service with a MySQL-compatible database and S3-compatible object storage. Put the application behind HTTPS, add your custom domain through your hosting provider, and configure DNS according to that provider’s instructions. Keep all secrets in the host’s encrypted environment-variable manager; do not place them in the repository or in frontend-exposed variables.

The application’s existing daily refresh runs at **05:00 UTC**. Replicate this with a six-field or five-field cron expression according to your scheduler’s format. Use an idempotent task that fetches only approved sources, upserts jobs by source and external ID, and recalculates each user’s current shortlist.

## Data and source policy during migration

The current source registry enables Jobicy’s documented public API and preserves canonical application links. Pnet remains disabled and pending until you have an approved access basis, written permission, or official feed/API. Keep that boundary when moving the system.

## Environment template

Use [`self-hosting/ENVIRONMENT_TEMPLATE.md`](self-hosting/ENVIRONMENT_TEMPLATE.md) to configure the secret manager provided by your chosen host. The values shown are placeholders only. You must also replace the managed server modules described above; the template lists the configuration categories, not a drop-in configuration for the current managed integration.

## GitHub handoff

Create a private GitHub repository, upload or push the portable source package, and keep GitHub Actions enabled. The supplied CI workflow runs `pnpm check` and `pnpm test` on pushes and pull requests. Add your production deployment workflow only after the managed integrations have been replaced and validated.

## References

- [1] [Jobicy Remote Jobs API and RSS Feed](https://jobicy.com/jobs-rss-feed)
- [2] [Pnet General Terms and Conditions](https://www.pnet.co.za/about-us/general-terms-conditions/)
