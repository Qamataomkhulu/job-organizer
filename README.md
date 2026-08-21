# Job Organizer

Job Organizer is an evidence-led job-search workspace that turns a user-owned résumé into a verified career profile, a natural master CV, career guidance, and a ranked shortlist of live jobs with direct source links.

## Product capabilities

| Capability | Implementation |
|---|---|
| PDF résumé intake | Authenticated PDF upload, server-side text extraction, and private object-storage reference. |
| AI profile extraction | Structured extraction of documented skills, certifications, role titles, employment timeline, and strongest role family. |
| Fit tiers | Deterministic job scoring with exactly **Priority**, **Strong**, and **Selective** labels. |
| Career Direction | Saved preferred titles and evidence-backed adjacent career paths guide live retrieval as well as ranking. |
| Live vacancies | Adzuna South Africa Jobs API for local roles, Jobicy for eligible worldwide remote roles, and verified South African government department table/list pages with original official destinations. |
| Shortlist | Ranked UI list with employer, location, provider label, source-provided salary when available, tier, score, evidence tags, and direct apply link. |
| Career outputs | Natural master CV, career-gap guidance, salary-positioning guidance, and downloadable ZIP package. |
| Background refresh | Authenticated daily Jobicy refresh, twice-daily shared Adzuna cache refresh at 06:00 and 18:00 UTC, and weekly Monday 06:00 UTC government-department metadata refresh. |

## Local development

This repository uses Node 22, pnpm, React, Express, tRPC, Drizzle, and MySQL-compatible storage. The managed deployment injects the application’s database, authentication, object-storage, and LLM credentials; never commit environment files or secret values.

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm dev
```

## Database workflow

Update `drizzle/schema.ts`, generate a migration with `pnpm drizzle-kit generate`, review the SQL, and apply it to the deployment database. File bytes belong in object storage; the database keeps metadata and ownership records only.

## Source policy

Read [`docs/public-source-policy.md`](docs/public-source-policy.md) before enabling a new vacancy source. The service must only retrieve sources with a documented permitted-access basis. It does not log in to job boards, bypass restrictions, or automate applications.

## Secure GitHub and AI-assisted development

Before copying this repository to GitHub or giving source files to an AI coding assistant, read [`docs/SECURITY_GITHUB_AI_HANDOFF.md`](docs/SECURITY_GITHUB_AI_HANDOFF.md). It explains why GitHub alone does not host the current full-stack application, how to protect API keys and private résumé data, how to preserve intellectual-property evidence, and the safe source-only prompt to use with an AI assistant. The repository security-reporting policy is in [`SECURITY.md`](SECURITY.md).

## Background refresh schedules

Publish the site before activating a callback. Jobicy refreshes daily through its authenticated background task. Adzuna refreshes its shared South African vacancy cache at **06:00 and 18:00 UTC**; a user search ranks that stored cache and does not invoke Adzuna. Government metadata refreshes every Monday at 06:00 UTC. Each callback is idempotent, upserts cached listings, and recalculates current shortlists where relevant.

## GitHub handoff

Create a private GitHub repository and push the extracted project source; do not commit `.env` files, credentials, user documents, database exports, dependencies, or build output. The included [`.github/workflows/quality.yml`](.github/workflows/quality.yml) runs on pushes and pull requests to `main`, using Node 22 and pnpm 10.4.1. It installs locked dependencies, runs `pnpm check`, runs `pnpm test`, and runs `pnpm build`.

The workflow validates the repository but does not deploy or provide managed secrets. Configure any non-managed hosting environment with equivalent database, OAuth, object storage, LLM, Adzuna, and scheduled-callback credentials before deployment.

For a portable handoff, paid custom-domain instructions, and an explanation of the external-hosting migration work, read [`docs/DEPLOYMENT_AND_CUSTOM_DOMAIN.md`](docs/DEPLOYMENT_AND_CUSTOM_DOMAIN.md). The archive contents and exclusions are documented in [`docs/PORTABLE_PACKAGE_MANIFEST.md`](docs/PORTABLE_PACKAGE_MANIFEST.md).

## Production notes

Adzuna South Africa, Jobicy, and five supported government-department page patterns are the current approved adapters: Environment, Health, Justice, Employment and Labour, and GCIS. Salary is displayed only where supplied directly by an approved source. Pnet is represented as a pending source until a documented permission basis or official feed/API is available. See [`docs/architecture.md`](docs/architecture.md) for the full system design, [`docs/public-source-policy.md`](docs/public-source-policy.md) for source limits, and `self-hosting/ENVIRONMENT_TEMPLATE.md` for external deployment secrets.
