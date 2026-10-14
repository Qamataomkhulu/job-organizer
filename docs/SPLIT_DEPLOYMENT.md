# Split deployment: GitHub Pages + cloud API

The repository now builds two targets:

- **GitHub Pages:** static React/Vite frontend from `pnpm build:client`.
- **Render/Railway:** Dockerized Express/tRPC API, database access, authentication callback, private S3-compatible storage, LLM calls, and scheduled refreshes.

## GitHub Pages

1. In repository Settings → Pages, set the source to **GitHub Actions**.
2. In repository Settings → Secrets and variables → Actions → Variables, add:
   - `API_URL`: the public cloud API URL, for example `https://job-organizer-api.onrender.com`.
3. Push to `main`. `.github/workflows/deploy-pages.yml` builds with `VITE_BASE_PATH=/job-organizer/` and publishes `dist/public`.
4. The static site will be available at `https://qamataomkhulu.github.io/job-organizer/`.

The frontend uses hash routing because GitHub Pages does not provide an application-server fallback for client routes.

## Cloud API

Set `APP_URL` to the frontend URL including the repository path, and set `CORS_ORIGINS` to the frontend origin without the path:

```text
APP_URL=https://qamataomkhulu.github.io/job-organizer/
CORS_ORIGINS=https://qamataomkhulu.github.io
```

Set `API_URL` to the cloud API URL. The API accepts `Authorization: Bearer $CRON_SECRET` on the three scheduled routes.

The storage adapter uses S3-compatible credentials and keeps résumé files private. Cloudflare R2, AWS S3, and Backblaze B2 are suitable providers. The LLM adapter accepts an OpenAI-compatible endpoint through `LLM_API_URL`, `LLM_API_KEY`, and `LLM_MODEL`.

## Render

Render can build directly from `Dockerfile` or use the included `render.yaml` Blueprint. Create the web service first, set all secret values, and then create the three cron services. Render cron schedules are UTC and each cron command exits after one request.

## Railway

Deploy the Dockerfile as the web service. Create short-lived cron services from the same repository with these start commands:

```text
node scripts/run-scheduled-refresh.mjs jobicy
node scripts/run-scheduled-refresh.mjs adzuna
node scripts/run-scheduled-refresh.mjs government
```

Use schedules `0 5 * * *`, `0 6,18 * * *`, and `0 6 * * 1`. Railway cron services must terminate after the request completes.

## Provider packages included

- `cors` and `@types/cors` for credentialed frontend-to-API requests.
- `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` for private S3/R2/B2 storage.
- `jose` for signed application sessions.
- `vite` and GitHub Pages Actions for the static frontend.

Authentication still uses the existing OAuth exchange adapter. For a fully provider-independent deployment, replace `server/_core/oauth.ts` and `server/_core/sdk.ts` with Auth0, Clerk, Supabase Auth, or another OIDC provider while keeping the same frontend/API split.

## GitHub-only static demo

GitHub Pages cannot execute Express, Docker, database, authentication, or scheduled jobs. GitHub Container Registry stores Docker images but does not run them. For a no-host preview, the Pages workflow builds with `VITE_STATIC_DEMO=true`; it renders the landing page and a realistic sample dashboard using local demo data, with no API calls or secrets.

Enable Pages at repository Settings → Pages → Source → GitHub Actions, then rerun `Deploy static demo to GitHub Pages`. The preview is `https://qamataomkhulu.github.io/job-organizer/`. The main CTA opens `#/demo`.

The optional `Publish API image to GitHub Container Registry` workflow publishes tagged API images to `ghcr.io`, but a separate compute provider is still required to run those images.
