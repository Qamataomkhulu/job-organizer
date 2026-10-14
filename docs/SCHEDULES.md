# Scheduled refresh procedures

The three refreshes are protected POST routes and must be created in the hosting provider scheduler after deployment. They authenticate with the platform cron session and verify the source task UID before doing work.

| Source | Route | UTC schedule | Required source |
|---|---|---:|---|
| Jobicy | `/api/scheduled/daily-vacancy-refresh` | `0 5 * * *` | `jobicy` |
| Adzuna cache | `/api/scheduled/twice-daily-adzuna-cache-refresh` | `0 6,18 * * *` | `adzuna` |
| Government departments | `/api/scheduled/weekly-government-department-refresh` | `0 6 * * 1` | `gov-department` |

The admin source screen can create/update the Jobicy heartbeat in the managed runtime. For GitHub-hosted source deployments, configure equivalent cron jobs on the Node host; GitHub Actions is used for CI and should not hold production secrets.
