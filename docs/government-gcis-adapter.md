# GCIS vacancy adapter and source-provided salary evidence

## Selected fifth official page

Use the official [Government Communication and Information System jobs page](https://www.gcis.gov.za/content/about-us/hr/vacancies) as the fifth supported department pattern. The verified page exposes a short active HTML title list, one explicit closing date, job-detail sections with source-provided annual salary text, and the official GCIS eRecruitment application destination. [1]

## Ingestion contract

Retain only the current list when its shared closing date is unexpired. Persist the official GCIS page as the original source destination, and preserve a listed official eRecruitment link as a tagged application destination where present. Extract salary only from the matching, explicitly labelled **Salary** text in the source page; do not calculate, infer, convert, or fill missing compensation.

## Boundary

Do not fetch PDFs or eRecruitment detail pages. Skip a GCIS page if it has no current title list, no parseable closing date, or no corresponding source-provided title block.

## Live validation — 21 August 2026

The official page was reviewed on 21 August 2026. It listed **Chief Financial Officer** and **Provincial Director: Western Cape Provincial Office**, showed a shared closing date of **04 September 2026**, and contained explicitly labelled annual salary text for both posts. The adapter therefore has the required live-page evidence for title capture, closing-date capture, official-page destination preservation, and salary-only-when-present extraction.

## Reference

[1] [GCIS — Jobs](https://www.gcis.gov.za/content/about-us/hr/vacancies)
