# Government Department Vacancy Discovery — Feasibility Record

## Official discovery source

The South African Government’s [Government jobs directory](https://www.gov.za/about-government/government-jobs) links to vacancy pages for national departments. It is a suitable **directory-only** discovery source. The official DPSA page states that the Public Service Vacancy Circular is published weekly, while the directory itself identifies department vacancy pages as a separate government channel. [1] [2]

## Observed page patterns

| Department page | Observed structure | Table-first metadata feasible? | Initial adapter treatment |
|---|---|---:|---|
| Forestry, Fisheries and the Environment | Structured table with reference, title/PDF link, component, location, and closing date | Yes | Supported table adapter. |
| Health | Structured title/PDF-link and closing-date table | Yes | Supported table adapter. |
| Justice and Constitutional Development | Publication/PDF link, a shared closing date, and an HTML list of titles | Yes, with list parser | Supported publication-list adapter. |
| Communications and Digital Technologies | Circular/PDF link and closing date only; no individual vacancy-title table | Partial | Store only when a page supplies a genuine title; otherwise skip without PDF extraction. |

> **Boundary for launch:** The weekly source will only ingest title, department, closing date, and original PDF link from an approved page pattern. It will not infer roles from PDF content, invent closing dates, or force unrelated page formats into a generic table parser.

## Recommended implementation approach

Use the official directory weekly to discover current department URLs. Apply a pattern-specific parser only to allowed department pages, normalise each record into the existing public vacancy schema, preserve its original PDF link, and de-duplicate on normalised title + department + closing date. Log unsupported page structures and leave them out of the searchable feed until a deterministic parser is added.

The weekly public-service circular remains a separate official source; this enhancement does not replace it.

## References

[1] [South African Government — Government jobs](https://www.gov.za/about-government/government-jobs)  
[2] [DPSA — Public service vacancy circular](https://www.dpsa.gov.za/newsroom/psvc/)  
[3] [Department of Forestry, Fisheries and the Environment — Vacancies](https://www.dffe.gov.za/vacancies)  
[4] [National Department of Health — Vacancies](https://www.health.gov.za/vacancies/)  
[5] [Department of Justice and Constitutional Development — Vacancies](https://www.justice.gov.za/vacancies/vacancies.htm)
