# Security, GitHub, IP, and AI-assisted development handoff

> **Legal note:** I am an AI, not a lawyer. This is a practical security and ownership checklist, not formal legal advice. For trademarks, copyright registration, contracts, or enforcement, obtain advice from a qualified intellectual-property lawyer in the jurisdictions where you operate.

## Why copying the repository to GitHub did not start the site

GitHub is source control and automation; it does not run this application by itself. Job Organizer is a full-stack service with a React client, an Express/tRPC server, a MySQL-compatible database, private file storage, authentication, server-side AI processing, managed environment variables, and authenticated scheduled callbacks. A copied repository is therefore **necessary but not sufficient** for a working public website.

The existing managed deployment remains the lowest-risk route because it already provides the database, private storage, OAuth, encrypted secrets, HTTPS, and background schedules. If you use a custom domain, attach it to the managed deployment rather than moving the runtime. An external host is possible, but it is a deliberate migration: you must replace the managed OAuth, LLM, storage, scheduler authentication, and secret-management helpers before publishing. See [`DEPLOYMENT_AND_CUSTOM_DOMAIN.md`](DEPLOYMENT_AND_CUSTOM_DOMAIN.md).

| Repository item | What GitHub provides | What you must still configure to run the site |
|---|---|---|
| `client/` and `server/` | Version history, pull requests, and automated checks | A Node 22 runtime that runs `pnpm build` and `pnpm start`. |
| `drizzle/` | Schema and migration history | A private MySQL-compatible database and reviewed migration process. |
| `server/_core/` | Current managed integration contract | Equivalent OAuth, storage, AI, scheduler, and configuration adapters if hosting outside the managed platform. |
| `self-hosting/ENVIRONMENT_TEMPLATE.md` | Safe variable names and placeholders | Real values stored only in the host’s encrypted secret manager. |
| `.github/workflows/quality.yml` | Type-check, test, and build validation | It does **not** deploy, host, or supply secrets. |

## Recommended GitHub setup

Create a **private** repository under an account or organization you control. Enable two-factor authentication, use a password manager, grant collaborators the minimum necessary role, and avoid sharing the owner account. Push the source-only archive after checking it contains no `.env` files, certificates, résumés, generated ZIPs, database exports, or logs.

Enable GitHub secret scanning and push protection where available. These controls are designed to detect hard-coded credentials in repository history and can stop an accidental push before it lands. [1] [2] Protect the `main` branch: require pull requests, require the existing quality workflow to pass, block force pushes, and require review for changes to workflows, deployment configuration, authentication, and secrets. GitHub recommends a repository security policy such as the included [`../SECURITY.md`](../SECURITY.md). [3]

The repository now includes a weekly Dependabot configuration for npm packages and GitHub Actions. Review those pull requests, run the test suite, and merge only after confirming that the update does not change authentication, billing, or data-handling behaviour unexpectedly.

## Protecting secrets, APIs, and private data

Use an encrypted secret manager at the hosting provider. Keep `ADZUNA_APP_KEY`, database connection strings, session secrets, LLM keys, storage credentials, OAuth secrets, and scheduler secrets **server-side only**. Do not prefix a secret with `VITE_`, place it in a React component, include it in a browser request, add it to a screenshot, or paste it into a chat with an AI assistant. Browser code is public to anyone who can load the site.

| Control | Minimum action | If it is exposed |
|---|---|---|
| API keys and passwords | Store only in encrypted host secrets; use one key per environment where possible. | Revoke/rotate the value immediately, update the host secret, redeploy, and review access logs. |
| Database | Use a unique, least-privilege application account; require TLS; keep backups encrypted and access-limited. | Rotate credentials, check for unexpected reads/writes, and restore only from a tested backup if needed. |
| User résumés and output packages | Use private object storage with user-scoped authorization; do not include them in Git, archives, or prompts. | Remove unintended copies, notify affected users where appropriate, investigate access paths, and document remediation. |
| Web APIs | Enforce HTTPS, authenticate state-changing routes, validate input on the server, rate-limit public endpoints, and log security events without secrets. | Disable or restrict the affected key/route, preserve relevant logs securely, and deploy the fix. |
| GitHub | Private repository, MFA, least-privilege collaborators, branch protection, secret scanning, and review gates. | Remove access or tokens, rotate secrets, inspect commit history and workflow changes, then create a clean remediation commit. |

OWASP recommends centralized secret handling, rotation and revocation processes, and preventing secrets from appearing in source control. Its REST guidance also calls for HTTPS and appropriate protection of credentials in transit. [4] [5]

## Defenses to add before external production hosting

The current platform already keeps managed secrets server-side. If you migrate elsewhere, implement the following before inviting public users:

1. Use a managed authentication provider and keep authorization checks on every user-scoped API and storage action.
2. Replace the managed storage helper with a private S3-compatible bucket; use short-lived, authorized access URLs rather than public résumé files.
3. Apply all Drizzle migrations to an encrypted, TLS-protected database. Use separate development, staging, and production databases.
4. Use a server-side LLM gateway. Do not send raw résumé contents from the browser directly to an AI provider.
5. Put a reverse proxy or host-level protections in front of the app: HTTPS, security headers, request-size limits, rate limiting, and structured error responses that never disclose stack traces or keys.
6. Authenticate each scheduled refresh with a dedicated scheduler secret or signed identity. Keep the daily Jobicy, twice-daily Adzuna cache, and weekly government refresh schedules separate.
7. Add monitoring for failed logins, upload failures, unexpected scheduler retries, repeated rate-limit events, and secret-scanning alerts. Keep logs free of résumés, cookies, authorization headers, and API keys.
8. Maintain a tested incident-response playbook: revoke, rotate, redeploy, investigate, and document.

## Protecting your intellectual property

Your strongest practical protection is an evidence trail and controlled access. Keep the repository private, preserve authored commit history, retain dated design notes and deployment records, add a clear copyright notice and license choice, and use written contributor or contractor agreements that assign code and design rights to your business. Do not publish your internal scoring logic, secret source credentials, résumé-processing prompts, database exports, or private operating documentation in a public repository.

Use separate decisions for the **name/logo** and the **code**. The Job Organizer name and logo may warrant trademark advice before commercial use; the source code and written materials benefit from a deliberate copyright and license strategy. A lawyer can advise whether registration, trademark search, confidentiality agreements, or a proprietary license is appropriate for your business model. Do not rely on `LICENSE` text alone to protect a brand, and do not copy third-party code, vacancy content, or logos without reviewing the governing terms.

## Safe prompt to give an AI coding assistant

Copy the following prompt into a fresh chat, then attach only the **source-only archive**. Do not attach `.env` files, tokens, user résumés, database exports, production logs, cookies, screenshots containing sensitive information, or credentials.

```text
You are helping maintain a private, production-bound Job Organizer web application.

Repository context:
- Stack: React 19, TypeScript, Vite, Express, tRPC, Drizzle, MySQL-compatible database, private object storage.
- The application ranks jobs against a user-owned résumé and uses approved public sources only.
- Approved sources: Jobicy, Adzuna South Africa, and five South African government department adapters (Environment, Health, Justice, Employment and Labour, and GCIS).
- Adzuna uses a shared cache refreshed at 06:00 and 18:00 UTC; a user search must not call the Adzuna API directly.
- Salaries may be shown only when an approved source explicitly provides them.

Non-negotiable security rules:
1. Never ask for, print, hardcode, commit, log, or expose API keys, database URLs, passwords, cookies, OAuth secrets, JWT secrets, storage credentials, résumé contents, or user data.
2. Treat every environment value as secret unless explicitly labelled public. Keep secrets server-side; never place them in VITE_ variables or client code.
3. Preserve authentication, user-scoped authorization, private file storage, input validation, source attribution, rate limits, and scheduler authentication.
4. Do not weaken privacy controls, make résumé files public, bypass job-source restrictions, scrape login-protected sites, or introduce a public refresh endpoint.
5. Before suggesting changes, inspect the existing files and identify tests to update. After changes, run type checks, tests, and a production build.
6. Prefer small, reviewable diffs. Explain migrations, secret requirements, security impact, rollback plan, and any external-service replacement required.

Task: [describe one narrowly scoped change here].
Return: an implementation plan, affected files, tests, security considerations, and deployment steps. Do not produce real secret values.
```

## Before you push to GitHub

Run these commands locally from the project directory after extracting the archive:

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
git status --short
git add .
git commit -m "Initial private Job Organizer source import"
git push -u origin main
```

Stop before `git add .` if `git status` shows a résumé, output package, database export, `.env` file, certificate, log, or any unfamiliar artifact. Remove the sensitive file from the working tree and rotate the relevant secret if it was ever tracked. Do not use `git reset --hard` to clean a repository with important local work; use a reviewed revert or a separate clean checkout instead.

## References

[1] [GitHub Docs — Push protection](https://docs.github.com/en/code-security/concepts/secret-security/push-protection)

[2] [GitHub Docs — Secret scanning](https://docs.github.com/code-security/secret-scanning/about-secret-scanning)

[3] [GitHub Docs — Quickstart for securing your repository](https://docs.github.com/en/code-security/getting-started/quickstart-for-securing-your-repository)

[4] [OWASP Cheat Sheet Series — Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

[5] [OWASP Cheat Sheet Series — REST Security](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html)
