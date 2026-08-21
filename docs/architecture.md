# Job Organizer Architecture

## Product flow

The service accepts a user-owned PDF résumé, extracts text on the server, stores the original file in private object storage, and sends the extracted text to the built-in language model for structured, evidence-led profile extraction. The profile contains skills, certifications, employment entries, likely role families, and only role titles justified by the document.

The product converts that profile into a natural master CV, career-gap guidance, and salary-positioning guidance. The prompt explicitly forbids inventing gaps, salaries, tools, dates, qualifications, or responsibilities. This is a profile-level output rather than a rewrite copied from an individual job description.

## Live vacancy flow

The approved production sources are the Adzuna South Africa Jobs API, the documented Jobicy public API, and a supported-page South African government-department source. The government source runs weekly, discovers the official directory, and normalises only verified metadata from Environment, Health, Justice, Employment and Labour, and GCIS. It retains title, department, closing date, original official handoff, and explicitly supplied salary text; it does not extract PDF bodies. Jobicy supplies eligible worldwide remote roles and preserves its canonical URL. Adzuna retrieves South African roles into a shared cache and preserves the provider redirect URL; user searches rank stored Adzuna listings rather than calling the provider. All records are normalised, de-duplicated by equivalent title, employer, and location, and passed through deterministic evidence matching. The user dashboard exposes only the three product fit tiers: **Priority**, **Strong**, and **Selective**.

The source registry records each source’s access status, terms URL, adapter kind, most recent refresh, and background-task identifier. Source labels remain visible on every opportunity card and the original provider link is the application handoff. Pnet has a placeholder policy record only; it is not enabled for automated collection until an approved access basis has been documented.

## Refresh schedules and cache flow

The daily Jobicy refresh is an authenticated callback at `/api/scheduled/daily-vacancy-refresh`. The Adzuna cache uses a separate authenticated callback at `/api/scheduled/twice-daily-adzuna-cache-refresh`, scheduled for 06:00 and 18:00 UTC. The weekly government callback remains `/api/scheduled/weekly-government-department-refresh` at Monday 06:00 UTC. Each task validates its platform-issued task identifier against the approved source record, upserts by `(source, externalId)`, records the refresh outcome, and reranks the most recent résumé per account where applicable. This makes repeated delivery safe and prevents an individual user search from consuming an Adzuna API request.

## Data model

| Record | Purpose |
|---|---|
| `resumes` | Private original-file reference, extracted text, verified profile, master CV, and career guidance. |
| `sourceConfigs` | Approved-source status, terms link, refresh state, and background-task identity. |
| `jobListings` | Cached public listing metadata, canonical source URL, and source-provided salary text when available. |
| `jobMatches` | Current résumé-to-job score, tier, and concise evidence rationale. |
| `refreshRuns` | User-triggered and scheduled refresh audit trail. |

## Security and integrity controls

The app keeps LLM credentials server-side, uses authenticated data access, stores uploaded file bytes in object storage rather than database blobs, preserves original vacancy URLs, and does not submit applications on behalf of users. The scheduler accepts only platform-authenticated cron identities and resolves the permitted source by the scheduler task ID, not request-body data.

## References

- [Jobicy Remote Jobs API & RSS Feed](https://jobicy.com/jobs-rss-feed)
- [Adzuna API Overview](https://developer.adzuna.com/overview)
- [Adzuna Terms and Conditions](https://www.adzuna.com/terms-and-conditions.html)
- [Pnet General Terms and Conditions](https://www.pnet.co.za/about-us/general-terms-conditions/)
