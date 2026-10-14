# External Hosting Environment Template

Set the following variables in your chosen hosting provider’s encrypted secret manager. The values below are placeholders and must never be committed to Git.

| Variable | Example placeholder | Purpose |
|---|---|---|
| `NODE_ENV` | `production` | Enables production runtime behaviour. |
| `APP_URL` | `https://qamataomkhulu.github.io/job-organizer/` | Public frontend URL used after authentication. |
| `CORS_ORIGINS` | `https://qamataomkhulu.github.io` | Comma-separated static frontend origins allowed to call the API. |
| `DATABASE_URL` | `mysql://USER:PASSWORD@HOST:3306/job_organizer` | MySQL-compatible database connection. |
| `JWT_SECRET` | `replace-with-a-long-random-secret` | Server-side session signing secret. |
| `AUTH_SECRET` | `replace-with-a-long-random-secret` | Replacement authentication-provider secret. |
| `LLM_API_URL` | `https://provider.example.com/v1` | Chosen server-side LLM provider base URL. |
| `VITE_API_URL` | `https://your-api.example.com` | Public frontend build variable pointing to the API. |
| `API_URL` | `https://your-api.example.com` | Server-side API URL used by scheduler jobs. |
| `LLM_API_KEY` | `replace-with-a-server-only-key` | LLM provider credential; never expose it to the browser. |
| `LLM_MODEL` | `your-structured-output-capable-model` | Model used for résumé extraction and document generation. |
| `S3_ENDPOINT` | `https://s3.example.com` | S3-compatible object-storage endpoint. |
| `S3_REGION` | `your-region` | Object-storage region. |
| `S3_BUCKET` | `job-organizer-private` | Private résumé and output-package bucket. |
| `S3_ACCESS_KEY_ID` | `replace-with-storage-access-key` | Object-storage access credential. |
| `S3_SECRET_ACCESS_KEY` | `replace-with-storage-secret` | Object-storage secret credential. |
| `CRON_SECRET` | `replace-with-a-long-random-secret` | Secret verified by your external scheduler callback. |
| `ADZUNA_APP_ID` | `replace-with-adzuna-app-id` | Server-side Adzuna application identifier for governed South African vacancy retrieval. |
| `ADZUNA_APP_KEY` | `replace-with-adzuna-app-key` | Server-side Adzuna application key paired with the App ID; never expose it to the browser. |
| `LOG_LEVEL` | `info` | Optional server logging level. |

> Storage, LLM calls, CORS, health checks, and scheduled callbacks now support the external-host variables above. The existing OAuth exchange remains the managed authentication adapter; replace `server/_core/oauth.ts` and `server/_core/sdk.ts` with Auth0, Clerk, Supabase Auth, or another OIDC provider if the API must be fully independent of the managed identity service.
