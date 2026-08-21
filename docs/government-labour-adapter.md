# Department of Employment and Labour vacancy adapter

## Selected official page

Use the official [Department of Employment and Labour vacancy list](https://www.labour.gov.za/vacancies/Pages/Vacancies-List.aspx) as the fourth supported department pattern. The live page exposes an HTML list with a vacancy reference number, closing date, linked title/detail cell, and vacancy status. Each active row can therefore be normalised without downloading or extracting a PDF body. [1]

## Ingestion contract

Keep only rows marked **Open** with a valid unexpired closing date. Persist the Department of Employment and Labour as the department, retain the displayed reference as a source tag, and preserve the linked vacancy-detail page as the original destination. De-duplicate by the existing source identity of title, department, and closing date.

## Boundary

Do not follow detail pages or download attached documents in this initial adapter. Skip malformed, closed, expired, or unlinked rows safely. This remains a table-first metadata source.

## Reference

[1] [Department of Employment and Labour — Vacancies](https://www.labour.gov.za/vacancies/Pages/Vacancies-List.aspx)
