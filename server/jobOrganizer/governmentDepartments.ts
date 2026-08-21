import { createHash } from "node:crypto";
import type { PublicJob } from "./types";

type SupportedDepartment = {
  department: string;
  url: string;
  directoryUrls?: string[];
  parser: "table" | "justice-list" | "labour-list" | "gcis-list";
};

export const SUPPORTED_GOVERNMENT_DEPARTMENTS: SupportedDepartment[] = [
  { department: "Department of Forestry, Fisheries and the Environment", url: "https://www.dffe.gov.za/vacancies", parser: "table" },
  { department: "National Department of Health", url: "https://www.health.gov.za/vacancies/", parser: "table" },
  { department: "Department of Justice and Constitutional Development", url: "https://www.justice.gov.za/vacancies/vacancies.htm", parser: "justice-list" },
  { department: "Department of Employment and Labour", url: "https://www.labour.gov.za/vacancies/Pages/Vacancies-List.aspx", directoryUrls: ["https://www.labour.gov.za/vacancies"], parser: "labour-list" },
  { department: "Government Communication and Information System", url: "https://www.gcis.gov.za/content/about-us/hr/vacancies", parser: "gcis-list" },
];

const GOV_SOURCE = "gov-department" as const;

function stripHtml(value: string) {
  return value.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&ndash;|&#8211;/gi, "–").replace(/\s+/g, " ").trim();
}

function absoluteUrl(href: string, baseUrl: string) {
  try { return new URL(href, baseUrl).toString(); } catch { return href; }
}

function asClosingDate(value: string) {
  const cleaned = value.replace(/@.*$/, "").replace(/[.,;]+$/, "").replace(/\s+/g, " ").trim();
  const timestamp = Date.parse(`${cleaned} 12:00:00 GMT+0200`);
  return Number.isNaN(timestamp) ? null : new Date(timestamp);
}

function rowId(department: string, title: string, closingDate: string) {
  return createHash("sha256").update(`${department}|${title}|${closingDate}`.toLowerCase()).digest("hex").slice(0, 40);
}

function makeGovernmentJob(input: { department: string; title: string; closingDateText: string; sourceUrl: string; location?: string; reference?: string; allowOfficialDetailLink?: boolean; salaryText?: string | null }): PublicJob | null {
  const title = stripHtml(input.title);
  const closingDateText = stripHtml(input.closingDateText);
  const closingDate = asClosingDate(closingDateText);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (!title || !closingDate || closingDate < today || (!input.allowOfficialDetailLink && !input.sourceUrl.toLowerCase().includes(".pdf")) || /\bnomination(?:s)?\b|advisory council|board member/i.test(title)) return null;
  return {
    source: GOV_SOURCE,
    sourceType: "gov-department",
    externalId: rowId(input.department, title, closingDateText),
    sourceUrl: input.sourceUrl,
    title,
    employer: input.department,
    departmentName: input.department,
    location: input.location || "South Africa",
    workMode: "onsite",
    employmentType: "government vacancy",
    salaryText: input.salaryText ?? null,
    description: `${input.department}. ${input.reference ? `Reference: ${stripHtml(input.reference)}. ` : ""}Closing date: ${closingDateText}. Table/list metadata only; read the original official ${input.allowOfficialDetailLink ? "vacancy detail page" : "PDF"} for the full advert.`,
    tags: ["government", "gov-department", "table-first", "no-pdf-body", ...(input.allowOfficialDetailLink ? ["official-detail-link"] : []), ...(input.salaryText ? ["salary-provided"] : [])],
    publishedAt: null,
    closingDate,
  };
}

function cellValues(rowHtml: string) {
  return Array.from(rowHtml.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)).map(match => match[1]);
}

function pdfAnchor(cellHtml: string, baseUrl: string) {
  const match = cellHtml.match(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
  if (!match) return null;
  const url = absoluteUrl(match[1], baseUrl);
  return /\.pdf(?:[?#]|$)/i.test(url) ? { url, title: stripHtml(match[2]) } : null;
}

function officialDetailAnchor(cellHtml: string, baseUrl: string) {
  const match = cellHtml.match(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
  if (!match) return null;
  const url = absoluteUrl(match[1], baseUrl);
  return new URL(url).hostname.endsWith("labour.gov.za") ? { url, title: stripHtml(match[2]) } : null;
}

export function parseGovernmentTablePage(html: string, department: string, pageUrl: string): PublicJob[] {
  const records: PublicJob[] = [];
  for (const table of html.match(/<table\b[^>]*>[\s\S]*?<\/table>/gi) ?? []) {
    for (const row of table.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) ?? []) {
      const cells = cellValues(row);
      if (cells.length < 2) continue;
      const titleLink = pdfAnchor(cells[1], pageUrl) ?? pdfAnchor(cells[0], pageUrl);
      const closingDateText = stripHtml(cells.at(-1) ?? "");
      if (!titleLink || /closing date/i.test(closingDateText)) continue;
      const record = makeGovernmentJob({
        department,
        title: titleLink.title,
        closingDateText,
        sourceUrl: titleLink.url,
        reference: cells.length >= 6 ? cells[0] : undefined,
        location: cells.length >= 6 ? stripHtml(cells[3]) : "South Africa",
      });
      if (record) records.push(record);
    }
  }
  return Array.from(new Map(records.map(record => [record.externalId, record])).values());
}

export function parseJusticeVacancyListPage(html: string, department: string, pageUrl: string): PublicJob[] {
  const publication = html.match(/<a\b[^>]*href=["']([^"']+\.pdf[^"']*)["'][^>]*>[\s\S]*?Vacancies\s+as\s+published[\s\S]*?<\/a>[\s\S]{0,400}?Closing\s+date:\s*([^<*]+)/i);
  if (!publication) return [];
  const sourceUrl = absoluteUrl(publication[1], pageUrl);
  const closingDateText = stripHtml(publication[2]);
  const afterPublication = html.slice((publication.index ?? 0) + publication[0].length);
  const vacancySection = afterPublication.split(/SMS Pre-Entry Certificate/i)[0];
  const records = Array.from(vacancySection.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)).map(match => {
    const item = stripHtml(match[1]);
    const title = item.replace(/^POST\s+\d+\/\d+\s*:\s*/i, "");
    return makeGovernmentJob({ department, title, closingDateText, sourceUrl, location: "South Africa" });
  }).filter((record): record is PublicJob => Boolean(record));
  return Array.from(new Map(records.map(record => [record.externalId, record])).values());
}

export function parseLabourVacancyListPage(html: string, department: string, pageUrl: string): PublicJob[] {
  const records: PublicJob[] = [];
  for (const table of html.match(/<table\b[^>]*>[\s\S]*?<\/table>/gi) ?? []) {
    for (const row of table.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) ?? []) {
      const cells = cellValues(row);
      if (cells.length < 4) continue;
      const reference = cells.at(-4) ?? "";
      const closingDateText = stripHtml(cells.at(-3) ?? "");
      const detail = officialDetailAnchor(cells.at(-2) ?? "", pageUrl);
      const status = stripHtml(cells.at(-1) ?? "");
      if (!detail || !/\bopen\b/i.test(status) || /closing date/i.test(closingDateText)) continue;
      const record = makeGovernmentJob({
        department,
        title: detail.title,
        closingDateText,
        sourceUrl: detail.url,
        reference,
        location: "South Africa",
        allowOfficialDetailLink: true,
      });
      if (record) records.push(record);
    }
  }
  return Array.from(new Map(records.map(record => [record.externalId, record])).values());
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function gcisSalaryForTitle(html: string, title: string) {
  const text = stripHtml(html);
  const headingPattern = new RegExp(`(?:POST\\s+\\d+\\/\\d+\\s*:\\s*)?${escapeRegExp(title)}`, "ig");
  const matches = Array.from(text.matchAll(headingPattern));
  const start = matches.at(-1)?.index;
  if (start === undefined) return null;
  const followingPost = text.slice(start + 1).search(/\bPost\s+\d+\/\d+\s*:/i);
  const block = text.slice(start, followingPost === -1 ? undefined : start + 1 + followingPost);
  const salary = block.match(/\bSalary\s*:\s*(R[\d\s,]+(?:\s+per annum[^.]{0,220})?)(?=\.?\s+(?:Centre|Requirements|Duties|Enquiries|Applications|Note)\s*:)/i);
  return salary?.[1].replace(/\s+/g, " ").trim() ?? null;
}

export function parseGcisVacancyListPage(html: string, department: string, pageUrl: string): PublicJob[] {
  const initialSection = html.match(/<h1\b[^>]*>\s*Jobs\s*<\/h1>([\s\S]*?)The\s+GCIS\s+is\s+an\s+equal\s+opportunity\s+employer/i)?.[1] ?? "";
  const closingDate = html.match(/Closing\s+date\s*:\s*([^<\n]+)/i)?.[1];
  if (!closingDate) return [];
  const titles = Array.from(initialSection.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi))
    .map(match => stripHtml(match[1]))
    .filter(title => title.length > 2 && !/subscribe|email alert/i.test(title));
  const records = titles.map(title => makeGovernmentJob({
    department,
    title,
    closingDateText: closingDate,
    sourceUrl: pageUrl,
    location: "Pretoria, South Africa",
    allowOfficialDetailLink: true,
    salaryText: gcisSalaryForTitle(html, title),
  })).filter((record): record is PublicJob => Boolean(record));
  return Array.from(new Map(records.map(record => [record.externalId, record])).values());
}

function normalisedPath(value: string) {
  const url = new URL(value);
  return `${url.hostname.replace(/^www\./, "")}${url.pathname.replace(/\/$/, "")}`;
}

export function discoverSupportedGovernmentDepartmentPages(directoryHtml: string) {
  const links = Array.from(directoryHtml.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)).map(match => match[1]);
  const discovered = new Set(links.map(link => {
    try { return normalisedPath(link); } catch { return ""; }
  }));
  return SUPPORTED_GOVERNMENT_DEPARTMENTS.filter(department => [department.url, ...(department.directoryUrls ?? [])].some(url => discovered.has(normalisedPath(url))));
}

type FetchText = (url: string) => Promise<string>;

export type GovernmentDepartmentFetchReport = {
  jobs: PublicJob[];
  successfulPages: number;
  skippedDepartments: string[];
};

async function fetchHtml(url: string) {
  const response = await fetch(url, { headers: { Accept: "text/html", "User-Agent": "JobOrganizer/1.0 official-vacancy-metadata" } });
  if (!response.ok) throw new Error(`Government source request failed for ${url}: ${response.status}`);
  return response.text();
}

export async function fetchSupportedGovernmentDepartmentReport(fetchText: FetchText = fetchHtml): Promise<GovernmentDepartmentFetchReport> {
  const directoryHtml = await fetchText("https://www.gov.za/about-government/government-jobs");
  const departments = discoverSupportedGovernmentDepartmentPages(directoryHtml);
  const results = await Promise.allSettled(departments.map(async department => {
    const pageHtml = await fetchText(department.url);
    if (department.parser === "table") return parseGovernmentTablePage(pageHtml, department.department, department.url);
    if (department.parser === "labour-list") return parseLabourVacancyListPage(pageHtml, department.department, department.url);
    if (department.parser === "gcis-list") return parseGcisVacancyListPage(pageHtml, department.department, department.url);
    return parseJusticeVacancyListPage(pageHtml, department.department, department.url);
  }));
  const skippedDepartments: string[] = [];
  const successful = results.flatMap((result, index) => {
    if (result.status === "fulfilled") return result.value;
    skippedDepartments.push(departments[index].department);
    console.warn(`[Government vacancies] Skipped ${departments[index].department}`, result.reason instanceof Error ? result.reason.message : result.reason);
    return [];
  });
  return {
    jobs: Array.from(new Map(successful.map(record => [record.externalId, record])).values()),
    successfulPages: results.filter(result => result.status === "fulfilled").length,
    skippedDepartments,
  };
}

export async function fetchSupportedGovernmentDepartmentJobs(fetchText: FetchText = fetchHtml): Promise<PublicJob[]> {
  return (await fetchSupportedGovernmentDepartmentReport(fetchText)).jobs;
}
