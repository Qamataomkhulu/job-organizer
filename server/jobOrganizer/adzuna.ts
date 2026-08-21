import type { PublicJob } from "./types";

type AdzunaJob = {
  id: string | number;
  redirect_url: string;
  title: string;
  description?: string;
  created?: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
  category?: { label?: string };
  contract_time?: string;
  contract_type?: string;
  salary_min?: number;
  salary_max?: number;
};

type AdzunaSearchOptions = {
  titles?: string[];
};

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

function workMode(value: string) {
  if (/\bremote\b/i.test(value)) return "remote" as const;
  if (/\bhybrid\b/i.test(value)) return "hybrid" as const;
  return "onsite" as const;
}

function sourceSalaryText(job: AdzunaJob) {
  const min = typeof job.salary_min === "number" && Number.isFinite(job.salary_min) && job.salary_min > 0 ? job.salary_min : null;
  const max = typeof job.salary_max === "number" && Number.isFinite(job.salary_max) && job.salary_max > 0 ? job.salary_max : null;
  const format = (value: number) => `R ${value.toLocaleString("en-ZA", { maximumFractionDigits: 0 }).replace(/\u00a0/g, " ")}`;
  if (min !== null && max !== null) return `${format(min)} – ${format(max)} (as listed by Adzuna)`;
  if (min !== null) return `From ${format(min)} (as listed by Adzuna)`;
  if (max !== null) return `Up to ${format(max)} (as listed by Adzuna)`;
  return null;
}

export async function fetchAdzunaJobs(options: AdzunaSearchOptions = {}): Promise<PublicJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) throw new Error("Adzuna credentials are not configured.");
  const titles = Array.from(new Set((options.titles?.length ? options.titles : ["cybersecurity"])
    .map(title => title.trim()).filter(Boolean))).slice(0, 6);
  const payloads = await Promise.all(titles.map(async title => {
    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      what: title,
      results_per_page: "20",
      "content-type": "application/json",
      sort_by: "date",
    });
    const response = await fetch(`https://api.adzuna.com/v1/api/jobs/za/search/1?${params.toString()}`, { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error(`Adzuna request failed with ${response.status}`);
    return response.json() as Promise<{ results?: AdzunaJob[] }>;
  }));
  const jobs = payloads.flatMap(payload => Array.isArray(payload.results) ? payload.results : []);
  return Array.from(new Map(jobs.filter(job => job.id && job.redirect_url && job.title).map(job => {
    const description = stripHtml(job.description || job.title);
    const location = job.location?.display_name?.trim() || "South Africa";
    const title = stripHtml(job.title);
    return [String(job.id), {
      source: "adzuna" as const,
      externalId: String(job.id),
      sourceUrl: job.redirect_url,
      title,
      employer: job.company?.display_name?.trim() || "Employer not disclosed",
      location,
      workMode: workMode(`${title} ${description}`),
      employmentType: [job.contract_time, job.contract_type].filter(Boolean).join(", ") || null,
      salaryText: sourceSalaryText(job),
      description,
      tags: [job.category?.label, job.contract_time, job.contract_type].filter((tag): tag is string => Boolean(tag)),
      publishedAt: job.created ? new Date(job.created) : null,
    } satisfies PublicJob];
  })).values());
}
