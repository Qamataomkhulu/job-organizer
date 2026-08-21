# Security Policy

## Supported code line

Security fixes are maintained on the current `main` branch of Job Organizer. Do not treat a copied archive, a local development server, or an unreviewed fork as a production security release.

## Reporting a vulnerability

Do **not** open a public issue that includes credentials, personally identifiable information, résumé content, attack payloads, or a reproducible exploit against a live deployment. Report the issue privately to the repository owner with a concise description, affected route or component, steps to reproduce in a non-production environment, impact, and any suggested mitigation.

The owner should acknowledge the report, reproduce it safely, revoke or rotate any exposed credential, deploy a fix, and record the affected version. Vulnerability reports are handled on a best-effort basis; no service-level response time is promised.

## Security boundaries

The application must keep credentials server-side, retain uploaded résumés and generated packages in private object storage, and preserve authorization checks on every user-scoped query or mutation. Never commit API keys, database URLs, session secrets, private certificates, production logs, résumé files, or database exports. Use the encrypted secret manager provided by the selected host and rotate a credential immediately if it reaches Git history, a browser bundle, a chat transcript, or a public ticket.

## Safe testing

Test only systems you own or are explicitly authorized to assess. Use a staging environment and synthetic data for security testing. Do not run destructive scans, denial-of-service tests, credential stuffing, or broad crawling against production services.
