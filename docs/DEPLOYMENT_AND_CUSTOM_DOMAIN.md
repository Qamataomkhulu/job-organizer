# Deployment and Paid Custom-Domain Guide

**Prepared for:** Job Organizer owner  
**Current managed domain:** `joborganize-7kpoftaq.manus.space`  
**Recommended path:** Keep the current managed deployment and attach a paid custom domain. This preserves the current authenticated database, private storage, OAuth, language-model, and scheduled-refresh integrations without a migration project.

## 1. Choose the deployment route

| Route | Best for | What changes | Recommendation |
|---|---|---|---|
| **Managed custom domain** | A branded public address with the existing working product | DNS and domain settings only | **Use this route first.** |
| **External hosting migration** | Full infrastructure ownership outside the managed environment | Replace managed OAuth, LLM, storage, scheduler, and database integrations | Plan as a separate engineering migration. |

> **Important:** The source archive is complete, but the current runtime is not a turnkey generic Node deployment. It deliberately uses managed integration modules under `server/_core`. Copying the source to another host without replacing those integrations will not provide working sign-in, résumé storage, AI generation, or scheduled refreshes.

## 2. Recommended: connect a paid custom domain to the existing live app

First, purchase a domain through your preferred registrar or from the project’s **Settings → Domains** area. Keep the current `manus.space` address active while testing; it provides a fallback if DNS propagation or verification takes time.

In the project management interface, open **Settings → Domains** and select either the purchased domain or **Bind existing domain**. The interface will show the exact DNS verification and routing records for your project. Copy those values exactly into the DNS panel at your registrar. Do not substitute guessed IP addresses or generic records.

| Domain form | Typical DNS action | Important note |
|---|---|---|
| `www.example.co.za` | Add the exact **CNAME** target supplied by the hosting interface | A CNAME maps a hostname to the provider’s hostname; use the exact target shown during binding. [1] |
| `example.co.za` (root/apex) | Add the exact **A**, **ALIAS**, or provider-supported apex record supplied by the hosting interface | Registrars differ at the apex; follow the project interface, not a copied generic value. |
| E-mail domain | Preserve existing MX, SPF, DKIM, and DMARC records | Website DNS records should not overwrite e-mail records. |

After the interface reports domain verification, make the custom domain the primary public address. Test `https://your-domain`, `https://www.your-domain` if configured, sign-in, résumé upload, Career Direction save-and-search, vacancy refresh, source handoffs, and account data deletion. New published checkpoints automatically update the same deployed application; no separate publish button is required in this project.

### Custom-domain completion checklist

- [ ] The paid domain is registered and renewal details are recorded.
- [ ] The exact verification and routing records from **Settings → Domains** are present at the registrar.
- [ ] The hosting interface reports the domain as verified and HTTPS is active.
- [ ] The canonical domain and any `www` redirect behave as intended.
- [ ] A real sign-in, upload, shortlist refresh, and Adzuna application handoff are tested on the custom domain.
- [ ] Existing e-mail DNS records remain unchanged.

## 3. External-hosting migration: what you must replace

External hosting is possible, but it is a migration rather than a one-click redeploy. The current full-stack project expects platform-managed services. Provision the services below before changing the application adapters.

| Current capability | External replacement needed | Configuration outcome |
|---|---|---|
| Manus OAuth | OAuth/OIDC provider such as Auth0, Clerk, or a self-managed identity provider | Replace the handlers under `server/_core/oauth.ts`; register production callback URLs. |
| Built-in LLM | A server-side LLM provider that supports structured outputs | Replace the implementation called by `server/_core/llm.ts`; keep the key server-only. |
| Managed file storage | Private S3-compatible bucket | Replace storage helpers with direct S3 SDK calls; never store PDF bytes in the database. |
| Managed MySQL-compatible database | Managed MySQL or TiDB instance | Set `DATABASE_URL`; apply the existing Drizzle migrations. |
| Managed scheduled callback | Provider cron job or worker queue | Securely invoke separate authenticated schedules for daily Jobicy refresh, twice-daily Adzuna cache refresh, and weekly government metadata refresh; do not expose a public unauthenticated refresh route. |
| Manus-specific frontend/runtime variables | Host-specific public configuration | Audit `server/_core/env.ts` and the Vite configuration before enabling the client build. |

### External deployment sequence

1. Create a private Git repository and upload the source archive **without** `.env` files or user data.
2. Provision a MySQL-compatible database and a private object-storage bucket. Restrict bucket access to the application service account.
3. Provision external identity, LLM, storage, and scheduler providers. Implement and test the replacement adapters in a staging environment.
4. Copy `self-hosting/ENVIRONMENT_TEMPLATE.md` to the host’s encrypted secret manager and supply non-placeholder values. Include `ADZUNA_APP_ID` and `ADZUNA_APP_KEY`; do not expose either to the browser.
5. Install the locked dependencies with `pnpm install --frozen-lockfile`, then run `pnpm check` and `pnpm test`.
6. Back up the destination database. Apply the version-controlled migrations with `pnpm drizzle-kit migrate`; Drizzle supports a codebase-first workflow in which generated SQL migrations are applied to the target database. [2]
7. Build with `pnpm build` and start with `NODE_ENV=production pnpm start`. Node’s production guidance recommends explicitly setting `NODE_ENV=production`. [3]
8. Configure protected schedules that call only authenticated server routes and respect provider source limits: daily Jobicy refresh, Adzuna cache refresh at 06:00 and 18:00 UTC, and the weekly government metadata refresh. Keep user searches on the stored Adzuna cache rather than calling Adzuna per request.
9. Run the production smoke tests listed below before switching DNS.

### Production smoke tests

| Test | Expected result |
|---|---|
| Sign-in and sign-out | Sessions are scoped to the signed-in account. |
| PDF upload | The file is private, profile generation completes, and raw résumé data is not visible to another account. |
| Career Direction save | Selected titles alter the subsequent targeted search plan. |
| Job refresh | Adzuna South Africa and Jobicy roles appear with source labels, original links, and no obvious duplicates. |
| Privacy action | A user can delete their own stored career data and cannot delete another user’s data. |
| Scheduled refresh | One protected scheduled run completes and logs the source refresh result. |

## 4. Secret inventory

Use the table in [`../self-hosting/ENVIRONMENT_TEMPLATE.md`](../self-hosting/ENVIRONMENT_TEMPLATE.md) as the source of truth. At minimum, external deployment requires a database URL, session and scheduler secrets, OAuth credentials, an LLM key, private object-storage credentials, and the paired Adzuna App ID/App Key. The existing managed built-in keys are **not portable** to another host.

## 5. Data transfer and privacy

The source package intentionally excludes private user files, database records, credentials, dependency folders, build output, browser logs, and deployment metadata. If you need to transfer active user data, plan a separate encrypted database migration and private object-storage copy. Obtain user consent and test data isolation before taking the old service offline.

## References

[1] [Google Workspace Admin Help — Add a CNAME record](https://knowledge.workspace.google.com/admin/domains/add-a-cname-record-to-your-domains/add-a-cname-record-to-your-domains)  
[2] [Drizzle ORM — Migrations fundamentals](https://orm.drizzle.team/docs/migrations)  
[3] [Node.js — Development and production](https://nodejs.org/learn/getting-started/nodejs-the-difference-between-development-and-production)
