import { describe, expect, it } from "vitest";
import { discoverSupportedGovernmentDepartmentPages, fetchSupportedGovernmentDepartmentJobs, fetchSupportedGovernmentDepartmentReport, parseGcisVacancyListPage, parseGovernmentTablePage, parseJusticeVacancyListPage, parseLabourVacancyListPage } from "./governmentDepartments";

const directory = `<a href="https://www.dffe.gov.za/vacancies">Environment</a><a href="https://www.health.gov.za/vacancies/">Health</a><a href="https://www.justice.gov.za/vacancies/vacancies.htm">Justice</a><a href="https://www.labour.gov.za/vacancies">Labour</a><a href="https://www.gcis.gov.za/content/about-us/hr/vacancies">GCIS</a>`;

describe("supported government department vacancy parsers", () => {
  it("discovers only the five approved department pages from the official directory", () => {
    const html = `${directory}<a href="https://example.gov.za/vacancies">Unsupported</a>`;
    expect(discoverSupportedGovernmentDepartmentPages(html).map(page => page.department)).toEqual([
      "Department of Forestry, Fisheries and the Environment",
      "National Department of Health",
      "Department of Justice and Constitutional Development",
      "Department of Employment and Labour",
      "Government Communication and Information System",
    ]);
  });

  it("extracts title, PDF, location, department, and closing date from supported tables without reading PDFs", () => {
    const html = `<table><tr><th>REF</th><th>DESCRIPTION</th><th>BRANCH</th><th>POST BASE</th><th>APPLICATIONS</th><th>CLOSING DATE</th></tr><tr><td>NOM01</td><td><a href="/careers/nomination.pdf">Nomination for Advisory Council</a></td><td>Board</td><td>Pretoria</td><td>Online</td><td>24 August 2026</td></tr><tr><td>OLD01</td><td><a href="/careers/old.pdf">Expired Security Officer</a></td><td>Security</td><td>Pretoria</td><td>Online</td><td>11 August 2026</td></tr><tr><td>CWM03/2026</td><td><a href="/careers/security.pdf">Cyber Security Officer</a></td><td>Security</td><td>Pretoria</td><td>Online</td><td>24 August 2026 @ 16:00</td></tr></table>`;
    const [job] = parseGovernmentTablePage(html, "Department of Forestry, Fisheries and the Environment", "https://www.dffe.gov.za/vacancies");
    expect(job).toMatchObject({ source: "gov-department", sourceType: "gov-department", title: "Cyber Security Officer", departmentName: "Department of Forestry, Fisheries and the Environment", location: "Pretoria", sourceUrl: "https://www.dffe.gov.za/careers/security.pdf", salaryText: null });
    expect(job.closingDate?.toISOString()).toContain("2026-08-24");
  });

  it("extracts Justice title lists against the department publication PDF without parsing the PDF body", () => {
    const html = `<a href="DoJCD-Vacancies-20260724.pdf"><b>Vacancies  as published on 24 Jul 2026</b></a><b>. Closing date: 24 August 2026.</b><ol><li>POST 26/96 : DEPUTY DIRECTOR-GENERAL: INFORMATION COMMUNICATION TECHNOLOGY SERVICES</li><li>POST 26/97 : STATE ATTORNEY (X2 POSTS)</li></ol><b>SMS Pre-Entry Certificate</b>`;
    const jobs = parseJusticeVacancyListPage(html, "Department of Justice and Constitutional Development", "https://www.justice.gov.za/vacancies/vacancies.htm");
    expect(jobs).toHaveLength(2);
    expect(jobs[0]).toMatchObject({ title: "DEPUTY DIRECTOR-GENERAL: INFORMATION COMMUNICATION TECHNOLOGY SERVICES", sourceUrl: "https://www.justice.gov.za/vacancies/DoJCD-Vacancies-20260724.pdf" });
  });

  it("extracts open Labour table rows and preserves the official vacancy-detail destination without following it", () => {
    const html = `<table><tr><th>Ref No</th><th>Closing Date</th><th>More Details</th><th>Vacancy Status</th></tr><tr><td>HR4/4/8/5</td><td>8/28/2026</td><td><a href="/Vacancies/Lists/Vacancy/DispForm.aspx?ID=55">Human Resource Clerk: Human Resource Management</a></td><td>Open</td></tr><tr><td>OLD</td><td>8/11/2026</td><td><a href="/Vacancies/Lists/Vacancy/DispForm.aspx?ID=12">Expired Clerk</a></td><td>Open</td></tr><tr><td>CLOSED</td><td>8/28/2026</td><td><a href="/Vacancies/Lists/Vacancy/DispForm.aspx?ID=13">Closed Clerk</a></td><td>Closed</td></tr></table>`;
    const [job] = parseLabourVacancyListPage(html, "Department of Employment and Labour", "https://www.labour.gov.za/vacancies/Pages/Vacancies-List.aspx");
    expect(job).toMatchObject({ title: "Human Resource Clerk: Human Resource Management", departmentName: "Department of Employment and Labour", sourceUrl: "https://www.labour.gov.za/Vacancies/Lists/Vacancy/DispForm.aspx?ID=55" });
    expect(job.tags).toContain("official-detail-link");
  });

  it("extracts the GCIS current title list, shared closing date, official page destination, and only its explicit salary text", () => {
    const html = `<h1>Jobs</h1><ul><li>Chief Financial Officer</li><li>Provincial Director: Western Cape Provincial Office</li></ul><p>The GCIS is an equal opportunity employer.</p><p>Closing date: 04 September 2026</p><h2>POST 29/33: Chief Financial Officer</h2><p>Salary: R1 554 696 per annum (Level 14), all-inclusive package.</p><p>Centre: Pretoria</p><h2>Post 29/34: Provincial Director: Western Cape Provincial Office</h2><p>Salary: R1 317 384 per annum (Level 13), all-inclusive package.</p><p>Centre: Bloemfontein</p>`;
    const jobs = parseGcisVacancyListPage(html, "Government Communication and Information System", "https://www.gcis.gov.za/content/about-us/hr/vacancies");
    expect(jobs).toHaveLength(2);
    expect(jobs[0]).toMatchObject({ title: "Chief Financial Officer", sourceUrl: "https://www.gcis.gov.za/content/about-us/hr/vacancies", salaryText: "R1 554 696 per annum (Level 14), all-inclusive package" });
    expect(jobs[1]).toMatchObject({ title: "Provincial Director: Western Cape Provincial Office", salaryText: "R1 317 384 per annum (Level 13), all-inclusive package" });
    expect(jobs.every(job => job.tags.includes("salary-provided"))).toBe(true);
  });

  it("skips an inaccessible supported department page without disabling the rest of the weekly source", async () => {
    const health = `<table><tr><th>Post Advertised</th><th>Closing Date</th></tr><tr><td><a href="role.pdf">Security Officer</a></td><td>24 August 2026</td></tr></table>`;
    const justice = `<a href="vacancies.pdf">Vacancies as published</a> Closing date: 24 August 2026.<ol><li>POST 1/1 : ICT SECURITY LEAD</li></ol>SMS Pre-Entry Certificate`;
    const labour = `<table><tr><td>HR1</td><td>8/24/2026</td><td><a href="/Vacancies/Lists/Vacancy/DispForm.aspx?ID=1">Labour Security Officer</a></td><td>Open</td></tr></table>`;
    const gcis = `<h1>Jobs</h1><ul><li>GCIS Security Officer</li></ul>The GCIS is an equal opportunity employer. Closing date: 24 August 2026 <h2>POST 1/1: GCIS Security Officer</h2> Salary: R500 000 per annum. Centre: Pretoria`;
    const fetched = await fetchSupportedGovernmentDepartmentJobs(async url => {
      if (url.includes("gov.za/about")) return directory;
      if (url.includes("dffe")) throw new Error("Certificate validation failed");
      if (url.includes("health")) return health;
      if (url.includes("labour")) return labour;
      if (url.includes("gcis")) return gcis;
      return justice;
    });
    expect(fetched.map(job => job.title)).toEqual(["Security Officer", "ICT SECURITY LEAD", "Labour Security Officer", "GCIS Security Officer"]);
  });

  it("reports when every supported department page is unavailable so the refresh can fail transparently", async () => {
    const report = await fetchSupportedGovernmentDepartmentReport(async url => {
      if (url.includes("gov.za/about")) return directory;
      throw new Error("Temporary official endpoint outage");
    });
    expect(report).toMatchObject({ jobs: [], successfulPages: 0 });
    expect(report.skippedDepartments).toHaveLength(5);
  });
});
