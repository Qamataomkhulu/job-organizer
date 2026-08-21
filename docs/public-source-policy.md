# Public Vacancy Source Policy

## Product rule

Job Organizer stores and ranks only vacancies obtained through an **approved source registry**. Every source has a documented terms URL, legal/access status, refresh cadence, rate limit, and adapter type. The product always preserves the source posting URL and sends applicants to the original listing.

## Approved production sources

### Adzuna South Africa Jobs API

Adzuna’s Job Search API requires a server-side App ID and App Key and supports the South African (`za`) search endpoint. Job Organizer uses governed cybersecurity search terms for South African vacancy discovery, shows **Adzuna South Africa** on each resulting opportunity card, and preserves the provided Adzuna redirect URL as the application handoff. The credentials are confidential, are never exposed to the browser, and are stored only in the encrypted deployment secret manager. Adzuna results are refreshed into a shared cache twice daily; users rank the stored cache and do not invoke Adzuna directly.

### Jobicy

Jobicy publishes a public remote-jobs API designed for job-discovery products, applications, research tools, dashboards, and AI products. Its documentation states that no API key is required, the API provides canonical Jobicy posting URLs, and integrations may use its listings in their own products when source attribution and the original URL are preserved. Its fair-use guidance limits polling to a few times per day and no more than once per hour.

The adapter uses `https://jobicy.com/api/v2/remote-jobs` for eligible worldwide remote roles. The platform retains Jobicy attribution, caches results, and includes it in the shared daily refresh. This source is suitable because it has a documented API and explicit intended use.

### South African government department vacancies

The official [Government jobs directory](https://www.gov.za/about-government/government-jobs) is used once a week to discover department vacancy pages. The initial supported set is intentionally limited to the Department of Forestry, Fisheries and the Environment, the National Department of Health, the Department of Justice and Constitutional Development, the Department of Employment and Labour, and the Government Communication and Information System (GCIS), because each exposes deterministic table or publication-list metadata. The Employment and Labour adapter retains the official vacancy-detail link; GCIS retains its official listing page and source-labelled salary where present; the other initial patterns retain the official PDF handoff. The adapter keeps only a vacancy title, department, closing date, original destination, and source-provided salary text; it does not download or extract PDF bodies. Unsupported formats, expired notices, nomination-only notices, and endpoints with invalid certificate chains are skipped safely. [1] [2] [7] [8]

## Salary display rule

Salary is shown only when an approved source supplies a salary range, amount, or explicitly labelled compensation text. Job Organizer preserves that source-provided text or formats returned numeric bounds without estimating currency, pay period, take-home pay, benefits, or an equivalent for listings with no salary. An absent salary means the source did not provide one; it is never interpreted as a low salary or missing candidate eligibility.

## Shared Adzuna vacancy cache

Adzuna results are refreshed into a shared, source-attributed cache at 06:00 and 18:00 UTC. An individual user search or résumé refresh ranks the cached Adzuna records already stored by the platform; it does not issue a new Adzuna API request. Each scheduled run updates the canonical Adzuna application redirect, de-duplicates records by Adzuna identifier, records the refresh result, and reranks current user results against the refreshed cache.

## Pnet assessment — 19 August 2026

Pnet’s published terms state that its website use is subject to its terms and conditions and that the site may suspend or deny access at its discretion. The terms confirm that public jobseeker features include job listings and application tools, but the reviewed text did **not** grant a separate automated-scraping licence. Therefore, Pnet is treated as a **pending approval source** until written permission, an official feed/API, or another clear permission basis is recorded.

## Source-adapter requirements

All future adapters require a documented permitted-access basis, conservative request rate, caching, source attribution, retention of the original posting URL, and an immediate disable control. The service will not circumvent access controls, log into job boards, bypass robots directives, or retrieve paywalled content.

## References

[1] [South African Government — Government jobs](https://www.gov.za/about-government/government-jobs)
[2] [DPSA — Public service vacancy circular](https://www.dpsa.gov.za/newsroom/psvc/)
[3] [Jobicy Remote Jobs API & RSS Feed](https://jobicy.com/jobs-rss-feed)
[4] [Adzuna API Overview](https://developer.adzuna.com/overview)
[5] [Adzuna Terms and Conditions](https://www.adzuna.com/terms-and-conditions.html)
[6] [Pnet General Terms and Conditions](https://www.pnet.co.za/about-us/general-terms-conditions/)
[7] [Department of Employment and Labour — Vacancies](https://www.labour.gov.za/vacancies/Pages/Vacancies-List.aspx)
[8] [Government Communication and Information System — Jobs](https://www.gcis.gov.za/content/about-us/hr/vacancies)
